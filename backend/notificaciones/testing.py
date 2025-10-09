"""
Sistema de Testing para Notificaciones
======================================

Endpoints simples para probar el sistema de notificaciones durante desarrollo.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from .core import NotificationManager, BusinessNotifications
import json

User = get_user_model()


@csrf_exempt
@require_http_methods(["POST"])
def test_payment_notification(request):
    """Endpoint para probar notificación de pago"""
    try:
        data = json.loads(request.body) if request.body else {}

        user_id = data.get("user_id", 6)  # Usuario Juan por defecto

        success = BusinessNotifications.payment_success(
            user_id=user_id,
            amount=data.get("amount", 150.0),
            concept=data.get("concept", "Viaje de prueba"),
            method=data.get("method", "Tarjeta Visa"),
        )

        return JsonResponse(
            {
                "success": success,
                "message": "Notificación de pago enviada",
                "user_id": user_id,
            }
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def test_trip_notification(request):
    """Endpoint para probar notificación de viaje"""
    try:
        data = json.loads(request.body) if request.body else {}

        user_id = data.get("user_id", 6)  # Usuario Juan por defecto

        success = BusinessNotifications.trip_confirmed(
            user_id=user_id,
            origin=data.get("origin", "La Paz"),
            destination=data.get("destination", "Santa Cruz"),
            date=data.get("date", "2025-10-15"),
            price=data.get("price", 150.0),
        )

        return JsonResponse(
            {
                "success": success,
                "message": "Notificación de viaje enviada",
                "user_id": user_id,
            }
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def test_custom_notification(request):
    """Endpoint para probar notificación personalizada"""
    try:
        data = json.loads(request.body) if request.body else {}

        success = NotificationManager.send(
            user_id=data.get("user_id", 6),
            title=data.get("title", "Notificación de prueba"),
            message=data.get("message", "Esta es una notificación de prueba"),
            type_code=data.get("type_code", "test"),
            data=data.get("data", {}),
        )

        return JsonResponse(
            {"success": success, "message": "Notificación personalizada enviada"}
        )

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
