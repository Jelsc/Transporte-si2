from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .ml_services import (
    eta_service,
    vrp_service,
    traffic_service,
    Location,
    Vehicle,
    Request,
)
from datetime import datetime
import json


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_eta(request):
    """Calcular tiempo estimado de llegada"""
    try:
        data = request.data

        # Validar datos de entrada
        vehicle_location = Location(
            latitude=float(data["vehicle_location"]["latitude"]),
            longitude=float(data["vehicle_location"]["longitude"]),
            address=data["vehicle_location"].get("address"),
        )

        destination = Location(
            latitude=float(data["destination"]["latitude"]),
            longitude=float(data["destination"]["longitude"]),
            address=data["destination"].get("address"),
        )

        traffic_factor = float(data.get("traffic_factor", 1.0))

        # Calcular ETA
        eta_result = eta_service.calculate_eta(
            vehicle_location, destination, traffic_factor
        )

        return Response({"success": True, "data": eta_result})

    except Exception as e:
        return Response(
            {"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def optimize_routes(request):
    """Optimizar rutas de vehículos"""
    try:
        data = request.data

        # Convertir vehículos
        vehicles = []
        for v_data in data["vehicles"]:
            vehicle = Vehicle(
                id=v_data["id"],
                current_location=Location(
                    latitude=float(v_data["current_location"]["latitude"]),
                    longitude=float(v_data["current_location"]["longitude"]),
                ),
                capacity=int(v_data["capacity"]),
                current_load=int(v_data.get("current_load", 0)),
                status=v_data.get("status", "available"),
            )
            vehicles.append(vehicle)

        # Convertir solicitudes
        requests = []
        for r_data in data["requests"]:
            request_obj = Request(
                id=r_data["id"],
                pickup_location=Location(
                    latitude=float(r_data["pickup_location"]["latitude"]),
                    longitude=float(r_data["pickup_location"]["longitude"]),
                ),
                dropoff_location=Location(
                    latitude=float(r_data["dropoff_location"]["latitude"]),
                    longitude=float(r_data["dropoff_location"]["longitude"]),
                ),
                passenger_count=int(r_data["passenger_count"]),
                priority=int(r_data.get("priority", 1)),
            )
            requests.append(request_obj)

        # Optimizar rutas
        optimization_result = vrp_service.optimize_routes(vehicles, requests)

        return Response({"success": True, "data": optimization_result})

    except Exception as e:
        return Response(
            {"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_traffic_info(request):
    """Obtener información de tráfico"""
    try:
        data = request.data

        origin = Location(
            latitude=float(data["origin"]["latitude"]),
            longitude=float(data["origin"]["longitude"]),
        )

        destination = Location(
            latitude=float(data["destination"]["latitude"]),
            longitude=float(data["destination"]["longitude"]),
        )

        traffic_factor = traffic_service.get_traffic_factor(origin, destination)

        return Response(
            {
                "success": True,
                "data": {
                    "traffic_factor": traffic_factor,
                    "traffic_level": "high"
                    if traffic_factor > 1.5
                    else "normal"
                    if traffic_factor > 1.0
                    else "low",
                    "origin": origin.__dict__,
                    "destination": destination.__dict__,
                },
            }
        )

    except Exception as e:
        return Response(
            {"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ml_services_status(request):
    """Estado de los servicios de ML"""
    return Response(
        {
            "success": True,
            "data": {
                "eta_service": "active",
                "vrp_service": "active",
                "traffic_service": "active",
                "version": "1.0.0",
                "last_updated": datetime.now().isoformat(),
            },
        }
    )
