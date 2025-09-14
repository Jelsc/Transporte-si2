"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include

# Endpoints principales del sistema
urlpatterns = [
    # Panel de administración de Django
    path("admin/", admin.site.urls),
    
    # ENDPOINTS DE API (todos bajo /api/)
    
    # Auth: login/logout/password/reset para clientes
    path("api/auth/", include("dj_rest_auth.urls")),
    
    # Auth: registro de clientes
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
    
    # Admin: gestión de usuarios, roles y permisos
    path("api/admin/", include("users.urls")),
    
    # ML: servicios de inteligencia artificial
    path("api/ml/", include("services.urls")),
    
    # Aquí puedes añadir nuevas apps cuando las crees, por ejemplo:
    # path("api/vehiculos/", include("vehiculos.urls")),
    # path("api/rutas/", include("rutas.urls")),
    # path("api/viajes/", include("viajes.urls")),
    
    # Auth social: endpoints para login social (navegador)
    path("accounts/", include("allauth.urls")),
    
    path('admin/', admin.site.urls),
    path('api/flotas/', include('flotas.urls')),
]
