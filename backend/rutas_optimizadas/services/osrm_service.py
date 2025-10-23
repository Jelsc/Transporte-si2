"""
Servicio para integrar con OSRM (Open Source Routing Machine)
Obtiene matrices de distancia y tiempo entre ubicaciones
"""

import os
import requests
import logging
from typing import List, Tuple, Dict, Optional
from decimal import Decimal

logger = logging.getLogger(__name__)


class OSRMService:
    """Servicio para interactuar con OSRM"""
    
    def __init__(self, base_url: str = None):
        """
        Inicializar servicio OSRM
        
        Args:
            base_url: URL del servidor OSRM (por defecto toma de variable de entorno)
        """
        # Prioridad: 1) parametro explicit, 2) variable de entorno, 3) default en contenedor
        if base_url is None:
            base_url = os.getenv("OSRM_URL", "http://osrm-backend:5000")
            
            # Detección automática para desarrollo local sin Docker
            if "localhost" in base_url or "127.0.0.1" in base_url:
                try:
                    # Intentar importar la utilidad de detección de IP
                    from core.utils.ip_detection import get_public_ip
                    ip = get_public_ip()
                    if ip:
                        # Si estamos en desarrollo local, usar localhost; si no, usar IP detectada
                        if ip not in ('localhost', '127.0.0.1'):
                            base_url = f"http://{ip}:5000"
                            logger.info(f"🔍 OSRM: IP pública detectada para OSRM: {ip}")
                except (ImportError, Exception) as e:
                    logger.warning(f"⚠️ No se pudo detectar IP para OSRM: {e}")
        
        logger.info(f"🗺️ OSRM: URL configurada: {base_url}")
        self.base_url = base_url.rstrip('/')
        self.timeout = 30  # segundos
    
    def is_available(self) -> bool:
        """
        Verificar si OSRM está disponible
        
        Returns:
            True si OSRM responde, False en caso contrario
        """
        try:
            # Intentar una petición simple para verificar disponibilidad
            # Usamos coordenadas de prueba cercanas (La Paz, Bolivia)
            test_coords = "-68.1193,-16.5000;-68.1293,-16.5100"
            response = requests.get(
                f"{self.base_url}/route/v1/driving/{test_coords}?overview=false",
                timeout=5
            )
            return response.status_code == 200 and response.json().get('code') == 'Ok'
        except requests.exceptions.RequestException as e:
            logger.warning(f"OSRM no disponible: {e}")
            return False
    
    def obtener_matriz_distancias(
        self, 
        coordenadas: List[Tuple[float, float]]
    ) -> Dict[str, List[List[float]]]:
        """
        Obtener matriz de distancias entre todas las coordenadas
        
        Args:
            coordenadas: Lista de tuplas (lat, lng)
            
        Returns:
            Dict con 'durations' y 'distances' matrices
            
        Raises:
            requests.exceptions.RequestException: Si falla la comunicación con OSRM
        """
        if len(coordenadas) < 2:
            raise ValueError("Se necesitan al menos 2 coordenadas")
        
        # Convertir coordenadas a formato OSRM (lng,lat) con precisión completa
        # Usar formato con 6 decimales para mantener precisión
        osrm_coords = [f"{float(lng):.6f},{float(lat):.6f}" for lat, lng in coordenadas]
        coordinates_str = ";".join(osrm_coords)
        
        # Construir la URL completa manualmente
        # No incluir sources/destinations cuando queremos la matriz completa (optimización)
        url = f"{self.base_url}/table/v1/driving/{coordinates_str}?annotations=duration,distance"
        
        try:
            logger.info(f"Obteniendo matriz OSRM para {len(coordenadas)} coordenadas")
            response = requests.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('code') != 'Ok':
                raise Exception(f"Error OSRM: {data.get('message', 'Unknown error')}")
            
            return {
                'durations': data.get('durations', []),
                'distances': data.get('distances', [])
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al obtener matriz OSRM: {e}")
            raise
    
    def obtener_ruta_detallada(
        self,
        origen: Tuple[float, float],
        destino: Tuple[float, float]
    ) -> Dict:
        """
        Obtener ruta detallada entre dos puntos
        
        Args:
            origen: Tupla (lat, lng) del punto de origen
            destino: Tupla (lat, lng) del punto de destino
            
        Returns:
            Dict con información detallada de la ruta
        """
        lat_orig, lng_orig = origen
        lat_dest, lng_dest = destino
        
        # Formatear coordenadas con precisión completa
        url = f"{self.base_url}/route/v1/driving/{float(lng_orig):.6f},{float(lat_orig):.6f};{float(lng_dest):.6f},{float(lat_dest):.6f}"
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'steps': 'true'
        }
        
        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('code') != 'Ok':
                raise Exception(f"Error OSRM: {data.get('message', 'Unknown error')}")
            
            route = data['routes'][0]
            
            return {
                'distance': route['distance'],  # metros
                'duration': route['duration'],  # segundos
                'geometry': route['geometry'],
                'legs': route['legs']
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al obtener ruta detallada: {e}")
            raise
    
    def obtener_rutas_multiples(
        self,
        coordenadas: List[Tuple[float, float]]
    ) -> Dict:
        """
        Obtener rutas entre múltiples puntos en secuencia
        
        Args:
            coordenadas: Lista de tuplas (lat, lng) en orden de visita
            
        Returns:
            Dict con información de la ruta completa
        """
        if len(coordenadas) < 2:
            raise ValueError("Se necesitan al menos 2 coordenadas")
        
        # Convertir coordenadas a formato OSRM (lng,lat) con precisión completa
        # Usar formato con 6 decimales para mantener precisión
        osrm_coords = [f"{float(lng):.6f},{float(lat):.6f}" for lat, lng in coordenadas]
        coordinates_str = ";".join(osrm_coords)
        
        url = f"{self.base_url}/route/v1/driving/{coordinates_str}"
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'steps': 'false'
        }
        
        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('code') != 'Ok':
                raise Exception(f"Error OSRM: {data.get('message', 'Unknown error')}")
            
            route = data['routes'][0]
            
            return {
                'distance': route['distance'],  # metros
                'duration': route['duration'],  # segundos
                'geometry': route['geometry'],
                'waypoints': data.get('waypoints', [])  # waypoints está en el root, no en route
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al obtener rutas múltiples: {e}")
            raise
    
    def calcular_distancia_haversine(
        self,
        punto1: Tuple[float, float],
        punto2: Tuple[float, float]
    ) -> float:
        """
        Calcular distancia aproximada usando fórmula de Haversine
        (fallback cuando OSRM no está disponible)
        
        Args:
            punto1: Tupla (lat, lng) del primer punto
            punto2: Tupla (lat, lng) del segundo punto
            
        Returns:
            Distancia en metros
        """
        import math
        
        lat1, lng1 = punto1
        lat2, lng2 = punto2
        
        # Radio de la Tierra en metros
        R = 6371000
        
        # Convertir grados a radianes
        lat1_rad = math.radians(lat1)
        lng1_rad = math.radians(lng1)
        lat2_rad = math.radians(lat2)
        lng2_rad = math.radians(lng2)
        
        # Diferencia de coordenadas
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        # Fórmula de Haversine
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def obtener_matriz_fallback(
        self,
        coordenadas: List[Tuple[float, float]]
    ) -> Dict[str, List[List[float]]]:
        """
        Obtener matriz de distancias usando Haversine como fallback
        
        Args:
            coordenadas: Lista de tuplas (lat, lng)
            
        Returns:
            Dict con matrices de distancias y duraciones estimadas
        """
        n = len(coordenadas)
        distances = [[0.0 for _ in range(n)] for _ in range(n)]
        durations = [[0.0 for _ in range(n)] for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    dist = self.calcular_distancia_haversine(coordenadas[i], coordenadas[j])
                    distances[i][j] = dist
                    # Estimar duración asumiendo velocidad promedio de 50 km/h
                    durations[i][j] = dist / 13.89  # 50 km/h = 13.89 m/s
                else:
                    distances[i][j] = 0.0
                    durations[i][j] = 0.0
        
        return {
            'distances': distances,
            'durations': durations
        }
    
    def obtener_matriz_con_fallback(
        self,
        coordenadas: List[Tuple[float, float]]
    ) -> Dict[str, List[List[float]]]:
        """
        Obtener matriz intentando OSRM primero, luego fallback
        
        Args:
            coordenadas: Lista de tuplas (lat, lng)
            
        Returns:
            Dict con matrices de distancias y duraciones
        """
        try:
            if self.is_available():
                return self.obtener_matriz_distancias(coordenadas)
            else:
                logger.warning("OSRM no disponible, usando cálculo Haversine")
                return self.obtener_matriz_fallback(coordenadas)
        except Exception as e:
            logger.warning(f"Error con OSRM, usando fallback: {e}")
            return self.obtener_matriz_fallback(coordenadas)


# Instancia global del servicio
osrm_service = OSRMService()
