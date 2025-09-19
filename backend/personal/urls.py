from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonalViewSet, DepartamentoViewSet

# Router para personal
personal_router = DefaultRouter()
personal_router.register(r'', PersonalViewSet, basename='personal')

# Router para departamentos
departamentos_router = DefaultRouter()
departamentos_router.register(r'', DepartamentoViewSet, basename='departamentos')

urlpatterns = [
    path('', include(personal_router.urls)),
    path('departamentos/', include(departamentos_router.urls)),
]