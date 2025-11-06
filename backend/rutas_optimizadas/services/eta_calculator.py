"""
Servicio para cálculo de ETA (Estimated Time of Arrival)
Incluye baseline ETA y actualización en tiempo real
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from decimal import Decimal

logger = logging.getLogger(__name__)


class ETACalculator:
    """
    Calcula ETAs baseline y en tiempo real para rutas optimizadas.
    
    ETA Baseline: Tiempo estimado calculado en el momento de la optimización,
                  basado en distancias y tiempos sin tráfico.
    
    ETA Real-time: Tiempo estimado actualizado considerando:
                   - Posición actual del vehículo
                   - Paradas ya completadas
                   - Condiciones de tráfico actuales
                   - Demoras acumuladas
    """
    
    def __init__(self):
        # Factor de ajuste por condiciones (puede entrenarse con ML)
        self.traffic_factor = 1.15  # 15% más tiempo por tráfico promedio
        self.service_time_buffer = 1.05  # 5% buffer en tiempo de servicio
    
    def calcular_eta_baseline(
        self,
        hora_inicio: datetime.time,
        paradas: List[Dict],
        matriz_tiempos: List[List[float]] = None
    ) -> List[Dict]:
        """
        Calcula el ETA baseline para cada parada en la ruta.
        
        Args:
            hora_inicio: Hora de inicio del viaje desde el depot
            paradas: Lista de diccionarios con información de paradas
            matriz_tiempos: Matriz de tiempos entre ubicaciones (segundos)
        
        Returns:
            Lista de paradas con ETAs baseline calculados
        """
        if not paradas:
            return []
        
        # Combinar fecha actual con hora de inicio
        fecha_base = datetime.now().date()
        tiempo_actual = datetime.combine(fecha_base, hora_inicio)
        
        paradas_con_eta = []
        
        for i, parada in enumerate(paradas):
            parada_info = parada.copy()
            
            # Tiempo de llegada = tiempo actual
            parada_info['eta_baseline_llegada'] = tiempo_actual.time()
            
            # Obtener tiempo de servicio
            tiempo_servicio_min = parada.get('tiempo_servicio_min', 0)
            
            # Tiempo de salida = llegada + servicio
            tiempo_salida = tiempo_actual + timedelta(minutes=tiempo_servicio_min)
            parada_info['eta_baseline_salida'] = tiempo_salida.time()
            
            # Calcular tiempo hasta la siguiente parada
            if i < len(paradas) - 1:
                # Usar matriz de tiempos si está disponible
                if matriz_tiempos and 'node_index' in parada:
                    node_actual = parada['node_index']
                    node_siguiente = paradas[i + 1]['node_index']
                    tiempo_viaje_seg = matriz_tiempos[node_actual][node_siguiente]
                    tiempo_viaje_min = tiempo_viaje_seg / 60.0
                else:
                    # Estimación basada en distancia (backup)
                    distancia_km = paradas[i + 1].get('distancia_desde_anterior_km', 0)
                    # Velocidad promedio urbana: 30 km/h
                    tiempo_viaje_min = (float(distancia_km) / 30.0) * 60.0
                
                # Aplicar factor de tráfico
                tiempo_viaje_min *= self.traffic_factor
                
                # Actualizar tiempo actual para siguiente parada
                tiempo_actual = tiempo_salida + timedelta(minutes=tiempo_viaje_min)
            
            paradas_con_eta.append(parada_info)
        
        logger.info(f"✅ ETAs baseline calculados para {len(paradas_con_eta)} paradas")
        return paradas_con_eta
    
    def actualizar_eta_tiempo_real(
        self,
        ruta_id: int,
        ubicacion_actual: Tuple[float, float],
        paradas_restantes: List[Dict],
        hora_actual: datetime = None
    ) -> List[Dict]:
        """
        Actualiza ETAs en tiempo real basado en posición actual del vehículo.
        
        Args:
            ruta_id: ID de la ruta optimizada
            ubicacion_actual: (lat, lng) posición actual del vehículo
            paradas_restantes: Paradas que aún no se han completado
            hora_actual: Hora actual (default: now)
        
        Returns:
            Lista de paradas con ETAs actualizados
        """
        if not paradas_restantes:
            logger.warning(f"No hay paradas restantes para ruta {ruta_id}")
            return []
        
        hora_actual = hora_actual or datetime.now()
        lat_actual, lng_actual = ubicacion_actual
        
        paradas_actualizadas = []
        tiempo_acumulado = hora_actual
        
        for i, parada in enumerate(paradas_restantes):
            parada_info = parada.copy()
            
            # Para la primera parada, calcular desde posición actual
            if i == 0:
                ubicacion_parada = parada.get('ubicacion_detalle', {})
                lat_parada = ubicacion_parada.get('lat')
                lng_parada = ubicacion_parada.get('lng')
                
                if lat_parada and lng_parada:
                    # Calcular distancia y tiempo desde posición actual
                    distancia_km = self._calcular_distancia_haversine(
                        lat_actual, lng_actual, 
                        float(lat_parada), float(lng_parada)
                    )
                    
                    # Velocidad promedio: 30 km/h urbano, 50 km/h carretera
                    velocidad_promedio = 35.0  # km/h
                    tiempo_viaje_min = (distancia_km / velocidad_promedio) * 60.0
                    tiempo_viaje_min *= self.traffic_factor
                    
                    tiempo_acumulado += timedelta(minutes=tiempo_viaje_min)
            else:
                # Usar distancia calculada desde parada anterior
                distancia_km = float(parada.get('distancia_desde_anterior_km', 0))
                tiempo_viaje_min = (distancia_km / 35.0) * 60.0
                tiempo_viaje_min *= self.traffic_factor
                tiempo_acumulado += timedelta(minutes=tiempo_viaje_min)
            
            # ETA de llegada
            parada_info['eta_realtime_llegada'] = tiempo_acumulado.time()
            
            # Calcular diferencia con baseline
            eta_baseline = parada.get('tiempo_llegada_estimado')
            if eta_baseline:
                baseline_dt = datetime.combine(hora_actual.date(), eta_baseline)
                diferencia_min = (tiempo_acumulado - baseline_dt).total_seconds() / 60.0
                parada_info['eta_diferencia_minutos'] = round(diferencia_min, 1)
                parada_info['eta_estado'] = self._clasificar_estado_eta(diferencia_min)
            
            # Tiempo de servicio
            tiempo_servicio_min = parada.get('tiempo_servicio_min', 0)
            tiempo_acumulado += timedelta(minutes=tiempo_servicio_min)
            parada_info['eta_realtime_salida'] = tiempo_acumulado.time()
            
            paradas_actualizadas.append(parada_info)
        
        logger.info(
            f"✅ ETAs actualizados en tiempo real para ruta {ruta_id} - "
            f"{len(paradas_actualizadas)} paradas restantes"
        )
        return paradas_actualizadas
    
    def calcular_demora_acumulada(
        self,
        paradas_completadas: List[Dict]
    ) -> Dict[str, float]:
        """
        Calcula estadísticas de demora basadas en paradas ya completadas.
        
        Args:
            paradas_completadas: Paradas que ya fueron visitadas
        
        Returns:
            Diccionario con estadísticas de demora
        """
        if not paradas_completadas:
            return {
                'demora_promedio_min': 0.0,
                'demora_maxima_min': 0.0,
                'paradas_demoradas': 0,
                'factor_demora': 1.0
            }
        
        demoras = []
        paradas_con_demora = 0
        
        for parada in paradas_completadas:
            hora_estimada = parada.get('tiempo_llegada_estimado')
            hora_real = parada.get('hora_llegada_real')
            
            if hora_estimada and hora_real:
                # Convertir a datetime para calcular diferencia
                if isinstance(hora_real, str):
                    hora_real = datetime.fromisoformat(hora_real)
                if isinstance(hora_estimada, str):
                    hora_estimada = datetime.strptime(hora_estimada, '%H:%M:%S').time()
                
                estimado_dt = datetime.combine(hora_real.date(), hora_estimada)
                diferencia_min = (hora_real - estimado_dt).total_seconds() / 60.0
                
                demoras.append(diferencia_min)
                if diferencia_min > 5:  # Demora mayor a 5 minutos
                    paradas_con_demora += 1
        
        if demoras:
            demora_promedio = sum(demoras) / len(demoras)
            demora_maxima = max(demoras)
            # Factor de demora: usado para ajustar ETAs futuras
            factor_demora = 1.0 + (demora_promedio / 60.0)  # Ajuste proporcional
        else:
            demora_promedio = 0.0
            demora_maxima = 0.0
            factor_demora = 1.0
        
        return {
            'demora_promedio_min': round(demora_promedio, 1),
            'demora_maxima_min': round(demora_maxima, 1),
            'paradas_demoradas': paradas_con_demora,
            'factor_demora': round(factor_demora, 2),
            'total_paradas_analizadas': len(demoras)
        }
    
    def _calcular_distancia_haversine(
        self, 
        lat1: float, 
        lng1: float, 
        lat2: float, 
        lng2: float
    ) -> float:
        """
        Calcula distancia entre dos puntos usando fórmula Haversine.
        
        Returns:
            Distancia en kilómetros
        """
        from math import radians, cos, sin, asin, sqrt
        
        # Convertir a radianes
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        
        # Fórmula Haversine
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radio de la Tierra en km
        r = 6371
        
        return c * r
    
    def _clasificar_estado_eta(self, diferencia_min: float) -> str:
        """
        Clasifica el estado del ETA según la diferencia con el baseline.
        
        Args:
            diferencia_min: Diferencia en minutos (positivo = demora, negativo = adelanto)
        
        Returns:
            Estado: 'on_time', 'delayed', 'early', 'critical'
        """
        if diferencia_min <= -5:
            return 'early'  # Adelantado >5 min
        elif diferencia_min <= 5:
            return 'on_time'  # En tiempo ±5 min
        elif diferencia_min <= 15:
            return 'delayed'  # Demorado 5-15 min
        else:
            return 'critical'  # Demora crítica >15 min
