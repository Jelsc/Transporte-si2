from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatbotViewSet, ChatbotAdminViewSet

router = DefaultRouter()
router.register(r'chatbot', ChatbotViewSet, basename='chatbot')
router.register(r'chatbot-admin', ChatbotAdminViewSet, basename='chatbot-admin')

urlpatterns = [
    path('', include(router.urls)),
]
