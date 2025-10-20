# encomiendas/serializers.py - COMPLETO Y CORREGIDO
from rest_framework import serializers
from .models import Encomienda, EncomiendaSeguimiento, TarifaEncomienda
from django.conf import settings
from django.contrib.auth import get_user_model

# ✅ Obtener el modelo de usuario personalizado
User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'nombre_completo']
    
    def get_nombre_completo(self, obj):
        return obj.get_full_name()


class EncomiendaSeguimientoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = EncomiendaSeguimiento
        fields = '__all__'
        read_only_fields = ['fecha', 'usuario']


# ✅ SERIALIZER PRINCIPAL CORREGIDO
class EncomiendaSerializer(serializers.ModelSerializer):
    conductor_nombre = serializers.SerializerMethodField()
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    seguimientos = EncomiendaSeguimientoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Encomienda
        fields = '__all__'
        read_only_fields = ['codigo_seguimiento', 'fecha_creacion', 'precio', 'creado_por']
    
    def get_conductor_nombre(self, obj):
        if obj.conductor_asignado:
            return obj.conductor_asignado.get_full_name()
        return None


# ✅ SERIALIZER PARA CREACIÓN
class CreateEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = [
            'remitente_nombre', 'remitente_telefono', 'remitente_direccion',
            'destinatario_nombre', 'destinatario_telefono', 'destino_ciudad',
            'destino_direccion', 'descripcion', 'peso', 'notas'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['creado_por'] = request.user
        return super().create(validated_data)


# ✅ SERIALIZER PARA ACTUALIZACIÓN
class UpdateEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = [
            'estado', 'conductor_asignado', 'fecha_entrega_real', 'notas'
        ]


# ✅ SERIALIZER PARA ASIGNAR CONDUCTOR
class AsignarConductorSerializer(serializers.Serializer):
    conductor_id = serializers.IntegerField()
    
    def validate_conductor_id(self, value):
        try:
            conductor = User.objects.get(id=value, groups__name='Conductores')
        except User.DoesNotExist:
            raise serializers.ValidationError("El conductor especificado no existe o no tiene el rol adecuado")
        return value


# ✅ SERIALIZER PARA ACTUALIZAR ESTADO
class ActualizarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Encomienda.ESTADO_CHOICES)
    notas = serializers.CharField(required=False, allow_blank=True)
    fecha_entrega_real = serializers.DateTimeField(required=False)


# ✅ SERIALIZER PARA TARIFAS
class TarifaEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TarifaEncomienda
        fields = '__all__'


# ✅ SERIALIZER PARA ESTADÍSTICAS
class EncomiendaStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pendientes = serializers.IntegerField()
    en_ruta = serializers.IntegerField()
    entregados = serializers.IntegerField()
    cancelados = serializers.IntegerField()
    ingresos_totales = serializers.DecimalField(max_digits=12, decimal_places=2)