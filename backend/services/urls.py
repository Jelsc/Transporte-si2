from django.urls import path
from . import views

urlpatterns = [
    path("eta/", views.calculate_eta, name="calculate_eta"),
    path("vrp/", views.optimize_routes, name="optimize_routes"),
    path("traffic/", views.get_traffic_info, name="get_traffic_info"),
    path("status/", views.ml_services_status, name="ml_services_status"),
]
