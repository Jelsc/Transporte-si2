from .views import PreferenciaNotificacionViewSet
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DispositivoFCMViewSet,
    NotificacionViewSet,
    TipoNotificacionViewSet,
    NotificacionAdminViewSet,
    RegistrarFCMTokenView,
)
from .views import PreferenciaNotificacion

# Router para las APIs RESTful
router = DefaultRouter()
router.register(r"dispositivos", DispositivoFCMViewSet, basename="dispositivo-fcm")
router.register(r"notificaciones", NotificacionViewSet, basename="notificaciones")
router.register(r"preferencias", PreferenciaNotificacionViewSet, basename="preferencias")
router.register(r"tipos", TipoNotificacionViewSet, basename="tipo-notificacion")
router.register(
    r"admin/notificaciones", NotificacionAdminViewSet, basename="admin-notificacion"
)

from .views import enviar_notificacion_simple, enviar_notificacion_con_token

urlpatterns = [
    path("", include(router.urls)),
    # Endpoints legacy (mantener para compatibilidad)
    path("enviar/", enviar_notificacion_simple, name="enviar-notificacion-simple"),
    path(
        "enviar-token/", enviar_notificacion_con_token, name="enviar-notificacion-token"
    ),
    path('dispositivofcm/', RegistrarFCMTokenView.as_view(), name='registrar_fcm_token'),
]
