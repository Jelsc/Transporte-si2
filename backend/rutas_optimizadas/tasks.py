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
    
    # Coordenadas (incluyendo depot)
    coordenadas = [(float(solicitud.depot.lat), float(solicitud.depot.lng))]
    demandas = [0]  # Depot no tiene demanda
    
    # Mapeo de índices
    indice_entrega = {}
    
    for i, entrega in enumerate(entregas, 1):
        coordenadas.append((float(entrega.ubicacion.lat), float(entrega.ubicacion.lng)))
        demandas.append(int(entrega.demanda_peso))
        indice_entrega[i] = entrega
    
    # Ventanas de tiempo (si están definidas)
    ventanas_tiempo = [(0, 30000)]  # Depot: ventana amplia
    
    for entrega in entregas:
        inicio = entrega.ventana_tiempo_inicio
        fin = entrega.ventana_tiempo_fin
        
        if inicio and fin:
            # Convertir tiempo a minutos desde medianoche
            inicio_min = inicio.hour * 60 + inicio.minute
            fin_min = fin.hour * 60 + fin.minute
            ventanas_tiempo.append((inicio_min, fin_min))
        else:
            # Ventana amplia si no está definida
            ventanas_tiempo.append((0, 30000))
    
    # Tiempos de servicio
    tiempos_servicio = [5]  # Depot: 5 minutos
    
    for entrega in entregas:
        tiempo = entrega.get_tiempo_servicio()
        tiempos_servicio.append(tiempo)
    
    # Capacidades de vehículos
    capacidades_vehiculos = []
    for vehiculo in vehiculos:
        # Convertir capacidad de kg a unidades enteras
        capacidad = int(vehiculo.capacidad_carga)
        capacidades_vehiculos.append(capacidad)
    
    return {
        'coordenadas': coordenadas,
        'demandas': demandas,
        'ventanas_tiempo': ventanas_tiempo,
        'tiempos_servicio': tiempos_servicio,
        'capacidades_vehiculos': capacidades_vehiculos,
        'indice_entrega': indice_entrega,
        'vehiculos': list(vehiculos),
        'depot': solicitud.depot
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
    # Verificar si hay ventanas de tiempo definidas
    tiene_ventanas = any(
        inicio != 0 or fin != 30000 
        for inicio, fin in datos_optimizacion['ventanas_tiempo'][1:]  # Excluir depot
    )
    
    if tiene_ventanas:
        # Usar solver con ventanas de tiempo
        solucion = vrp_solver.resolver_vrp_con_ventanas_tiempo(
            matriz_distancias=matriz_resultado['distances'],
            matriz_tiempos=matriz_resultado['durations'],
            demandas=datos_optimizacion['demandas'],
            capacidades_vehiculos=datos_optimizacion['capacidades_vehiculos'],
            ventanas_tiempo=datos_optimizacion['ventanas_tiempo'],
            tiempos_servicio=datos_optimizacion['tiempos_servicio'],
            depot=0
        )
    else:
        # Usar solver básico
        solucion = vrp_solver.resolver_vrp_basico(
            matriz_distancias=matriz_resultado['distances'],
            matriz_tiempos=matriz_resultado['durations'],
            demandas=datos_optimizacion['demandas'],
            capacidades_vehiculos=datos_optimizacion['capacidades_vehiculos'],
            depot=0
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
    depot = datos_optimizacion['depot']
    
    tiempo_acumulado = 0  # Minutos desde inicio
    
    for i, nodo_idx in enumerate(ruta_data['ruta']):
        if i == 0:
            # Parada de depot inicial
            parada = Parada.objects.create(
                ruta=ruta_optimizada,
                entrega=None,
                ubicacion=depot,
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
            # Parada de depot final
            parada = Parada.objects.create(
                ruta=ruta_optimizada,
                entrega=None,
                ubicacion=depot,
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
