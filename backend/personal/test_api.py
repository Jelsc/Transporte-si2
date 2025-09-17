from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date, timedelta
from .models import Personal, Departamento

User = get_user_model()


class PersonalAPITest(APITestCase):
    """Tests para la API de Personal"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        # Crear usuario admin
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="testpass123",
            is_staff=True,
            is_superuser=True
        )
        
        # Crear token JWT
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Datos de prueba
        self.personal_data = {
            "nombre": "Juan",
            "apellido": "Pérez",
            "ci": "12345678",
            "email": "juan@test.com",
            "telefono": "123456789",
            "fecha_nacimiento": "1990-01-01",
            "tipo_personal": "operador",
            "departamento": "Operaciones",
            "cargo": "Operador de Transporte",
            "fecha_ingreso": str(date.today() - timedelta(days=365))
        }
    
    def test_create_personal(self):
        """Test de creación de personal via API"""
        url = reverse('personal-list')
        response = self.client.post(url, self.personal_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Personal.objects.count(), 1)
        
        personal = Personal.objects.get()
        self.assertEqual(personal.nombre, "Juan")
        self.assertEqual(personal.apellido, "Pérez")
        self.assertEqual(personal.ci, "12345678")
        self.assertEqual(personal.email, "juan@test.com")
    
    def test_list_personal(self):
        """Test de listado de personal via API"""
        # Crear personal de prueba
        Personal.objects.create(**self.personal_data)
        
        url = reverse('personal-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        personal_data = response.data['results'][0]
        self.assertEqual(personal_data['nombre'], "Juan")
        self.assertEqual(personal_data['apellido'], "Pérez")
    
    def test_retrieve_personal(self):
        """Test de obtención de personal específico via API"""
        personal = Personal.objects.create(**self.personal_data)
        
        url = reverse('personal-detail', kwargs={'pk': personal.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], "Juan")
        self.assertEqual(response.data['apellido'], "Pérez")
    
    def test_update_personal(self):
        """Test de actualización de personal via API"""
        personal = Personal.objects.create(**self.personal_data)
        
        update_data = {
            "nombre": "Juan Carlos",
            "apellido": "Pérez García",
            "ci": "12345678",
            "email": "juancarlos@test.com",
            "telefono": "987654321",
            "fecha_nacimiento": "1990-01-01",
            "tipo_personal": "supervisor",
            "departamento": "Administración",
            "cargo": "Supervisor",
            "fecha_ingreso": str(date.today() - timedelta(days=365))
        }
        
        url = reverse('personal-detail', kwargs={'pk': personal.pk})
        response = self.client.put(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        personal.refresh_from_db()
        self.assertEqual(personal.nombre, "Juan Carlos")
        self.assertEqual(personal.apellido, "Pérez García")
        self.assertEqual(personal.email, "juancarlos@test.com")
        self.assertEqual(personal.tipo_personal, "supervisor")
    
    def test_delete_personal(self):
        """Test de eliminación de personal via API"""
        personal = Personal.objects.create(**self.personal_data)
        
        url = reverse('personal-detail', kwargs={'pk': personal.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Personal.objects.count(), 0)
    
    def test_personal_validation_ci_unique(self):
        """Test de validación de CI único"""
        Personal.objects.create(**self.personal_data)
        
        # Intentar crear otro personal con la misma CI
        duplicate_data = self.personal_data.copy()
        duplicate_data['email'] = "otro@test.com"
        
        url = reverse('personal-list')
        response = self.client.post(url, duplicate_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ci', response.data)
    
    def test_personal_validation_email_unique(self):
        """Test de validación de email único"""
        Personal.objects.create(**self.personal_data)
        
        # Intentar crear otro personal con el mismo email
        duplicate_data = self.personal_data.copy()
        duplicate_data['ci'] = "87654321"
        
        url = reverse('personal-list')
        response = self.client.post(url, duplicate_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_personal_search(self):
        """Test de búsqueda de personal"""
        Personal.objects.create(**self.personal_data)
        
        # Crear otro personal
        other_data = self.personal_data.copy()
        other_data.update({
            'nombre': 'Pedro',
            'apellido': 'García',
            'ci': '87654321',
            'email': 'pedro@test.com'
        })
        Personal.objects.create(**other_data)
        
        # Buscar por nombre
        url = reverse('personal-list')
        response = self.client.get(url, {'search': 'Juan'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['nombre'], 'Juan')
    
    def test_personal_filter_by_tipo(self):
        """Test de filtrado por tipo de personal"""
        Personal.objects.create(**self.personal_data)
        
        # Crear otro personal con tipo diferente
        other_data = self.personal_data.copy()
        other_data.update({
            'nombre': 'Pedro',
            'apellido': 'García',
            'ci': '87654321',
            'email': 'pedro@test.com',
            'tipo_personal': 'supervisor'
        })
        Personal.objects.create(**other_data)
        
        # Filtrar por tipo
        url = reverse('personal-list')
        response = self.client.get(url, {'tipo_personal': 'operador'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['tipo_personal'], 'operador')
    
    def test_unauthorized_access(self):
        """Test de acceso no autorizado"""
        # Remover credenciales
        self.client.credentials()
        
        url = reverse('personal-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
