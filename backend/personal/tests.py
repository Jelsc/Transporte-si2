from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date, timedelta
from .models import Personal, Departamento

User = get_user_model()


class PersonalModelTest(TestCase):
    """Tests para el modelo Personal"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.personal = Personal.objects.create(
            nombre="Juan",
            apellido="Pérez",
            ci="12345678",
            email="juan@test.com",
            telefono="123456789",
            fecha_nacimiento="1990-01-01",
            tipo_personal="operador",
            departamento="Operaciones",
            cargo="Operador de Transporte",
            fecha_ingreso=date.today() - timedelta(days=365)
        )
    
    def test_personal_creation(self):
        """Test de creación de personal"""
        self.assertEqual(self.personal.nombre, "Juan")
        self.assertEqual(self.personal.apellido, "Pérez")
        self.assertEqual(self.personal.ci, "12345678")
        self.assertEqual(self.personal.email, "juan@test.com")
        self.assertEqual(self.personal.tipo_personal, "operador")
        self.assertTrue(self.personal.es_activo)
    
    def test_nombre_completo(self):
        """Test del property nombre_completo"""
        self.assertEqual(self.personal.nombre_completo, "Juan Pérez")
    
    def test_anos_antiguedad(self):
        """Test del property anos_antiguedad"""
        # Personal con 1 año de antigüedad
        self.assertEqual(self.personal.anos_antiguedad, 1)
        
        # Personal recién ingresado
        self.personal.fecha_ingreso = date.today()
        self.personal.save()
        self.assertEqual(self.personal.anos_antiguedad, 0)
    
    def test_cambiar_estado(self):
        """Test del método cambiar_estado"""
        self.personal.cambiar_estado("inactivo")
        self.assertEqual(self.personal.estado, "inactivo")
        self.assertFalse(self.personal.es_activo)
    
    def test_ci_unico(self):
        """Test de unicidad de CI"""
        with self.assertRaises(ValidationError):
            Personal.objects.create(
                nombre="Pedro",
                apellido="García",
                ci="12345678",  # Misma CI
                email="pedro@test.com",
                telefono="987654321",
                fecha_nacimiento="1985-05-15",
                tipo_personal="supervisor",
                departamento="Administración",
                cargo="Supervisor",
                fecha_ingreso=date.today()
            )
    
    def test_email_unico(self):
        """Test de unicidad de email"""
        with self.assertRaises(ValidationError):
            Personal.objects.create(
                nombre="Pedro",
                apellido="García",
                ci="87654321",
                email="juan@test.com",  # Mismo email
                telefono="987654321",
                fecha_nacimiento="1985-05-15",
                tipo_personal="supervisor",
                departamento="Administración",
                cargo="Supervisor",
                fecha_ingreso=date.today()
            )


class DepartamentoModelTest(TestCase):
    """Tests para el modelo Departamento"""
    
    def setUp(self):
        """Configuración inicial"""
        self.departamento = Departamento.objects.create(
            nombre='Operaciones',
            descripcion='Departamento de operaciones de transporte'
        )
        
        self.personal = Personal.objects.create(
            nombre="María",
            apellido="González",
            ci="11223344",
            email="maria@test.com",
            telefono="555555555",
            fecha_nacimiento="1988-03-15",
            tipo_personal="operador",
            departamento="Operaciones",
            cargo="Operador",
            fecha_ingreso=date.today()
        )
    
    def test_departamento_creation(self):
        """Test de creación de departamento"""
        self.assertEqual(self.departamento.nombre, "Operaciones")
        self.assertTrue(self.departamento.es_activo)
    
    def test_get_empleados_count(self):
        """Test del método get_empleados_count"""
        # Con empleado
        self.assertEqual(self.departamento.get_empleados_count(), 1)
        
        # Sin empleados
        self.personal.departamento = "Otro Departamento"
        self.personal.save()
        self.assertEqual(self.departamento.get_empleados_count(), 0)
    
    def test_get_empleados(self):
        """Test del método get_empleados"""
        empleados = self.departamento.get_empleados()
        self.assertEqual(empleados.count(), 1)
        self.assertEqual(empleados.first(), self.personal)


class PersonalAdminTest(TestCase):
    """Tests para el admin de personal"""
    
    def setUp(self):
        """Configuración inicial"""
        self.personal = Personal.objects.create(
            nombre="Carlos",
            apellido="Mendoza",
            ci="99887766",
            email="carlos@test.com",
            telefono="666666666",
            fecha_nacimiento="1982-07-20",
            tipo_personal="administrador",
            departamento="Administración",
            cargo="Administrador",
            fecha_ingreso=date.today()
        )
    
    def test_personal_str_representation(self):
        """Test de representación string del personal"""
        expected = f"{self.personal.nombre} {self.personal.apellido} - {self.personal.cargo}"
        self.assertEqual(str(self.personal), expected)
    
    def test_personal_verbose_names(self):
        """Test de nombres verbose del modelo"""
        self.assertEqual(Personal._meta.verbose_name, "Personal")
        self.assertEqual(Personal._meta.verbose_name_plural, "Personal de Empresa")