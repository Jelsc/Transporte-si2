from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from .models import PersonalEmpresa, Departamento

User = get_user_model()


class PersonalEmpresaModelTest(TestCase):
    """Tests para el modelo PersonalEmpresa"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.user = User.objects.create_user(
            username='test_empleado',
            email='empleado@test.com',
            password='testpass123'
        )
        
        self.empleado = PersonalEmpresa.objects.create(
            usuario=self.user,
            tipo_personal='operador',
            codigo_empleado='EMP001',
            departamento='Operaciones',
            cargo='Operador de Transporte',
            fecha_ingreso=date.today() - timedelta(days=365)
        )
    
    def test_empleado_creation(self):
        """Test de creación de empleado"""
        self.assertEqual(self.empleado.usuario, self.user)
        self.assertEqual(self.empleado.codigo_empleado, 'EMP001')
        self.assertEqual(self.empleado.tipo_personal, 'operador')
        self.assertTrue(self.empleado.es_activo)
    
    def test_nombre_completo(self):
        """Test del property nombre_completo"""
        self.user.first_name = 'María'
        self.user.last_name = 'González'
        self.user.save()
        
        self.assertEqual(self.empleado.nombre_completo, 'María González')
    
    def test_anos_antiguedad(self):
        """Test del property anos_antiguedad"""
        # Empleado con 1 año de antigüedad
        self.assertEqual(self.empleado.anos_antiguedad, 1)
        
        # Empleado recién ingresado
        self.empleado.fecha_ingreso = date.today()
        self.empleado.save()
        self.assertEqual(self.empleado.anos_antiguedad, 0)
    
    def test_cambiar_estado(self):
        """Test del método cambiar_estado"""
        # Cambio válido
        self.assertTrue(self.empleado.cambiar_estado('vacaciones'))
        self.assertEqual(self.empleado.estado, 'vacaciones')
        
        # Cambio inválido
        self.assertFalse(self.empleado.cambiar_estado('estado_invalido'))
        self.assertEqual(self.empleado.estado, 'vacaciones')
    
    def test_actualizar_ultimo_acceso(self):
        """Test del método actualizar_ultimo_acceso"""
        self.empleado.actualizar_ultimo_acceso()
        self.assertIsNotNone(self.empleado.ultimo_acceso)
    
    def test_puede_acceder_sistema(self):
        """Test del método puede_acceder_sistema"""
        # Empleado activo
        self.assertTrue(self.empleado.puede_acceder_sistema())
        
        # Empleado inactivo
        self.empleado.es_activo = False
        self.empleado.save()
        self.assertFalse(self.empleado.puede_acceder_sistema())
        
        # Empleado suspendido
        self.empleado.es_activo = True
        self.empleado.estado = 'suspendido'
        self.empleado.save()
        self.assertFalse(self.empleado.puede_acceder_sistema())
    
    def test_jerarquia(self):
        """Test del método get_jerarquia"""
        # Crear supervisor
        supervisor_user = User.objects.create_user(
            username='supervisor',
            email='supervisor@test.com',
            password='testpass123'
        )
        
        supervisor = PersonalEmpresa.objects.create(
            usuario=supervisor_user,
            tipo_personal='supervisor',
            codigo_empleado='SUP001',
            departamento='Operaciones',
            cargo='Supervisor de Operaciones'
        )
        
        # Asignar supervisor
        self.empleado.supervisor = supervisor
        self.empleado.save()
        
        jerarquia = self.empleado.get_jerarquia()
        self.assertEqual(jerarquia['supervisor'], supervisor)
        self.assertEqual(jerarquia['nivel'], 1)


class DepartamentoModelTest(TestCase):
    """Tests para el modelo Departamento"""
    
    def setUp(self):
        """Configuración inicial"""
        self.departamento = Departamento.objects.create(
            nombre='Operaciones',
            descripcion='Departamento de operaciones de transporte'
        )
    
    def test_departamento_creation(self):
        """Test de creación de departamento"""
        self.assertEqual(self.departamento.nombre, 'Operaciones')
        self.assertTrue(self.departamento.es_activo)
    
    def test_get_empleados_count(self):
        """Test del método get_empleados_count"""
        # Sin empleados
        self.assertEqual(self.departamento.get_empleados_count(), 0)
        
        # Crear empleado
        user = User.objects.create_user(
            username='empleado',
            email='empleado@test.com',
            password='testpass123'
        )
        
        PersonalEmpresa.objects.create(
            usuario=user,
            tipo_personal='operador',
            codigo_empleado='EMP001',
            departamento='Operaciones',
            cargo='Operador'
        )
        
        self.assertEqual(self.departamento.get_empleados_count(), 1)


class PersonalEmpresaAdminTest(TestCase):
    """Tests para el admin de personal"""
    
    def setUp(self):
        """Configuración inicial"""
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='adminpass123'
        )
        
        self.user = User.objects.create_user(
            username='test_empleado',
            email='empleado@test.com',
            password='testpass123'
        )
    
    def test_personal_admin_creation(self):
        """Test de creación de empleado desde admin"""
        empleado = PersonalEmpresa.objects.create(
            usuario=self.user,
            tipo_personal='operador',
            codigo_empleado='EMP001',
            departamento='Operaciones',
            cargo='Operador'
        )
        
        self.assertEqual(empleado.usuario, self.user)
        self.assertEqual(empleado.codigo_empleado, 'EMP001')
