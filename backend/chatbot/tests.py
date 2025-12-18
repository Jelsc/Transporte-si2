from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, time
from decimal import Decimal

from .models import ChatConversation, ChatMessage, ChatRecommendation
from .services import ChatbotService
from viajes.models import Viaje
from ubicaciones.models import Ubicacion
from vehiculos.models import Vehiculo

User = get_user_model()


class ChatbotModelTests(TestCase):
    """Tests para los modelos del chatbot."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.conversation = ChatConversation.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
    
    def test_create_conversation(self):
        """Test crear conversación."""
        self.assertEqual(self.conversation.user, self.user)
        self.assertEqual(self.conversation.session_id, 'test-session-123')
        self.assertTrue(self.conversation.is_active)
    
    def test_create_message(self):
        """Test crear mensaje."""
        message = ChatMessage.objects.create(
            conversation=self.conversation,
            role='user',
            content='Hola, quiero viajar'
        )
        
        self.assertEqual(message.conversation, self.conversation)
        self.assertEqual(message.role, 'user')
        self.assertEqual(message.content, 'Hola, quiero viajar')
    
    def test_create_recommendation(self):
        """Test crear recomendación."""
        message = ChatMessage.objects.create(
            conversation=self.conversation,
            role='assistant',
            content='Aquí hay un viaje'
        )
        
        recommendation = ChatRecommendation.objects.create(
            message=message,
            recommendation_type='viaje',
            data={'viaje_id': 1},
            confidence_score=0.9
        )
        
        self.assertEqual(recommendation.message, message)
        self.assertEqual(recommendation.recommendation_type, 'viaje')
        self.assertEqual(recommendation.confidence_score, 0.9)


class ChatbotServiceTests(TestCase):
    """Tests para el servicio del chatbot."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        
        # Crear ubicaciones
        self.origen = Ubicacion.objects.create(
            nombre='La Paz',
            ciudad='La Paz',
            latitud=-16.5,
            longitud=-68.15,
            activo=True
        )
        
        self.destino = Ubicacion.objects.create(
            nombre='Cochabamba',
            ciudad='Cochabamba',
            latitud=-17.4,
            longitud=-66.17,
            activo=True
        )
        
        # Crear vehículo
        self.vehiculo = Vehiculo.objects.create(
            placa='TEST-123',
            marca='Mercedes',
            modelo='Sprinter',
            capacidad=20,
            anio=2020,
            disponible=True
        )
        
        # Crear viaje
        self.viaje = Viaje.objects.create(
            origen=self.origen,
            destino=self.destino,
            fecha=date.today(),
            hora=time(8, 0),
            vehiculo=self.vehiculo,
            precio=Decimal('50.00'),
            estado='programado'
        )
        
        self.service = ChatbotService(user=self.user)
    
    def test_analyze_intent_route_search(self):
        """Test detección de intención de búsqueda de ruta."""
        intent = self.service._analyze_intent('Quiero ir de La Paz a Cochabamba')
        
        self.assertEqual(intent['type'], 'buscar_ruta')
        self.assertGreater(intent['confidence'], 0.5)
    
    def test_analyze_intent_schedule(self):
        """Test detección de intención de consulta de horarios."""
        intent = self.service._analyze_intent('¿Cuáles son los horarios disponibles?')
        
        self.assertEqual(intent['type'], 'consultar_horarios')
        self.assertGreater(intent['confidence'], 0.5)
    
    def test_analyze_intent_price(self):
        """Test detección de intención de consulta de precios."""
        intent = self.service._analyze_intent('¿Cuánto cuesta el viaje?')
        
        self.assertEqual(intent['type'], 'consultar_precio')
        self.assertGreater(intent['confidence'], 0.5)
    
    def test_extract_locations(self):
        """Test extracción de ubicaciones del mensaje."""
        locations = self.service._extract_locations('Quiero ir de La Paz a Cochabamba')
        
        self.assertIn('La Paz', locations)
        self.assertIn('Cochabamba', locations)
    
    def test_process_message(self):
        """Test procesamiento completo de mensaje."""
        response = self.service.process_message('Hola')
        
        self.assertIn('session_id', response)
        self.assertIn('message', response)
        self.assertTrue(response['message'])
    
    def test_get_or_create_conversation_new(self):
        """Test crear nueva conversación."""
        conversation = self.service.get_or_create_conversation()
        
        self.assertEqual(conversation.user, self.user)
        self.assertTrue(conversation.is_active)
    
    def test_get_or_create_conversation_existing(self):
        """Test obtener conversación existente."""
        # Crear conversación
        conv1 = self.service.get_or_create_conversation()
        session_id = conv1.session_id
        
        # Obtener la misma conversación
        conv2 = self.service.get_or_create_conversation(session_id)
        
        self.assertEqual(conv1.id, conv2.id)


class ChatbotViewTests(TestCase):
    """Tests para las vistas del chatbot."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.client.force_login(self.user)
    
    def test_chat_endpoint(self):
        """Test endpoint de chat."""
        response = self.client.post(
            '/api/chatbot/chat/',
            {'message': 'Hola'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('session_id', data)
        self.assertIn('message', data)
    
    def test_history_endpoint(self):
        """Test endpoint de historial."""
        response = self.client.get('/api/chatbot/history/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
    
    def test_stats_endpoint(self):
        """Test endpoint de estadísticas."""
        response = self.client.get('/api/chatbot/stats/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_conversations', data)
        self.assertIn('total_messages', data)
    
    def test_chat_requires_authentication(self):
        """Test que el chat requiere autenticación."""
        self.client.logout()
        
        response = self.client.post(
            '/api/chatbot/chat/',
            {'message': 'Hola'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
