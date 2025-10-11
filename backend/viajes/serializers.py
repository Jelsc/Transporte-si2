from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Viaje, Asiento, Reserva, ItemReserva
from vehiculos.models import Vehiculo
from users.models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = ["id", "nombre", "placa", "tipo_vehiculo"]

class ViajeSerializer(serializers.ModelSerializer):
    vehiculo = VehiculoSerializer(read_only=True)   
    vehiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehiculo.objects.all(), 
        source="vehiculo", 
        write_only=True
    )

    class Meta:
        model = Viaje
        fields = [
            "id", "origen", "destino", "fecha", "hora", 
            "vehiculo", "vehiculo_id", "precio", "estado", 
            "asientos_disponibles", "asientos_ocupados"
        ]
    
    def create(self, validated_data):
        vehiculo = validated_data['vehiculo']
        if not validated_data.get('asientos_disponibles'):
            validated_data['asientos_disponibles'] = vehiculo.capacidad_pasajeros
        return super().create(validated_data)

class AsientoSerializer(serializers.ModelSerializer):
    viaje = ViajeSerializer(read_only=True)
    esta_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Asiento
        fields = ["id", "numero", "estado", "viaje", "esta_disponible", "reserva_temporal"]
    
    def get_esta_disponible(self, obj):
        return obj.esta_disponible

class ItemReservaSerializer(serializers.ModelSerializer):
    asiento = AsientoSerializer(read_only=True)
    asiento_id = serializers.PrimaryKeyRelatedField(
        queryset=Asiento.objects.all(),
        source='asiento',
        write_only=True,
        required=True
    )

    class Meta:
        model = ItemReserva
        fields = ['id', 'asiento', 'asiento_id', 'precio']
        read_only_fields = ['precio']

class ReservaSerializer(serializers.ModelSerializer):
    cliente = CustomUserSerializer(read_only=True)
    items = ItemReservaSerializer(many=True, read_only=True, source='items.all')
    viaje_info = serializers.SerializerMethodField()
    tiempo_restante = serializers.SerializerMethodField()
    esta_expirada = serializers.SerializerMethodField()
    
    asientos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True,
        help_text="Lista de IDs de asientos a reservar"
    )

    class Meta:
        model = Reserva
        fields = [
            "id", "cliente", "codigo_reserva", "fecha_reserva", "fecha_expiracion",
            "estado", "total", "pagado", "items", "asientos_ids", "viaje", 
            "viaje_info", "tiempo_restante", "esta_expirada"
        ]
        read_only_fields = ['codigo_reserva', 'total', 'cliente', 'fecha_reserva', 'fecha_expiracion']

    def get_viaje_info(self, obj):
        if obj.viaje:
            return {
                'id': obj.viaje.id,
                'origen': obj.viaje.origen,
                'destino': obj.viaje.destino,
                'fecha': obj.viaje.fecha,
                'hora': obj.viaje.hora,
                'precio': obj.viaje.precio
            }
        return None

    def get_tiempo_restante(self, obj):
        return obj.tiempo_restante

    def get_esta_expirada(self, obj):
        return obj.esta_expirada

    def validate_asientos_ids(self, value):
        if not value:
            raise serializers.ValidationError("Debe seleccionar al menos un asiento")
        
        asientos = Asiento.objects.filter(id__in=value)
        if len(asientos) != len(value):
            raise serializers.ValidationError("Algunos asientos no existen")
        
        asientos_ocupados = asientos.filter(estado__in=['ocupado', 'reservado'])
        if asientos_ocupados.exists():
            numeros_ocupados = list(asientos_ocupados.values_list('numero', flat=True))
            raise serializers.ValidationError(
                f"Los asientos {numeros_ocupados} no están disponibles"
            )
        
        viajes_ids = asientos.values_list('viaje_id', flat=True).distinct()
        if len(viajes_ids) > 1:
            raise serializers.ValidationError(
                "Todos los asientos deben ser del mismo viaje"
            )
        
        return value

    def create(self, validated_data):
        asientos_ids = validated_data.pop('asientos_ids')
        user = self.context['request'].user
        
        with transaction.atomic():
            reserva = Reserva.objects.create(cliente=user)
            
            asientos = Asiento.objects.filter(id__in=asientos_ids)
            asientos_ocupados = asientos.filter(estado__in=['ocupado', 'reservado'])
            
            if asientos_ocupados.exists():
                raise serializers.ValidationError(
                    "Algunos asientos ya fueron ocupados durante el proceso de reserva"
                )
            
            viaje = asientos.first().viaje
            precio_viaje = viaje.precio
            
            for asiento in asientos:
                ItemReserva.objects.create(
                    reserva=reserva,
                    asiento=asiento,
                    precio=precio_viaje
                )
            
        return reserva

