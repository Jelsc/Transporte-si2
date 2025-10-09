# 📱 Sistema de Notificaciones - Transporte SI2

Sistema unificado de notificaciones push para mobile y web.

## 🚀 Uso Simple

```python
from notificaciones.core import NotificationManager, BusinessNotifications

# Notificación básica
NotificationManager.send(
    user_id=1,
    title="Pago realizado",
    message="Tu pago de $150 ha sido procesado",
    type_code="payment_success"
)

# Notificaciones de negocio predefinidas
BusinessNotifications.payment_success(
    user_id=1,
    amount=150.0,
    concept="Viaje La Paz - Santa Cruz"
)

BusinessNotifications.trip_confirmed(
    user_id=1,
    origin="La Paz",
    destination="Santa Cruz",
    date="2025-10-15",
    price=150.0
)
```

## 🔧 Configuración

1. Firebase configurado automáticamente
2. Migraciones: `python manage.py migrate notificaciones`
3. ¡Listo para usar!
