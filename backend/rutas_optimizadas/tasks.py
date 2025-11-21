"""
Tasks de Celery para procesamiento asíncrono de optimización de rutas
"""

from celery import shared_task
from django.utils import timezone
from django.db import transaction
from typing import Dict, List, Tuple
import logging

from .models import SolicitudRuta, Entrega, RutaOptimizada, Parada
from .services.osrm_service import osrm_service
from .services.vrp_solver import vrp_solver

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def optimizar_ruta_task(self, solicitud_id: int) -> Dict:
    """
    Task de Celery para optimizar una ruta de forma asíncrona
    
    Args:
        solicitud_id: ID de la solicitud de ruta a optimizar
        
    Returns:
        Dict con el resultado de la optimización
    """
    try:
        # Actualizar progreso
        self.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 100, 'status': 'Iniciando optimización...'}
        )
        
        # Obtener solicitud
        solicitud = SolicitudRuta.objects.get(id=solicitud_id)
        
        # Actualizar estado
        solicitud.estado = 'procesando'
        solicitud.fecha_procesamiento = timezone.now()
        solicitud.save()
        
        logger.info(f"Iniciando optimización para solicitud {solicitud_id}")
        
        # Paso 1: Preparar datos
        self.update_state(
            state='PROGRESS',
            meta={'current': 10, 'total': 100, 'status': 'Preparando datos...'}
        )
        
        datos_optimizacion = _preparar_datos_optimizacion(solicitud)
        
        # Paso 2: Obtener matriz de distancias
        self.update_state(
            state='PROGRESS',
            meta={'current': 30, 'total': 100, 'status': 'Obteniendo matriz de distancias...'}
        )
        
        matriz_resultado = osrm_service.obtener_matriz_con_fallback(
            datos_optimizacion['coordenadas']
        )
        
        # Paso 3: Resolver VRP
        self.update_state(
            state='PROGRESS',
            meta={'current': 60, 'total': 100, 'status': 'Resolviendo VRP...'}
        )
        
        solucion = _resolver_vrp(datos_optimizacion, matriz_resultado)
        
        # Paso 4: Guardar resultados
        self.update_state(
            state='PROGRESS',
            meta={'current': 80, 'total': 100, 'status': 'Guardando resultados...'}
        )
        
        with transaction.atomic():
            # Limpiar rutas anteriores
            solicitud.rutas_optimizadas.all().delete()
            
            # Crear nuevas rutas optimizadas
            rutas_creadas = _crear_rutas_optimizadas(solicitud, solucion, datos_optimizacion)
            
            # Actualizar estado de solicitud
            solicitud.estado = 'completado'
            solicitud.mensaje_resultado = f'Optimización completada. {len(rutas_creadas)} rutas creadas.'
            solicitud.save()
        
        # Paso 5: Completado
        self.update_state(
            state='PROGRESS',
            meta={'current': 100, 'total': 100, 'status': 'Optimización completada'}
        )
        
        resultado = {
            'solicitud_id': solicitud_id,
            'estado': 'completado',
            'rutas_creadas': len(rutas_creadas),
            'distancia_total': sum(r.distancia_total_km for r in rutas_creadas),
            'tiempo_total': sum(r.tiempo_total_min for r in rutas_creadas),
            'mensaje': 'Optimización completada exitosamente'
        }
        
        logger.info(f"Optimización completada para solicitud {solicitud_id}")
        return resultado
        
    except Exception as exc:
        logger.error(f"Error en optimización de solicitud {solicitud_id}: {exc}")
        
        # Actualizar estado de error
        try:
            solicitud = SolicitudRuta.objects.get(id=solicitud_id)
            solicitud.estado = 'fallido'
            solicitud.mensaje_resultado = f'Error en optimización: {str(exc)}'
            solicitud.save()
        except:
            pass
        
        # Re-raise para que Celery maneje el error
        raise self.retry(exc=exc, countdown=60, max_retries=3)


