from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from .models import ChatConversation, ChatMessage, ChatRecommendation
from .serializers import (
    ChatConversationSerializer,
    ChatMessageSerializer,
    ChatRecommendationSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer
)
from .services import ChatbotService, ChatbotAnalyticsService


class ChatbotViewSet(viewsets.ViewSet):
    """
    ViewSet para el chatbot de recomendaciones.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def chat(self, request):
        """
        Endpoint principal para interactuar con el chatbot.
        """
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')
        
        # Procesar mensaje con el servicio
        chatbot_service = ChatbotService(user=request.user)
        response_data = chatbot_service.process_message(message, session_id)
        
        # Serializar recomendaciones
        recommendations_data = []
        for rec in response_data.get('recommendations', []):
            rec_serializer = ChatRecommendationSerializer(rec)
            recommendations_data.append(rec_serializer.data)
        
        return Response({
            'session_id': response_data['session_id'],
            'message': response_data['message'],
            'recommendations': recommendations_data,
            'metadata': response_data.get('metadata', {})
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        Obtiene el historial de conversaciones del usuario.
        """
        conversations = ChatConversation.objects.filter(
            user=request.user
        ).prefetch_related('messages')[:20]
        
        serializer = ChatConversationSerializer(conversations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def conversation(self, request, pk=None):
        """
        Obtiene los detalles de una conversación específica.
        """
        try:
            conversation = ChatConversation.objects.get(
                session_id=pk,
                user=request.user
            )
            serializer = ChatConversationSerializer(conversation)
            return Response(serializer.data)
        except ChatConversation.DoesNotExist:
            return Response(
                {'error': 'Conversación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def end_conversation(self, request, pk=None):
        """
        Finaliza una conversación activa.
        """
        try:
            conversation = ChatConversation.objects.get(
                session_id=pk,
                user=request.user,
                is_active=True
            )
            conversation.is_active = False
            conversation.save()
            return Response({'message': 'Conversación finalizada'})
        except ChatConversation.DoesNotExist:
            return Response(
                {'error': 'Conversación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """
        Permite al usuario dar feedback sobre una recomendación.
        """
        was_helpful = request.data.get('was_helpful')
        
        if was_helpful is None:
            return Response(
                {'error': 'El campo was_helpful es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recommendation = ChatRecommendation.objects.get(
                id=pk,
                message__conversation__user=request.user
            )
            recommendation.was_helpful = was_helpful
            recommendation.save()
            
            return Response({
                'message': 'Gracias por tu feedback',
                'recommendation_id': recommendation.id
            })
        except ChatRecommendation.DoesNotExist:
            return Response(
                {'error': 'Recomendación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Obtiene estadísticas de uso del chatbot para el usuario.
        """
        stats = ChatbotAnalyticsService.get_conversation_stats(user=request.user)
        return Response(stats)
    
    @action(detail=False, methods=['delete'])
    def clear_history(self, request):
        """
        Borra el historial de conversaciones del usuario.
        """
        deleted_count = ChatConversation.objects.filter(user=request.user).delete()[0]
        return Response({
            'message': f'Se eliminaron {deleted_count} conversaciones',
            'deleted_count': deleted_count
        })


class ChatbotAdminViewSet(viewsets.ViewSet):
    """
    ViewSet para administración del chatbot (solo staff).
    """
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Solo staff puede acceder."""
        permissions = super().get_permissions()
        if not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Solo administradores pueden acceder a estas estadísticas")
        return permissions
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Obtiene estadísticas globales del chatbot.
        """
        conversation_stats = ChatbotAnalyticsService.get_conversation_stats()
        recommendation_stats = ChatbotAnalyticsService.get_recommendation_stats()
        
        return Response({
            'conversations': conversation_stats,
            'recommendations': recommendation_stats
        })
