from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from viajes.models import Viaje
from .services import NotificationFactory
from .models import PreferenciaNotificacion

User = get_user_model()


@receiver(post_save, sender=User)
def crear_preferencias_notificacion(sender, instance, created, **kwargs):
    """Crear preferencias de notificación para nuevos usuarios"""
    if created:
        PreferenciaNotificacion.objects.create(usuario=instance)


@receiver(post_save, sender=Viaje)
def notificar_nuevo_viaje(sender, instance, created, **kwargs):
    """Notificar cuando se crea un nuevo viaje"""
    if created:
        # Obtener usuarios que podrían estar interesados (clientes activos)
        usuarios_objetivo = User.objects.filter(
            is_active=True,
            rol__es_administrativo=False  # Solo clientes
        )
        
        # Enviar notificación usando el factory
        NotificationFactory.nuevo_viaje(instance, usuarios_objetivo)


@receiver(post_save, sender=Viaje)
def notificar_cambio_estado_viaje(sender, instance, created, **kwargs):
    """Notificar cambios de estado en viajes existentes"""
    if not created and instance.estado == 'cancelado':
        # Si el viaje fue cancelado, notificar a usuarios que lo tenían reservado
        # Esto requeriría un modelo de Reserva que no veo en el código actual
        # Por ahora, notificamos a todos los clientes
        usuarios_objetivo = User.objects.filter(
            is_active=True,
            rol__es_administrativo=False
        )
        
        for usuario in usuarios_objetivo:
            NotificationFactory.viaje_cancelado(instance, usuario)


# Ejemplo de signal personalizado para otros eventos
@receiver(post_save, sender=User)
def notificar_nuevo_usuario_admin(sender, instance, created, **kwargs):
    """Notificar a administradores cuando se registra un nuevo usuario"""
    if created and not instance.is_superuser:
        # Obtener administradores
        administradores = User.objects.filter(
            is_active=True,
            rol__es_administrativo=True
        )
        
        from .services import NotificationService
        
        for admin in administradores:
            NotificationService.enviar_notificacion(
                usuario_id=admin.id,
                titulo="Nuevo usuario registrado",
                mensaje=f"El usuario {instance.username} se ha registrado en el sistema",
                tipo_codigo="nuevo_usuario",
                data_extra={
                    "usuario_id": instance.id,
                    "username": instance.username,
                    "email": instance.email or ""
                },
                prioridad="baja"
            )