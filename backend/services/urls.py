from django.urls import path
from . import views

# Endpoints para servicios de Machine Learning e IA
# Todos estos endpoints están bajo /api/ml/ en la URL completa
urlpatterns = [
    # Cálculo de tiempo estimado de llegada (ETA)
    # POST: vehicle_location, destination, traffic_factor
    path("eta/", views.calculate_eta, name="calculate_eta"),
    
    # Optimización de rutas de vehículos (VRP)
    # POST: vehicles, requests, constraints
    path("vrp/", views.optimize_routes, name="optimize_routes"),
    
    # Información de tráfico en tiempo real
    # GET: location, radius
    path("traffic/", views.get_traffic_info, name="get_traffic_info"),
    
    # Estado de los servicios de ML
    # GET: comprueba disponibilidad y rendimiento
    path("status/", views.ml_services_status, name="ml_services_status"),
]
