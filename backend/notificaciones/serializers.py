from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    DispositivoFCM,
    TipoNotificacion,
    Notificacion,
    PreferenciaNotificacion,
)

User = get_user_model()


class DispositivoFCMSerializer(serializers.ModelSerializer):
    """Serializer para registrar dispositivos FCM"""

    class Meta:
        model = DispositivoFCM
        fields = [
            "id",
            "token_fcm",
            "tipo_dispositivo",
            "nombre_dispositivo",
            "activo",
            "fecha_registro",
            "fecha_ultimo_uso",
        ]
        read_only_fields = ["id", "usuario", "fecha_registro", "fecha_ultimo_uso"]

    def create(self, validated_data):
        """Crear o actualizar dispositivo FCM"""
        usuario = self.context["request"].user
        token_fcm = validated_data["token_fcm"]

        # Buscar si ya existe el token (independientemente del usuario)
        dispositivo_existente = DispositivoFCM.objects.filter(
            token_fcm=token_fcm
        ).first()

        if dispositivo_existente:
            # Si el token ya existe, reasignarlo al usuario actual
            dispositivo_existente.usuario = usuario
            dispositivo_existente.nombre_dispositivo = validated_data.get(
                "nombre_dispositivo", dispositivo_existente.nombre_dispositivo
            )
            dispositivo_existente.tipo_dispositivo = validated_data.get(
                "tipo_dispositivo", dispositivo_existente.tipo_dispositivo
            )
            dispositivo_existente.activo = True
            dispositivo_existente.save()
            return dispositivo_existente
        else:
            # Si no existe, crear nuevo dispositivo
            dispositivo, creado = DispositivoFCM.objects.get_or_create(
                usuario=usuario, token_fcm=token_fcm, defaults=validated_data
            )

            if not creado:
                # Actualizar datos si el dispositivo ya existía para este usuario
                for attr, value in validated_data.items():
                    setattr(dispositivo, attr, value)
                dispositivo.activo = True
                dispositivo.save()

            return dispositivo


class TipoNotificacionSerializer(serializers.ModelSerializer):
    """Serializer para tipos de notificación"""

    class Meta:
        model = TipoNotificacion
        fields = [
            "id",
            "codigo",
            "nombre",
            "descripcion",
            "activo",
            "requiere_autenticacion",
        ]


class NotificacionSerializer(serializers.ModelSerializer):
    """Serializer para listar notificaciones del usuario"""

    tipo_info = TipoNotificacionSerializer(source="tipo", read_only=True)
    usuario_username = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = Notificacion
        fields = [
            "id",
            "titulo",
            "mensaje",
            "tipo_info",
            "prioridad",
            "estado",
            "fecha_creacion",
            "fecha_envio",
            "fecha_entrega",
            "fecha_lectura",
            "data_extra",
            "fue_leida",
            "fue_entregada",
            "usuario_username",
        ]
        read_only_fields = [
            "id",
            "fecha_creacion",
            "fecha_envio",
            "fecha_entrega",
            "fecha_lectura",
        ]


class NotificacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear notificaciones (uso interno/admin)"""

    usuarios_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Lista de IDs de usuarios para envío masivo",
    )

    class Meta:
        model = Notificacion
        fields = [
            "titulo",
            "mensaje",
            "tipo",
            "prioridad",
            "usuario",
            "usuarios_ids",
            "data_extra",
            "programada_para",
            "expira_en",
        ]

    def validate(self, attrs):
        """Validar que se especifique al menos un destinatario"""
        if not attrs.get("usuario") and not attrs.get("usuarios_ids"):
            raise serializers.ValidationError(
                "Debe especificar al menos un usuario o una lista de usuarios."
            )
        return attrs


class PreferenciaNotificacionSerializer(serializers.ModelSerializer):
    """Serializer para preferencias de notificación del usuario"""

    class Meta:
        model = PreferenciaNotificacion
        fields = [
            "nuevos_viajes",
            "cambios_viaje",
            "recordatorios",
            "promociones",
            "sistema",
            "no_molestar_desde",
            "no_molestar_hasta",
            "push_mobile",
            "push_web",
            "email",
            "fecha_actualizacion",
        ]
        read_only_fields = ["fecha_actualizacion"]

    def update(self, instance, validated_data):
        """Actualizar preferencias del usuario"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class NotificacionEstadoSerializer(serializers.Serializer):
    """Serializer para actualizar estado de notificaciones"""

    ACCIONES = [
        ("marcar_leida", "Marcar como leída"),
        ("marcar_entregada", "Marcar como entregada"),
    ]

    notificacion_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de notificaciones a actualizar",
    )
    accion = serializers.ChoiceField(choices=ACCIONES)

    def validate_notificacion_ids(self, value):
        """Validar que las notificaciones existan y pertenezcan al usuario"""
        usuario = self.context["request"].user

        # Verificar que todas las notificaciones existen y pertenecen al usuario
        notificaciones_existentes = Notificacion.objects.filter(
            id__in=value, usuario=usuario
        ).count()

        if notificaciones_existentes != len(value):
            raise serializers.ValidationError(
                "Algunas notificaciones no existen o no te pertenecen."
            )

        return value


class EstadisticasNotificacionSerializer(serializers.Serializer):
    """Serializer para estadísticas de notificaciones"""

    total_notificaciones = serializers.IntegerField(read_only=True)
    no_leidas = serializers.IntegerField(read_only=True)
    leidas = serializers.IntegerField(read_only=True)
    por_tipo = serializers.DictField(read_only=True)
    dispositivos_activos = serializers.IntegerField(read_only=True)
