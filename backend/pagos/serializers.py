from rest_framework import serializers
from .models import Pago


class PagoSerializer(serializers.ModelSerializer):
    """Serializer para listar pagos"""
    usuario_nombre = serializers.SerializerMethodField()
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    
    class Meta:
        model = Pago
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'usuario_email',
            'monto',
            'metodo_pago',
            'estado',
            'descripcion',
            'stripe_payment_intent_id',
            'stripe_charge_id',
            'fecha_creacion',
            'fecha_completado',
            'fecha_cancelado'
        ]
        read_only_fields = [
            'id',
            'usuario',
            'estado',
            'stripe_payment_intent_id',
            'stripe_charge_id',
            'fecha_creacion',
            'fecha_completado',
            'fecha_cancelado'
        ]
    
    def get_usuario_nombre(self, obj):
        """Obtener nombre completo del usuario"""
        if obj.usuario.first_name and obj.usuario.last_name:
            return f"{obj.usuario.first_name} {obj.usuario.last_name}"
        return obj.usuario.username


class CrearPagoSerializer(serializers.ModelSerializer):
    """Serializer para crear pagos"""
    
    class Meta:
        model = Pago
        fields = ['monto', 'metodo_pago', 'descripcion']
    
    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        if value > 999999.99:
            raise serializers.ValidationError("El monto es demasiado alto")
        return value
    
    def create(self, validated_data):
        """Crear un nuevo pago"""
        # El usuario se asigna desde la vista
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class ConfirmarPagoSerializer(serializers.Serializer):
    """Serializer para confirmar pagos"""
    payment_intent_id = serializers.CharField(
        required=True,
        help_text="ID del Payment Intent de Stripe"
    )