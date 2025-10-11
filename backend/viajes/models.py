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
# MODELO ASIENTO (ACTUALIZADO)
# ==========================
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
        """Verifica si el asiento está realmente disponible"""
        return self.estado == 'libre'

# ==========================
# MODELO RESERVA (ACTUALIZADO CON EXPIRACIÓN)
# ==========================
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
        # Generar código único si no existe
        if not self.codigo_reserva:
            self.codigo_reserva = str(uuid.uuid4())[:8].upper()
        
        # Establecer expiración si es nueva reserva pendiente
        if not self.pk and self.estado == 'pendiente_pago' and not self.fecha_expiracion:
            self.fecha_expiracion = timezone.now() + timedelta(minutes=15)
        
        super().save(*args, **kwargs)

    @property
    def esta_expirada(self):
        """Verifica si la reserva ha expirado"""
        if self.estado != 'pendiente_pago' or not self.fecha_expiracion:
            return False
        return timezone.now() > self.fecha_expiracion

    @property
    def tiempo_restante(self):
        """Calcula segundos restantes hasta expiración"""
        if not self.fecha_expiracion or self.estado != 'pendiente_pago':
            return 0
        ahora = timezone.now()
        diferencia = self.fecha_expiracion - ahora
        return max(0, int(diferencia.total_seconds()))

    def liberar_asientos(self):
        """Libera todos los asientos asociados a esta reserva"""
        with transaction.atomic():
            # Liberar asientos temporales
            Asiento.objects.filter(reserva_temporal=self).update(
                estado='libre', 
                reserva_temporal=None
            )
            
            # Liberar asientos de items de reserva
            for item in self.items.all():
                if item.asiento:
                    item.asiento.estado = 'libre'
                    item.asiento.reserva_temporal = None
                    item.asiento.save()
            
            # ✅ NUEVO: Forzar actualización de contadores
            if self.viaje:
                transaction.on_commit(lambda: actualizar_contadores_viaje(self.viaje.id))

    def confirmar_pago(self):
        """Confirma la reserva después del pago exitoso"""
        with transaction.atomic():
            self.estado = 'pagada'
            self.pagado = True
            self.fecha_expiracion = None  # Ya no expira
            self.save()
            
            # Marcar asientos como ocupados permanentemente
            for item in self.items.all():
                if item.asiento:
                    item.asiento.estado = 'ocupado'
                    item.asiento.reserva_temporal = None
                    item.asiento.save()
            
            # ✅ NUEVO: Forzar actualización de contadores
            if self.viaje:
                transaction.on_commit(lambda: actualizar_contadores_viaje(self.viaje.id))

# ==========================
# MODELO ITEM_RESERVA (ACTUALIZADO)
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
        if self.pk is None and not self.asiento.esta_disponible:
            raise ValidationError(f"El asiento {self.asiento.numero} no está disponible")

# ==========================
# SEÑALES MEJORADAS PARA ACTUALIZACIÓN DE CONTADORES
# ==========================

# ✅ FUNCIÓN AUXILIAR PARA ACTUALIZAR CONTADORES
def actualizar_contadores_viaje(viaje_id):
    """
    Función auxiliar para actualizar contadores de forma segura
    """
    try:
        viaje = Viaje.objects.get(id=viaje_id)
        
        # Calcular asientos ocupados (ocupados + reservados)
        asientos_ocupados = Asiento.objects.filter(
            viaje=viaje, 
            estado__in=['ocupado', 'reservado']
        ).count()
        
        # Calcular asientos disponibles
        asientos_disponibles = viaje.vehiculo.capacidad_pasajeros - asientos_ocupados
        
        # Actualizar solo si hay cambios
        if (viaje.asientos_ocupados != asientos_ocupados or 
            viaje.asientos_disponibles != asientos_disponibles):
            
            # Usar update() para evitar recursión en señales
            Viaje.objects.filter(id=viaje_id).update(
                asientos_ocupados=asientos_ocupados,
                asientos_disponibles=asientos_disponibles
            )
            
            print(f"✅ Contadores actualizados - Viaje {viaje_id}: {asientos_ocupados} ocupados, {asientos_disponibles} disponibles")
            
    except Viaje.DoesNotExist:
        print(f"❌ Viaje {viaje_id} no encontrado para actualizar contadores")
    except Exception as e:
        print(f"❌ Error actualizando contadores del viaje {viaje_id}: {e}")

