from django.http import JsonResponse
from django.urls import reverse
from django.utils.deprecation import MiddlewareMixin


class AdminPortalMiddleware(MiddlewareMixin):
    """
    Middleware para verificar acceso al panel administrativo.
    """
    
    # URLs que requieren acceso administrativo
    ADMIN_URLS = [
        '/api/admin/',
        '/admin/',
    ]
    
    # URLs que no requieren verificación
    EXCLUDED_URLS = [
        '/api/auth/',
        '/api/admin/admin/login/',
        '/api/admin/google/',
        '/accounts/',
    ]
    
    def process_request(self, request):
        """Procesa la petición para verificar acceso administrativo"""
        
        # Solo verificar URLs administrativas
        if not any(request.path.startswith(url) for url in self.ADMIN_URLS):
            return None
        
        # Excluir URLs que no requieren verificación
        if any(request.path.startswith(url) for url in self.EXCLUDED_URLS):
            return None
        
        # Verificar si el usuario está autenticado
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Usuario no autenticado',
                'detail': 'Se requiere autenticación para acceder a esta área'
            }, status=401)
        
        # Verificar si el usuario tiene acceso administrativo
        if not request.user.es_administrativo:
            return JsonResponse({
                'error': 'Acceso denegado',
                'detail': 'Se requiere rol administrativo para acceder a esta área'
            }, status=403)
        
        # Verificar si el usuario tiene acceso al panel administrativo
        if not request.user.is_admin_portal:
            return JsonResponse({
                'error': 'Acceso denegado',
                'detail': 'El usuario no tiene acceso al panel administrativo'
            }, status=403)
        
        return None
