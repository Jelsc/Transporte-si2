"""
Servicio para convertir Viajes comerciales en SolicitudesRuta VRP
Permite reutilizar el servicio VRP para optimización de viajes
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
# from django.utils import timezone  # No se usa en este archivo
from viajes.models import Viaje
from ubicaciones.models import Ubicacion
from vehiculos.models import Vehiculo

from ..models import SolicitudRuta, Entrega


class ViajeConverterService:
    """Servicio para convertir Viajes en SolicitudesRuta VRP"""
    
    def __init__(self):
        self.tipo_viaje = 'comercial'  # Tipo para identificar origen
    
    def convertir_viaje_a_solicitud_ruta(
        self, 
        viaje: Viaje,
        incluir_paradas_intermedias: bool = False,
        tiempo_servicio_minutos: int = 15
    ) -> SolicitudRuta:
        """
        Convierte un viaje comercial en una solicitud de ruta VRP
        
        Args:
            viaje: Viaje comercial a convertir
            incluir_paradas_intermedias: Si incluir paradas intermedias
            tiempo_servicio_minutos: Tiempo de servicio en cada parada
            
        Returns:
            SolicitudRuta creada para optimización
        """
        # Crear solicitud de ruta
        solicitud = SolicitudRuta.objects.create(
            nombre=f"Viaje: {viaje.origen.nombre} → {viaje.destino.nombre}",
            descripcion=f"Optimización de viaje comercial del {viaje.fecha}",
            tipo='viaje_comercial',  # Tipo específico para viajes
            estado='pendiente',
            depot=viaje.origen,  # Depot = origen del viaje
            fecha_requerida=viaje.fecha,
            hora_inicio=viaje.hora,
            # Configuraciones específicas para viajes comerciales
            max_duracion_minutos=480,  # 8 horas máximo
            max_distancia_km=500,      # 500 km máximo
            prioridad=2,  # Prioridad media para viajes comerciales
            # Metadatos del viaje original
            viaje_origen=viaje,  # Relación al viaje original
        )
        
        # Crear entregas (pickup y delivery)
        entregas = self._crear_entregas_desde_viaje(
            viaje, 
            solicitud, 
            tiempo_servicio_minutos
        )
        
        # Agregar paradas intermedias si se solicita
        if incluir_paradas_intermedias:
            self._agregar_paradas_intermedias(viaje, solicitud, entregas)
        
        # Agregar vehículo disponible
        solicitud.vehiculos_disponibles.add(viaje.vehiculo)
        
        return solicitud
    
    def _crear_entregas_desde_viaje(
        self, 
        viaje: Viaje, 
        solicitud: SolicitudRuta,
        tiempo_servicio: int
    ) -> List[Entrega]:
        """Crear entregas (pickup/delivery) desde un viaje"""
        entregas = []
        
        # 1. Pickup en origen (cargar pasajeros)
        pickup = Entrega.objects.create(
            solicitud=solicitud,
            ubicacion=viaje.origen,
            tipo='pickup',
            descripcion=f"Carga de pasajeros en {viaje.origen.nombre}",
            demanda=viaje.asientos_disponibles,  # Demanda = capacidad del vehículo
            tiempo_servicio_minutos=tiempo_servicio,
            ventana_tiempo_inicio=viaje.hora,
            ventana_tiempo_fin=(datetime.combine(viaje.fecha, viaje.hora) + 
                              timedelta(minutes=30)).time(),
            prioridad=1,  # Alta prioridad para pickup
        )
        entregas.append(pickup)
        
        # 2. Delivery en destino (descargar pasajeros)
        delivery = Entrega.objects.create(
            solicitud=solicitud,
            ubicacion=viaje.destino,
            tipo='delivery',
            descripcion=f"Descarga de pasajeros en {viaje.destino.nombre}",
            demanda=-viaje.asientos_ocupados,  # Demanda negativa = descarga
            tiempo_servicio_minutos=tiempo_servicio,
            ventana_tiempo_inicio=(datetime.combine(viaje.fecha, viaje.hora) + 
                                 timedelta(hours=2)).time(),  # Estimado 2h después
            ventana_tiempo_fin=(datetime.combine(viaje.fecha, viaje.hora) + 
                              timedelta(hours=4)).time(),  # Ventana de 2h
            prioridad=1,  # Alta prioridad para delivery
        )
        entregas.append(delivery)
        
        return entregas
    
    def _agregar_paradas_intermedias(
        self, 
        viaje: Viaje, 
        solicitud: SolicitudRuta,
        entregas_existentes: List[Entrega]
    ):
        """Agregar paradas intermedias opcionales para viajes largos"""
        # Buscar ubicaciones intermedias entre origen y destino
        ubicaciones_intermedias = self._buscar_ubicaciones_intermedias(
            viaje.origen, 
            viaje.destino
        )
        
        for ubicacion in ubicaciones_intermedias:
            Entrega.objects.create(
                solicitud=solicitud,
                ubicacion=ubicacion,
                tipo='pickup_delivery',
                descripcion=f"Parada intermedia en {ubicacion.nombre}",
                demanda=0,  # Sin cambio de carga
                tiempo_servicio_minutos=10,  # Parada rápida
                ventana_tiempo_inicio=(datetime.combine(viaje.fecha, viaje.hora) + 
                                     timedelta(hours=1)).time(),
                ventana_tiempo_fin=(datetime.combine(viaje.fecha, viaje.hora) + 
                                  timedelta(hours=3)).time(),
                prioridad=3,  # Baja prioridad
            )
    
    def _buscar_ubicaciones_intermedias(
        self, 
        origen: Ubicacion, 
        destino: Ubicacion
    ) -> List[Ubicacion]:
        """Buscar ubicaciones intermedias entre origen y destino"""
        # Implementación simple: buscar terminales/agencias en el área
        return Ubicacion.objects.filter(
            tipo__in=['TERMINAL', 'AGENCIA'],
            activo=True
        ).exclude(
            id__in=[origen.id, destino.id]
        )[:3]  # Máximo 3 paradas intermedias
    
    def convertir_multiples_viajes_a_solicitud(
        self, 
        viajes: List[Viaje],
        nombre_solicitud: str = None
    ) -> SolicitudRuta:
        """
        Convierte múltiples viajes en una sola solicitud de ruta VRP
        Útil para optimizar múltiples viajes del mismo día
        """
        if not viajes:
            raise ValueError("Se requiere al menos un viaje")
        
        # Usar el primer viaje como base
        viaje_base = viajes[0]
        
        solicitud = SolicitudRuta.objects.create(
            nombre=nombre_solicitud or f"Optimización múltiple - {len(viajes)} viajes",
            descripcion=f"Optimización de {len(viajes)} viajes comerciales",
            tipo='viajes_multiples',
            estado='pendiente',
            depot=viaje_base.origen,
            fecha_requerida=viaje_base.fecha,
            hora_inicio=viaje_base.hora,
            max_duracion_minutos=720,  # 12 horas para múltiples viajes
            max_distancia_km=1000,     # 1000 km para múltiples viajes
            prioridad=1,  # Alta prioridad para optimización múltiple
        )
        
        # Agregar todas las entregas de todos los viajes
        for viaje in viajes:
            self._crear_entregas_desde_viaje(viaje, solicitud, 15)
            solicitud.vehiculos_disponibles.add(viaje.vehiculo)
        
        return solicitud
    
    def sincronizar_resultado_optimizacion(
        self, 
        solicitud: SolicitudRuta, 
        viaje_original: Viaje
    ) -> Viaje:
        """
        Sincroniza el resultado de la optimización VRP de vuelta al viaje original
        Actualiza horarios, rutas, etc.
        """
        if solicitud.estado != 'completado':
            raise ValueError("La solicitud debe estar completada para sincronizar")
        
        rutas_optimizadas = solicitud.rutas_optimizadas.all()
        if not rutas_optimizadas.exists():
            raise ValueError("No hay rutas optimizadas para sincronizar")
        
        # Tomar la primera ruta optimizada (asumiendo un solo vehículo)
        ruta_optimizada = rutas_optimizadas.first()
        
        # Actualizar el viaje con información de la optimización
        viaje_original.estado = 'programado'  # Confirmar programación
        
        # Guardar información de optimización en el viaje
        # (Esto requeriría agregar campos adicionales al modelo Viaje)
        
        return viaje_original


# Instancia global del servicio
viaje_converter_service = ViajeConverterService()

