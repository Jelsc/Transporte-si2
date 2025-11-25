from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class Encomienda(models.Model):
    ESTADO_CHOICES = [
        ("pendiente", "Pendiente"),
        ("en_ruta", "En Ruta"),
        ("entregado", "Entregado"),
        ("cancelado", "Cancelado"),
    ]

    METODO_PAGO_CHOICES = [
        ("efectivo", "Efectivo"),
        ("tarjeta", "Tarjeta"),
    ]

    ESTADO_PAGO_CHOICES = [
        ("pendiente", "Pendiente"),
        ("procesando", "Procesando"),
        ("completado", "Completado"),
        ("fallido", "Fallido"),
    ]

    remitente_nombre = models.CharField(max_length=100)
    remitente_telefono = models.CharField(max_length=20)
    remitente_direccion = models.TextField(blank=True, null=True)

    destinatario_nombre = models.CharField(max_length=100)
    destinatario_telefono = models.CharField(max_length=20)

    destino_ciudad = models.CharField(max_length=50)
    destino_direccion = models.TextField()

    codigo_seguimiento = models.CharField(max_length=20, unique=True, editable=False)
    descripcion = models.TextField()
    peso = models.DecimalField(
        max_digits=8, decimal_places=2, validators=[MinValueValidator(0.1)]
    )
    precio = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    notas = models.TextField(blank=True, null=True)

    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default="pendiente"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_entrega_estimada = models.DateTimeField(blank=True, null=True)
    fecha_entrega_real = models.DateTimeField(blank=True, null=True)

    conductor_asignado = models.ForeignKey(
        "conductores.Conductor",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="encomiendas",
    )

    viaje = models.ForeignKey(
        "viajes.Viaje",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="encomiendas",
        help_text="Viaje asignado a esta encomienda (debe tener el mismo destino)",
    )

    metodo_pago = models.CharField(
        max_length=20, choices=METODO_PAGO_CHOICES, default="efectivo"
    )
    estado_pago = models.CharField(
        max_length=20, choices=ESTADO_PAGO_CHOICES, default="pendiente"
    )
    pago_info = models.JSONField(blank=True, null=True)

    pago = models.ForeignKey(
        "pagos.Pago",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="encomiendas",
    )

    # ✅ CORREGIDO: Usando AUTH_USER_MODEL
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="encomiendas_creadas",
    )

    class Meta:
        verbose_name = "Encomienda"
        verbose_name_plural = "Encomiendas"
        ordering = ["-fecha_creacion"]

    def save(self, *args, **kwargs):
        if not self.codigo_seguimiento:
            self.codigo_seguimiento = self.generar_codigo_seguimiento()
        super().save(*args, **kwargs)

    def generar_codigo_seguimiento(self):
        return f"EN{str(uuid.uuid4())[:8].upper()}"

    def __str__(self):
        return f"{self.codigo_seguimiento} - {self.destinatario_nombre}"


class Seguimiento(models.Model):
    encomienda = models.ForeignKey(
        Encomienda, on_delete=models.CASCADE, related_name="seguimientos"
    )
    evento = models.CharField(max_length=100)
    descripcion = models.TextField()
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Seguimiento"
        verbose_name_plural = "Seguimientos"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.encomienda.codigo_seguimiento} - {self.evento}"