# ✅ SEÑAL: Cuando se crea/actualiza/elimina un ItemReserva
@receiver([post_save, post_delete], sender=ItemReserva)
def actualizar_contadores_despues_reserva(sender, instance, **kwargs):
    """
    Actualiza los contadores del viaje cuando cambian las reservas
    """
    try:
        if instance and hasattr(instance, 'asiento') and instance.asiento:
            viaje = instance.asiento.viaje
            
            # Usar transaction.on_commit para asegurar que se ejecute después de la transacción
            transaction.on_commit(lambda: actualizar_contadores_viaje(viaje.id))
    except Exception as e:
        print(f"❌ Error en señal de ItemReserva: {e}")

# ✅ SEÑAL: Cuando cambia el estado de un asiento
@receiver(pre_save, sender=Asiento)
def actualizar_contadores_despues_asiento(sender, instance, **kwargs):
    """
    Actualiza contadores cuando cambia el estado de un asiento
    """
    try:
        # Solo si el estado está cambiando
        if instance.pk and instance.viaje:
            old_instance = Asiento.objects.get(pk=instance.pk)
            if old_instance.estado != instance.estado:
                transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Asiento.DoesNotExist:
        # Es una nueva instancia
        if instance.viaje:
            transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Exception as e:
        print(f"❌ Error en señal de Asiento: {e}")

# ✅ SEÑAL: Cuando se crea un nuevo asiento
@receiver(post_save, sender=Asiento)
def actualizar_contadores_nuevo_asiento(sender, instance, created, **kwargs):
    """
    Actualiza contadores cuando se crea un nuevo asiento
    """
    try:
        if created and instance.viaje:
            transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Exception as e:
        print(f"❌ Error en señal de nuevo asiento: {e}")

# ✅ SEÑAL: Cuando se elimina un asiento
@receiver(post_delete, sender=Asiento)
def actualizar_contadores_eliminar_asiento(sender, instance, **kwargs):
    """
    Actualiza contadores cuando se elimina un asiento
    """
    try:
        if instance and instance.viaje:
            transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
    except Exception as e:
        print(f"❌ Error en señal de eliminar asiento: {e}")

# ✅ SEÑAL: Cuando se confirma el pago de una reserva
@receiver(pre_save, sender=Reserva)
def actualizar_contadores_confirmar_pago(sender, instance, **kwargs):
    """
    Actualiza contadores cuando se confirma el pago de una reserva
    """
    try:
        if instance.pk and instance.viaje:
            old_instance = Reserva.objects.get(pk=instance.pk)
            
            # Si cambió de pendiente_pago a pagada/confirmada
            if (old_instance.estado == 'pendiente_pago' and 
                instance.estado in ['pagada', 'confirmada']):
                
                print(f"🔄 Confirmando pago - actualizando contadores para viaje {instance.viaje.id}")
                transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
                
    except Reserva.DoesNotExist:
        pass
    except Exception as e:
        print(f"❌ Error en señal de confirmar pago: {e}")

# ✅ SEÑAL: Cuando se cancela una reserva
@receiver(pre_save, sender=Reserva)
def actualizar_contadores_cancelar_reserva(sender, instance, **kwargs):
    """
    Actualiza contadores cuando se cancela una reserva
    """
    try:
        if instance.pk and instance.viaje:
            old_instance = Reserva.objects.get(pk=instance.pk)
            
            # Si cambió a cancelada o expirada
            if (old_instance.estado != 'cancelada' and 
                instance.estado in ['cancelada', 'expirada']):
                
                print(f"🔄 Cancelando reserva - actualizando contadores para viaje {instance.viaje.id}")
                transaction.on_commit(lambda: actualizar_contadores_viaje(instance.viaje.id))
                
    except Reserva.DoesNotExist:
        pass
    except Exception as e:
        print(f"❌ Error en señal de cancelar reserva: {e}")

# ==========================
# SEÑALES EXISTENTES (MANTENIDAS PARA COMPATIBILIDAD)
# ==========================
@receiver(post_save, sender=Viaje)
def generar_asientos_para_viaje(sender, instance, created, **kwargs):
    if created and instance.vehiculo:
        for i in range(1, instance.vehiculo.capacidad_pasajeros + 1):
            Asiento.objects.create(viaje=instance, numero=str(i))

