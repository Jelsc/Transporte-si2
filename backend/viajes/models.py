from django.db import models
from django.core.exceptions import ValidationError
from vehiculos.models import Vehiculo
from ubicaciones.models import Ubicacion

class Viaje(models.Model):
    ESTADOS = [
        ('programado', 'Programado'),
        ('en_curso', 'En Curso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]

    # Relaciones con ubicaciones
    origen = models.ForeignKey(
        Ubicacion, 
        on_delete=models.PROTECT,  # PROTECT evita eliminar ubicaciones con viajes
        related_name="viajes_origen",
        help_text="Ubicación de origen del viaje"
    )
    destino = models.ForeignKey(
        Ubicacion, 
        on_delete=models.PROTECT,
        related_name="viajes_destino",
        help_text="Ubicación de destino del viaje"
    )
    
    # Información del viaje
    fecha = models.DateField(help_text="Fecha del viaje")
    hora = models.TimeField(help_text="Hora de salida")
    vehiculo = models.ForeignKey(
        Vehiculo, 
        on_delete=models.CASCADE, 
        related_name="viajes",
        help_text="Vehículo asignado al viaje"
    )
    precio = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Precio del viaje"
    )
    estado = models.CharField(
        max_length=20, 
        choices=ESTADOS, 
        default='programado',
        help_text="Estado actual del viaje"
    )
    
    # Gestión de asientos
    asientos_disponibles = models.PositiveIntegerField(
        default=0,
        help_text="Asientos disponibles para reservar"
    )
    asientos_ocupados = models.PositiveIntegerField(
        default=0,
        help_text="Asientos ya reservados"
    )

    class Meta:
        ordering = ['-fecha', '-hora']
        verbose_name = 'Viaje'
        verbose_name_plural = 'Viajes'
        indexes = [
            models.Index(fields=['fecha', 'hora']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.origen.nombre} → {self.destino.nombre} ({self.fecha} {self.hora})"
    
    def clean(self):
        """Validaciones personalizadas del modelo"""
        super().clean()
        
        # Validar que origen y destino sean diferentes
        if self.origen_id and self.destino_id and self.origen_id == self.destino_id:
            raise ValidationError({
                'destino': 'El destino debe ser diferente al origen'
            })
        
        # Validar que las ubicaciones estén activas
        if self.origen and not self.origen.activo:
            raise ValidationError({
                'origen': 'La ubicación de origen debe estar activa'
            })
        
        if self.destino and not self.destino.activo:
            raise ValidationError({
                'destino': 'La ubicación de destino debe estar activa'
            })
        
        # Validar asientos
        if self.asientos_ocupados > self.asientos_disponibles:
            raise ValidationError({
                'asientos_ocupados': 'Los asientos ocupados no pueden superar los disponibles'
            })
    
    def save(self, *args, **kwargs):
        """Sobrescribir save para ejecutar validaciones"""
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def asientos_libres(self):
        """Calcula los asientos libres"""
        return self.asientos_disponibles - self.asientos_ocupados
    
    @property
    def esta_lleno(self):
        """Verifica si el viaje está lleno"""
        return self.asientos_ocupados >= self.asientos_disponibles
    
    @property
    def porcentaje_ocupacion(self):
        """Calcula el porcentaje de ocupación"""
        if self.asientos_disponibles == 0:
            return 0
        return (self.asientos_ocupados / self.asientos_disponibles) * 100