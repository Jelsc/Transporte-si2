from django.db import models
from conductores.models import Conductor

class Vehiculo(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("mantenimiento", "En Mantenimiento"),
        ("baja", "Dado de Baja"),
    ]

    # Datos básicos
    nombre = models.CharField(max_length=100)
    tipo_vehiculo = models.CharField(max_length=50)  # bus, minibus, camión, etc.
    placa = models.CharField(max_length=20, unique=True)
    marca = models.CharField(max_length=50, blank=True, null=True)
    modelo = models.CharField(max_length=50, blank=True, null=True)
    año_fabricacion = models.IntegerField(blank=True, null=True)
    conductor = models.ForeignKey(Conductor, on_delete=models.SET_NULL, null=True, blank=True, related_name="conductores")

    # Capacidades
    capacidad_pasajeros = models.IntegerField(default=0)
    capacidad_carga = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # en kg

    # Estado y operación
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    kilometraje = models.IntegerField(default=0)
    ultimo_mantenimiento = models.DateField(blank=True, null=True)
    proximo_mantenimiento = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.placa})"