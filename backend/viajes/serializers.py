from rest_framework import serializers
from django.db import transaction
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

    class Meta:
        model = Asiento
        fields = ["id", "numero", "estado", "viaje"]

# ==========================
# NUEVO SERIALIZER PARA ITEM_RESERVA
# ==========================
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

# ==========================
# SERIALIZER DE RESERVA ACTUALIZADO (MÚLTIPLES ASIENTOS) - CORREGIDO
# ==========================
class ReservaSerializer(serializers.ModelSerializer):
    cliente = CustomUserSerializer(read_only=True)
    items = ItemReservaSerializer(many=True, read_only=True, source='items.all')
    
    asientos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True,
        help_text="Lista de IDs de asientos a reservar"
    )

    class Meta:
        model = Reserva
        fields = [
            "id", "cliente", "codigo_reserva", "fecha_reserva", 
            "estado", "total", "pagado", "items", "asientos_ids"
        ]
        read_only_fields = ['codigo_reserva', 'total', 'cliente', 'fecha_reserva']

    def validate_asientos_ids(self, value):
        """
        Valida que todos los asientos existan y estén libres
        """
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
        """
        Crea una reserva con múltiples asientos en una transacción atómica - CORREGIDO
        """
        asientos_ids = validated_data.pop('asientos_ids')
        user = self.context['request'].user
        
        with transaction.atomic():
            # CORRECCIÓN: Crear la reserva solo con el cliente
            reserva = Reserva.objects.create(cliente=user)
            
            # Obtener los asientos y verificar nuevamente
            asientos = Asiento.objects.filter(id__in=asientos_ids)
            asientos_ocupados = asientos.filter(estado__in=['ocupado', 'reservado'])
            
            if asientos_ocupados.exists():
                raise serializers.ValidationError(
                    "Algunos asientos ya fueron ocupados durante el proceso de reserva"
                )
            
            # Obtener el precio del viaje
            viaje = asientos.first().viaje
            precio_viaje = viaje.precio
            
            # ✅ CORRECCIÓN: Crear items UNO POR UNO (dispara señales)
            for asiento in asientos:
                # Esto dispara la señal post_save automáticamente
                ItemReserva.objects.create(
                    reserva=reserva,
                    asiento=asiento,
                    precio=precio_viaje
                )
                # ❌ NO actualizar el asiento manualmente - lo hace la señal
            
        return reserva

# ==========================
# SERIALIZER PARA COMPATIBILIDAD (RESERVA SIMPLE) - CORREGIDO
# ==========================
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
        """
        Crea una reserva simple con un solo asiento - CORREGIDO
        """
        asiento = validated_data.pop('asiento')  # Extraer el asiento
        user = self.context['request'].user
        
        with transaction.atomic():
            # Crear la reserva principal
            reserva = Reserva.objects.create(cliente=user)
            
            # ✅ CORRECCIÓN: Solo crear el ItemReserva, la señal se encarga del asiento
            ItemReserva.objects.create(
                reserva=reserva,
                asiento=asiento,
                precio=asiento.viaje.precio
            )
            # ❌ NO actualizar el asiento manualmente - lo hace la señal
            
        return reserva