# ✅ SEÑAL ACTUALIZADA: Maneja tanto reservas temporales como permanentes
@receiver(post_save, sender=ItemReserva)
def actualizar_asiento_y_contadores(sender, instance, created, **kwargs):
    """
    Actualiza el estado del asiento Y los contadores del viaje
    """
    if created and instance.asiento and instance.asiento.viaje:
        # Determinar estado del asiento según estado de la reserva
        if instance.reserva.estado == 'pendiente_pago':
            # Reserva temporal - marcar como reservado
            instance.asiento.estado = 'reservado'
            instance.asiento.reserva_temporal = instance.reserva
        elif instance.reserva.estado == 'pagada':
            # Reserva pagada - marcar como ocupado
            instance.asiento.estado = 'ocupado'
        
        instance.asiento.save()
        # ✅ ACTUALIZADO: Usar la nueva función de contadores
        transaction.on_commit(lambda: actualizar_contadores_viaje(instance.asiento.viaje.id))

@receiver(post_delete, sender=ItemReserva)
def liberar_asiento_y_actualizar(sender, instance, **kwargs):
    """
    Libera el asiento Y actualiza contadores
    """
    if instance.asiento and instance.asiento.viaje:
        instance.asiento.estado = 'libre'
        instance.asiento.reserva_temporal = None
        instance.asiento.save()
        # ✅ ACTUALIZADO: Usar la nueva función de contadores
        transaction.on_commit(lambda: actualizar_contadores_viaje(instance.asiento.viaje.id))

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
# FUNCIONES DE UTILIDAD MEJORADAS
# ==========================
def forzar_actualizacion_contadores_viaje(viaje_id):
    """
    Función para forzar la actualización de contadores de un viaje
    Útil para corregir inconsistencias
    """
    try:
        print(f"🔄 Forzando actualización de contadores para viaje {viaje_id}")
        actualizar_contadores_viaje(viaje_id)
        return True
    except Exception as e:
        print(f"❌ Error forzando actualización: {e}")
        return False

def reparar_todos_contadores():
    """
    Función para reparar todos los contadores del sistema
    """
    try:
        viajes = Viaje.objects.all()
        total_reparados = 0
        
        for viaje in viajes:
            if forzar_actualizacion_contadores_viaje(viaje.id):
                total_reparados += 1
        
        print(f"✅ Reparados {total_reparados}/{viajes.count()} viajes")
        return total_reparados
    except Exception as e:
        print(f"❌ Error reparando contadores: {e}")
        return 0

def limpiar_reservas_expiradas():
    """
    Limpia todas las reservas expiradas y libera sus asientos
    """
    from django.db import transaction
    from django.utils import timezone
    
    with transaction.atomic():
        reservas_expiradas = Reserva.objects.filter(
            estado='pendiente_pago',
            fecha_expiracion__lt=timezone.now()
        )
        
        for reserva in reservas_expiradas:
            print(f"🔄 Liberando reserva expirada: {reserva.codigo_reserva}")
            reserva.estado = 'expirada'
            reserva.save()
            reserva.liberar_asientos()
        
        return reservas_expiradas.count()

def obtener_reservas_por_expiracion(minutos=5):
    """
    Obtiene reservas que expirarán en los próximos X minutos
    Útil para notificaciones
    """
    from django.utils import timezone
    from django.db.models import Q
    
    limite = timezone.now() + timedelta(minutes=minutos)
    return Reserva.objects.filter(
        Q(estado='pendiente_pago') &
        Q(fecha_expiracion__lte=limite) &
        Q(fecha_expiracion__gt=timezone.now())
    )

# ==========================
# DEBUG PARA VERIFICAR SEÑALES
# ==========================
print("🎯 MODELS.PY CARGADO - Sistema de contadores mejorado implementado")

# Verificar señales registradas
print(f"Señales post_save para ItemReserva: {len(post_save._live_receivers(ItemReserva))}")
print(f"Señales post_delete para ItemReserva: {len(post_delete._live_receivers(ItemReserva))}")
print(f"Señales pre_save para Asiento: {len(pre_save._live_receivers(Asiento))}")
print(f"Señales post_save para Asiento: {len(post_save._live_receivers(Asiento))}")
print(f"Señales post_delete para Asiento: {len(post_delete._live_receivers(Asiento))}")
print(f"Señales pre_save para Reserva: {len(pre_save._live_receivers(Reserva))}")