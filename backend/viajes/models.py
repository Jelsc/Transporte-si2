from django.db import models
from vehiculos.models import Vehiculo

class Viaje(models.Model):
    ORIGENES = [
        ('Santa Cruz', 'Santa Cruz'),
        ('Cochabamba', 'Cochabamba'),
        ('La Paz', 'La Paz'),
    ]

    origen = models.CharField(max_length=50, choices=ORIGENES)
    destino = models.CharField(max_length=50)
    fecha = models.DateField()
    hora = models.TimeField()
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, related_name="viajes")
    precio = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.origen} → {self.destino} ({self.fecha} {self.hora})"