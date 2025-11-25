from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.db.models import F, Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Viaje, Asiento, Reserva, ItemReserva
from ubicaciones.models import Ubicacion
from .serializers import (
    ViajeSerializer,
    AsientoSerializer,
    ReservaSerializer,
    ReservaSimpleSerializer,
    ItemReservaSerializer,
    CrearReservaTemporalSerializer,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from notificaciones.services import NotificationService
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class ViajeViewSet(viewsets.ModelViewSet):
    queryset = Viaje.objects.all().order_by("fecha", "hora")
    serializer_class = ViajeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = [
        "origen__nombre",
        "destino__nombre",
        "vehiculo__nombre",
        "vehiculo__placa",
    ]
    filterset_fields = {
        "origen": ["exact"],
        "destino": ["exact"],
        "fecha": ["gte", "lte"],
        "vehiculo": ["exact"],
        "estado": ["exact"],
    }

    # Sobrescribir permisos por defecto
    permission_classes = []  # Vacío para que get_permissions() tenga control total

    def get_permissions(self):
        """
        Permite lectura pública, pero creación/edición/eliminación solo para usuarios autenticados con staff
        """
        logger.info(
            f"🔐 get_permissions - Action: {self.action}, User: {self.request.user}, Authenticated: {self.request.user.is_authenticated}"
        )
        if self.action in [
            "list",
            "retrieve",
            "mis_viajes",
            "obtener_pasajeros",
            "mi_vehiculo",
            "viaje_en_curso",
            "actualizar_ubicacion",
        ]:
            return (
                [AllowAny()]
                if self.action in ["list", "retrieve"]
                else [IsAuthenticated()]
            )
        # Para crear, actualizar o eliminar, solo requiere autenticación
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Override para mejorar búsqueda flexible cuando se usa parámetro search
        """
        queryset = super().get_queryset()
        return queryset

    def filter_queryset(self, queryset):
        """
        Override para mejorar búsqueda flexible cuando se usa parámetro search
        """
        # Obtener parámetros
        search_param = self.request.query_params.get("search", "").strip()
        estado_param = self.request.query_params.get("estado", "")

        # Aplicar filtro de estado PRIMERO (más restrictivo)
        if estado_param:
            queryset = queryset.filter(estado=estado_param)

        # Si hay búsqueda, aplicar búsqueda flexible
        if search_param:
            # Buscar en destino__nombre (lo más importante para encomiendas)
            # Usar icontains para búsqueda flexible
            queryset = queryset.filter(
                Q(destino__nombre__icontains=search_param)
                | Q(origen__nombre__icontains=search_param)
            )
            logger.info(f"📋 Búsqueda '{search_param}': {queryset.count()} resultados")
        else:
            # Si no hay search, aplicar filtros estándar de DRF
            queryset = super().filter_queryset(queryset)

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Override del método list para agregar logging
        """
        logger.info(
            f"📋 LIST REQUEST - User: {request.user}, Headers: {request.headers.get('Authorization', 'No Auth Header')}"
        )
        logger.info(f"📋 Query params: {request.query_params.dict()}")

        # Usar filter_queryset que ahora tiene búsqueda flexible mejorada
        queryset = self.filter_queryset(self.get_queryset())

        logger.info(f"📋 Resultados encontrados: {queryset.count()}")

        # Continuar con la paginación normal usando super().list()
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """
        Override del método create para agregar logging
        """
        logger.info(
            f"📝 CREATE REQUEST - User: {request.user}, Is Staff: {request.user.is_staff if request.user.is_authenticated else 'Not authenticated'}"
        )
        logger.info(f"📦 Data recibida: {request.data}")
        logger.info(
            f"🔑 Authorization Header: {request.headers.get('Authorization', 'No Auth Header')}"
        )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """
        Valida que solo usuarios staff puedan crear viajes
        """
        logger.info(
            f"✅ perform_create - User: {self.request.user}, Is Staff: {self.request.user.is_staff}"
        )
        if not self.request.user.is_staff:
            logger.warning(f"❌ Usuario {self.request.user} no tiene permisos de staff")
            raise PermissionDenied(
                "Solo el personal administrativo puede crear viajes."
            )
        serializer.save()
        logger.info(f"✨ Viaje creado exitosamente")

    def perform_update(self, serializer):
        """
        Valida que solo usuarios staff puedan actualizar viajes
        """
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Solo el personal administrativo puede modificar viajes."
            )
        serializer.save()

    def perform_destroy(self, instance):
        """
        Valida que solo usuarios staff puedan eliminar viajes
        """
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Solo el personal administrativo puede eliminar viajes."
            )
        instance.delete()

    @action(detail=False, methods=["get"], url_path="mis-viajes")
    def mis_viajes(self, request):
        """
        Endpoint personalizado para obtener los viajes asignados al conductor actual.
        Filtra por el conductor asociado al usuario autenticado.
        """
        try:
            # Verificar que el usuario tenga un perfil de conductor
            if not hasattr(request.user, "conductor") or request.user.conductor is None:
                return Response(
                    {
                        "success": False,
                        "error": "El usuario no tiene un perfil de conductor asociado",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            conductor = request.user.conductor

            # Filtrar viajes por el vehículo del conductor
            queryset = (
                Viaje.objects.filter(vehiculo__conductor=conductor)
                .select_related("vehiculo", "origen", "destino")
                .order_by("-fecha", "-hora")
            )

            # Aplicar filtro de estado si se proporciona
            estado_filter = request.query_params.get("estado")
            if estado_filter and estado_filter != "todos":
                queryset = queryset.filter(estado=estado_filter)

            # Serializar los datos
            serializer = self.get_serializer(queryset, many=True)

            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                    "count": queryset.count(),
                    "conductor": {
                        "id": conductor.id,
                        "nombre_completo": conductor.nombre_completo,
                        "vehiculo": conductor.conductores.first().nombre
                        if conductor.conductores.exists()
                        else None,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"❌ Error en mis_viajes: {str(e)}")
            return Response(
                {"success": False, "error": f"Error al obtener viajes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="actualizar-estado")
    def actualizar_estado(self, request, pk=None):
        """
        Endpoint para que el conductor actualice el estado de un viaje.
        Solo puede actualizar viajes asignados a su vehículo.
        """
        try:
            viaje = self.get_object()

            # Verificar que el usuario tenga un perfil de conductor
            if not hasattr(request.user, "conductor") or request.user.conductor is None:
                return Response(
                    {
                        "success": False,
                        "error": "El usuario no tiene un perfil de conductor asociado",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            conductor = request.user.conductor

            # Verificar que el viaje esté asignado al vehículo del conductor
            if viaje.vehiculo.conductor != conductor:
                return Response(
                    {
                        "success": False,
                        "error": "No tienes permisos para modificar este viaje",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Obtener el nuevo estado
            nuevo_estado = request.data.get("estado")
            if not nuevo_estado:
                return Response(
                    {"success": False, "error": "Debe proporcionar un estado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validar que el estado sea válido
            estados_validos = dict(Viaje.ESTADOS).keys()
            if nuevo_estado not in estados_validos:
                return Response(
                    {
                        "success": False,
                        "error": f"Estado inválido. Estados válidos: {', '.join(estados_validos)}",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Actualizar el estado
            viaje.estado = nuevo_estado
            viaje.save()

            # Serializar el viaje actualizado
            serializer = self.get_serializer(viaje)

            logger.info(
                f"✅ Conductor {conductor.nombre_completo} actualizó viaje {viaje.id} a estado '{nuevo_estado}'"
            )

            return Response(
                {
                    "success": True,
                    "message": f"Estado actualizado a {nuevo_estado}",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"❌ Error en actualizar_estado: {str(e)}")
            return Response(
                {"success": False, "error": f"Error al actualizar estado: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"], url_path="pasajeros")
    def obtener_pasajeros(self, request, pk=None):
        """
        Endpoint para obtener la lista de pasajeros de un viaje específico.
        Solo accesible por el conductor asignado al viaje.
        """
        try:
            viaje = self.get_object()

            # Verificar que el usuario tenga un perfil de conductor
            if not hasattr(request.user, "conductor") or request.user.conductor is None:
                return Response(
                    {
                        "success": False,
                        "error": "El usuario no tiene un perfil de conductor asociado",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            conductor = request.user.conductor

            # Verificar que el viaje esté asignado al vehículo del conductor
            if viaje.vehiculo.conductor != conductor:
                return Response(
                    {
                        "success": False,
                        "error": "No tienes permisos para ver los pasajeros de este viaje",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Obtener todas las reservas confirmadas del viaje
            reservas = (
                Reserva.objects.filter(viaje=viaje, estado__in=["confirmada", "pagada"])
                .select_related("cliente")
                .prefetch_related("items__asiento")
            )

            pasajeros = []
            for reserva in reservas:
                # Obtener los asientos de cada reserva
                items = reserva.items.all()
                asientos = [item.asiento.numero for item in items]

                cliente = reserva.cliente
                pasajeros.append(
                    {
                        "id": reserva.id,
                        "nombre": cliente.first_name,
                        "apellido": cliente.last_name,
                        "email": cliente.email,
                        "telefono": cliente.telefono
                        if hasattr(cliente, "telefono")
                        else "N/A",
                        "ci": cliente.ci if hasattr(cliente, "ci") else "N/A",
                        "asientos": asientos,
                        "cantidad_asientos": len(asientos),
                        "estado_reserva": reserva.estado,
                        "fecha_reserva": reserva.fecha_reserva.isoformat(),
                        "codigo_reserva": reserva.codigo_reserva,
                    }
                )

            return Response(
                {
                    "success": True,
                    "data": {
                        "pasajeros": pasajeros,
                        "totales": {
                            "total_pasajeros": len(pasajeros),
                            "asientos_ocupados": viaje.asientos_ocupados,
                            "asientos_disponibles": viaje.asientos_libres,
                        },
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"❌ Error al obtener pasajeros: {str(e)}")
            return Response(
                {"success": False, "error": f"Error al obtener pasajeros: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="mi-vehiculo")
    def mi_vehiculo(self, request):
        """
        Endpoint para obtener información del vehículo asignado al conductor.
        """
        try:
            # Verificar que el usuario tenga un perfil de conductor
            if not hasattr(request.user, "conductor") or request.user.conductor is None:
                return Response(
                    {
                        "success": False,
                        "error": "El usuario no tiene un perfil de conductor asociado",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            conductor = request.user.conductor

            # Obtener el vehículo asignado
            from vehiculos.models import Vehiculo

            vehiculos = Vehiculo.objects.filter(conductor=conductor)

            if not vehiculos.exists():
                return Response(
                    {"success": False, "error": "No tienes un vehículo asignado"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            vehiculo = vehiculos.first()

            # Calcular estadísticas del vehículo
            viajes_hoy = Viaje.objects.filter(
                vehiculo=vehiculo, fecha=timezone.now().date()
            ).count()

            viajes_programados = Viaje.objects.filter(
                vehiculo=vehiculo, estado="programado"
            ).count()

            viajes_en_curso = Viaje.objects.filter(
                vehiculo=vehiculo, estado="en_curso"
            ).count()

            return Response(
                {
                    "success": True,
                    "data": {
                        "id": vehiculo.id,
                        "nombre": vehiculo.nombre,
                        "placa": vehiculo.placa,
                        "tipo": vehiculo.tipo_vehiculo,
                        "marca": vehiculo.marca or "N/A",
                        "modelo": vehiculo.modelo or "N/A",
                        "año": vehiculo.año_fabricacion,
                        "capacidad_pasajeros": vehiculo.capacidad_pasajeros,
                        "capacidad_carga": str(vehiculo.capacidad_carga),
                        "estado": vehiculo.estado,
                        "kilometraje": vehiculo.kilometraje,
                        "ultimo_mantenimiento": vehiculo.ultimo_mantenimiento.isoformat()
                        if vehiculo.ultimo_mantenimiento
                        else None,
                        "proximo_mantenimiento": vehiculo.proximo_mantenimiento.isoformat()
                        if vehiculo.proximo_mantenimiento
                        else None,
                        "estadisticas": {
                            "viajes_hoy": viajes_hoy,
                            "viajes_programados": viajes_programados,
                            "viajes_en_curso": viajes_en_curso,
                        },
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"❌ Error al obtener información del vehículo: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": f"Error al obtener información del vehículo: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="viaje-en-curso")
    def viaje_en_curso(self, request):
        """
        Obtiene el viaje actualmente en curso para el conductor.
        Retorna información completa del viaje, ruta y progreso.
        """
        try:
            # Verificar que el usuario tenga un perfil de conductor
            if not hasattr(request.user, "conductor") or request.user.conductor is None:
                return Response(
                    {
                        "success": False,
                        "error": "El usuario no tiene un perfil de conductor asociado",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            conductor = request.user.conductor

            # Buscar viaje en curso del conductor
            viaje = (
                Viaje.objects.filter(vehiculo__conductor=conductor, estado="en_curso")
                .select_related("vehiculo", "origen", "destino")
                .first()
            )

            if not viaje:
                return Response(
                    {"success": True, "data": None, "mensaje": "No hay viaje en curso"},
                    status=status.HTTP_200_OK,
                )

            # Obtener información de los pasajeros
            reservas = (
                Reserva.objects.filter(viaje=viaje, estado__in=["confirmada", "pagada"])
                .select_related("cliente")
                .prefetch_related("items__asiento")
            )

            pasajeros = []
            for reserva in reservas:
                asientos = [item.asiento.numero for item in reserva.items.all()]
                pasajeros.append(
                    {
                        "id": reserva.id,
                        "nombre": f"{reserva.cliente.first_name} {reserva.cliente.last_name}",
                        "asientos": asientos,
                        "cantidad_asientos": len(asientos),
                        "estado_reserva": reserva.estado,
                        "codigo_reserva": reserva.codigo_reserva,
                    }
                )

            # Construir respuesta con información completa del viaje
            data = {
                "viaje": {
                    "id": viaje.id,
                    "origen": {
                        "id": viaje.origen.id,
                        "nombre": viaje.origen.nombre,
                        "direccion": viaje.origen.direccion_texto,
                        "lat": float(viaje.origen.lat),
                        "lng": float(viaje.origen.lng),
                    },
                    "destino": {
                        "id": viaje.destino.id,
                        "nombre": viaje.destino.nombre,
                        "direccion": viaje.destino.direccion_texto,
                        "lat": float(viaje.destino.lat),
                        "lng": float(viaje.destino.lng),
                    },
                    "fecha": viaje.fecha,
                    "hora": viaje.hora,
                    "estado": viaje.estado,
                    "precio": float(viaje.precio),
                    "asientos_disponibles": viaje.asientos_disponibles,
                    "asientos_ocupados": viaje.asientos_ocupados,
                },
                "pasajeros": pasajeros,
                "totales": {
                    "total_pasajeros": len(pasajeros),
                    "asientos_ocupados": viaje.asientos_ocupados,
                    "asientos_disponibles": viaje.asientos_disponibles,
                },
            }

            return Response({"success": True, "data": data}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"❌ Error en viaje_en_curso: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": f"Error al obtener viaje en curso: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"], url_path="actualizar-ubicacion")
    def actualizar_ubicacion(self, request):
        """
        Actualiza la ubicación actual del conductor durante un viaje.
        Permite tracking en tiempo real para futura integración con mapas.

        Body params:
        - lat: Latitud actual
        - lng: Longitud actual
        - velocidad: Velocidad actual (opcional)
        - rumbo: Dirección/rumbo (opcional)
        """
        try:
            # Verificar que el usuario tenga un perfil de conductor
            if not hasattr(request.user, "conductor") or request.user.conductor is None:
                return Response(
                    {
                        "success": False,
                        "error": "El usuario no tiene un perfil de conductor asociado",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            conductor = request.user.conductor

            # Validar datos recibidos
            lat = request.data.get("lat")
            lng = request.data.get("lng")

            if lat is None or lng is None:
                return Response(
                    {
                        "success": False,
                        "error": "Se requieren los parámetros lat y lng",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validar rangos de coordenadas
            try:
                lat = float(lat)
                lng = float(lng)
                if not (-90 <= lat <= 90):
                    raise ValueError("Latitud fuera de rango")
                if not (-180 <= lng <= 180):
                    raise ValueError("Longitud fuera de rango")
            except (ValueError, TypeError) as e:
                return Response(
                    {"success": False, "error": f"Coordenadas inválidas: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Buscar viaje en curso
            viaje = Viaje.objects.filter(
                vehiculo__conductor=conductor, estado="en_curso"
            ).first()

            if not viaje:
                return Response(
                    {
                        "success": False,
                        "error": "No hay viaje en curso para actualizar ubicación",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Preparar datos de ubicación
            velocidad = request.data.get("velocidad")
            rumbo = request.data.get("rumbo")

            ubicacion_data = {
                "lat": lat,
                "lng": lng,
                "timestamp": timezone.now().isoformat(),
                "viaje_id": viaje.id,
                "conductor_id": conductor.id,
            }

            if velocidad is not None:
                ubicacion_data["velocidad"] = float(velocidad)
            if rumbo is not None:
                ubicacion_data["rumbo"] = float(rumbo)

            # TODO: Almacenar en Redis o base de datos para tracking en tiempo real
            # Por ahora, solo validamos y confirmamos recepción
            # cache.set(f'ubicacion_conductor_{conductor.id}', ubicacion_data, timeout=60)

            return Response(
                {
                    "success": True,
                    "mensaje": "Ubicación actualizada correctamente",
                    "data": ubicacion_data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"❌ Error en actualizar_ubicacion: {str(e)}")
            return Response(
                {"success": False, "error": f"Error al actualizar ubicación: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="calcular-eta")
    def calcular_eta(self, request):
        """
        Calcula ETA dinámico desde ubicación actual hasta destino usando OSRM

        GET /api/viajes/calcular-eta/?lat=-16.5&lng=-68.15&destino_id=5

        Parámetros:
            - lat: Latitud actual del conductor
            - lng: Longitud actual del conductor
            - destino_id: ID de la ubicación de destino

        Respuesta:
            {
                "success": true,
                "eta": {
                    "distancia_km": 12.5,
                    "tiempo_minutos": 18,
                    "tiempo_llegada_estimado": "2025-11-05T13:30:00",
                    "geometria_ruta": "encoded_polyline..."
                }
            }
        """
        try:
            # Validar parámetros
            lat_actual = request.query_params.get("lat")
            lng_actual = request.query_params.get("lng")
            destino_id = request.query_params.get("destino_id")

            if not all([lat_actual, lng_actual, destino_id]):
                return Response(
                    {
                        "success": False,
                        "error": "Se requieren parámetros: lat, lng, destino_id",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                lat_actual = float(lat_actual)
                lng_actual = float(lng_actual)
                destino_id = int(destino_id)
            except (ValueError, TypeError):
                return Response(
                    {
                        "success": False,
                        "error": "Parámetros inválidos. lat y lng deben ser números, destino_id debe ser entero",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validar rangos de coordenadas
            if not (-90 <= lat_actual <= 90 and -180 <= lng_actual <= 180):
                return Response(
                    {"success": False, "error": "Coordenadas fuera de rango válido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Obtener ubicación de destino
            try:
                destino = Ubicacion.objects.get(id=destino_id)
            except Ubicacion.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": f"Ubicación de destino {destino_id} no encontrada",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Calcular ETA con OSRM
            from rutas_optimizadas.services.osrm_service import OSRMService
            from datetime import datetime, timedelta

            osrm = OSRMService()

            # Verificar si OSRM está disponible
            if not osrm.is_available():
                # Fallback: cálculo simple basado en distancia euclidiana
                from math import radians, sin, cos, sqrt, atan2

                R = 6371  # Radio de la Tierra en km
                lat1, lng1 = radians(lat_actual), radians(lng_actual)
                lat2, lng2 = radians(destino.lat), radians(destino.lng)

                dlat = lat2 - lat1
                dlng = lng2 - lng1

                a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
                c = 2 * atan2(sqrt(a), sqrt(1 - a))
                distancia_km = R * c

                # Asumir velocidad promedio de 40 km/h en ciudad
                tiempo_minutos = int((distancia_km / 40) * 60)
                tiempo_llegada = datetime.now() + timedelta(minutes=tiempo_minutos)

                return Response(
                    {
                        "success": True,
                        "eta": {
                            "distancia_km": round(distancia_km, 2),
                            "tiempo_minutos": tiempo_minutos,
                            "tiempo_llegada_estimado": tiempo_llegada.isoformat(),
                            "geometria_ruta": None,
                            "modo_calculo": "euclidiano",  # Indicar que es cálculo aproximado
                        },
                        "warning": "OSRM no disponible, usando cálculo aproximado",
                    },
                    status=status.HTTP_200_OK,
                )

            # Calcular ruta con OSRM
            origen = (lat_actual, lng_actual)
            destino_coords = (float(destino.lat), float(destino.lng))

            try:
                ruta = osrm.obtener_ruta_detallada(origen, destino_coords)
            except Exception as e:
                logger.error(f"Error obteniendo ruta OSRM: {e}")
                return Response(
                    {
                        "success": False,
                        "error": f"No se pudo calcular la ruta: {str(e)}",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            distancia_metros = ruta["distance"]
            duracion_segundos = ruta["duration"]

            distancia_km = distancia_metros / 1000
            tiempo_minutos = int(duracion_segundos / 60)
            tiempo_llegada = datetime.now() + timedelta(seconds=duracion_segundos)

            # Geometría de la ruta en formato GeoJSON
            # OSRM devuelve geometry como GeoJSON con coordinates [[lng, lat], [lng, lat], ...]
            geometria_geojson = ruta.get("geometry", {})
            geometria_coords = (
                geometria_geojson.get("coordinates", [])
                if isinstance(geometria_geojson, dict)
                else []
            )

            logger.info(
                f"✅ Ruta OSRM obtenida - Puntos: {len(geometria_coords)}, Distancia: {distancia_km:.2f}km"
            )

            return Response(
                {
                    "success": True,
                    "eta": {
                        "distancia_km": round(distancia_km, 2),
                        "tiempo_minutos": tiempo_minutos,
                        "tiempo_llegada_estimado": tiempo_llegada.isoformat(),
                        "geometria_ruta": geometria_coords,  # Array de [lng, lat]
                        "modo_calculo": "osrm",
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"❌ Error en calcular_eta: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "error": f"Error al calcular ETA: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AsientoViewSet(viewsets.ModelViewSet):
    queryset = Asiento.objects.all()
    serializer_class = AsientoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        viaje_id = self.request.query_params.get("viaje")
        if viaje_id:
            queryset = queryset.filter(viaje_id=viaje_id)
        return queryset


class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = [
        "codigo_reserva",
        "cliente__username",
        "cliente__email",
        "cliente__first_name",
        "cliente__last_name",
        "items__asiento__viaje__origen",
        "items__asiento__viaje__destino",
    ]
    filterset_fields = {
        "cliente": ["exact"],
        "estado": ["exact"],
        "pagado": ["exact"],
        "fecha_reserva": ["gte", "lte", "exact"],
        "viaje": ["exact"],
    }
    ordering_fields = ["fecha_reserva", "total", "codigo_reserva"]
    ordering = ["-fecha_reserva"]

    def get_queryset(self):
        queryset = Reserva.objects.all()

        viaje_id = self.request.query_params.get("viaje")
        if viaje_id:
            queryset = queryset.filter(viaje_id=viaje_id)

        codigo_reserva = self.request.query_params.get("codigo_reserva")
        if codigo_reserva:
            queryset = queryset.filter(codigo_reserva__icontains=codigo_reserva)

        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset.order_by("-fecha_reserva")
        return queryset.filter(cliente=self.request.user).order_by("-fecha_reserva")

    def get_serializer_class(self):
        if self.action == "crear_reserva_temporal":
            return CrearReservaTemporalSerializer
        elif self.action == "create_simple":
            return ReservaSimpleSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)

    # ✅ CORREGIDO: Crear reserva temporal con LOCK atómico
    @action(detail=False, methods=["post"], url_path="crear-temporal")
    def crear_reserva_temporal(self, request):
        """
        Crear reserva temporal con expiración (15 minutos)
        POST /api/reservas/crear-temporal/
        {
            "viaje_id": 1,
            "asientos_ids": [1, 2, 3],
            "monto_total": 150.00
        }
        """
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": "Datos inválidos",
                    "detalles": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                viaje_id = serializer.validated_data["viaje_id"]
                asientos_ids = serializer.validated_data["asientos_ids"]
                monto_total = serializer.validated_data.get("monto_total", 0)

                # ✅ CORRECCIÓN CRÍTICA: Primero hacer LOCK de todos los asientos
                # Esto previene race conditions
                asientos = Asiento.objects.filter(
                    id__in=asientos_ids, viaje_id=viaje_id
                ).select_for_update()

                # ✅ Verificar disponibilidad DESPUÉS del lock (operación atómica)
                asientos_no_disponibles = []
                asientos_disponibles = []

                for asiento in asientos:
                    if asiento.estado == "libre":
                        asientos_disponibles.append(asiento)
                    else:
                        asientos_no_disponibles.append(asiento.numero)

                # Si hay asientos no disponibles, retornar error
                if asientos_no_disponibles:
                    return Response(
                        {
                            "success": False,
                            "error": f"Algunos asientos ya no están disponibles: {', '.join(asientos_no_disponibles)}",
                            "detalles": {
                                "asientos_ocupados": asientos_no_disponibles,
                                "asientos_solicitados": asientos_ids,
                                "timestamp": timezone.now().isoformat(),
                            },
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Verificar que encontramos todos los asientos solicitados
                if len(asientos_disponibles) != len(asientos_ids):
                    return Response(
                        {
                            "success": False,
                            "error": f"No se encontraron todos los asientos. Solicitados: {len(asientos_ids)}, Encontrados: {len(asientos_disponibles)}",
                            "detalles": {
                                "asientos_solicitados": asientos_ids,
                                "asientos_encontrados": [
                                    a.id for a in asientos_disponibles
                                ],
                            },
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 2. Crear reserva temporal
                reserva = Reserva.objects.create(
                    cliente=request.user,
                    viaje_id=viaje_id,
                    estado="pendiente_pago",
                    fecha_expiracion=timezone.now() + timedelta(minutes=15),
                    total=monto_total,
                )

                # 3. Crear items de reserva y marcar asientos como reservados
                items_reserva = []
                for asiento in asientos_disponibles:
                    items_reserva.append(
                        ItemReserva(
                            reserva=reserva,
                            asiento=asiento,
                            precio=asiento.viaje.precio,
                        )
                    )
                    # Actualizar estado del asiento
                    asiento.estado = "reservado"
                    asiento.reserva_temporal = reserva
                    asiento.save()

                # Crear todos los items de reserva
                ItemReserva.objects.bulk_create(items_reserva)

                # 4. Actualizar contadores del viaje
                try:
                    viaje = Viaje.objects.get(id=viaje_id)
                    asientos_ocupados = Asiento.objects.filter(
                        viaje=viaje, estado__in=["ocupado", "reservado"]
                    ).count()

                    viaje.asientos_ocupados = asientos_ocupados
                    viaje.asientos_disponibles = (
                        viaje.vehiculo.capacidad_pasajeros - asientos_ocupados
                    )
                    viaje.save(
                        update_fields=["asientos_ocupados", "asientos_disponibles"]
                    )
                except Viaje.DoesNotExist:
                    # Si el viaje no existe, continuar sin actualizar contadores
                    pass

                # 5. Serializar respuesta
                reserva_data = ReservaSerializer(
                    reserva, context={"request": request}
                ).data
                # Enviar notificación al usuario sobre la reserva temporal creada
                try:
                    NotificationService.enviar_notificacion(
                        usuario_id=request.user.id,
                        titulo="Reserva creada (temporal)",
                        mensaje=f"Reserva {reserva.codigo_reserva} creada. Tienes 15 minutos para pagar.",
                        tipo_codigo="reserva_creada",
                        data_extra={
                            "reserva_id": reserva.id,
                            "codigo_reserva": reserva.codigo_reserva,
                            "viaje_id": reserva.viaje.id if reserva.viaje else None,
                            "asientos": [a.numero for a in reserva.items.all()],
                            "total": str(reserva.total),
                        },
                        prioridad="normal",
                    )
                except Exception:
                    # No bloquear la creación de la reserva si falla la notificación
                    pass

                return Response(
                    {
                        "success": True,
                        "message": "Reserva temporal creada exitosamente. Tienes 15 minutos para completar el pago.",
                        "data": reserva_data,
                        "expiracion": reserva.fecha_expiracion.isoformat(),
                        "tiempo_restante": reserva.tiempo_restante,
                        "asientos_reservados": [a.numero for a in asientos_disponibles],
                        "reserva_id": reserva.id,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            # Log del error para debugging
            import traceback

            error_details = traceback.format_exc()
            print(f"❌ Error en crear_reserva_temporal: {str(e)}")
            print(f"📋 Traceback: {error_details}")

            return Response(
                {
                    "success": False,
                    "error": "Error al crear reserva temporal",
                    "detalles": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ✅ NUEVO ENDPOINT: Verificar disponibilidad de asientos
    @action(detail=False, methods=["post"], url_path="verificar-disponibilidad")
    def verificar_disponibilidad(self, request):
        """
        Verificar disponibilidad de asientos antes de reservar
        POST /api/reservas/verificar-disponibilidad/
        {
            "viaje_id": 1,
            "asientos_ids": [1, 2, 3]
        }
        """
        viaje_id = request.data.get("viaje_id")
        asientos_ids = request.data.get("asientos_ids", [])

        if not viaje_id or not asientos_ids:
            return Response(
                {"success": False, "error": "Se requieren viaje_id y asientos_ids"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verificar disponibilidad sin lock (solo lectura)
            asientos = Asiento.objects.filter(id__in=asientos_ids, viaje_id=viaje_id)

            asientos_disponibles = []
            asientos_ocupados = []

            for asiento in asientos:
                if asiento.estado == "libre":
                    asientos_disponibles.append(
                        {
                            "id": asiento.id,
                            "numero": asiento.numero,
                            "estado": asiento.estado,
                        }
                    )
                else:
                    asientos_ocupados.append(
                        {
                            "id": asiento.id,
                            "numero": asiento.numero,
                            "estado": asiento.estado,
                            "reserva_temporal": asiento.reserva_temporal_id,
                        }
                    )

            return Response(
                {
                    "success": True,
                    "disponible": len(asientos_ocupados) == 0,
                    "asientos_disponibles": asientos_disponibles,
                    "asientos_ocupados": asientos_ocupados,
                    "total_solicitados": len(asientos_ids),
                    "total_encontrados": len(asientos),
                    "timestamp": timezone.now().isoformat(),
                }
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Error al verificar disponibilidad",
                    "detalles": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ✅ NUEVO ENDPOINT: Confirmar pago de reserva temporal
    @action(detail=True, methods=["post"], url_path="confirmar-pago")
    def confirmar_pago(self, request, pk=None):
        """
        Confirmar pago de reserva temporal
        POST /api/reservas/{id}/confirmar-pago/
        """
        try:
            reserva = self.get_object()

            if reserva.cliente != request.user and not (
                request.user.is_staff or request.user.is_superuser
            ):
                return Response(
                    {
                        "success": False,
                        "error": "No tiene permisos para confirmar esta reserva",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if reserva.estado != "pendiente_pago":
                return Response(
                    {
                        "success": False,
                        "error": f"La reserva no está pendiente de pago. Estado actual: {reserva.estado}",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if reserva.esta_expirada:
                return Response(
                    {
                        "success": False,
                        "error": "La reserva ha expirado. Por favor, crea una nueva reserva.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                reserva.confirmar_pago()
                # Notificar al usuario que la reserva fue confirmada
                try:
                    NotificationService.enviar_notificacion(
                        usuario_id=reserva.cliente.id,
                        titulo="Reserva confirmada",
                        mensaje=f"Tu reserva {reserva.codigo_reserva} fue confirmada correctamente.",
                        tipo_codigo="reserva_confirmada",
                        data_extra={
                            "reserva_id": reserva.id,
                            "codigo_reserva": reserva.codigo_reserva,
                            "viaje_id": reserva.viaje.id if reserva.viaje else None,
                            "total": str(reserva.total),
                        },
                        prioridad="alta",
                    )
                except Exception:
                    pass

            reserva_data = ReservaSerializer(reserva, context={"request": request}).data

            return Response(
                {
                    "success": True,
                    "message": "Pago confirmado exitosamente. Reserva activada.",
                    "data": reserva_data,
                }
            )

        except Reserva.DoesNotExist:
            return Response(
                {"success": False, "error": "Reserva no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Error al confirmar pago",
                    "detalles": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ✅ NUEVO ENDPOINT: Cancelar reserva temporal
    @action(detail=True, methods=["post"], url_path="cancelar-temporal")
    def cancelar_temporal(self, request, pk=None):
        """
        Cancelar reserva temporal (antes de que expire)
        POST /api/reservas/{id}/cancelar-temporal/
        """
        try:
            reserva = self.get_object()

            if reserva.cliente != request.user and not (
                request.user.is_staff or request.user.is_superuser
            ):
                return Response(
                    {
                        "success": False,
                        "error": "No tiene permisos para cancelar esta reserva",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if reserva.estado != "pendiente_pago":
                return Response(
                    {
                        "success": False,
                        "error": f"Solo se pueden cancelar reservas temporales. Estado actual: {reserva.estado}",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                reserva.estado = "cancelada"
                reserva.save()
                reserva.liberar_asientos()
                # Notificar al usuario que la reserva temporal fue cancelada
                try:
                    NotificationService.enviar_notificacion(
                        usuario_id=reserva.cliente.id,
                        titulo="Reserva cancelada",
                        mensaje=f"Tu reserva {reserva.codigo_reserva} fue cancelada y los asientos liberados.",
                        tipo_codigo="reserva_cancelada",
                        data_extra={
                            "reserva_id": reserva.id,
                            "codigo_reserva": reserva.codigo_reserva,
                            "viaje_id": reserva.viaje.id if reserva.viaje else None,
                        },
                        prioridad="normal",
                    )
                except Exception:
                    pass

            return Response(
                {
                    "success": True,
                    "message": "Reserva temporal cancelada exitosamente. Los asientos han sido liberados.",
                }
            )

        except Reserva.DoesNotExist:
            return Response(
                {"success": False, "error": "Reserva no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Error al cancelar reserva",
                    "detalles": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ✅ NUEVO ENDPOINT: Verificar estado de reserva temporal
    @action(detail=True, methods=["get"], url_path="estado-temporal")
    def estado_temporal(self, request, pk=None):
        """
        Obtener estado de reserva temporal (incluyendo tiempo restante)
        GET /api/reservas/{id}/estado-temporal/
        """
        try:
            reserva = self.get_object()

            if reserva.cliente != request.user and not (
                request.user.is_staff or request.user.is_superuser
            ):
                return Response(
                    {
                        "success": False,
                        "error": "No tiene permisos para ver esta reserva",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            return Response(
                {
                    "success": True,
                    "data": {
                        "id": reserva.id,
                        "codigo_reserva": reserva.codigo_reserva,
                        "estado": reserva.estado,
                        "esta_expirada": reserva.esta_expirada,
                        "tiempo_restante": reserva.tiempo_restante,
                        "fecha_expiracion": reserva.fecha_expiracion.isoformat()
                        if reserva.fecha_expiracion
                        else None,
                        "asientos": [
                            item.asiento.numero for item in reserva.items.all()
                        ],
                        "viaje": {
                            "origen": reserva.viaje.origen,
                            "destino": reserva.viaje.destino,
                            "fecha": reserva.viaje.fecha,
                            "hora": reserva.viaje.hora,
                        }
                        if reserva.viaje
                        else None,
                    },
                }
            )

        except Reserva.DoesNotExist:
            return Response(
                {"success": False, "error": "Reserva no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

    # ✅ ENDPOINT EXISTENTE: Crear reserva simple (compatibilidad)
    @action(detail=False, methods=["post"], url_path="simple")
    def create_simple(self, request):
        """
        Endpoint para crear reservas simples (compatibilidad)
        POST /api/reservas/simple/
        """
        serializer = ReservaSimpleSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ ENDPOINT EXISTENTE: Detalle completo
    @action(detail=True, methods=["get"], url_path="detalle-completo")
    def detalle_completo(self, request, pk=None):
        """
        Obtiene el detalle completo de una reserva con todos sus items
        GET /api/reservas/{id}/detalle-completo/
        """
        try:
            reserva = self.get_object()

            if (
                not (request.user.is_staff or request.user.is_superuser)
                and reserva.cliente != request.user
            ):
                return Response(
                    {"error": "No tiene permisos para ver esta reserva"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = ReservaSerializer(reserva, context={"request": request})
            return Response(serializer.data)
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )

    # ✅ ENDPOINT EXISTENTE: Agregar asientos
    @action(detail=True, methods=["post"], url_path="agregar-asientos")
    def agregar_asientos(self, request, pk=None):
        """
        Agrega asientos adicionales a una reserva existente
        POST /api/reservas/{id}/agregar-asientos/
        {
            "asientos_ids": [6, 7, 8]
        }
        """
        try:
            reserva = self.get_object()

            if reserva.cliente != request.user and not (
                request.user.is_staff or request.user.is_superuser
            ):
                return Response(
                    {"error": "No tiene permisos para modificar esta reserva"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if reserva.estado not in ["pendiente_pago", "confirmada"]:
                return Response(
                    {
                        "error": "No se puede modificar una reserva en estado: "
                        + reserva.estado
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            asientos_ids = request.data.get("asientos_ids", [])

            if not asientos_ids:
                return Response(
                    {"error": "Debe proporcionar asientos_ids"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                asientos = Asiento.objects.filter(id__in=asientos_ids)

                if len(asientos) != len(asientos_ids):
                    return Response(
                        {"error": "Algunos asientos no existen"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                asientos_ocupados = asientos.filter(estado__in=["ocupado", "reservado"])
                if asientos_ocupados.exists():
                    numeros_ocupados = list(
                        asientos_ocupados.values_list("numero", flat=True)
                    )
                    return Response(
                        {
                            "error": f"Los asientos {numeros_ocupados} no están disponibles"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                nuevos_items = []
                for asiento in asientos:
                    nuevos_items.append(
                        ItemReserva(
                            reserva=reserva,
                            asiento=asiento,
                            precio=asiento.viaje.precio,
                        )
                    )

                ItemReserva.objects.bulk_create(nuevos_items)

            reserva.refresh_from_db()
            serializer = ReservaSerializer(reserva, context={"request": request})

            return Response(
                {
                    "success": True,
                    "message": f"Se agregaron {len(nuevos_items)} asientos a la reserva",
                    "reserva": serializer.data,
                }
            )
            # Notificar al usuario que se agregaron asientos
            try:
                # Construir lista de números de asiento correctamente
                asientos_numeros = []
                for item in nuevos_items:
                    # item.asiento puede no estar poblado hasta que se refresque/relacione; obtener desde la instancia creada
                    if hasattr(item, "asiento") and item.asiento:
                        asientos_numeros.append(item.asiento.numero)
                # Si bulk_create devolvió objetos sin atributos relacionados, intentar obtener desde la reserva
                if not asientos_numeros:
                    asientos_numeros = [
                        it.asiento.numero
                        for it in reserva.items.order_by("-id")[: len(nuevos_items)]
                    ]

                NotificationService.enviar_notificacion(
                    usuario_id=reserva.cliente.id,
                    titulo="Asientos agregados",
                    mensaje=f"Se agregaron {len(nuevos_items)} asientos a tu reserva {reserva.codigo_reserva}.",
                    tipo_codigo="reserva_asientos_agregados",
                    data_extra={
                        "reserva_id": reserva.id,
                        "codigo_reserva": reserva.codigo_reserva,
                        "asientos_agregados": asientos_numeros,
                        "total": str(reserva.total),
                    },
                    prioridad="normal",
                )
            except Exception:
                # No bloquear la respuesta si falla la notificación
                pass

        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )


class ItemReservaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ItemReserva.objects.all()
    serializer_class = ItemReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return ItemReserva.objects.all()
        return ItemReserva.objects.filter(reserva__cliente=self.request.user)
