from rest_framework import serializers
from .models import Viaje
from vehiculos.models import Vehiculo

class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = ["id", "nombre", "placa", "tipo_vehiculo"]

class ViajeSerializer(serializers.ModelSerializer):
    vehiculo = VehiculoSerializer(read_only=True)   
    vehiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehiculo.objects.all(), source="vehiculo", write_only=True
    )

    class Meta:
        model = Viaje
        fields = [
            "id", "origen", "destino", "fecha", "hora", 
            "vehiculo", "vehiculo_id", "precio", "estado", 
            "asientos_disponibles", "asientos_ocupados"
        ]