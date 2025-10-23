from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import Viaje, Asiento, Reserva, ItemReserva
from vehiculos.models import Vehiculo
from users.models import CustomUser
from ubicaciones.models import Ubicacion


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = ["id", "nombre", "placa", "tipo_vehiculo"]


class UbicacionSerializer(serializers.ModelSerializer):
    """Serializer simplificado para ubicaciones en viajes"""
    class Meta:
        model = Ubicacion
        fields = ["id", "nombre", "tipo", "direccion_texto", "lat", "lng"]


class ViajeSerializer(serializers.ModelSerializer):
    # Campos de lectura con información completa
    vehiculo = VehiculoSerializer(read_only=True)
    origen_detalle = UbicacionSerializer(source='origen', read_only=True)
    destino_detalle = UbicacionSerializer(source='destino', read_only=True)
    
    # Campos de escritura con solo IDs
    vehiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehiculo.objects.all(), 
        source="vehiculo", 
        write_only=True
    )
    origen_id = serializers.PrimaryKeyRelatedField(
        queryset=Ubicacion.objects.filter(activo=True),  # Solo ubicaciones activas
        source="origen",
        write_only=True
    )
    destino_id = serializers.PrimaryKeyRelatedField(
        queryset=Ubicacion.objects.filter(activo=True),
        source="destino",
        write_only=True
    )

    # Propiedades calculadas
    asientos_libres = serializers.IntegerField(read_only=True)
    esta_lleno = serializers.BooleanField(read_only=True)
    porcentaje_ocupacion = serializers.FloatField(read_only=True)

    class Meta:
        model = Viaje
        fields = [
            "id", 
            # Ubicaciones (lectura)
            "origen_detalle", "destino_detalle",
            # Ubicaciones (escritura)
            "origen_id", "destino_id",
            # Información del viaje
            "fecha", "hora", 
            # Vehículo
            "vehiculo", "vehiculo_id",
            # Precio y estado
            "precio", "estado", 
            # Asientos
            "asientos_disponibles", "asientos_ocupados",
            # Propiedades calculadas
            "asientos_libres", "esta_lleno", "porcentaje_ocupacion"
        ]
        read_only_fields = ["asientos_libres", "esta_lleno", "porcentaje_ocupacion"]
    
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
    viaje_info = serializers.SerializerMethodField()
    tiempo_restante = serializers.SerializerMethodField()
    esta_expirada = serializers.SerializerMethodField()
    
    asientos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
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
                'origen': obj.viaje.origen.nombre,
                'destino': obj.viaje.destino.nombre,
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
            if viaje.estado != 'programado':
                raise serializers.ValidationError("El viaje no está disponible para reservas")
            
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
        
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Hay asientos duplicados en la selección")
            
        return value
    
    def validate(self, data):
        viaje_id = data['viaje_id']
        asientos_ids = data['asientos_ids']
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Usuario no autenticado")
        
        reserva_existente = Reserva.objects.filter(
            cliente=request.user,
            viaje_id=viaje_id,
            estado='pendiente_pago'
        ).exclude(fecha_expiracion__lt=timezone.now()).first()
        
        if reserva_existente:
            tiempo_restante = reserva_existente.tiempo_restante
            minutos_restantes = max(0, tiempo_restante // 60)
            
            raise serializers.ValidationError(
                f"Ya tienes una reserva temporal activa para este viaje. "
                f"Código: {reserva_existente.codigo_reserva}. "
                f"Tiempo restante: {minutos_restantes} minutos."
            )
        
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
        
        asientos_ocupados = Asiento.objects.filter(
            id__in=asientos_ids,
            estado__in=['ocupado', 'reservado']
        )
        
        if asientos_ocupados.exists():
            numeros_ocupados = list(asientos_ocupados.values_list('numero', flat=True))
            raise serializers.ValidationError(
                f"Los siguientes asientos ya no están disponibles: {', '.join(numeros_ocupados)}"
            )
        
        viaje = Viaje.objects.get(id=viaje_id)
        precio_esperado = viaje.precio * len(asientos_ids)
        monto_total = data['monto_total']
        
        if abs(float(monto_total) - float(precio_esperado)) > 0.01:
            raise serializers.ValidationError(
                f"El monto total no coincide. Esperado: {precio_esperado:.2f}, Recibido: {float(monto_total):.2f}"
            )
        
        if len(asientos_ids) > viaje.asientos_disponibles:
            raise serializers.ValidationError(
                f"No hay suficientes asientos disponibles. "
                f"Solicitados: {len(asientos_ids)}, Disponibles: {viaje.asientos_disponibles}"
            )
        
        return data


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
                'origen': obj.viaje.origen.nombre,
                'destino': obj.viaje.destino.nombre,
                'fecha': obj.viaje.fecha,
                'hora': obj.viaje.hora,
                'precio': obj.viaje.precio,
                'asientos_disponibles': obj.viaje.asientos_disponibles
            }
        return None
