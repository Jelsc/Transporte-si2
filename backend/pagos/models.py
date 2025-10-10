from django.db import models
from django.conf import settings
from django.utils import timezone


class Pago(models.Model):
    """Modelo para gestionar pagos del sistema"""
    
    ESTADOS_PAGO = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
        ('fallido', 'Fallido'),
    ]
    
    METODOS_PAGO = [
        ('stripe', 'Stripe'),
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
    ]
    
    # Relaciones
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pagos',
        verbose_name='Usuario'
    )
    
    # Información del pago
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Monto'
    )
    
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODOS_PAGO,
        default='stripe',
        verbose_name='Método de Pago'
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_PAGO,
        default='pendiente',
        verbose_name='Estado'
    )
    
    # Detalles
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    
    # IDs de Stripe
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Stripe Payment Intent ID'
    )
    
    stripe_charge_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Stripe Charge ID'
    )
    
    # Fechas
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Completado'
    )
    
    fecha_cancelado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cancelado'
    )
    
    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Pago #{self.id} - {self.usuario.username} - ${self.monto}"
    
    def marcar_completado(self):
        """Marca el pago como completado"""
        self.estado = 'completado'
        self.fecha_completado = timezone.now()
        self.save()
    
    def marcar_cancelado(self):
        """Marca el pago como cancelado"""
        self.estado = 'cancelado'
        self.fecha_cancelado = timezone.now()
        self.save()