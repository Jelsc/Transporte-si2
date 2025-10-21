from rest_framework import serializers
from .models import Viaje
from vehiculos.models import Vehiculo
from ubicaciones.models import Ubicacion


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
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que origen y destino sean diferentes
        origen = data.get('origen')
        destino = data.get('destino')
        
        if origen and destino and origen.id == destino.id:
            raise serializers.ValidationError({
                'destino': 'El destino debe ser diferente al origen'
            })
        
        # Validar que las ubicaciones estén activas
        if origen and not origen.activo:
            raise serializers.ValidationError({
                'origen_id': 'La ubicación de origen debe estar activa'
            })
        
        if destino and not destino.activo:
            raise serializers.ValidationError({
                'destino_id': 'La ubicación de destino debe estar activa'
            })
        
        # Validar asientos
        asientos_disponibles = data.get('asientos_disponibles')
        asientos_ocupados = data.get('asientos_ocupados', 0)
        
        if asientos_ocupados > asientos_disponibles:
            raise serializers.ValidationError({
                'asientos_ocupados': 'Los asientos ocupados no pueden superar los disponibles'
            })
        
        return data