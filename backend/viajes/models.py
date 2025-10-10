from django.db import models
from django.core.exceptions import ValidationError
from vehiculos.models import Vehiculo
from users.models import CustomUser
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import uuid

# ==========================
# MODELO VIAJE (SIN CAMBIOS)
# ==========================
class Viaje(models.Model):
    ESTADOS = [
        ('programado', 'Programado'),
        ('en_curso', 'En Curso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]
    
    ORIGENES = [
        ('Santa Cruz', 'Santa Cruz'),
        ('Cochabamba', 'Cochabamba'),
        ('La Paz', 'La Paz'),
        ('Oruro', 'Oruro'),
        ('Potosi', 'Potosi'),
        ('Tarija', 'Tarija'),
        ('Beni', 'Beni'),
        ('Pando', 'Pando'),
    ]

    origen = models.CharField(max_length=50, choices=ORIGENES)
    destino = models.CharField(max_length=50)
    fecha = models.DateField()
    hora = models.TimeField()
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, related_name="viajes")
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='programado')
    asientos_disponibles = models.PositiveIntegerField(default=0)
    asientos_ocupados = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.origen} → {self.destino} ({self.fecha} {self.hora})"

# ==========================
# MODELO ASIENTO (SIN CAMBIOS)
# ==========================
class Asiento(models.Model):
    ESTADOS = [
        ('libre', 'Libre'),
        ('ocupado', 'Ocupado'),
        ('reservado', 'Reservado'),
    ]

    viaje = models.ForeignKey(Viaje, on_delete=models.CASCADE, related_name='asientos')
    numero = models.CharField(max_length=5)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='libre')

    class Meta:
        unique_together = ('viaje', 'numero')

    def __str__(self):
        return f"{self.viaje} - Asiento {self.numero} ({self.estado})"

# ==========================
# NUEVO MODELO RESERVA (ACTUALIZADO)
# ==========================
class Reserva(models.Model):
    ESTADOS_RESERVA = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
        ('pagada', 'Pagada'),
    ]
    
    cliente = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reservas')
    fecha_reserva = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_RESERVA, default='pendiente')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    codigo_reserva = models.CharField(max_length=10, unique=True, blank=True)
    pagado = models.BooleanField(default=False)  # 👈 Mantenemos este campo por compatibilidad
    
    def __str__(self):
        return f"Reserva {self.codigo_reserva} - {self.cliente}"

# ==========================
# NUEVO MODELO ITEM_RESERVA
# ==========================
class ItemReserva(models.Model):
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, related_name='items')
    asiento = models.ForeignKey(Asiento, on_delete=models.CASCADE, related_name='reservas')
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ('asiento',)  # Un asiento solo puede estar en una reserva activa
    
    def __str__(self):
        return f"{self.reserva} - {self.asiento}"

    def clean(self):
        # Validar que el asiento esté libre al crear el item
        if self.pk is None and self.asiento.estado != 'libre':  # Solo al crear
            raise ValidationError(f"El asiento {self.asiento.numero} no está disponible")

# ==========================
# SEÑALES CORREGIDAS
# ==========================
@receiver(post_save, sender=Viaje)
def generar_asientos_para_viaje(sender, instance, created, **kwargs):
    if created and instance.vehiculo:
        for i in range(1, instance.vehiculo.capacidad_pasajeros + 1):
            Asiento.objects.create(viaje=instance, numero=str(i))

@receiver(post_save, sender=Reserva)
def generar_codigo_reserva(sender, instance, created, **kwargs):
    """Genera código único al crear reserva"""
    if created and not instance.codigo_reserva:
        instance.codigo_reserva = str(uuid.uuid4())[:8].upper()
        instance.save(update_fields=['codigo_reserva'])

# ✅ SEÑALES CORREGIDAS - Sin conflicto
@receiver(post_save, sender=ItemReserva)
def actualizar_asiento_y_contadores(sender, instance, created, **kwargs):
    """
    Actualiza el estado del asiento Y los contadores del viaje
    """
    if created and instance.asiento and instance.asiento.viaje:
        # 1. Actualizar estado del asiento
        instance.asiento.estado = 'ocupado'
        instance.asiento.save()
        
        # 2. Actualizar contadores del viaje
        actualizar_contadores_viaje_directo(instance.asiento.viaje)

@receiver(post_delete, sender=ItemReserva)
def liberar_asiento_y_actualizar(sender, instance, **kwargs):
    """
    Libera el asiento Y actualiza contadores
    """
    if instance.asiento and instance.asiento.viaje:
        instance.asiento.estado = 'libre'
        instance.asiento.save()
        actualizar_contadores_viaje_directo(instance.asiento.viaje)

def actualizar_contadores_viaje_directo(viaje):
    """
    Función auxiliar para actualizar contadores
    """
    asientos_ocupados = Asiento.objects.filter(
        viaje=viaje, 
        estado='ocupado'
    ).count()
    
    asientos_disponibles = viaje.vehiculo.capacidad_pasajeros - asientos_ocupados
    
    # Siempre actualizar, no verificar cambios (más simple)
    viaje.asientos_ocupados = asientos_ocupados
    viaje.asientos_disponibles = asientos_disponibles
    viaje.save(update_fields=['asientos_ocupados', 'asientos_disponibles'])

@receiver(post_save, sender=ItemReserva)
def actualizar_total_reserva(sender, instance, created, **kwargs):
    """
    Actualiza el total de la reserva cuando se agregan/eliminan items
    """
    if instance.reserva:
        total = instance.reserva.items.aggregate(
            total=models.Sum('precio')
        )['total'] or 0
        instance.reserva.total = total
        instance.reserva.save(update_fields=['total'])

# ==========================
# DEBUG PARA VERIFICAR SEÑALES
# ==========================
print("🎯 MODELS.PY CARGADO - Señales para viajes registradas")

# Verificar señales registradas
from django.db.models.signals import post_save
from django.dispatch import receiver

print(f"Señales post_save para ItemReserva: {len(post_save._live_receivers(ItemReserva))}")