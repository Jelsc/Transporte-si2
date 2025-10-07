from rest_framework import serializers
from .models import Vehiculo
from conductores.models import Conductor

class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = ["id", "nombre", "apellido"]

class VehiculoSerializer(serializers.ModelSerializer):
    conductor = ConductorSerializer(read_only=True)  # Para GET, muestra info completa
    conductor_id = serializers.PrimaryKeyRelatedField(
        queryset=Conductor.objects.all(), source='conductor', write_only=True
    )

    class Meta:
        model = Vehiculo
        fields = "__all__"