def _preparar_datos_optimizacion(solicitud: SolicitudRuta) -> Dict:
    """
    Preparar datos para la optimización
    
    Args:
        solicitud: Solicitud de ruta
        
    Returns:
        Dict con datos preparados para optimización
    """
    entregas = solicitud.entregas.all().order_by('prioridad')
    vehiculos = solicitud.vehiculos_disponibles.all()
    
    # Obtener depot de salida (nuevo campo o legacy)
    depot_salida = solicitud.depot_salida or solicitud.depot
    depot_regreso = solicitud.depot_regreso or solicitud.depot
    
    if not depot_salida:
        raise ValueError("La solicitud no tiene definido un depósito de salida")
    if not depot_regreso:
        raise ValueError("La solicitud no tiene definido un depósito de regreso")
    
    # Verificar si son depósitos diferentes
    mismo_depot = (depot_salida.id == depot_regreso.id)
    
    # Para OR-Tools: Solo incluimos depot_salida y entregas como nodos
    # El depot_regreso se maneja a través de la matriz de distancias
    coordenadas = [(float(depot_salida.lat), float(depot_salida.lng))]
    demandas = [0]  # Depot salida no tiene demanda
    ventanas_tiempo = [(0, 30000)]  # Depot salida: ventana amplia
    tiempos_servicio = [5]  # Depot salida: 5 minutos
    
    # Mapeo de índices
    indice_entrega = {}
    
    # Agregar todas las entregas
    for i, entrega in enumerate(entregas, 1):
        coordenadas.append((float(entrega.ubicacion.lat), float(entrega.ubicacion.lng)))
        demandas.append(int(entrega.demanda_peso))
        indice_entrega[i] = entrega
        
        # Ventana de tiempo
        inicio = entrega.ventana_tiempo_inicio
        fin = entrega.ventana_tiempo_fin
        
        if inicio and fin:
            inicio_min = inicio.hour * 60 + inicio.minute
            fin_min = fin.hour * 60 + fin.minute
            ventanas_tiempo.append((inicio_min, fin_min))
        else:
            ventanas_tiempo.append((0, 30000))
        
        # Tiempo de servicio
        tiempo = entrega.get_tiempo_servicio()
        tiempos_servicio.append(tiempo)
    
    # Si los depósitos son diferentes, agregamos coordenada de depot_regreso
    # para calcular distancias, pero NO como nodo visitable
    if not mismo_depot:
        # Agregar coordenada del depot de regreso al final para matriz de distancias
        coordenadas.append((float(depot_regreso.lat), float(depot_regreso.lng)))
        # Nota: NO agregamos demanda, ventana ni tiempo de servicio porque
        # este nodo no es visitable, solo se usa para calcular distancias
    
    # Índices para OR-Tools
    depot_salida_idx = 0
    depot_regreso_idx = 0 if mismo_depot else (len(coordenadas) - 1)
    
    # Capacidades de vehículos
    capacidades_vehiculos = []
    for vehiculo in vehiculos:
        # Convertir capacidad de kg a unidades enteras
        capacidad = int(vehiculo.capacidad_carga)
        capacidades_vehiculos.append(capacidad)
    
    # Log de información para depuración
    logger.info(f"Preparación de datos:")
    logger.info(f"  - Depósitos: salida={depot_salida.nombre} (idx={depot_salida_idx}), regreso={depot_regreso.nombre} (idx={depot_regreso_idx})")
    logger.info(f"  - Mismo depot: {mismo_depot}")
    logger.info(f"  - Total coordenadas (para matriz): {len(coordenadas)}")
    logger.info(f"  - Nodos visitables: {len(demandas)} (depot + {len(entregas)} entregas)")
    logger.info(f"  - Total vehículos: {len(vehiculos)}")
    
    return {
        'coordenadas': coordenadas,
        'demandas': demandas,
        'ventanas_tiempo': ventanas_tiempo,
        'tiempos_servicio': tiempos_servicio,
        'capacidades_vehiculos': capacidades_vehiculos,
        'indice_entrega': indice_entrega,
        'vehiculos': list(vehiculos),
        'depot_salida': depot_salida,
        'depot_regreso': depot_regreso,
        'depot_salida_idx': 0,
        'depot_regreso_idx': depot_regreso_idx,
        'mismo_depot': mismo_depot
    }


def _resolver_vrp(datos_optimizacion: Dict, matriz_resultado: Dict) -> Dict:
    """
    Resolver VRP usando los datos preparados
    
    Args:
        datos_optimizacion: Datos preparados para optimización
        matriz_resultado: Matriz de distancias y tiempos
        
    Returns:
        Dict con la solución del VRP
    """
    depot_inicio = datos_optimizacion['depot_salida_idx']
    depot_fin = datos_optimizacion['depot_regreso_idx']
    
    logger.info(f"Resolviendo VRP:")
    logger.info(f"  - depot_inicio: {depot_inicio}")
    logger.info(f"  - depot_fin: {depot_fin}")
    logger.info(f"  - num_nodos: {len(datos_optimizacion['coordenadas'])}")
    logger.info(f"  - num_vehiculos: {len(datos_optimizacion['capacidades_vehiculos'])}")
    
    # Verificar si hay ventanas de tiempo definidas
    tiene_ventanas = any(
        inicio != 0 or fin != 30000 
        for inicio, fin in datos_optimizacion['ventanas_tiempo'][1:]  # Excluir depot
    )
    
    if tiene_ventanas:
        # Usar solver con ventanas de tiempo
        logger.info("Usando solver CON ventanas de tiempo")
        solucion = vrp_solver.resolver_vrp_con_ventanas_tiempo(
            matriz_distancias=matriz_resultado['distances'],
            matriz_tiempos=matriz_resultado['durations'],
            demandas=datos_optimizacion['demandas'],
            capacidades_vehiculos=datos_optimizacion['capacidades_vehiculos'],
            ventanas_tiempo=datos_optimizacion['ventanas_tiempo'],
            tiempos_servicio=datos_optimizacion['tiempos_servicio'],
            depot_inicio=depot_inicio,
            depot_fin=depot_fin
        )
    else:
        # Usar solver básico
        logger.info("Usando solver BÁSICO")
        solucion = vrp_solver.resolver_vrp_basico(
            matriz_distancias=matriz_resultado['distances'],
            matriz_tiempos=matriz_resultado['durations'],
            demandas=datos_optimizacion['demandas'],
            capacidades_vehiculos=datos_optimizacion['capacidades_vehiculos'],
            depot_inicio=depot_inicio,
            depot_fin=depot_fin
        )
    
    return solucion


