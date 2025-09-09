from django.contrib.auth.models import AbstractUser
from django.db import models


class Rol(models.Model):
    """Roles del sistema: cliente, administrador, conductor, etc."""

    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    es_administrativo = models.BooleanField(default=False)
    permisos = models.JSONField(
        default=list, blank=True
    )  # Lista de permisos específicos

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre


class CustomUser(AbstractUser):
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True)
    es_activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_ultimo_acceso = models.DateTimeField(null=True, blank=True)

    # Campos específicos para clientes
    fecha_nacimiento = models.DateField(null=True, blank=True)

    # Campos específicos para administrativos
    codigo_empleado = models.CharField(max_length=20, blank=True, null=True)
    departamento = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.rol.nombre if self.rol else 'Sin rol'})"

    @property
    def es_administrativo(self):
        return self.rol and self.rol.es_administrativo

    @property
    def es_cliente(self):
        return self.rol and not self.rol.es_administrativo
