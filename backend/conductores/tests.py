from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from .models import Conductor

User = get_user_model()


class ConductorModelTest(TestCase):
    """Tests para el modelo Conductor"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.user = User.objects.create_user(
            username='test_conductor',
            email='conductor@test.com',
            password='testpass123'
        )
        
        self.conductor = Conductor.objects.create(
            usuario=self.user,
            numero_licencia='LIC123456',
            tipo_licencia='B',
            fecha_vencimiento_licencia=date.today() + timedelta(days=365),
            estado='disponible',
            experiencia_anos=5
        )
    
    def test_conductor_creation(self):
        """Test de creación de conductor"""
        self.assertEqual(self.conductor.usuario, self.user)
        self.assertEqual(self.conductor.numero_licencia, 'LIC123456')
        self.assertEqual(self.conductor.tipo_licencia, 'B')
        self.assertTrue(self.conductor.es_activo)
    
    def test_nombre_completo(self):
        """Test del property nombre_completo"""
        self.user.first_name = 'Juan'
        self.user.last_name = 'Pérez'
        self.user.save()
        
        self.assertEqual(self.conductor.nombre_completo, 'Juan Pérez')
    
    def test_licencia_vencida(self):
        """Test del property licencia_vencida"""
        # Licencia válida
        self.assertFalse(self.conductor.licencia_vencida)
        
        # Licencia vencida
        self.conductor.fecha_vencimiento_licencia = date.today() - timedelta(days=1)
        self.conductor.save()
        self.assertTrue(self.conductor.licencia_vencida)
    
    def test_dias_para_vencer_licencia(self):
        """Test del property dias_para_vencer_licencia"""
        dias_esperados = (self.conductor.fecha_vencimiento_licencia - date.today()).days
        self.assertEqual(self.conductor.dias_para_vencer_licencia, dias_esperados)
    
    def test_cambiar_estado(self):
        """Test del método cambiar_estado"""
        # Cambio válido
        self.assertTrue(self.conductor.cambiar_estado('ocupado'))
        self.assertEqual(self.conductor.estado, 'ocupado')
        
        # Cambio inválido
        self.assertFalse(self.conductor.cambiar_estado('estado_invalido'))
        self.assertEqual(self.conductor.estado, 'ocupado')
    
    def test_actualizar_ubicacion(self):
        """Test del método actualizar_ubicacion"""
        lat = -16.5000
        lng = -68.1500
        
        self.conductor.actualizar_ubicacion(lat, lng)
        
        self.assertEqual(self.conductor.ultima_ubicacion_lat, lat)
        self.assertEqual(self.conductor.ultima_ubicacion_lng, lng)
        self.assertIsNotNone(self.conductor.ultima_actualizacion_ubicacion)
    
    def test_puede_conducir(self):
        """Test del método puede_conducir"""
        # Conductor activo con licencia válida
        self.assertTrue(self.conductor.puede_conducir())
        
        # Conductor inactivo
        self.conductor.es_activo = False
        self.conductor.save()
        self.assertFalse(self.conductor.puede_conducir())
        
        # Conductor con licencia vencida
        self.conductor.es_activo = True
        self.conductor.fecha_vencimiento_licencia = date.today() - timedelta(days=1)
        self.conductor.save()
        self.assertFalse(self.conductor.puede_conducir())
        
        # Conductor en estado inactivo
        self.conductor.fecha_vencimiento_licencia = date.today() + timedelta(days=365)
        self.conductor.estado = 'inactivo'
        self.conductor.save()
        self.assertFalse(self.conductor.puede_conducir())


class ConductorAdminTest(TestCase):
    """Tests para el admin de conductores"""
    
    def setUp(self):
        """Configuración inicial"""
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='adminpass123'
        )
        
        self.user = User.objects.create_user(
            username='test_conductor',
            email='conductor@test.com',
            password='testpass123'
        )
    
    def test_conductor_admin_creation(self):
        """Test de creación de conductor desde admin"""
        conductor = Conductor.objects.create(
            usuario=self.user,
            numero_licencia='LIC123456',
            tipo_licencia='B',
            fecha_vencimiento_licencia=date.today() + timedelta(days=365)
        )
        
        self.assertEqual(conductor.usuario, self.user)
        self.assertEqual(conductor.numero_licencia, 'LIC123456')
