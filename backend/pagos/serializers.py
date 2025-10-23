from rest_framework import serializers
from django.apps import apps
from .models import Pago
from django.utils import timezone

def get_reserva_model():
    """Obtener el modelo Reserva de la app viaje de manera segura"""
    return apps.get_model('viajes', 'Reserva')

class PagoSerializer(serializers.ModelSerializer):
    """Serializer para listar pagos con información de reserva"""
    usuario_nombre = serializers.SerializerMethodField()
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    
    # 👇 NUEVOS CAMPOS PARA RESERVA
    reserva_info = serializers.SerializerMethodField()
    codigo_reserva = serializers.CharField(source='reserva.codigo_reserva', read_only=True)
    reserva_estado = serializers.CharField(source='reserva.estado', read_only=True)
    
    class Meta:
        model = Pago
        fields = [
            'id',
            'usuario', 'usuario_nombre', 'usuario_email',
            'reserva', 'reserva_info', 'codigo_reserva', 'reserva_estado',  # 👈 NUEVOS
            'monto', 'metodo_pago', 'estado', 'descripcion',
            'stripe_payment_intent_id', 'stripe_charge_id',
            'fecha_creacion', 'fecha_completado', 'fecha_cancelado'
        ]
        read_only_fields = [
            'id', 'usuario', 'estado', 'stripe_payment_intent_id', 
            'stripe_charge_id', 'fecha_creacion', 'fecha_completado', 
            'fecha_cancelado', 'reserva_info', 'codigo_reserva', 'reserva_estado'
        ]
    
    def get_usuario_nombre(self, obj):
        """Obtener nombre completo del usuario"""
        if obj.usuario.first_name and obj.usuario.last_name:
            return f"{obj.usuario.first_name} {obj.usuario.last_name}"
        return obj.usuario.username
    
    def get_reserva_info(self, obj):
        """Información básica de la reserva relacionada"""
        if obj.reserva and obj.reserva.items.exists():
            try:
                primer_item = obj.reserva.items.first()
                if primer_item and primer_item.asiento and primer_item.asiento.viaje:
                    viaje = primer_item.asiento.viaje
                    return {
                        'origen': viaje.origen,
                        'destino': viaje.destino,
                        'fecha': viaje.fecha,
                        'hora': viaje.hora,
                        'cantidad_asientos': obj.reserva.items.count()
                    }
            except Exception:
                return None
        return None


class CrearPagoSerializer(serializers.ModelSerializer):
    """Serializer para crear pagos conectados con reservas"""
    
    # 👇 CAMPO PARA RECIBIR EL ID DE LA RESERVA
    reserva_id = serializers.PrimaryKeyRelatedField(
        queryset=get_reserva_model().objects.all(),
        source='reserva',
        write_only=True,
        required=True,
        help_text="ID de la reserva a pagar"
    )
    
    class Meta:
        model = Pago
        fields = ['monto', 'metodo_pago', 'descripcion', 'reserva_id']
        read_only_fields = ['monto', 'descripcion']  # 👈 Estos se auto-completarán
    
    def validate_monto(self, value):
        """Validar que el monto sea positivo"""
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        if value > 999999.99:
            raise serializers.ValidationError("El monto es demasiado alto")
        return value
    
    def validate(self, attrs):
        """Validaciones adicionales al crear el pago - VERSIÓN MEJORADA"""
        reserva = attrs.get('reserva')
        usuario = self.context['request'].user
        
        if not reserva:
            raise serializers.ValidationError({
                'reserva_id': 'Reserva no encontrada'
            })
        
        # Verificar que la reserva pertenezca al usuario
        if reserva.cliente != usuario:
            raise serializers.ValidationError({
                'reserva_id': 'No tienes permiso para pagar esta reserva'
            })
        
        # Verificar que la reserva no tenga ya un pago completado
        if reserva.pagos.filter(estado='completado').exists():
            raise serializers.ValidationError({
                'reserva_id': 'Esta reserva ya tiene un pago completado'
            })
        
        # ✅ VALIDACIONES MEJORADAS PARA ESTADOS DE RESERVA:
        
        # 1. Estados que NO permiten pago
        estados_invalidos = ['cancelada', 'expirada', 'pagada']
        
        if reserva.estado in estados_invalidos:
            raise serializers.ValidationError({
                'reserva_id': f'No se puede pagar una reserva en estado: {reserva.estado}'
            })
        
        # 2. Verificar expiración para reservas temporales
        if reserva.estado == 'pendiente_pago':
            # Verificar si la reserva tiene método para detectar expiración
            if hasattr(reserva, 'esta_expirada') and reserva.esta_expirada:
                raise serializers.ValidationError({
                    'reserva_id': 'La reserva ha expirado. Por favor, realiza una nueva reserva.'
                })
            
            # Verificar expiración por fecha si existe el campo
            if (hasattr(reserva, 'fecha_expiracion') and 
                reserva.fecha_expiracion and 
                reserva.fecha_expiracion < timezone.now()):
                raise serializers.ValidationError({
                    'reserva_id': 'La reserva ha expirado. Por favor, realiza una nueva reserva.'
                })
            
            # Verificar tiempo restante (para logging/debug)
            if hasattr(reserva, 'tiempo_restante'):
                tiempo_restante = reserva.tiempo_restante
                if tiempo_restante < 60:  # Menos de 1 minuto
                    print(f"⚠️ Advertencia: Reserva {reserva.codigo_reserva} con poco tiempo restante: {tiempo_restante}s")
                elif tiempo_restante > 0:
                    print(f"✅ Reserva {reserva.codigo_reserva} con {tiempo_restante}s restantes - Procesando pago")
        
        # 3. Validar que la reserva tenga items/asientos
        if not reserva.items.exists():
            raise serializers.ValidationError({
                'reserva_id': 'La reserva no tiene asientos asignados'
            })
        
        # 4. Validar que los asientos sigan disponibles (para reservas no pagadas)
        if reserva.estado in ['pendiente_pago', 'pendiente']:
            asientos_no_disponibles = []
            for item in reserva.items.all():
                if (item.asiento and 
                    item.asiento.estado not in ['libre', 'reservado'] and
                    item.asiento.reserva_temporal != reserva):
                    asientos_no_disponibles.append(item.asiento.numero)
            
            if asientos_no_disponibles:
                raise serializers.ValidationError({
                    'reserva_id': f'Los asientos {asientos_no_disponibles} ya no están disponibles'
                })
        
        # 👇 AUTO-COMPLETAR MONTO Y DESCRIPCIÓN DESDE LA RESERVA
        attrs['monto'] = reserva.total
        attrs['descripcion'] = f"Pago para reserva {reserva.codigo_reserva} - {reserva.items.count()} asiento(s)"
        
        # ✅ LOG PARA DEBUG
        print(f"✅ Validación exitosa - Reserva {reserva.codigo_reserva} (estado: {reserva.estado}) lista para pago")
        
        return attrs
    
    def create(self, validated_data):
        """Crear un nuevo pago - el usuario se asigna desde la vista"""
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class ConfirmarPagoSerializer(serializers.Serializer):
    """Serializer para confirmar pagos - SE MANTIENE IGUAL"""
    payment_intent_id = serializers.CharField(
        required=True,
        help_text="ID del Payment Intent de Stripe"
    )