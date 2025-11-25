from rest_framework import serializers
from .models import Encomienda, Seguimiento
from conductores.models import Conductor
from pagos.models import Pago


class SeguimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seguimiento
        fields = ["id", "evento", "descripcion", "ubicacion", "fecha"]


class EncomiendaSerializer(serializers.ModelSerializer):
    conductor_nombre = serializers.CharField(
        source="conductor_asignado.nombre_completo", read_only=True
    )
    conductor_info = serializers.SerializerMethodField()
    seguimientos = SeguimientoSerializer(many=True, read_only=True)
    pago_detalle = serializers.SerializerMethodField()
    creado_por_nombre = serializers.CharField(
        source="creado_por.get_full_name", read_only=True
    )
    puede_ser_asignada = serializers.BooleanField(read_only=True)
    puede_ser_entregada = serializers.BooleanField(read_only=True)
    viaje_info = serializers.SerializerMethodField()
    tracking_info = serializers.SerializerMethodField()

    class Meta:
        model = Encomienda
        fields = [
            "id",
            "codigo_seguimiento",
            "remitente_nombre",
            "remitente_telefono",
            "remitente_direccion",
            "destinatario_nombre",
            "destinatario_telefono",
            "destino_ciudad",
            "destino_direccion",
            "descripcion",
            "peso",
            "precio",
            "notas",
            "estado",
            "fecha_creacion",
            "fecha_entrega_estimada",
            "fecha_entrega_real",
            "conductor_asignado",
            "conductor_nombre",
            "conductor_info",
            "creado_por",
            "creado_por_nombre",
            "metodo_pago",
            "estado_pago",
            "pago_info",
            "pago_detalle",
            "seguimientos",
            "pago",
            "puede_ser_asignada",
            "puede_ser_entregada",
            "viaje",
            "viaje_info",
            "tracking_info",
        ]
        read_only_fields = [
            "codigo_seguimiento",
            "fecha_creacion",
            "creado_por",
            "pago",
        ]

    def get_conductor_info(self, obj):
        if obj.conductor_asignado:
            return {
                "id": obj.conductor_asignado.id,
                "nombre_completo": obj.conductor_asignado.nombre_completo,
                "telefono": obj.conductor_asignado.telefono,
                "tipo_licencia": obj.conductor_asignado.tipo_licencia,
                "nro_licencia": obj.conductor_asignado.nro_licencia,
                "estado": obj.conductor_asignado.estado,
            }
        return None

    def get_pago_detalle(self, obj):
        if obj.pago:
            return {
                "id": obj.pago.id,
                "monto": str(obj.pago.monto),
                "estado": obj.pago.estado,
                "metodo_pago": obj.pago.metodo_pago,
                "fecha_creacion": obj.pago.fecha_creacion,
            }
        return None

    def get_viaje_info(self, obj):
        """Información del viaje asignado si existe"""
        if not obj.viaje:
            return None

        viaje = obj.viaje
        return {
            "id": viaje.id,
            "origen": {
                "id": viaje.origen.id,
                "nombre": viaje.origen.nombre,
                "lat": float(viaje.origen.lat),
                "lng": float(viaje.origen.lng),
            },
            "destino": {
                "id": viaje.destino.id,
                "nombre": viaje.destino.nombre,
                "lat": float(viaje.destino.lat),
                "lng": float(viaje.destino.lng),
            },
            "fecha": viaje.fecha.isoformat() if viaje.fecha else None,
            "hora": viaje.hora.isoformat() if viaje.hora else None,
            "estado": viaje.estado,
        }

    def get_tracking_info(self, obj):
        """Información de tracking en tiempo real si hay viaje asignado"""
        if not obj.viaje or obj.viaje.estado != "en_curso":
            return None

        # Obtener conductor del viaje
        conductor = (
            obj.viaje.vehiculo.conductor
            if obj.viaje.vehiculo and hasattr(obj.viaje.vehiculo, "conductor")
            else None
        )
        if not conductor:
            return None

        # Obtener ubicación actual del conductor
        ubicacion_conductor = None
        if conductor.ultima_ubicacion_lat and conductor.ultima_ubicacion_lng:
            ubicacion_conductor = {
                "lat": float(conductor.ultima_ubicacion_lat),
                "lng": float(conductor.ultima_ubicacion_lng),
                "ultima_actualizacion": conductor.ultima_actualizacion_ubicacion.isoformat()
                if conductor.ultima_actualizacion_ubicacion
                else None,
            }

        # Calcular ETA si hay ubicación del conductor y destino
        eta_info = None
        if ubicacion_conductor and obj.viaje.destino:
            # El ETA se calculará en el endpoint de seguimiento para tener datos más actualizados
            # Aquí solo indicamos que está disponible
            eta_info = {
                "disponible": True,
                "destino_id": obj.viaje.destino.id,
            }

        return {
            "conductor_ubicacion": ubicacion_conductor,
            "eta": eta_info,
            "viaje_en_curso": obj.viaje.estado == "en_curso",
        }


class CreateEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = [
            "remitente_nombre",
            "remitente_telefono",
            "remitente_direccion",
            "destinatario_nombre",
            "destinatario_telefono",
            "destino_ciudad",
            "destino_direccion",
            "descripcion",
            "peso",
            "precio",
            "notas",
            "metodo_pago",
        ]


class UpdateEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = [
            "remitente_nombre",
            "remitente_telefono",
            "remitente_direccion",
            "destinatario_nombre",
            "destinatario_telefono",
            "destino_ciudad",
            "destino_direccion",
            "descripcion",
            "peso",
            "precio",
            "notas",
            "estado",
            "conductor_asignado",
            "metodo_pago",
            "estado_pago",
            "fecha_entrega_estimada",
            "fecha_entrega_real",
        ]


class AsignarConductorSerializer(serializers.Serializer):
    conductor_id = serializers.IntegerField()

    def validate_conductor_id(self, value):
        try:
            conductor = Conductor.objects.get(id=value)
            if not conductor.puede_conducir():
                raise serializers.ValidationError(
                    "El conductor no está disponible para asignación"
                )
            return value
        except Conductor.DoesNotExist:
            raise serializers.ValidationError("Conductor no encontrado")


class ActualizarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Encomienda.ESTADO_CHOICES)
    notas = serializers.CharField(required=False, allow_blank=True)
    ubicacion = serializers.CharField(required=False, allow_blank=True)
