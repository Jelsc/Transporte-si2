from django.db import models
from django.conf import settings  # ✅ Importar settings
from django.contrib.auth import get_user_model  # ✅ Importar get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal


class Encomienda(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_ruta', 'En Ruta'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Información básica
    codigo_seguimiento = models.CharField(max_length=20, unique=True, editable=False)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    # Información del remitente
    remitente_nombre = models.CharField(max_length=200)
    remitente_telefono = models.CharField(max_length=20)
    remitente_direccion = models.TextField(blank=True, null=True)
    
    # Información del destinatario
    destinatario_nombre = models.CharField(max_length=200)
    destinatario_telefono = models.CharField(max_length=20)
    destino_ciudad = models.CharField(max_length=100)
    destino_direccion = models.TextField()
    
    # Detalles del paquete
    descripcion = models.TextField()
    peso = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Fechas
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_entrega_estimada = models.DateField(blank=True, null=True)
    fecha_entrega_real = models.DateTimeField(blank=True, null=True)
    
    # Asignaciones - ✅ Usar el modelo de usuario personalizado
    conductor_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # ✅ Cambiar a settings.AUTH_USER_MODEL
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='encomiendas_asignadas',
        limit_choices_to={'groups__name': 'Conductores'}
    )
    
    # Información adicional - ✅ Usar el modelo de usuario personalizado
    notas = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # ✅ Cambiar a settings.AUTH_USER_MODEL
        on_delete=models.CASCADE, 
        related_name='encomiendas_creadas'
    )
    
    class Meta:
        db_table = 'encomiendas'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['codigo_seguimiento']),
            models.Index(fields=['estado']),
            models.Index(fields=['destino_ciudad']),
            models.Index(fields=['fecha_creacion']),
        ]
    
    def __str__(self):
        return f"{self.codigo_seguimiento} - {self.destinatario_nombre}"
    
    def save(self, *args, **kwargs):
        if not self.codigo_seguimiento:
            # Generar código de seguimiento único
            import random
            import string
            from django.utils import timezone
            
            year = timezone.now().strftime('%Y')
            while True:
                random_part = ''.join(random.choices(string.digits, k=6))
                codigo = f"ENC{year}{random_part}"
                if not Encomienda.objects.filter(codigo_seguimiento=codigo).exists():
                    self.codigo_seguimiento = codigo
                    break
        
        # Calcular precio si no está establecido
        if not self.precio or self.precio == 0:
            self.precio = self.calcular_precio()
            
        super().save(*args, **kwargs)
    
    def calcular_precio(self):
        """Calcular precio basado en peso y destino"""
        precios_base = {
            'La Paz': Decimal('20.00'),
            'Santa Cruz': Decimal('25.00'),
            'Cochabamba': Decimal('22.00'),
            'Oruro': Decimal('18.00'),
            'Potosi': Decimal('20.00'),
            'Tarija': Decimal('23.00'),
            'Beni': Decimal('30.00'),
            'Pando': Decimal('35.00'),
        }
        
        base = precios_base.get(self.destino_ciudad, Decimal('25.00'))
        adicional_peso = max(Decimal('0.00'), (self.peso - Decimal('1.00')) * Decimal('5.00'))
        
        return base + adicional_peso
    
    @property
    def conductor_nombre(self):
        return self.conductor_asignado.get_full_name() if self.conductor_asignado else None


class EncomiendaSeguimiento(models.Model):
    encomienda = models.ForeignKey(Encomienda, on_delete=models.CASCADE, related_name='seguimientos')
    evento = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    ubicacion = models.CharField(max_length=200, blank=True, null=True)
    # ✅ Usar el modelo de usuario personalizado
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # ✅ Cambiar a settings.AUTH_USER_MODEL
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        db_table = 'encomienda_seguimiento'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.encomienda.codigo_seguimiento} - {self.evento}"


class TarifaEncomienda(models.Model):
    ciudad = models.CharField(max_length=100, unique=True)
    precio_base = models.DecimalField(max_digits=8, decimal_places=2)
    precio_kg_adicional = models.DecimalField(max_digits=8, decimal_places=2, default=5.00)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'tarifas_encomienda'
    
    def __str__(self):
        return f"{self.ciudad} - Bs. {self.precio_base}"