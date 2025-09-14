from django.db import models

class Vehiculo(models.Model):
    placa = models.CharField(max_length=20, unique=True)
    modelo = models.CharField(max_length=100)
    anio = models.IntegerField()
    capacidad_pasajeros = models.IntegerField()
    capacidad_carga = models.DecimalField(max_digits=5, decimal_places=1)  # toneladas
    vin = models.CharField(max_length=50, unique=True)
    seguro_vigente = models.BooleanField(default=True)
    estado = models.CharField(
        max_length=20,
        choices=[("Disponible", "Disponible"), ("En mantenimiento", "En mantenimiento"), ("Fuera de servicio", "Fuera de servicio")],
        default="Disponible"
    )

    def __str__(self):
        return f"{self.placa} - {self.modelo}"