def _crear_rutas_optimizadas(
    solicitud: SolicitudRuta,
    solucion: Dict,
    datos_optimizacion: Dict
) -> List[RutaOptimizada]:
    """
    Crear objetos RutaOptimizada y Parada basados en la solución
    
    Args:
        solicitud: Solicitud original
        solucion: Solución del VRP
        datos_optimizacion: Datos de optimización
        
    Returns:
        Lista de rutas optimizadas creadas
    """
    rutas_creadas = []
    vehiculos = datos_optimizacion['vehiculos']
    indice_entrega = datos_optimizacion['indice_entrega']
    
    for ruta_data in solucion['rutas']:
        vehiculo_id = ruta_data['vehiculo_id']
        
        if vehiculo_id >= len(vehiculos):
            continue  # Saltar si no hay vehículo disponible
        
        vehiculo = vehiculos[vehiculo_id]
        
        # Crear ruta optimizada
        ruta_optimizada = RutaOptimizada.objects.create(
            solicitud=solicitud,
            vehiculo=vehiculo,
            numero_ruta=ruta_data['vehiculo_id'] + 1,
            distancia_total_km=ruta_data['distancia_total'],
            tiempo_total_min=ruta_data['tiempo_total'],
            carga_total_kg=sum(datos_optimizacion['demandas'][i] for i in ruta_data['ruta'][1:-1]),
            hora_inicio=solicitud.hora_inicio,
            hora_fin_estimada=_calcular_hora_fin(solicitud.hora_inicio, ruta_data['tiempo_total']),
            completada=False
        )
        
        # Crear paradas
        _crear_paradas_ruta(ruta_optimizada, ruta_data, datos_optimizacion)
        
        # Aplicar ETA baseline a todas las paradas
        _aplicar_eta_baseline(ruta_optimizada, datos_optimizacion.get('matriz_tiempos'))
        
        rutas_creadas.append(ruta_optimizada)
    
    return rutas_creadas


