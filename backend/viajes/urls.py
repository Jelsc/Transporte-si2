from rest_framework.routers import DefaultRouter
from .views import ViajeViewSet, AsientoViewSet, ReservaViewSet
from .views_cliente import MisReservasViewSet

router = DefaultRouter()
router.register(r'viajes', ViajeViewSet, basename='viajes')
router.register(r'asientos', AsientoViewSet, basename='asientos')
router.register(r'reservas', ReservaViewSet, basename='reservas')
router.register(r'mis-reservas', MisReservasViewSet, basename='mis-reservas') 

urlpatterns = router.urls
