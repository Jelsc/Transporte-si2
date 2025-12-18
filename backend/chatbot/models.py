from django.db import models
from django.conf import settings
from django.utils import timezone


class ChatConversation(models.Model):
    """
    Representa una conversación de chat con el usuario.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_conversations',
        help_text="Usuario que inicia la conversación"
    )
    session_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="ID único de la sesión de chat"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha de inicio de la conversación"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Última actualización"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Si la conversación está activa"
    )
    
    class Meta:
        db_table = 'chatbot_conversations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Conversación {self.session_id} - {self.user.email}"


class ChatMessage(models.Model):
    """
    Representa un mensaje individual en una conversación.
    """
    ROLE_CHOICES = [
        ('user', 'Usuario'),
        ('assistant', 'Asistente'),
        ('system', 'Sistema'),
    ]
    
    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text="Conversación a la que pertenece el mensaje"
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        help_text="Rol del emisor del mensaje"
    )
    content = models.TextField(
        help_text="Contenido del mensaje"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Metadata adicional (intenciones, entidades detectadas, etc.)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha de creación del mensaje"
    )
    
    class Meta:
        db_table = 'chatbot_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"


class ChatRecommendation(models.Model):
    """
    Almacena las recomendaciones específicas generadas por el chatbot.
    """
    RECOMMENDATION_TYPES = [
        ('ruta', 'Recomendación de Ruta'),
        ('viaje', 'Recomendación de Viaje'),
        ('horario', 'Recomendación de Horario'),
        ('precio', 'Información de Precio'),
        ('vehiculo', 'Recomendación de Vehículo'),
        ('general', 'Recomendación General'),
    ]
    
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name='recommendations',
        help_text="Mensaje que contiene la recomendación"
    )
    recommendation_type = models.CharField(
        max_length=20,
        choices=RECOMMENDATION_TYPES,
        help_text="Tipo de recomendación"
    )
    data = models.JSONField(
        help_text="Datos de la recomendación (IDs de viajes, rutas, etc.)"
    )
    confidence_score = models.FloatField(
        default=0.0,
        help_text="Puntuación de confianza de la recomendación (0-1)"
    )
    was_helpful = models.BooleanField(
        null=True,
        blank=True,
        help_text="Feedback del usuario sobre si fue útil"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    class Meta:
        db_table = 'chatbot_recommendations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['message', 'recommendation_type']),
        ]
    
    def __str__(self):
        return f"{self.recommendation_type} - Score: {self.confidence_score}"