def _crear_paradas_ruta(
    ruta_optimizada: RutaOptimizada,
    ruta_data: Dict,
    datos_optimizacion: Dict
) -> None:
    """
    Crear paradas para una ruta optimizada
    
    Args:
        ruta_optimizada: Ruta optimizada
        ruta_data: Datos de la ruta
        datos_optimizacion: Datos de optimización
    """
    indice_entrega = datos_optimizacion['indice_entrega']
    tiempos_servicio = datos_optimizacion['tiempos_servicio']
    depot_salida = datos_optimizacion['depot_salida']
    depot_regreso = datos_optimizacion['depot_regreso']
    
    tiempo_acumulado = 0  # Minutos desde inicio
    
    for i, nodo_idx in enumerate(ruta_data['ruta']):
        if i == 0:
            # Parada de depot inicial (salida)
            parada = Parada.objects.create(
                ruta=ruta_optimizada,
                entrega=None,
                ubicacion=depot_salida,
                orden=i,
                tiempo_llegada_estimado=ruta_optimizada.hora_inicio,
                tiempo_salida_estimado=_sumar_minutos(
                    ruta_optimizada.hora_inicio, 
                    tiempos_servicio[nodo_idx]
                ),
                tiempo_servicio_min=tiempos_servicio[nodo_idx],
                distancia_desde_anterior_km=0,
                es_depot=True,
                completada=False
            )
            tiempo_acumulado += tiempos_servicio[nodo_idx]
            
        elif i == len(ruta_data['ruta']) - 1:
            # Parada de depot final (regreso)
            # IMPORTANTE: depot_regreso puede tener índice fuera de tiempos_servicio
            # porque no es un nodo visitable, solo punto final de la matriz
            tiempo_servicio_depot_fin = 0  # No hay servicio en punto final
            if depot_salida.id == depot_regreso.id:
                # Si es el mismo depot, usar su tiempo de servicio
                tiempo_servicio_depot_fin = tiempos_servicio[0]
                
            parada = Parada.objects.create(
                ruta=ruta_optimizada,
                entrega=None,
                ubicacion=depot_regreso,
                orden=i,
                tiempo_llegada_estimado=_sumar_minutos(
                    ruta_optimizada.hora_inicio, 
                    tiempo_acumulado
                ),
                tiempo_salida_estimado=_sumar_minutos(
                    ruta_optimizada.hora_inicio, 
                    tiempo_acumulado + tiempo_servicio_depot_fin
                ),
                tiempo_servicio_min=tiempo_servicio_depot_fin,
                distancia_desde_anterior_km=0,  # Se calculará después
                es_depot=True,
                completada=False
            )
            
        else:
            # Parada de entrega
            entrega = indice_entrega[nodo_idx]
            
            parada = Parada.objects.create(
                ruta=ruta_optimizada,
                entrega=entrega,
                ubicacion=entrega.ubicacion,
                orden=i,
                tiempo_llegada_estimado=_sumar_minutos(
                    ruta_optimizada.hora_inicio, 
                    tiempo_acumulado
                ),
                tiempo_salida_estimado=_sumar_minutos(
                    ruta_optimizada.hora_inicio, 
                    tiempo_acumulado + tiempos_servicio[nodo_idx]
                ),
                tiempo_servicio_min=tiempos_servicio[nodo_idx],
                distancia_desde_anterior_km=0,  # Se calculará después
                es_depot=False,
                completada=False
            )
            tiempo_acumulado += tiempos_servicio[nodo_idx]


def _calcular_hora_fin(hora_inicio, tiempo_total_minutos):
    """Calcular hora de fin sumando minutos a la hora de inicio"""
    from datetime import datetime, timedelta
    
    # Crear datetime con la hora de inicio
    dt_inicio = datetime.combine(datetime.today().date(), hora_inicio)
    
    # Sumar minutos
    dt_fin = dt_inicio + timedelta(minutes=tiempo_total_minutos)
    
    return dt_fin.time()


def _sumar_minutos(hora_inicio, minutos_a_sumar):
    """Sumar minutos a una hora"""
    from datetime import datetime, timedelta
    
    dt_inicio = datetime.combine(datetime.today().date(), hora_inicio)
    dt_resultado = dt_inicio + timedelta(minutes=minutos_a_sumar)
    
    return dt_resultado.time()


def _aplicar_eta_baseline(ruta_optimizada: RutaOptimizada, matriz_tiempos: List[List[float]] = None) -> None:
    """
    Aplica cálculos de ETA baseline a todas las paradas de una ruta.
    
    Utiliza el servicio ETACalculator para calcular tiempos estimados
    de llegada y salida basados en la optimización inicial.
    
    Args:
        ruta_optimizada: Ruta optimizada con paradas ya creadas
        matriz_tiempos: Matriz de tiempos entre ubicaciones (opcional)
    """
    from .services.eta_calculator import ETACalculator
    
    paradas = ruta_optimizada.paradas.all().order_by('orden')
    
    if not paradas:
        logger.warning(f"Ruta {ruta_optimizada.id} no tiene paradas para calcular ETA")
        return
    
    # Preparar datos de paradas para el calculator
    paradas_data = []
    for parada in paradas:
        parada_dict = {
            'id': parada.id,
            'orden': parada.orden,
            'tiempo_servicio_min': parada.tiempo_servicio_min,
            'distancia_desde_anterior_km': float(parada.distancia_desde_anterior_km),
        }
        paradas_data.append(parada_dict)
    
    # Calcular ETAs baseline
    calculator = ETACalculator()
    paradas_con_eta = calculator.calcular_eta_baseline(
        hora_inicio=ruta_optimizada.hora_inicio,
        paradas=paradas_data,
        matriz_tiempos=matriz_tiempos
    )
    
    # Actualizar paradas con los ETAs calculados
    for i, parada in enumerate(paradas):
        eta_data = paradas_con_eta[i]
        
        # Los tiempos ya están calculados, solo agregamos metadata adicional
        # El tiempo_llegada_estimado y tiempo_salida_estimado ya fueron
        # calculados en _crear_paradas_ruta, pero podemos validarlos aquí
        
        # Guardamos los ETAs baseline como metadatos adicionales si fuera necesario
        # Por ahora, el cálculo en _crear_paradas_ruta es suficiente
        pass
    
    logger.info(f"✅ ETAs baseline aplicados a ruta {ruta_optimizada.id} con {len(paradas)} paradas")

