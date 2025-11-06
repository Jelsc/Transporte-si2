from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SolicitudRutaViewSet, EntregaViewSet, RutaOptimizadaViewSet, ParadaViewSet, ETAViewSet
from .views_viajes import ViajeVRPViewSet, OptimizacionMultiplesViajesViewSet

router = DefaultRouter()
router.register(r'solicitudes', SolicitudRutaViewSet)
router.register(r'entregas', EntregaViewSet)
router.register(r'rutas', RutaOptimizadaViewSet)
router.register(r'paradas', ParadaViewSet)
router.register(r'eta', ETAViewSet, basename='eta')

# URLs específicas para integración con viajes
router.register(r'viajes', ViajeVRPViewSet, basename='viajes-vrp')
router.register(r'optimizacion-multiples', OptimizacionMultiplesViajesViewSet, basename='optimizacion-multiples')

urlpatterns = [
    path('', include(router.urls)),
]

