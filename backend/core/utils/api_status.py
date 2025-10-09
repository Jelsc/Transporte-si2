from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["GET"])
def api_status(request):
    """
    Endpoint de estado de la API para verificar conectividad.
    """
    return JsonResponse({
        "status": "ok",
        "message": "Transporte API is running",
        "version": "1.0.0",
        "available_endpoints": {
            "auth": "/api/auth/",
            "users": "/api/users/", 
            "conductores": "/api/conductores/",
            "personal": "/api/personal/",
            "vehiculos": "/api/vehiculos/",
            "viajes": "/api/viajes/",
            "notificaciones": "/api/notificaciones/",
            "test": "/api/test/"
        }
    })