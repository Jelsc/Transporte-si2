from django.contrib import admin
from .models import ChatConversation, ChatMessage, ChatRecommendation


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'created_at', 'updated_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['session_id', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'content_preview', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['content', 'conversation__session_id']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Contenido'


@admin.register(ChatRecommendation)
class ChatRecommendationAdmin(admin.ModelAdmin):
    list_display = ['recommendation_type', 'confidence_score', 'was_helpful', 'created_at']
    list_filter = ['recommendation_type', 'was_helpful', 'created_at']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
