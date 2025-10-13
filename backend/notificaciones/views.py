from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json

from .models import (
    DispositivoFCM,
    Notificacion,
    PreferenciaNotificacion,
    TipoNotificacion,
)
from .serializers import (
    DispositivoFCMSerializer,
    NotificacionSerializer,
    NotificacionCreateSerializer,
    PreferenciaNotificacionSerializer,
    NotificacionEstadoSerializer,
    EstadisticasNotificacionSerializer,
    TipoNotificacionSerializer,
)
from .services import NotificationService

User = get_user_model()


class DispositivoFCMViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar dispositivos FCM del usuario"""

    serializer_class = DispositivoFCMSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DispositivoFCM.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """Crear dispositivo asociado al usuario actual"""
        token_fcm = serializer.validated_data.get("token_fcm")

        # Verificar si el token ya existe
        dispositivo_existente = DispositivoFCM.objects.filter(
            token_fcm=token_fcm
        ).first()

        if dispositivo_existente:
            # Si el token ya existe, reasignarlo al usuario actual
            print(
                f"🔄 Token FCM ya existe, reasignando de {dispositivo_existente.usuario.username} a {self.request.user.username}"
            )

            dispositivo_existente.usuario = self.request.user
            dispositivo_existente.nombre_dispositivo = serializer.validated_data.get(
                "nombre_dispositivo", dispositivo_existente.nombre_dispositivo
            )
            dispositivo_existente.tipo_dispositivo = serializer.validated_data.get(
                "tipo_dispositivo", dispositivo_existente.tipo_dispositivo
            )
            dispositivo_existente.activo = True
            dispositivo_existente.save()

            print(
                f"✅ Token FCM reasignado exitosamente a {self.request.user.username}"
            )
        else:
            # Si no existe, crear nuevo dispositivo
            serializer.save(usuario=self.request.user)

    @action(detail=True, methods=["post"])
    def desactivar(self, request, pk=None):
        """Desactivar un dispositivo específico"""
        dispositivo = self.get_object()
        dispositivo.activo = False
        dispositivo.save()
        return Response(
            {"message": "Dispositivo desactivado"}, status=status.HTTP_200_OK
        )


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para ver notificaciones del usuario"""

    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notificacion.objects.filter(usuario=self.request.user)

        # Filtros opcionales
        tipo = self.request.query_params.get("tipo", None)
        estado = self.request.query_params.get("estado", None)
        no_leidas = self.request.query_params.get("no_leidas", None)

        if tipo:
            queryset = queryset.filter(tipo__codigo=tipo)
        if estado:
            queryset = queryset.filter(estado=estado)
        if no_leidas == "true":
            queryset = queryset.exclude(estado="leida")

        return queryset.order_by("-fecha_creacion")

    @action(detail=True, methods=["post"])
    def marcar_leida(self, request, pk=None):
        """Marcar una notificación como leída"""
        notificacion = self.get_object()
        notificacion.marcar_como_leida()
        return Response(
            {"message": "Notificación marcada como leída"}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["post"])
    def marcar_multiples(self, request):
        """Marcar múltiples notificaciones con una acción"""
        serializer = NotificacionEstadoSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            notificacion_ids = serializer.validated_data["notificacion_ids"]
            accion = serializer.validated_data["accion"]

            notificaciones = Notificacion.objects.filter(
                id__in=notificacion_ids, usuario=request.user
            )

            count = 0
            for notificacion in notificaciones:
                if accion == "marcar_leida":
                    notificacion.marcar_como_leida()
                    count += 1
                elif accion == "marcar_entregada":
                    notificacion.marcar_como_entregada()
                    count += 1

            return Response(
                {"message": f"{count} notificaciones actualizadas", "accion": accion},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        """Obtener estadísticas de notificaciones del usuario"""
        stats = NotificationService.obtener_estadisticas_usuario(request.user)
        serializer = EstadisticasNotificacionSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def historial(self, request):
        """Obtener historial completo de notificaciones con paginación"""
        queryset = self.get_queryset()

        # Aplicar paginación
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def no_leidas(self, request):
        """Obtener solo notificaciones no leídas"""
        queryset = self.get_queryset().exclude(estado="leida")
        serializer = self.get_serializer(queryset, many=True)
        return Response({"count": queryset.count(), "notificaciones": serializer.data})

    @action(detail=False, methods=["post"])
    def marcar_todas_leidas(self, request):
        """Marcar todas las notificaciones como leídas"""
        count = (
            Notificacion.objects.filter(usuario=request.user)
            .exclude(estado="leida")
            .update(estado="leida", fecha_lectura=timezone.now())
        )

        return Response(
            {"message": f"{count} notificaciones marcadas como leídas", "count": count},
            status=status.HTTP_200_OK,
        )


class PreferenciaNotificacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar preferencias de notificación"""

    serializer_class = PreferenciaNotificacionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "put", "patch"]  # Solo lectura y actualización

    def get_object(self):
        """Obtener o crear las preferencias del usuario"""
        preferencia, created = PreferenciaNotificacion.objects.get_or_create(
            usuario=self.request.user
        )
        return preferencia

    def list(self, request, *args, **kwargs):
        """Listar devuelve las preferencias del usuario actual"""
        preferencia = self.get_object()
        serializer = self.get_serializer(preferencia)
        return Response(serializer.data)


class TipoNotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para ver tipos de notificaciones disponibles"""

    queryset = TipoNotificacion.objects.filter(activo=True)
    serializer_class = TipoNotificacionSerializer
    permission_classes = [IsAuthenticated]


class NotificacionAdminViewSet(viewsets.ModelViewSet):
    """ViewSet administrativo para gestionar notificaciones"""

    queryset = Notificacion.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return NotificacionCreateSerializer
        return NotificacionSerializer

    def get_queryset(self):
        # Solo usuarios administrativos pueden ver todas las notificaciones
        if not self.request.user.es_administrativo:
            return Notificacion.objects.filter(usuario=self.request.user)
        return super().get_queryset()

    def perform_create(self, serializer):
        """Crear notificación(es) usando el servicio"""
        validated_data = serializer.validated_data
        usuarios_ids = validated_data.pop("usuarios_ids", None)

        if usuarios_ids:
            # Envío masivo
            NotificationService.enviar_notificacion_masiva(
                usuarios_ids=usuarios_ids,
                titulo=validated_data["titulo"],
                mensaje=validated_data["mensaje"],
                tipo_codigo=validated_data["tipo"].codigo,
                data_extra=validated_data.get("data_extra", {}),
                prioridad=validated_data.get("prioridad", "normal"),
            )
        else:
            # Envío individual
            usuario = validated_data["usuario"]
            NotificationService.enviar_notificacion(
                usuario_id=usuario.id,
                titulo=validated_data["titulo"],
                mensaje=validated_data["mensaje"],
                tipo_codigo=validated_data["tipo"].codigo,
                data_extra=validated_data.get("data_extra", {}),
                prioridad=validated_data.get("prioridad", "normal"),
                programada_para=validated_data.get("programada_para"),
            )

    @action(detail=False, methods=["post"])
    def enviar_masiva(self, request):
        """Endpoint específico para envío masivo de notificaciones"""
        serializer = NotificacionCreateSerializer(data=request.data)

        if serializer.is_valid():
            validated_data = serializer.validated_data
            usuarios_ids = validated_data.get("usuarios_ids", [])

            if not usuarios_ids:
                return Response(
                    {"error": "Se requiere una lista de usuarios"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            count = NotificationService.enviar_notificacion_masiva(
                usuarios_ids=usuarios_ids,
                titulo=validated_data["titulo"],
                mensaje=validated_data["mensaje"],
                tipo_codigo=validated_data["tipo"].codigo,
                data_extra=validated_data.get("data_extra", {}),
                prioridad=validated_data.get("prioridad", "normal"),
            )

            return Response(
                {
                    "message": f"Notificación enviada a {count} dispositivos",
                    "usuarios_objetivo": len(usuarios_ids),
                    "dispositivos_notificados": count,
                },
                status=status.HTTP_201_CREATED,
            )


@api_view(["POST"])
@permission_classes([])  # Sin autenticación para testing
def enviar_notificacion_simple(request):
    """
    Endpoint simple para probar notificaciones sin autenticación
    Solo para desarrollo/testing
    """
    try:
        data = json.loads(request.body) if hasattr(request, "body") else request.data

        titulo = data.get("titulo", "Notificación de prueba")
        mensaje = data.get("mensaje", "Mensaje de prueba del sistema")
        tipo = data.get("tipo", "INFO")
        usuario_id = data.get("usuario_id", 1)

        # Intentar obtener el usuario
        try:
            usuario = User.objects.get(id=usuario_id)
        except User.DoesNotExist:
            return Response(
                {
                    "error": f"Usuario {usuario_id} no existe",
                    "message": "Crea un superusuario con: python manage.py createsuperuser",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar que Firebase esté disponible
        try:
            resultado = NotificationService.enviar_notificacion(
                usuario_id=usuario_id,
                titulo=titulo,
                mensaje=mensaje,
                tipo_codigo=tipo,
                data_extra=data.get("datos_adicionales", {}),
            )

            return Response(
                {
                    "success": True,
                    "message": "Notificación enviada correctamente",
                    "notificacion_id": resultado.id
                    if hasattr(resultado, "id")
                    else "N/A",
                    "usuario": usuario.email or usuario.username,
                    "titulo": titulo,
                    "mensaje": mensaje,
                    "tipo": tipo,
                    "firebase_disponible": True,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as firebase_error:
            return Response(
                {
                    "success": False,
                    "message": "Notificación guardada en BD pero Firebase falló",
                    "error": str(firebase_error),
                    "usuario": usuario.email or usuario.username,
                    "titulo": titulo,
                    "mensaje": mensaje,
                    "firebase_disponible": False,
                    "sugerencia": "Verificar configuración de Firebase y credenciales",
                },
                status=status.HTTP_201_CREATED,
            )

    except json.JSONDecodeError:
        return Response(
            {"error": "JSON inválido en el cuerpo de la petición"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        return Response(
            {"error": str(e), "message": "Error procesando la notificación"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([])  # Sin autenticación para testing
def enviar_notificacion_con_token(request):
    """
    Endpoint para probar notificaciones directamente con token FCM
    Solo para desarrollo/testing
    """
    try:
        data = json.loads(request.body) if hasattr(request, "body") else request.data

        titulo = data.get("titulo", "Prueba con Token")
        mensaje = data.get("mensaje", "Mensaje de prueba directo")
        token_fcm = data.get("token_fcm")

        if not token_fcm:
            return Response(
                {
                    "error": "token_fcm es requerido",
                    "example": {
                        "titulo": "Mi notificación",
                        "mensaje": "Mensaje de prueba",
                        "token_fcm": "token_del_dispositivo_aqui",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enviar directamente con Firebase Admin SDK
        try:
            from .services import NotificationService

            # Crear mensaje directo para Firebase
            message = {
                "notification": {"title": titulo, "body": mensaje},
                "data": {"tipo": "TEST", "timestamp": str(timezone.now().timestamp())},
                "token": token_fcm,
            }

            # Enviar con Firebase Admin SDK
            response = NotificationService._send_firebase_message(message)

            return Response(
                {
                    "success": True,
                    "message": "Notificación enviada directamente con Firebase",
                    "firebase_response": response,
                    "titulo": titulo,
                    "mensaje": mensaje,
                    "token_usado": token_fcm[:50] + "...",
                    "firebase_disponible": True,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as firebase_error:
            return Response(
                {
                    "success": False,
                    "message": "Error enviando con Firebase",
                    "error": str(firebase_error),
                    "titulo": titulo,
                    "mensaje": mensaje,
                    "token_usado": token_fcm[:50] + "...",
                    "sugerencia": "Verificar token FCM y configuración de Firebase",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except json.JSONDecodeError:
        return Response(
            {"error": "JSON inválido en el cuerpo de la petición"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        return Response(
            {"error": str(e), "message": "Error procesando la petición"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
