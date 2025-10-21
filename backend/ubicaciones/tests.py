from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from unittest.mock import patch, Mock

from .models import Ubicacion, TipoUbicacion, SourceUbicacion

User = get_user_model()


class UbicacionModelTest(TestCase):
    """Tests para el modelo Ubicacion"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.ubicacion_data = {
            'tipo': TipoUbicacion.TERMINAL,
            'nombre': 'Terminal Bimodal - Santa Cruz',
            'direccion_texto': 'Av. Intermodal s/n, Santa Cruz',
            'descripcion': 'Terminal principal',
            'lat': Decimal('-17.7849'),
            'lng': Decimal('-63.1806'),
            'service_min': 8,
            'source': SourceUbicacion.MANUAL,
            'activo': True
        }
    
    def test_crear_ubicacion(self):
        """Test crear ubicación básica"""
        ubicacion = Ubicacion.objects.create(**self.ubicacion_data)
        
        self.assertEqual(ubicacion.nombre, 'Terminal Bimodal - Santa Cruz')
        self.assertEqual(ubicacion.tipo, TipoUbicacion.TERMINAL)
        self.assertEqual(ubicacion.lat, Decimal('-17.7849'))
        self.assertEqual(ubicacion.lng, Decimal('-63.1806'))
        self.assertTrue(ubicacion.activo)
        self.assertIsNotNone(ubicacion.geohash)
    
    def test_coordenadas_property(self):
        """Test propiedad coordenadas"""
        ubicacion = Ubicacion.objects.create(**self.ubicacion_data)
        coordenadas = ubicacion.coordenadas
        
        self.assertEqual(coordenadas[0], -17.7849)
        self.assertEqual(coordenadas[1], -63.1806)
    
    def test_geohash_cercano(self):
        """Test geohash de menor precisión"""
        ubicacion = Ubicacion.objects.create(**self.ubicacion_data)
        geohash_cercano = ubicacion.geohash_cercano
        
        self.assertIsNotNone(geohash_cercano)
        self.assertLess(len(geohash_cercano), len(ubicacion.geohash))
    
    def test_validacion_nombre_corto(self):
        """Test validación de nombre muy corto"""
        self.ubicacion_data['nombre'] = 'AB'
        
        with self.assertRaises(Exception):
            ubicacion = Ubicacion(**self.ubicacion_data)
            ubicacion.full_clean()
    
    def test_validacion_coordenadas_faltantes(self):
        """Test validación cuando faltan coordenadas"""
        self.ubicacion_data.pop('lat')
        
        with self.assertRaises(Exception):
            ubicacion = Ubicacion(**self.ubicacion_data)
            ubicacion.full_clean()
    
    def test_validacion_latitud_fuera_rango(self):
        """Test validación de latitud fuera de rango"""
        self.ubicacion_data['lat'] = Decimal('95.0')  # Fuera de rango
        
        with self.assertRaises(Exception):
            ubicacion = Ubicacion(**self.ubicacion_data)
            ubicacion.full_clean()
    
    def test_validacion_longitud_fuera_rango(self):
        """Test validación de longitud fuera de rango"""
        self.ubicacion_data['lng'] = Decimal('185.0')  # Fuera de rango
        
        with self.assertRaises(Exception):
            ubicacion = Ubicacion(**self.ubicacion_data)
            ubicacion.full_clean()
    
    def test_validacion_service_min_negativo(self):
        """Test validación de service_min negativo"""
        self.ubicacion_data['service_min'] = -1
        
        with self.assertRaises(Exception):
            ubicacion = Ubicacion(**self.ubicacion_data)
            ubicacion.full_clean()


class UbicacionAPITest(APITestCase):
    """Tests para la API de ubicaciones"""
    
    def setUp(self):
        """Configuración inicial para los tests de API"""
        # Crear usuario para autenticación
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Datos de ubicación para tests
        self.ubicacion_data = {
            'tipo': TipoUbicacion.TERMINAL,
            'nombre': 'Terminal Bimodal - Santa Cruz',
            'direccion_texto': 'Av. Intermodal s/n, Santa Cruz',
            'descripcion': 'Terminal principal',
            'lat': -17.7849,
            'lng': -63.1806,
            'service_min': 8,
            'source': SourceUbicacion.MANUAL,
            'activo': True
        }
    
    def test_listar_ubicaciones(self):
        """Test listar ubicaciones"""
        # Crear ubicaciones de prueba
        Ubicacion.objects.create(**self.ubicacion_data)
        
        response = self.client.get('/api/ubicaciones/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['nombre'], 'Terminal Bimodal - Santa Cruz')
    
    def test_crear_ubicacion(self):
        """Test crear ubicación vía API"""
        response = self.client.post('/api/ubicaciones/', self.ubicacion_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nombre'], 'Terminal Bimodal - Santa Cruz')
        self.assertEqual(response.data['tipo'], TipoUbicacion.TERMINAL)
        self.assertIsNotNone(response.data['geohash'])
    
    def test_crear_ubicacion_sin_coordenadas(self):
        """Test crear ubicación sin coordenadas debe fallar"""
        data_invalida = self.ubicacion_data.copy()
        data_invalida.pop('lat')
        data_invalida.pop('lng')
        
        response = self.client.post('/api/ubicaciones/', data_invalida)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_crear_ubicacion_nombre_corto(self):
        """Test crear ubicación con nombre muy corto debe fallar"""
        data_invalida = self.ubicacion_data.copy()
        data_invalida['nombre'] = 'AB'
        
        response = self.client.post('/api/ubicaciones/', data_invalida)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_obtener_ubicacion(self):
        """Test obtener ubicación específica"""
        ubicacion = Ubicacion.objects.create(**self.ubicacion_data)
        
        response = self.client.get(f'/api/ubicaciones/{ubicacion.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Terminal Bimodal - Santa Cruz')
    
    def test_actualizar_ubicacion(self):
        """Test actualizar ubicación"""
        ubicacion = Ubicacion.objects.create(**self.ubicacion_data)
        
        data_actualizada = self.ubicacion_data.copy()
        data_actualizada['nombre'] = 'Terminal Bimodal - Santa Cruz (Actualizado)'
        
        response = self.client.put(f'/api/ubicaciones/{ubicacion.id}/', data_actualizada)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Terminal Bimodal - Santa Cruz (Actualizado)')
    
    def test_eliminar_ubicacion(self):
        """Test eliminar ubicación"""
        ubicacion = Ubicacion.objects.create(**self.ubicacion_data)
        
        response = self.client.delete(f'/api/ubicaciones/{ubicacion.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Ubicacion.objects.filter(id=ubicacion.id).exists())
    
    def test_filtrar_por_tipo(self):
        """Test filtrar ubicaciones por tipo"""
        # Crear ubicaciones de diferentes tipos
        Ubicacion.objects.create(**self.ubicacion_data)
        
        data_agencia = self.ubicacion_data.copy()
        data_agencia['nombre'] = 'Agencia Central'
        data_agencia['tipo'] = TipoUbicacion.AGENCIA
        Ubicacion.objects.create(**data_agencia)
        
        response = self.client.get('/api/ubicaciones/?tipo=TERMINAL')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['tipo'], TipoUbicacion.TERMINAL)
    
    def test_buscar_por_nombre(self):
        """Test búsqueda por nombre"""
        Ubicacion.objects.create(**self.ubicacion_data)
        
        response = self.client.get('/api/ubicaciones/?search=Terminal')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_geocodificacion(self):
        """Test endpoint de geocodificación"""
        # Mock de la respuesta de Nominatim
        mock_response = {
            'lat': -17.7849,
            'lng': -63.1806,
            'osm_id': '123456',
            'place_id': '789012',
            'source': SourceUbicacion.GEOCODED_NOMINATIM,
            'direccion_encontrada': 'Av. Intermodal, Santa Cruz, Bolivia',
            'confianza': 0.95
        }
        
        with patch.object(UbicacionViewSet, '_geocodificar_nominatim', return_value=mock_response):
            response = self.client.post('/api/ubicaciones/geocode/', {
                'direccion_texto': 'Av. Intermodal, Santa Cruz'
            })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['lat'], -17.7849)
        self.assertEqual(response.data['lng'], -63.1806)
        self.assertEqual(response.data['source'], SourceUbicacion.GEOCODED_NOMINATIM)
    
    def test_geocodificacion_sin_resultado(self):
        """Test geocodificación sin resultados"""
        with patch.object(UbicacionViewSet, '_geocodificar_nominatim', return_value=None):
            response = self.client.post('/api/ubicaciones/geocode/', {
                'direccion_texto': 'Dirección inexistente'
            })
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_autenticacion_requerida(self):
        """Test que la autenticación es requerida"""
        self.client.force_authenticate(user=None)
        
        response = self.client.get('/api/ubicaciones/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
