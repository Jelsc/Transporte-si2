from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UbicacionViewSet

# Router para las vistas
router = DefaultRouter()
router.register(r'', UbicacionViewSet, basename='ubicaciones')

urlpatterns = [
    # Incluir todas las rutas del router
    path('', include(router.urls)),
]
