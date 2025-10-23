from django.db import models
from django.core.exceptions import ValidationError
from vehiculos.models import Vehiculo
from users.models import CustomUser
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
import uuid
from django.db import transaction
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
        if not kwargs.pop('skip_validation', False):
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


class Asiento(models.Model):
    ESTADOS = [
        ('libre', 'Libre'),
        ('ocupado', 'Ocupado'),
        ('reservado', 'Reservado Temporalmente'),
    ]

    viaje = models.ForeignKey(Viaje, on_delete=models.CASCADE, related_name='asientos')
    numero = models.CharField(max_length=5)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='libre')
    reserva_temporal = models.ForeignKey(
        'Reserva', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='asientos_temporales'
    )

    class Meta:
        unique_together = ('viaje', 'numero')

    def __str__(self):
        return f"{self.viaje} - Asiento {self.numero} ({self.estado})"

    @property
    def esta_disponible(self):
        return self.estado == 'libre'


class Reserva(models.Model):
    ESTADOS_RESERVA = [
        ('pendiente_pago', 'Pendiente de Pago'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
        ('expirada', 'Expirada'),
        ('pagada', 'Pagada'),
    ]
    
    cliente = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reservas')
    viaje = models.ForeignKey(Viaje, on_delete=models.CASCADE, related_name='reservas', null=True, blank=True)
    fecha_reserva = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_RESERVA, default='pendiente_pago')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    codigo_reserva = models.CharField(max_length=10, unique=True, blank=True)
    pagado = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Reserva {self.codigo_reserva} - {self.cliente}"

    def save(self, *args, **kwargs):
        if not self.codigo_reserva:
            self.codigo_reserva = str(uuid.uuid4())[:8].upper()
        
        if not self.pk and self.estado == 'pendiente_pago' and not self.fecha_expiracion:
            self.fecha_expiracion = timezone.now() + timedelta(minutes=15)
        
        super().save(*args, **kwargs)

    @property
    def esta_expirada(self):
        if self.estado != 'pendiente_pago' or not self.fecha_expiracion:
            return False
        return timezone.now() > self.fecha_expiracion

    @property
    def tiempo_restante(self):
        if not self.fecha_expiracion or self.estado != 'pendiente_pago':
            return 0
        ahora = timezone.now()
        diferencia = self.fecha_expiracion - ahora
        return max(0, int(diferencia.total_seconds()))

    def liberar_asientos(self):
        with transaction.atomic():
            Asiento.objects.filter(reserva_temporal=self).update(
                estado='libre', 
                reserva_temporal=None
            )
            
            for item in self.items.all():
                if item.asiento:
                    item.asiento.estado = 'libre'
                    item.asiento.reserva_temporal = None
                    item.asiento.save()
            
            if self.viaje:
                transaction.on_commit(lambda: actualizar_contadores_viaje(self.viaje.id))

    def confirmar_pago(self):
        with transaction.atomic():
            self.estado = 'pagada'
            self.pagado = True
            self.fecha_expiracion = None
            self.save()
            
            for item in self.items.all():
                if item.asiento:
                    item.asiento.estado = 'ocupado'
                    item.asiento.reserva_temporal = None
                    item.asiento.save()
            
            if self.viaje:
                transaction.on_commit(lambda: actualizar_contadores_viaje(self.viaje.id))


class ItemReserva(models.Model):
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, related_name='items')
    asiento = models.ForeignKey(Asiento, on_delete=models.CASCADE, related_name='reservas')
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ('asiento',)
    
    def __str__(self):
        return f"{self.reserva} - {self.asiento}"

    def clean(self):
        if self.pk is None and not self.asiento.esta_disponible:
            raise ValidationError(f"El asiento {self.asiento.numero} no está disponible")


def actualizar_contadores_viaje(viaje_id):
    try:
        viaje = Viaje.objects.get(id=viaje_id)
        
        asientos_ocupados = Asiento.objects.filter(
            viaje=viaje, 
            estado__in=['ocupado', 'reservado']
        ).count()
        
        asientos_disponibles = viaje.vehiculo.capacidad_pasajeros - asientos_ocupados
        
        if (viaje.asientos_ocupados != asientos_ocupados or 
            viaje.asientos_disponibles != asientos_disponibles):
            
            Viaje.objects.filter(id=viaje_id).update(
                asientos_ocupados=asientos_ocupados,
                asientos_disponibles=asientos_disponibles
            )
            
    except Viaje.DoesNotExist:
        pass
    except Exception as e:
        print(f"Error actualizando contadores del viaje {viaje_id}: {e}")


