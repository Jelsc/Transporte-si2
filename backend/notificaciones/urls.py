from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DispositivoFCMViewSet,
    NotificacionViewSet,
    PreferenciaNotificacionViewSet,
    TipoNotificacionViewSet,
    NotificacionAdminViewSet,
)

# Router para las APIs RESTful
router = DefaultRouter()
router.register(r"dispositivos", DispositivoFCMViewSet, basename="dispositivo-fcm")
router.register(r"notificaciones", NotificacionViewSet, basename="notificacion")
router.register(
    r"preferencias", PreferenciaNotificacionViewSet, basename="preferencia-notificacion"
)
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
]
