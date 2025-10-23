from rest_framework import serializers
from .models import Encomienda, Seguimiento
from conductores.models import Conductor
from pagos.models import Pago

class SeguimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seguimiento
        fields = ['id', 'evento', 'descripcion', 'ubicacion', 'fecha']

class EncomiendaSerializer(serializers.ModelSerializer):
    conductor_nombre = serializers.CharField(source='conductor_asignado.nombre_completo', read_only=True)
    conductor_info = serializers.SerializerMethodField()
    seguimientos = SeguimientoSerializer(many=True, read_only=True)
    pago_detalle = serializers.SerializerMethodField()
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    puede_ser_asignada = serializers.BooleanField(read_only=True)
    puede_ser_entregada = serializers.BooleanField(read_only=True)

    class Meta:
        model = Encomienda
        fields = [
            'id', 'codigo_seguimiento', 'remitente_nombre', 'remitente_telefono', 'remitente_direccion',
            'destinatario_nombre', 'destinatario_telefono', 'destino_ciudad', 'destino_direccion',
            'descripcion', 'peso', 'precio', 'notas', 'estado', 'fecha_creacion', 
            'fecha_entrega_estimada', 'fecha_entrega_real', 'conductor_asignado', 'conductor_nombre',
            'conductor_info', 'creado_por', 'creado_por_nombre', 'metodo_pago', 'estado_pago',
            'pago_info', 'pago_detalle', 'seguimientos', 'pago', 'puede_ser_asignada', 'puede_ser_entregada'
        ]
        read_only_fields = ['codigo_seguimiento', 'fecha_creacion', 'creado_por', 'pago']

    def get_conductor_info(self, obj):
        if obj.conductor_asignado:
            return {
                'id': obj.conductor_asignado.id,
                'nombre_completo': obj.conductor_asignado.nombre_completo,
                'telefono': obj.conductor_asignado.telefono,
                'tipo_licencia': obj.conductor_asignado.tipo_licencia,
                'nro_licencia': obj.conductor_asignado.nro_licencia,
                'estado': obj.conductor_asignado.estado
            }
        return None

    def get_pago_detalle(self, obj):
        if obj.pago:
            return {
                'id': obj.pago.id,
                'monto': str(obj.pago.monto),
                'estado': obj.pago.estado,
                'metodo_pago': obj.pago.metodo_pago,
                'fecha_creacion': obj.pago.fecha_creacion
            }
        return None

class CreateEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = [
            'remitente_nombre', 'remitente_telefono', 'remitente_direccion',
            'destinatario_nombre', 'destinatario_telefono', 'destino_ciudad', 
            'destino_direccion', 'descripcion', 'peso', 'precio', 'notas',
            'metodo_pago'
        ]

class UpdateEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = [
            'remitente_nombre', 'remitente_telefono', 'remitente_direccion',
            'destinatario_nombre', 'destinatario_telefono', 'destino_ciudad', 
            'destino_direccion', 'descripcion', 'peso', 'precio', 'notas',
            'estado', 'conductor_asignado', 'metodo_pago', 'estado_pago',
            'fecha_entrega_estimada', 'fecha_entrega_real'
        ]

class AsignarConductorSerializer(serializers.Serializer):
    conductor_id = serializers.IntegerField()

    def validate_conductor_id(self, value):
        try:
            conductor = Conductor.objects.get(id=value)
            if not conductor.puede_conducir():
                raise serializers.ValidationError("El conductor no está disponible para asignación")
            return value
        except Conductor.DoesNotExist:
            raise serializers.ValidationError("Conductor no encontrado")

class ActualizarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Encomienda.ESTADO_CHOICES)
    notas = serializers.CharField(required=False, allow_blank=True)
    ubicacion = serializers.CharField(required=False, allow_blank=True)