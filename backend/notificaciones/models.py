from django.db import models
from django.utils import timezone
from django.conf import settings


class DispositivoFCM(models.Model):
    """Registra los tokens FCM de los dispositivos de los usuarios"""

    TIPOS_DISPOSITIVO = [
        ("android", "Android"),
        ("ios", "iOS"),
        ("web", "Web"),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dispositivos_fcm",
    )
    token_fcm = models.TextField(unique=True)  # Token FCM único
    tipo_dispositivo = models.CharField(max_length=20, choices=TIPOS_DISPOSITIVO)
    nombre_dispositivo = models.CharField(
        max_length=100, blank=True, null=True
    )  # Ej: "iPhone de Juan"
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_ultimo_uso = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Dispositivo FCM"
        verbose_name_plural = "Dispositivos FCM"
        unique_together = ["usuario", "token_fcm"]

    def __str__(self):
        return f"{self.usuario.username} - {self.get_tipo_dispositivo_display()} - {self.nombre_dispositivo or 'Sin nombre'}"

    def marcar_como_usado(self):
        """Actualiza la fecha de último uso"""
        self.fecha_ultimo_uso = timezone.now()
        self.save(update_fields=["fecha_ultimo_uso"])


class TipoNotificacion(models.Model):
    """Define los tipos de notificaciones del sistema"""

    codigo = models.CharField(
        max_length=50, unique=True
    )  # Ej: 'nuevo_viaje', 'viaje_cancelado'
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    icono = models.CharField(
        max_length=10, default="🔔", help_text="Emoji o icono para la notificación"
    )
    color = models.CharField(
        max_length=7, default="#007bff", help_text="Color en formato hexadecimal"
    )
    activo = models.BooleanField(default=True)
    requiere_autenticacion = models.BooleanField(
        default=True
    )  # Si requiere que el usuario esté logueado
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tipo de Notificación"
        verbose_name_plural = "Tipos de Notificación"

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Notificacion(models.Model):
    """Almacena las notificaciones enviadas"""

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("enviada", "Enviada"),
        ("entregada", "Entregada"),
        ("fallida", "Fallida"),
        ("leida", "Leída"),
    ]

    PRIORIDADES = [
        ("baja", "Baja"),
        ("normal", "Normal"),
        ("alta", "Alta"),
        ("critica", "Crítica"),
    ]

    # Información básica
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    tipo = models.ForeignKey(TipoNotificacion, on_delete=models.CASCADE)
    prioridad = models.CharField(max_length=20, choices=PRIORIDADES, default="normal")

    # Destinatarios
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notificaciones",
        null=True,
        blank=True,
    )
    usuario_origen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificaciones_enviadas",
    )
    dispositivo = models.ForeignKey(
        DispositivoFCM, on_delete=models.CASCADE, null=True, blank=True
    )

    # Información del módulo
    modulo = models.CharField(
        max_length=50,
        default="GENERAL",
        help_text="Módulo del sistema que originó la notificación",
    )

    # Estado y seguimiento
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    fecha_lectura = models.DateTimeField(null=True, blank=True)

    # Datos adicionales
    data_extra = models.JSONField(
        default=dict, blank=True
    )  # Datos específicos de la notificación
    mensaje_error = models.TextField(blank=True, null=True)  # Si hubo error en el envío

    # Configuración de envío
    programada_para = models.DateTimeField(
        null=True, blank=True
    )  # Para notificaciones programadas
    expira_en = models.DateTimeField(
        null=True, blank=True
    )  # Cuándo expira la notificación

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"{self.titulo} - {self.usuario.username if self.usuario else 'Sin usuario'} - {self.estado}"

    def marcar_como_enviada(self):
        """Marca la notificación como enviada"""
        self.estado = "enviada"
        self.fecha_envio = timezone.now()
        self.save(update_fields=["estado", "fecha_envio"])

    def marcar_como_entregada(self):
        """Marca la notificación como entregada"""
        self.estado = "entregada"
        self.fecha_entrega = timezone.now()
        self.save(update_fields=["estado", "fecha_entrega"])

    def marcar_como_leida(self):
        """Marca la notificación como leída"""
        self.estado = "leida"
        self.fecha_lectura = timezone.now()
        self.save(update_fields=["estado", "fecha_lectura"])

    def marcar_como_fallida(self, mensaje_error=""):
        """Marca la notificación como fallida"""
        self.estado = "fallida"
        self.mensaje_error = mensaje_error
        self.save(update_fields=["estado", "mensaje_error"])

    @property
    def fue_leida(self):
        return self.estado == "leida"

    @property
    def fue_entregada(self):
        return self.estado in ["entregada", "leida"]


class PreferenciaNotificacion(models.Model):
    """Preferencias de notificación por usuario"""

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preferencias_notificacion",
    )

    # Tipos de notificaciones habilitadas
    nuevos_viajes = models.BooleanField(default=True)
    cambios_viaje = models.BooleanField(default=True)
    recordatorios = models.BooleanField(default=True)
    promociones = models.BooleanField(default=False)
    sistema = models.BooleanField(default=True)

    # Configuración de horarios
    no_molestar_desde = models.TimeField(null=True, blank=True)  # Ej: 22:00
    no_molestar_hasta = models.TimeField(null=True, blank=True)  # Ej: 08:00

    # Configuración por dispositivo
    push_mobile = models.BooleanField(default=True)
    push_web = models.BooleanField(default=True)
    email = models.BooleanField(default=False)

    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Preferencia de Notificación"
        verbose_name_plural = "Preferencias de Notificación"

    def __str__(self):
        return f"Preferencias de {self.usuario.username}"

    def acepta_tipo_notificacion(self, tipo_codigo):
        """Verifica si el usuario acepta un tipo específico de notificación"""
        tipo_map = {
            "nuevo_viaje": self.nuevos_viajes,
            "cambio_viaje": self.cambios_viaje,
            "recordatorio": self.recordatorios,
            "promocion": self.promociones,
            "sistema": self.sistema,
        }
        return tipo_map.get(tipo_codigo, True)

    def esta_en_horario_no_molestar(self):
        """Verifica si actualmente está en horario de no molestar"""
        if not self.no_molestar_desde or not self.no_molestar_hasta:
            return False

        ahora = timezone.now().time()

        # Si el horario no cruza medianoche
        if self.no_molestar_desde < self.no_molestar_hasta:
            return self.no_molestar_desde <= ahora <= self.no_molestar_hasta

        # Si cruza medianoche
        return ahora >= self.no_molestar_desde or ahora <= self.no_molestar_hasta
