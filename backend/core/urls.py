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
from rest_framework.routers import DefaultRouter

# Importaciones de testing movidas a notificaciones.urls
from core.utils.api_status import api_status

# Import viewsets para asientos y reservas
from viajes.views import AsientoViewSet, ReservaViewSet
from viajes.views_cliente import MisReservasViewSet

# Router para asientos y reservas
router = DefaultRouter()
router.register(r'asientos', AsientoViewSet, basename='asientos')
router.register(r'reservas', ReservaViewSet, basename='reservas')
router.register(r'mis-reservas', MisReservasViewSet, basename='mis-reservas')

# Endpoints principales del sistema
urlpatterns = [
    # Panel de administración de Django
    path("admin/", admin.site.urls),
    # ENDPOINTS DE API (todos bajo /api/)
    # Status de la API
    path("api/status/", api_status, name="api_status"),
    # Sistema de usuarios unificado
    path("api/", include("users.urls")),
    # Conductores: gestión de conductores
    path("api/conductores/", include("conductores.urls")),
    # Personal: gestión de personal de empresa
    path("api/personal/", include("personal.urls")),
    
    path("api/bitacora/", include("bitacora.urls")),
  
    path("api/vehiculos/", include("vehiculos.urls")),
  
    path("api/viajes/", include("viajes.urls")),
    
    # Asientos y Reservas (desde viajes)
    path("api/", include(router.urls)),
  
    path("api/notificaciones/", include("notificaciones.urls")),
    
    # Encomiendas: gestión de paquetes y envíos
    path("api/encomiendas/", include("encomiendas.urls")),
    
    # Ubicaciones: catálogo único para viajes y encomiendas
    path("api/ubicaciones/", include("ubicaciones.urls")),
    
    # Rutas Optimizadas: VRP/PDPTW para encomiendas y entregas
    path("api/rutas-optimizadas/", include("rutas_optimizadas.urls")),
    
    # Backups: gestión de backups de base de datos
    path("api/backups/", include("backups.urls")),
    
    # Auth social: endpoints para login social (navegador)
    path("accounts/", include("allauth.urls")),

    path("api/pagos/", include("pagos.urls")),  # AGREGAR AQUÍ
]