@receiver([post_save, post_delete], sender=ItemReserva)
def actualizar_contadores_despues_reserva(sender, instance, **kwargs):
    try:
        if instance and hasattr(instance, 'asiento') and instance.asiento:
            viaje = instance.asiento.viaje
            transaction.on_commit(lambda: actualizar_contadores_viaje(viaje.id))
    except Exception as e:
        print(f"Error en señal de ItemReserva: {e}")


@receiver(pre_save, sender=Asiento)
def actualizar_contadores_despues_asiento(sender, instance, **kwargs):
    try:
        if instance.pk and instance.viaje:
            old_instance = Asiento.objects.get(pk=instance.pk)
            if old_instance.estado != instance.estado:
                transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Asiento.DoesNotExist:
        if instance.viaje:
            transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Exception as e:
        print(f"Error en señal de Asiento: {e}")


@receiver(post_save, sender=Asiento)
def actualizar_contadores_nuevo_asiento(sender, instance, created, **kwargs):
    try:
        if created and instance.viaje:
            transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Exception as e:
        print(f"Error en señal de nuevo asiento: {e}")


@receiver(post_delete, sender=Asiento)
def actualizar_contadores_eliminar_asiento(sender, instance, **kwargs):
    try:
        if instance and instance.viaje:
            transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Exception as e:
        print(f"Error en señal de eliminar asiento: {e}")


@receiver(pre_save, sender=Reserva)
def manejar_estados_reserva(sender, instance, **kwargs):
    try:
        if instance.pk and instance.viaje:
            old_instance = Reserva.objects.get(pk=instance.pk)
            
            if (old_instance.estado == 'pendiente_pago' and 
                instance.estado in ['pagada', 'confirmada']):
                transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
                
            if (old_instance.estado != 'cancelada' and 
                instance.estado in ['cancelada', 'expirada']):
                transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
                
    except Reserva.DoesNotExist:
        pass
    except Exception as e:
        print(f"Error en señal de reserva: {e}")


@receiver(post_save, sender=Viaje)
def generar_asientos_para_viaje(sender, instance, created, **kwargs):
    if created and instance.vehiculo:
        for i in range(1, instance.vehiculo.capacidad_pasajeros + 1):
            Asiento.objects.create(viaje=instance, numero=str(i))


@receiver(post_save, sender=ItemReserva)
def actualizar_asiento_y_contadores(sender, instance, created, **kwargs):
    if created and instance.asiento and instance.asiento.viaje:
        if instance.reserva.estado == 'pendiente_pago':
            instance.asiento.estado = 'reservado'
            instance.asiento.reserva_temporal = instance.reserva
        elif instance.reserva.estado == 'pagada':
            instance.asiento.estado = 'ocupado'
        
        instance.asiento.save()
        transaction.on_commit(lambda: actualizar_contadores_viaje(instance.asiento.viaje.id))


@receiver(post_delete, sender=ItemReserva)
def liberar_asiento_y_actualizar(sender, instance, **kwargs):
    if instance.asiento and instance.asiento.viaje:
        instance.asiento.estado = 'libre'
        instance.asiento.reserva_temporal = None
        instance.asiento.save()
        transaction.on_commit(lambda: actualizar_contadores_viaje(instance.asiento.viaje.id))


@receiver(post_save, sender=ItemReserva)
def actualizar_total_reserva(sender, instance, created, **kwargs):
    if instance.reserva:
        total = instance.reserva.items.aggregate(
            total=models.Sum('precio')
        )['total'] or 0
        instance.reserva.total = total
        instance.reserva.save(update_fields=['total'])


def forzar_actualizacion_contadores_viaje(viaje_id):
    try:
        actualizar_contadores_viaje(viaje_id)
        return True
    except Exception as e:
        print(f"Error forzando actualización: {e}")
        return False


def reparar_todos_contadores():
    try:
        viajes = Viaje.objects.all()
        total_reparados = 0
        
        for viaje in viajes:
            if forzar_actualizacion_contadores_viaje(viaje.id):
                total_reparados += 1
        
        return total_reparados
    except Exception as e:
        print(f"Error reparando contadores: {e}")
        return 0


def limpiar_reservas_expiradas():
    from django.db import transaction
    from django.utils import timezone
    
    with transaction.atomic():
        reservas_expiradas = Reserva.objects.filter(
            estado='pendiente_pago',
            fecha_expiracion__lt=timezone.now()
        )
        
        for reserva in reservas_expiradas:
            reserva.estado = 'expirada'
            reserva.save()
            reserva.liberar_asientos()
        
        return reservas_expiradas.count()


def obtener_reservas_por_expiracion(minutos=5):
    from django.utils import timezone
    from django.db.models import Q
    
    limite = timezone.now() + timedelta(minutes=minutos)
    return Reserva.objects.filter(
        Q(estado='pendiente_pago') &
        Q(fecha_expiracion__lte=limite) &
        Q(fecha_expiracion__gt=timezone.now())
    )