class ReservaSimpleSerializer(serializers.ModelSerializer):
    cliente = CustomUserSerializer(read_only=True)
    asiento = AsientoSerializer(read_only=True)
    asiento_id = serializers.PrimaryKeyRelatedField(
        queryset=Asiento.objects.all(),
        source='asiento', 
        write_only=True,
        required=True
    )

    class Meta:
        model = Reserva
        fields = [
            "id", "cliente", "asiento", "asiento_id", 
            "fecha_reserva", "pagado", "codigo_reserva", "total"
        ]
        read_only_fields = ['codigo_reserva', 'total', 'cliente', 'fecha_reserva']

    def validate_asiento_id(self, value):
        if value.estado != 'libre':
            raise serializers.ValidationError("Este asiento ya está ocupado o reservado.")
        return value

    def create(self, validated_data):
        asiento = validated_data.pop('asiento')
        user = self.context['request'].user
        
        with transaction.atomic():
            reserva = Reserva.objects.create(cliente=user)
            
            ItemReserva.objects.create(
                reserva=reserva,
                asiento=asiento,
                precio=asiento.viaje.precio
            )
            
        return reserva

# ✅ CORREGIDO: SERIALIZER PARA RESERVA TEMPORAL CON VALIDACIONES MEJORADAS
class CrearReservaTemporalSerializer(serializers.Serializer):
    viaje_id = serializers.IntegerField(required=True)
    asientos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )
    monto_total = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=True
    )
    
    def validate_viaje_id(self, value):
        try:
            viaje = Viaje.objects.get(id=value)
            # ✅ VALIDACIÓN NUEVA: Verificar que el viaje esté programado
            if viaje.estado != 'programado':
                raise serializers.ValidationError("El viaje no está disponible para reservas")
            
            # ✅ VALIDACIÓN NUEVA: Verificar que haya asientos disponibles
            if viaje.asientos_disponibles <= 0:
                raise serializers.ValidationError("No hay asientos disponibles en este viaje")
                
            return value
        except Viaje.DoesNotExist:
            raise serializers.ValidationError("El viaje no existe")
    
    def validate_asientos_ids(self, value):
        if not value:
            raise serializers.ValidationError("Debe seleccionar al menos un asiento")
        if len(value) > 10:
            raise serializers.ValidationError("No se pueden reservar más de 10 asientos a la vez")
        
        # ✅ VALIDACIÓN NUEVA: Verificar que no haya duplicados
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Hay asientos duplicados en la selección")
            
        return value
    
    def validate(self, data):
        viaje_id = data['viaje_id']
        asientos_ids = data['asientos_ids']
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Usuario no autenticado")
        
        # ✅ CORREGIDO: Verificar que el usuario no tenga ya una reserva temporal para este viaje
        # Usamos fecha_expiracion en lugar de la propiedad esta_expirada
        reserva_existente = Reserva.objects.filter(
            cliente=request.user,
            viaje_id=viaje_id,
            estado='pendiente_pago'
        ).exclude(
            # ✅ CORRECCIÓN CRÍTICA: Usar fecha_expiracion en lugar de esta_expirada
            fecha_expiracion__lt=timezone.now()
        ).first()
        
        if reserva_existente:
            tiempo_restante = reserva_existente.tiempo_restante
            minutos_restantes = max(0, tiempo_restante // 60)
            
            raise serializers.ValidationError(
                f"Ya tienes una reserva temporal activa para este viaje. "
                f"Código: {reserva_existente.codigo_reserva}. "
                f"Tiempo restante: {minutos_restantes} minutos. "
                f"Completa el pago o cancela la reserva antes de crear una nueva."
            )
        
        # Validar que los asientos pertenezcan al viaje
        asientos_viaje = Asiento.objects.filter(
            id__in=asientos_ids, 
            viaje_id=viaje_id
        ).count()
        
        if asientos_viaje != len(asientos_ids):
            asientos_no_encontrados = set(asientos_ids) - set(
                Asiento.objects.filter(
                    id__in=asientos_ids, 
                    viaje_id=viaje_id
                ).values_list('id', flat=True)
            )
            raise serializers.ValidationError(
                f"Algunos asientos no pertenecen al viaje seleccionado: {list(asientos_no_encontrados)}"
            )
        
        # ✅ VALIDACIÓN MEJORADA: Verificar disponibilidad de asientos
        asientos_ocupados = Asiento.objects.filter(
            id__in=asientos_ids,
            estado__in=['ocupado', 'reservado']
        )
        
        if asientos_ocupados.exists():
            numeros_ocupados = list(asientos_ocupados.values_list('numero', flat=True))
            raise serializers.ValidationError(
                f"Los siguientes asientos ya no están disponibles: {', '.join(numeros_ocupados)}"
            )
        
        # Validar que el monto total sea razonable
        viaje = Viaje.objects.get(id=viaje_id)
        precio_esperado = viaje.precio * len(asientos_ids)
        monto_total = data['monto_total']
        
        # Permitir pequeñas diferencias por decimales
        if abs(float(monto_total) - float(precio_esperado)) > 0.01:  # ✅ Más preciso
            raise serializers.ValidationError(
                f"El monto total no coincide. Esperado: {precio_esperado:.2f}, Recibido: {float(monto_total):.2f}"
            )
        
        # ✅ VALIDACIÓN NUEVA: Verificar que no se exceda la capacidad del vehículo
        if len(asientos_ids) > viaje.asientos_disponibles:
            raise serializers.ValidationError(
                f"No hay suficientes asientos disponibles. "
                f"Solicitados: {len(asientos_ids)}, Disponibles: {viaje.asientos_disponibles}"
            )
        
        return data

# ✅ SERIALIZER PARA ESTADO DE RESERVA TEMPORAL
class EstadoReservaTemporalSerializer(serializers.ModelSerializer):
    tiempo_restante = serializers.SerializerMethodField()
    esta_expirada = serializers.SerializerMethodField()
    asientos = serializers.SerializerMethodField()
    viaje_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Reserva
        fields = [
            'id', 'codigo_reserva', 'estado', 'esta_expirada', 
            'tiempo_restante', 'fecha_expiracion', 'asientos', 'viaje_info'
        ]
    
    def get_tiempo_restante(self, obj):
        return obj.tiempo_restante
    
    def get_esta_expirada(self, obj):
        return obj.esta_expirada
    
    def get_asientos(self, obj):
        return [item.asiento.numero for item in obj.items.all()]
    
    def get_viaje_info(self, obj):
        if obj.viaje:
            return {
                'origen': obj.viaje.origen,
                'destino': obj.viaje.destino,
                'fecha': obj.viaje.fecha,
                'hora': obj.viaje.hora,
                'precio': obj.viaje.precio,
                'asientos_disponibles': obj.viaje.asientos_disponibles
            }
        return None