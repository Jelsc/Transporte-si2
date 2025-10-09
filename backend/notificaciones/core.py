"""
Sistema de Notificaciones Unificado - Transporte SI2
=====================================================

Servicio centralizado para envío de notificaciones push siguiendo principios SOLID.
Diseñado para ser simple, escalable y fácil de usar desde cualquier módulo.

Uso básico:
-----------
from notificaciones.core import NotificationManager

# Notificación simple
NotificationManager.send(
    user_id=1,
    title="Pago realizado",
    message="Tu pago de $150 ha sido procesado",
    type_code="payment_success"
)

# Notificación con datos extra
NotificationManager.send(
    user_id=1,
    title="Viaje confirmado",
    message="Tu viaje a Santa Cruz está confirmado",
    type_code="trip_confirmed",
    data={"trip_id": 123, "departure": "2025-10-15"}
)
"""

import logging
from typing import Dict, Any, Optional, List
from django.utils import timezone

logger = logging.getLogger(__name__)


class NotificationManager:
    """
    Gestor centralizado de notificaciones.
    Proporciona una interfaz simple y consistente para enviar notificaciones.
    """

    @staticmethod
    def send(
        user_id: int,
        title: str,
        message: str,
        type_code: str = "info",
        data: Optional[Dict[str, Any]] = None,
        priority: str = "normal",
    ) -> bool:
        """
        Envía una notificación a un usuario específico.

        Args:
            user_id: ID del usuario destinatario
            title: Título de la notificación
            message: Mensaje de la notificación
            type_code: Tipo de notificación (info, payment_success, trip_confirmed, etc.)
            data: Datos adicionales (opcional)
            priority: Prioridad (normal, alta, baja, critica)

        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        try:
            from .services import NotificationService

            result = NotificationService.enviar_notificacion(
                usuario_id=user_id,
                titulo=title,
                mensaje=message,
                tipo_codigo=type_code,
                data_extra=data or {},
                prioridad=priority,
            )
            return len(result) > 0
        except Exception as e:
            logger.error(f"Error enviando notificación a usuario {user_id}: {e}")
            return False

    @staticmethod
    def send_multiple(
        user_ids: List[int],
        title: str,
        message: str,
        type_code: str = "info",
        data: Optional[Dict[str, Any]] = None,
        priority: str = "normal",
    ) -> int:
        """
        Envía una notificación a múltiples usuarios.

        Returns:
            int: Número de usuarios notificados exitosamente
        """
        try:
            from .services import NotificationService

            count = NotificationService.enviar_notificacion_masiva(
                usuarios_ids=user_ids,
                titulo=title,
                mensaje=message,
                tipo_codigo=type_code,
                data_extra=data or {},
                prioridad=priority,
            )
            return count
        except Exception as e:
            logger.error(f"Error enviando notificación masiva: {e}")
            return 0


class BusinessNotifications:
    """
    Notificaciones específicas de negocio.
    Proporciona métodos predefinidos para casos de uso comunes.
    """

    @staticmethod
    def payment_success(
        user_id: int, amount: float, concept: str, method: str = "Tarjeta"
    ):
        """Notificación de pago exitoso"""
        return NotificationManager.send(
            user_id=user_id,
            title="💳 ¡Pago realizado exitosamente!",
            message=f"Tu pago de ${amount} por {concept} ha sido procesado correctamente",
            type_code="payment_success",
            data={
                "amount": str(amount),
                "concept": concept,
                "payment_method": method,
                "timestamp": timezone.now().isoformat(),
            },
            priority="alta",
        )

    @staticmethod
    def package_delivered(
        user_id: int, recipient: str, address: str, company: str = "Transporte SI2"
    ):
        """Notificación de paquete entregado"""
        return NotificationManager.send(
            user_id=user_id,
            title="📦 ¡Paquete entregado!",
            message=f"Tu paquete para {recipient} en {address} ha sido entregado por {company}",
            type_code="package_delivered",
            data={
                "recipient": recipient,
                "address": address,
                "company": company,
                "timestamp": timezone.now().isoformat(),
            },
            priority="alta",
        )

    @staticmethod
    def trip_confirmed(
        user_id: int, origin: str, destination: str, date: str, price: float
    ):
        """Notificación de viaje confirmado"""
        return NotificationManager.send(
            user_id=user_id,
            title="🚌 ¡Viaje confirmado!",
            message=f"Tu viaje de {origin} a {destination} el {date} está confirmado",
            type_code="trip_confirmed",
            data={
                "origin": origin,
                "destination": destination,
                "date": date,
                "price": str(price),
                "timestamp": timezone.now().isoformat(),
            },
            priority="alta",
        )

    @staticmethod
    def trip_status_update(user_id: int, trip_id: int, status: str, details: str = ""):
        """Actualización de estado de viaje"""
        status_messages = {
            "boarding": "🚌 Subida al bus",
            "departed": "🏃 En camino",
            "arrived": "📍 Llegada",
            "delayed": "⏰ Retraso",
            "cancelled": "❌ Cancelado",
        }

        title = status_messages.get(status, f"Actualización de viaje")
        message = (
            f"Tu viaje ha cambiado de estado: {details}"
            if details
            else f"Estado: {status}"
        )

        return NotificationManager.send(
            user_id=user_id,
            title=title,
            message=message,
            type_code="trip_update",
            data={
                "trip_id": trip_id,
                "status": status,
                "details": details,
                "timestamp": timezone.now().isoformat(),
            },
            priority="normal",
        )

    @staticmethod
    def promotion_available(
        user_id: int, title: str, description: str, discount: float = 0
    ):
        """Notificación de promoción disponible"""
        message = f"¡{title}! {description}"
        if discount > 0:
            message += f" - {discount}% de descuento"

        return NotificationManager.send(
            user_id=user_id,
            title="🎁 ¡Oferta especial!",
            message=message,
            type_code="promotion",
            data={
                "promotion_title": title,
                "description": description,
                "discount": discount,
                "timestamp": timezone.now().isoformat(),
            },
            priority="baja",
        )


# Alias para compatibilidad y simplicidad
NotificationTrigger = BusinessNotifications
