from rest_framework import serializers
from .models import Encomienda, EncomiendaSeguimiento, TarifaEncomienda
from django.conf import settings
from django.contrib.auth import get_user_model

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


class EncomiendaSerializer(serializers.ModelSerializer):
    conductor_nombre = serializers.SerializerMethodField()
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    seguimientos = EncomiendaSeguimientoSerializer(many=True, read_only=True)
    
    # INFORMACIÓN DEL PAGO - NUEVO
    pago_info = serializers.SerializerMethodField()
    estado_pago = serializers.CharField(source='pago.estado', read_only=True)
    metodo_pago = serializers.CharField(source='pago.metodo_pago', read_only=True)
    
    class Meta:
        model = Encomienda
        fields = '__all__'
        read_only_fields = ['codigo_seguimiento', 'fecha_creacion', 'precio', 'creado_por', 'pago']
    
    def get_conductor_nombre(self, obj):
        if obj.conductor_asignado:
            return obj.conductor_asignado.get_full_name()
        return None
    
    def get_pago_info(self, obj):
        if obj.pago:
            return {
                'id': obj.pago.id,
                'monto': str(obj.pago.monto),
                'estado': obj.pago.estado,
                'metodo_pago': obj.pago.metodo_pago,
                'fecha_creacion': obj.pago.fecha_creacion,
                'stripe_payment_intent_id': obj.pago.stripe_payment_intent_id,
            }
        return None


class CreateEncomiendaSerializer(serializers.ModelSerializer):
    # CAMPO PARA MÉTODO DE PAGO - NUEVO
    metodo_pago = serializers.ChoiceField(
        choices=[
            ('stripe', 'Stripe'),
            ('efectivo', 'Efectivo'),
            ('transferencia', 'Transferencia'),
        ],
        write_only=True,
        required=True
    )
    
    class Meta:
        model = Encomienda
        fields = [
            'remitente_nombre', 'remitente_telefono', 'remitente_direccion',
            'destinatario_nombre', 'destinatario_telefono', 'destino_ciudad',
            'destino_direccion', 'descripcion', 'peso', 'notas', 'metodo_pago'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        metodo_pago = validated_data.pop('metodo_pago')
        
        # Crear la encomienda primero
        encomienda = Encomienda.objects.create(
            creado_por=request.user,
            **validated_data
        )
        
        # Crear el pago asociado - NUEVO
        from pagos.models import Pago
        
        pago = Pago.objects.create(
            usuario=request.user,
            monto=encomienda.precio,
            metodo_pago=metodo_pago,
            descripcion=f"Pago por encomienda #{encomienda.codigo_seguimiento} - {encomienda.destinatario_nombre}",
            estado='pendiente'
        )
        
        # Asignar el pago a la encomienda
        encomienda.pago = pago
        encomienda.save()
        
        # Crear seguimiento inicial
        from .models import EncomiendaSeguimiento
        EncomiendaSeguimiento.objects.create(
            encomienda=encomienda,
            evento='Encomienda creada',
            descripcion=f'Encomienda creada con código {encomienda.codigo_seguimiento}. Pago {metodo_pago} pendiente.',
            usuario=request.user
        )
        
        return encomienda


class UpdateEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encomienda
        fields = [
            'estado', 'conductor_asignado', 'fecha_entrega_real', 'notas'
        ]


class AsignarConductorSerializer(serializers.Serializer):
    conductor_id = serializers.IntegerField()
    
    def validate_conductor_id(self, value):
        try:
            conductor = User.objects.get(id=value, groups__name='Conductores')
        except User.DoesNotExist:
            raise serializers.ValidationError("El conductor especificado no existe o no tiene el rol adecuado")
        return value


class ActualizarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Encomienda.ESTADO_CHOICES)
    notas = serializers.CharField(required=False, allow_blank=True)
    fecha_entrega_real = serializers.DateTimeField(required=False)


class TarifaEncomiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TarifaEncomienda
        fields = '__all__'


class EncomiendaStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pendientes = serializers.IntegerField()
    en_ruta = serializers.IntegerField()
    entregados = serializers.IntegerField()
    cancelados = serializers.IntegerField()
    ingresos_totales = serializers.DecimalField(max_digits=12, decimal_places=2)