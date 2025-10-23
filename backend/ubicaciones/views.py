from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.core.cache import cache
import requests
import time

from .models import Ubicacion, SourceUbicacion
from .serializers import (
    UbicacionSerializer,
    UbicacionCreateSerializer,
    UbicacionUpdateSerializer,
    GeocodeRequestSerializer,
    GeocodeResponseSerializer
)


class UbicacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el CRUD completo de ubicaciones.
    
    Endpoints disponibles:
    - GET /api/ubicaciones/ - Listar ubicaciones (con filtros y búsqueda)
    - POST /api/ubicaciones/ - Crear nueva ubicación
    - GET /api/ubicaciones/{id}/ - Obtener ubicación específica
    - PUT /api/ubicaciones/{id}/ - Actualizar ubicación completa
    - PATCH /api/ubicaciones/{id}/ - Actualizar ubicación parcial
    - DELETE /api/ubicaciones/{id}/ - Eliminar ubicación
    - POST /api/ubicaciones/geocode/ - Geocodificar dirección
    """
    
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer
    permission_classes = [IsAuthenticated]
    
    # Filtros y búsqueda
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'activo']
    search_fields = ['nombre', 'direccion_texto', 'descripcion']
    ordering_fields = ['nombre', 'created_at', 'updated_at', 'tipo']
    ordering = ['-updated_at']
    
    def get_permissions(self):
        """
        Permisos personalizados:
        - Lectura (GET, HEAD, OPTIONS): Acceso público
        - Escritura (POST, PUT, PATCH, DELETE): Requiere autenticación
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return UbicacionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UbicacionUpdateSerializer
        return UbicacionSerializer
    
    def get_queryset(self):
        """Optimizar consultas y aplicar filtros adicionales"""
        queryset = super().get_queryset()
        
        # Filtrar por tipo si se especifica
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filtrar por estado activo si se especifica
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            activo_bool = activo.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(activo=activo_bool)
        
        # Búsqueda por nombre o dirección
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(direccion_texto__icontains=search) |
                Q(descripcion__icontains=search)
            )
        
        return queryset.select_related()
    
    def perform_create(self, serializer):
        """Personalizar la creación de ubicaciones"""
        # TODO: Agregar lógica de deduplicación suave si es necesario
        serializer.save()
    
    def perform_update(self, serializer):
        """Personalizar la actualización de ubicaciones"""
        serializer.save()
    
    @action(detail=False, methods=['post'], url_path='geocode')
    def geocode(self, request):
        """
        Geocodifica una dirección usando Nominatim.
        
        POST /api/ubicaciones/geocode/
        {
            "direccion_texto": "Av. Intermodal s/n, Santa Cruz"
        }
        
        Respuesta:
        {
            "lat": -17.7849,
            "lng": -63.1806,
            "osm_id": "node/123456",
            "place_id": "123456789",
            "source": "GEOCODED_NOMINATIM",
            "direccion_encontrada": "Av. Intermodal, Santa Cruz, Bolivia",
            "confianza": 0.95
        }
        """
        serializer = GeocodeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        direccion = serializer.validated_data['direccion_texto']
        
        # Verificar cache primero
        cache_key = f"geocode:{direccion.lower()}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            return Response(cached_result, status=status.HTTP_200_OK)
        
        try:
            # Geocodificar con Nominatim
            resultado = self._geocodificar_nominatim(direccion)
            
            if resultado:
                # Cachear resultado por 24 horas
                cache.set(cache_key, resultado, 86400)
                return Response(resultado, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'No se pudo geocodificar la dirección'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error en geocodificación: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _geocodificar_nominatim(self, direccion):
        """
        Geocodifica una dirección usando el servicio Nominatim de OpenStreetMap.
        
        Args:
            direccion (str): Dirección a geocodificar
            
        Returns:
            dict: Resultado de la geocodificación o None si falla
        """
        # URL del servicio Nominatim
        url = "https://nominatim.openstreetmap.org/search"
        
        # Parámetros de la consulta
        params = {
            'q': direccion,
            'format': 'json',
            'limit': 1,
            'addressdetails': 1,
            'countrycodes': 'bo',  # Limitar a Bolivia
            'extratags': 1
        }
        
        # Headers para ser respetuosos con el servicio
        headers = {
            'User-Agent': 'Transporte-SI2/1.0 (contacto@empresa.com)'
        }
        
        try:
            # Rate limiting: esperar 1 segundo entre requests
            time.sleep(1)
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data:
                return None
            
            # Tomar el primer resultado
            result = data[0]
            
            # Extraer información relevante
            lat = float(result['lat'])
            lng = float(result['lon'])
            osm_id = result.get('osm_id')
            place_id = result.get('place_id')
            
            # Construir dirección formateada
            direccion_encontrada = self._formatear_direccion(result)
            
            # Calcular confianza basada en el tipo de lugar
            confianza = self._calcular_confianza(result)
            
            return {
                'lat': lat,
                'lng': lng,
                'osm_id': f"node/{osm_id}" if osm_id else None,
                'place_id': str(place_id) if place_id else None,
                'source': SourceUbicacion.GEOCODED_NOMINATIM,
                'direccion_encontrada': direccion_encontrada,
                'confianza': confianza
            }
            
        except requests.RequestException as e:
            print(f"Error en request a Nominatim: {e}")
            return None
        except (ValueError, KeyError) as e:
            print(f"Error procesando respuesta de Nominatim: {e}")
            return None
    
    def _formatear_direccion(self, result):
        """Formatea la dirección encontrada por Nominatim"""
        address = result.get('address', {})
        
        # Construir dirección jerárquicamente
        componentes = []
        
        # Avenida/Calle
        if 'road' in address:
            componentes.append(address['road'])
        elif 'pedestrian' in address:
            componentes.append(address['pedestrian'])
        
        # Número
        if 'house_number' in address:
            componentes.append(address['house_number'])
        
        # Barrio/Suburbio
        if 'suburb' in address:
            componentes.append(address['suburb'])
        elif 'neighbourhood' in address:
            componentes.append(address['neighbourhood'])
        
        # Ciudad
        if 'city' in address:
            componentes.append(address['city'])
        elif 'town' in address:
            componentes.append(address['town'])
        elif 'village' in address:
            componentes.append(address['village'])
        
        # Estado/Departamento
        if 'state' in address:
            componentes.append(address['state'])
        
        # País
        if 'country' in address:
            componentes.append(address['country'])
        
        return ', '.join(componentes) if componentes else result.get('display_name', '')
    
    def _calcular_confianza(self, result):
        """Calcula el nivel de confianza basado en el tipo de lugar"""
        # Tipos de lugares con diferentes niveles de confianza
        confianza_por_tipo = {
            'house': 0.95,
            'building': 0.90,
            'amenity': 0.85,
            'shop': 0.85,
            'office': 0.85,
            'highway': 0.70,
            'place': 0.60,
        }
        
        # Obtener tipo de lugar
        place_type = result.get('type', '')
        osm_type = result.get('osm_type', '')
        
        # Determinar confianza
        if place_type in confianza_por_tipo:
            return confianza_por_tipo[place_type]
        elif osm_type == 'node':
            return 0.80  # Nodos son más precisos
        elif osm_type == 'way':
            return 0.75  # Ways pueden ser menos precisos
        else:
            return 0.60  # Confianza por defecto
