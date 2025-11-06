# pagos/serializers.py - VERSIÓN CORREGIDA
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
            'reserva', 'reserva_info', 'codigo_reserva', 'reserva_estado',
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
        """Información básica de la reserva relacionada - VERSIÓN CORREGIDA"""
        if obj.reserva and obj.reserva.items.exists():
            try:
                primer_item = obj.reserva.items.first()
                if primer_item and primer_item.asiento and primer_item.asiento.viaje:
                    viaje = primer_item.asiento.viaje
                    
                    # ✅ CORREGIDO: Serializar objetos Ubicacion a strings/dicts
                    origen_info = self._serializar_ubicacion(viaje.origen)
                    destino_info = self._serializar_ubicacion(viaje.destino)
                    
                    return {
                        'origen': origen_info,  # ✅ Ahora es un dict/string, no un objeto
                        'destino': destino_info,  # ✅ Ahora es un dict/string, no un objeto
                        'fecha': viaje.fecha.isoformat() if viaje.fecha else None,
                        'hora': str(viaje.hora) if viaje.hora else None,
                        'cantidad_asientos': obj.reserva.items.count()
                    }
            except Exception as e:
                print(f"❌ Error serializando reserva_info: {e}")
                return None
        return None
    
    def _serializar_ubicacion(self, ubicacion):
        """Método helper para serializar objetos Ubicacion de manera segura"""
        if not ubicacion:
            return None
        
        try:
            # ✅ Opción 1: Devolver solo el string representation
            # return str(ubicacion)
            
            # ✅ Opción 2: Devolver un diccionario con datos básicos
            return {
                'id': ubicacion.id,
                'nombre': str(ubicacion.nombre) if hasattr(ubicacion, 'nombre') else str(ubicacion),
                'tipo': str(ubicacion.tipo) if hasattr(ubicacion, 'tipo') else 'TERMINAL',
                'direccion': str(ubicacion.direccion) if hasattr(ubicacion, 'direccion') else None,
                'ciudad': str(ubicacion.ciudad) if hasattr(ubicacion, 'ciudad') else None
            }
        except Exception as e:
            print(f"❌ Error serializando ubicación: {e}")
            # ✅ Opción de respaldo: devolver solo el ID
            return {
                'id': ubicacion.id,
                'nombre': f'Ubicación {ubicacion.id}'
            }


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
        read_only_fields = ['monto', 'descripcion']
    
    def validate_monto(self, value):
        """Validar que el monto sea positivo"""
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        if value > 999999.99:
            raise serializers.ValidationError("El monto es demasiado alto")
        return value
    
    def validate(self, attrs):
        """Validaciones adicionales al crear el pago"""
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
        
        # Estados que NO permiten pago
        estados_invalidos = ['cancelada', 'expirada', 'pagada']
        
        if reserva.estado in estados_invalidos:
            raise serializers.ValidationError({
                'reserva_id': f'No se puede pagar una reserva en estado: {reserva.estado}'
            })
        
        # Verificar expiración para reservas temporales
        if reserva.estado == 'pendiente_pago':
            if hasattr(reserva, 'fecha_expiracion') and reserva.fecha_expiracion and reserva.fecha_expiracion < timezone.now():
                raise serializers.ValidationError({
                    'reserva_id': 'La reserva ha expirado. Por favor, realiza una nueva reserva.'
                })
        
        # Validar que la reserva tenga items/asientos
        if not reserva.items.exists():
            raise serializers.ValidationError({
                'reserva_id': 'La reserva no tiene asientos asignados'
            })
        
        # Auto-completar monto y descripción
        attrs['monto'] = reserva.total
        attrs['descripcion'] = f"Pago para reserva {reserva.codigo_reserva} - {reserva.items.count()} asiento(s)"
        
        return attrs
    
    def create(self, validated_data):
        """Crear un nuevo pago - el usuario se asigna desde la vista"""
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class ConfirmarPagoSerializer(serializers.Serializer):
    """Serializer para confirmar pagos"""
    payment_intent_id = serializers.CharField(
        required=True,
        help_text="ID del Payment Intent de Stripe"
    )