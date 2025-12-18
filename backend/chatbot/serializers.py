from rest_framework import serializers
from .models import ChatConversation, ChatMessage, ChatRecommendation


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer para mensajes de chat."""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatConversationSerializer(serializers.ModelSerializer):
    """Serializer para conversaciones de chat."""
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatConversation
        fields = ['id', 'session_id', 'created_at', 'updated_at', 'is_active', 'messages']
        read_only_fields = ['id', 'session_id', 'created_at', 'updated_at']


class ChatRecommendationSerializer(serializers.ModelSerializer):
    """Serializer para recomendaciones."""
    
    class Meta:
        model = ChatRecommendation
        fields = ['id', 'recommendation_type', 'data', 'confidence_score', 'was_helpful', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    """Serializer para solicitudes de chat."""
    message = serializers.CharField(required=True, max_length=2000)
    session_id = serializers.CharField(required=False, allow_blank=True)
    
    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("El mensaje no puede estar vacío")
        return value.strip()


class ChatResponseSerializer(serializers.Serializer):
    """Serializer para respuestas del chatbot."""
    session_id = serializers.CharField()
    message = serializers.CharField()
    recommendations = ChatRecommendationSerializer(many=True, required=False)
    metadata = serializers.DictField(required=False)
