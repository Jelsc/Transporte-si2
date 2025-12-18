import uuid
import re
import os
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Avg, Min, Max, Count
from typing import Dict, List, Any, Optional

from .models import ChatConversation, ChatMessage, ChatRecommendation
from viajes.models import Viaje, Asiento
from ubicaciones.models import Ubicacion
from vehiculos.models import Vehiculo

# Intentar importar OpenAI
try:
    from .openai_integration import OpenAIChatbotIntegration
    OPENAI_AVAILABLE = True
except (ImportError, ValueError) as e:
    OPENAI_AVAILABLE = False
    print(f"OpenAI no disponible: {e}")


class ChatbotService:
    """
    Servicio principal del chatbot que maneja la lógica de recomendaciones.
    """
    
    def __init__(self, user):
        self.user = user
        
        # Intentar usar OpenAI/Groq si está configurado
        self.use_ai = False
        if OPENAI_AVAILABLE and (os.getenv('GROQ_API_KEY') or os.getenv('OPENAI_API_KEY')):
            try:
                self.ai = OpenAIChatbotIntegration()
                self.use_ai = True
                provider = "Groq" if os.getenv('GROQ_API_KEY') else "OpenAI"
                print(f"✅ Chatbot usando {provider} para usuario {user.email}")
            except Exception as e:
                print(f"⚠️ No se pudo inicializar IA: {e}")
                self.use_ai = False
        else:
            print(f"ℹ️ Chatbot usando análisis basado en reglas para usuario {user.email}")
        
    def get_or_create_conversation(self, session_id: Optional[str] = None) -> ChatConversation:
        """Obtiene o crea una conversación."""
        if session_id:
            try:
                conversation = ChatConversation.objects.get(
                    session_id=session_id,
                    user=self.user,
                    is_active=True
                )
                return conversation
            except ChatConversation.DoesNotExist:
                pass
        
        # Crear nueva conversación
        conversation = ChatConversation.objects.create(
            user=self.user,
            session_id=str(uuid.uuid4()),
            is_active=True
        )
        return conversation
    
    def process_message(self, message_content: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Procesa un mensaje del usuario y genera una respuesta.
        """
        # Obtener o crear conversación
        conversation = self.get_or_create_conversation(session_id)
        
        # Guardar mensaje del usuario
        user_message = ChatMessage.objects.create(
            conversation=conversation,
            role='user',
            content=message_content
        )
        
        # Analizar la intención del usuario
        if self.use_ai:
            # Usar OpenAI para análisis de intención
            intent = self.ai.analyze_intent(message_content)
        else:
            # Usar análisis basado en reglas
            intent = self._analyze_intent(message_content)
        
        # Generar respuesta basada en la intención
        response_data = self._generate_response(intent, message_content, conversation)
        
        # Guardar mensaje del asistente
        assistant_message = ChatMessage.objects.create(
            conversation=conversation,
            role='assistant',
            content=response_data['message'],
            metadata=response_data.get('metadata', {})
        )
        
        # Guardar recomendaciones si las hay
        recommendations = []
        for rec in response_data.get('recommendations', []):
            recommendation = ChatRecommendation.objects.create(
                message=assistant_message,
                recommendation_type=rec['type'],
                data=rec['data'],
                confidence_score=rec.get('confidence', 0.8)
            )
            recommendations.append(recommendation)
        
        return {
            'session_id': conversation.session_id,
            'message': response_data['message'],
            'recommendations': recommendations,
            'metadata': response_data.get('metadata', {})
        }
    
    def _analyze_intent(self, message: str) -> Dict[str, Any]:
        """
        Analiza la intención del mensaje del usuario.
        Por ahora usa reglas simples, pero puede integrarse con un modelo de IA.
        """
        message_lower = message.lower()
        
        intent = {
            'type': 'general',
            'entities': {},
            'confidence': 0.5
        }
        
        # Detectar consulta de rutas
        if any(word in message_lower for word in ['ruta', 'viaje', 'ir', 'llegar', 'cómo llego', 'quiero ir']):
            intent['type'] = 'buscar_ruta'
            intent['confidence'] = 0.8
            
            # Extraer ubicaciones mencionadas
            ubicaciones = self._extract_locations(message)
            if ubicaciones:
                intent['entities']['ubicaciones'] = ubicaciones
        
        # Detectar consulta de horarios
        elif any(word in message_lower for word in ['horario', 'hora', 'cuándo', 'sale', 'disponible']):
            intent['type'] = 'consultar_horarios'
            intent['confidence'] = 0.8
            
            # Extraer fecha si se menciona
            fecha = self._extract_date(message)
            if fecha:
                intent['entities']['fecha'] = fecha
        
        # Detectar consulta de precios
        elif any(word in message_lower for word in ['precio', 'costo', 'cuánto', 'valor', 'tarifa']):
            intent['type'] = 'consultar_precio'
            intent['confidence'] = 0.8
        
        # Detectar búsqueda de vehículos
        elif any(word in message_lower for word in ['vehículo', 'bus', 'cómodo', 'asientos']):
            intent['type'] = 'buscar_vehiculo'
            intent['confidence'] = 0.7
        
        # Detectar solicitud de ayuda
        elif any(word in message_lower for word in ['ayuda', 'ayúdame', 'qué puedes', 'cómo funciona']):
            intent['type'] = 'ayuda'
            intent['confidence'] = 0.9
        
        return intent
    
    def _generate_response(self, intent: Dict[str, Any], message: str, conversation: ChatConversation) -> Dict[str, Any]:
        """
        Genera una respuesta basada en la intención detectada.
        """
        intent_type = intent['type']
        
        if intent_type == 'buscar_ruta':
            return self._handle_route_search(intent, message)
        elif intent_type == 'consultar_horarios':
            return self._handle_schedule_query(intent, message)
        elif intent_type == 'consultar_precio':
            return self._handle_price_query(intent, message)
        elif intent_type == 'buscar_vehiculo':
            return self._handle_vehicle_search(intent, message)
        elif intent_type == 'ayuda':
            return self._handle_help_request()
        else:
            return self._handle_general_query(message)
    
    def _handle_route_search(self, intent: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Maneja búsqueda de rutas."""
        ubicaciones = intent['entities'].get('ubicaciones', [])
        
        if len(ubicaciones) < 2:
            # Pedir más información
            ubicaciones_disponibles = list(Ubicacion.objects.filter(activo=True).values_list('nombre', flat=True)[:10])
            return {
                'message': f"Para ayudarte a encontrar una ruta, necesito saber tu origen y destino. "
                          f"Algunas ubicaciones disponibles son: {', '.join(ubicaciones_disponibles)}. "
                          f"¿Desde dónde y hacia dónde quieres viajar?",
                'recommendations': [],
                'metadata': {'requires_location': True, 'ubicaciones_disponibles': ubicaciones_disponibles}
            }
        
        # Buscar viajes disponibles
        origen_query = Q()
        destino_query = Q()
        
        for ub in ubicaciones[:1]:  # Primera como origen
            origen_query |= Q(origen__nombre__icontains=ub)
        
        for ub in ubicaciones[1:2]:  # Segunda como destino
            destino_query |= Q(destino__nombre__icontains=ub)
        
        viajes = Viaje.objects.filter(
            origen_query & destino_query,
            estado='programado',
            fecha__gte=timezone.now().date()
        ).select_related('origen', 'destino', 'vehiculo').order_by('fecha', 'hora')[:5]
        
        if viajes:
            recommendations = []
            viajes_info = []
            
            for viaje in viajes:
                asientos_disponibles = viaje.get_asientos_disponibles_count()
                
                recommendations.append({
                    'type': 'viaje',
                    'data': {
                        'viaje_id': viaje.id,
                        'origen': viaje.origen.nombre,
                        'destino': viaje.destino.nombre,
                        'fecha': viaje.fecha.isoformat(),
                        'hora': viaje.hora.isoformat(),
                        'precio': float(viaje.precio),
                        'asientos_disponibles': asientos_disponibles,
                        'vehiculo': {
                            'modelo': viaje.vehiculo.modelo,
                            'capacidad': viaje.vehiculo.capacidad
                        }
                    },
                    'confidence': 0.9
                })
                
                viajes_info.append(
                    f"- {viaje.fecha.strftime('%d/%m/%Y')} a las {viaje.hora.strftime('%H:%M')} - "
                    f"Bs. {viaje.precio} ({asientos_disponibles} asientos disponibles)"
                )
            
            message = (
                f"¡Encontré {len(viajes)} viaje(s) disponible(s) desde {viajes[0].origen.nombre} "
                f"hasta {viajes[0].destino.nombre}:\n\n" + "\n".join(viajes_info) +
                f"\n\n¿Te gustaría reservar alguno de estos viajes?"
            )
            
            return {
                'message': message,
                'recommendations': recommendations,
                'metadata': {'found_trips': len(viajes)}
            }
        else:
            return {
                'message': f"Lo siento, no encontré viajes disponibles para esa ruta en este momento. "
                          f"¿Quieres buscar en otras fechas o destinos alternativos?",
                'recommendations': [],
                'metadata': {'found_trips': 0}
            }
    
    def _handle_schedule_query(self, intent: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Maneja consultas de horarios."""
        fecha = intent['entities'].get('fecha', timezone.now().date())
        
        viajes = Viaje.objects.filter(
            estado='programado',
            fecha__gte=fecha
        ).select_related('origen', 'destino').order_by('fecha', 'hora')[:10]
        
        if viajes:
            horarios_por_ruta = {}
            for viaje in viajes:
                ruta = f"{viaje.origen.nombre} - {viaje.destino.nombre}"
                if ruta not in horarios_por_ruta:
                    horarios_por_ruta[ruta] = []
                horarios_por_ruta[ruta].append(
                    f"{viaje.fecha.strftime('%d/%m')} {viaje.hora.strftime('%H:%M')}"
                )
            
            message_parts = ["Estos son algunos horarios disponibles:\n"]
            for ruta, horarios in list(horarios_por_ruta.items())[:5]:
                message_parts.append(f"\n**{ruta}:**")
                message_parts.append(", ".join(horarios[:3]))
            
            return {
                'message': "\n".join(message_parts) + "\n\n¿Hay alguna ruta específica que te interese?",
                'recommendations': [],
                'metadata': {'total_trips': len(viajes)}
            }
        
        return {
            'message': "No hay horarios disponibles para las próximas fechas. Te sugerimos revisar más adelante.",
            'recommendations': [],
            'metadata': {}
        }
    
    def _handle_price_query(self, intent: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Maneja consultas de precios."""
        # Obtener estadísticas de precios
        precio_stats = Viaje.objects.filter(
            estado='programado'
        ).aggregate(
            min_precio=Min('precio'),
            max_precio=Max('precio'),
            avg_precio=Avg('precio')
        )
        
        if precio_stats['avg_precio']:
            message = (
                f"Los precios de nuestros viajes varían según la ruta y distancia:\n\n"
                f"- Precio mínimo: Bs. {precio_stats['min_precio']:.2f}\n"
                f"- Precio máximo: Bs. {precio_stats['max_precio']:.2f}\n"
                f"- Precio promedio: Bs. {precio_stats['avg_precio']:.2f}\n\n"
                f"¿Quieres saber el precio de una ruta específica?"
            )
        else:
            message = "Para darte información de precios, necesito saber tu ruta. ¿Desde dónde y hacia dónde quieres viajar?"
        
        return {
            'message': message,
            'recommendations': [],
            'metadata': {'price_stats': precio_stats}
        }
    
    def _handle_vehicle_search(self, intent: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Maneja búsqueda de vehículos."""
        vehiculos = Vehiculo.objects.filter(
            disponible=True
        ).order_by('-capacidad')[:5]
        
        if vehiculos:
            vehiculos_info = []
            for v in vehiculos:
                vehiculos_info.append(
                    f"- {v.modelo} ({v.marca}) - Capacidad: {v.capacidad} asientos - Placa: {v.placa}"
                )
            
            message = (
                f"Contamos con estos vehículos disponibles:\n\n" +
                "\n".join(vehiculos_info) +
                "\n\n¿Quieres ver los viajes disponibles en alguno de estos vehículos?"
            )
        else:
            message = "En este momento no hay información de vehículos disponibles."
        
        return {
            'message': message,
            'recommendations': [],
            'metadata': {'vehicles_count': len(vehiculos)}
        }
    
    def _handle_help_request(self) -> Dict[str, Any]:
        """Maneja solicitudes de ayuda."""
        message = """¡Hola! Soy tu asistente virtual de transporte. Puedo ayudarte con:

🚌 **Búsqueda de viajes**: Dime tu origen y destino, y te mostraré los viajes disponibles.
📅 **Consulta de horarios**: Pregúntame por los horarios disponibles.
💰 **Información de precios**: Te puedo dar información sobre tarifas.
🚗 **Vehículos**: Te muestro nuestros vehículos disponibles.

Ejemplos de preguntas que puedes hacerme:
- "Quiero ir de La Paz a Cochabamba"
- "¿Cuáles son los horarios disponibles?"
- "¿Cuánto cuesta un viaje a Santa Cruz?"
- "¿Qué vehículos tienen disponibles?"

¿En qué puedo ayudarte hoy?"""
        
        return {
            'message': message,
            'recommendations': [],
            'metadata': {'type': 'help'}
        }
    
    def _handle_general_query(self, message: str) -> Dict[str, Any]:
        """Maneja consultas generales."""
        return {
            'message': "Entiendo que necesitas ayuda. ¿Podrías ser más específico? "
                      "Puedo ayudarte a buscar viajes, consultar horarios, ver precios o información sobre vehículos. "
                      "Escribe 'ayuda' si quieres ver todo lo que puedo hacer.",
            'recommendations': [],
            'metadata': {}
        }
    
    def _extract_locations(self, message: str) -> List[str]:
        """Extrae nombres de ubicaciones del mensaje."""
        # Obtener todas las ubicaciones activas
        ubicaciones = Ubicacion.objects.filter(activo=True).values_list('nombre', flat=True)
        
        found_locations = []
        message_lower = message.lower()
        
        for ubicacion in ubicaciones:
            if ubicacion.lower() in message_lower:
                found_locations.append(ubicacion)
        
        return found_locations
    
    def _extract_date(self, message: str) -> Optional[datetime]:
        """Extrae fechas del mensaje."""
        # Buscar patrones de fecha (simplificado)
        today = timezone.now().date()
        message_lower = message.lower()
        
        if 'hoy' in message_lower:
            return today
        elif 'mañana' in message_lower:
            return today + timedelta(days=1)
        elif 'pasado mañana' in message_lower or 'pasado' in message_lower:
            return today + timedelta(days=2)
        
        # Buscar patrón dd/mm o dd-mm
        date_pattern = r'(\d{1,2})[/-](\d{1,2})'
        match = re.search(date_pattern, message)
        if match:
            try:
                day, month = int(match.group(1)), int(match.group(2))
                year = today.year
                if month < today.month or (month == today.month and day < today.day):
                    year += 1
                return datetime(year, month, day).date()
            except ValueError:
                pass
        
        return None


class ChatbotAnalyticsService:
    """Servicio para analítica del chatbot."""
    
    @staticmethod
    def get_conversation_stats(user=None):
        """Obtiene estadísticas de conversaciones."""
        query = ChatConversation.objects.all()
        if user:
            query = query.filter(user=user)
        
        return {
            'total_conversations': query.count(),
            'active_conversations': query.filter(is_active=True).count(),
            'total_messages': ChatMessage.objects.filter(conversation__in=query).count(),
            'avg_messages_per_conversation': query.annotate(
                msg_count=Count('messages')
            ).aggregate(avg=Avg('msg_count'))['avg'] or 0
        }
    
    @staticmethod
    def get_recommendation_stats():
        """Obtiene estadísticas de recomendaciones."""
        total = ChatRecommendation.objects.count()
        helpful = ChatRecommendation.objects.filter(was_helpful=True).count()
        
        by_type = ChatRecommendation.objects.values('recommendation_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return {
            'total_recommendations': total,
            'helpful_recommendations': helpful,
            'helpfulness_rate': (helpful / total * 100) if total > 0 else 0,
            'by_type': list(by_type)
        }
