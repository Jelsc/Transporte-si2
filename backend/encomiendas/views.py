from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Q
from django.utils import timezone
from .models import Encomienda, Seguimiento
from .serializers import (
    EncomiendaSerializer,
    CreateEncomiendaSerializer,
    UpdateEncomiendaSerializer,
    AsignarConductorSerializer,
    ActualizarEstadoSerializer,
    SeguimientoSerializer,
)
from .filters import EncomiendaFilter
from conductores.models import Conductor
from pagos.models import Pago
import json


class EncomiendaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = EncomiendaFilter

    def get_queryset(self):
        user = self.request.user

        # Admin ve todas las encomiendas
        if user.is_staff:
            return Encomienda.objects.all().prefetch_related("seguimientos")

        # Conductores ven sus encomiendas asignadas
        if hasattr(user, "conductor"):
            return Encomienda.objects.filter(
                conductor_asignado=user.conductor
            ).prefetch_related("seguimientos")

        # Usuarios normales ven solo sus encomiendas
        return Encomienda.objects.filter(creado_por=user).prefetch_related(
            "seguimientos"
        )

    def get_serializer_class(self):
        if self.action == "create":
            return CreateEncomiendaSerializer
        elif self.action in ["update", "partial_update"]:
            return UpdateEncomiendaSerializer
        return EncomiendaSerializer

    def perform_create(self, serializer):
        # Calcular precio automáticamente si no se proporciona
        instance = serializer.save(creado_por=self.request.user)

        # Si no tiene precio, calcularlo
        if not instance.precio or instance.precio == 0:
            instance.precio = self.calcular_precio(
                instance.peso, instance.destino_ciudad
            )
            instance.save()

        # Crear primer seguimiento
        Seguimiento.objects.create(
            encomienda=instance,
            evento="Encomienda registrada",
            descripcion="La encomienda ha sido registrada en el sistema y está pendiente de procesar.",
        )

    def calcular_precio(self, peso, destino):
        precios_base = {
            "La Paz": 20,
            "Santa Cruz": 25,
            "Cochabamba": 22,
            "Oruro": 18,
            "Potosi": 20,
            "Tarija": 23,
            "Beni": 30,
            "Pando": 35,
        }
        base = precios_base.get(destino, 25)
        adicional_peso = peso > 1 and (peso - 1) * 5 or 0
        return base + adicional_peso

    @action(detail=False, methods=["get"])
    def mis_encomiendas(self, request):
        """Encomiendas del usuario autenticado"""
        encomiendas = Encomienda.objects.filter(creado_por=request.user)
        page = self.paginate_queryset(encomiendas)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(encomiendas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def asignadas(self, request):
        """Encomiendas asignadas al conductor autenticado"""
        if not hasattr(request.user, "conductor"):
            return Response(
                {"error": "Usuario no es conductor"}, status=status.HTTP_403_FORBIDDEN
            )

        encomiendas = Encomienda.objects.filter(
            conductor_asignado=request.user.conductor
        )
        serializer = self.get_serializer(encomiendas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def asignar_viaje(self, request, pk=None):
        """Asignar encomienda a un viaje (debe tener el mismo destino)"""
        encomienda = self.get_object()
        viaje_id = request.data.get("viaje_id")

        if not viaje_id:
            return Response(
                {"error": "viaje_id es requerido"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from viajes.models import Viaje

            viaje = Viaje.objects.select_related("destino").get(id=viaje_id)

            # Validar que el destino coincida usando comparación flexible
            def normalizar_texto(texto):
                """Normaliza texto para comparación (minúsculas, sin acentos, espacios)"""
                if not texto:
                    return ""
                import unicodedata

                # Convertir a minúsculas y quitar acentos
                texto = texto.lower().strip()
                texto = unicodedata.normalize("NFD", texto)
                texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
                return texto

            def ciudades_coinciden(ciudad1, ciudad2):
                """Compara dos ciudades de forma flexible"""
                if not ciudad1 or not ciudad2:
                    return False
                norm1 = normalizar_texto(ciudad1)
                norm2 = normalizar_texto(ciudad2)
                # Coincidencia exacta
                if norm1 == norm2:
                    return True
                # Una contiene a la otra
                if norm1 in norm2 or norm2 in norm1:
                    return True
                return False

            # Obtener nombres normalizados
            destino_viaje_nombre = normalizar_texto(viaje.destino.nombre)
            destino_viaje_direccion = (
                normalizar_texto(viaje.destino.direccion_texto)
                if viaje.destino.direccion_texto
                else ""
            )
            destino_encomienda_ciudad = normalizar_texto(encomienda.destino_ciudad)
            destino_encomienda_direccion = (
                normalizar_texto(encomienda.destino_direccion)
                if encomienda.destino_direccion
                else ""
            )

            # Comparar: nombre del destino del viaje con ciudad de encomienda
            coincide_nombre = ciudades_coinciden(
                destino_viaje_nombre, destino_encomienda_ciudad
            )
            coincide_direccion = False

            # Si hay dirección en el viaje, comparar también
            if destino_viaje_direccion:
                coincide_direccion = (
                    destino_encomienda_ciudad in destino_viaje_direccion
                    or destino_viaje_direccion in destino_encomienda_ciudad
                    or (
                        destino_encomienda_direccion
                        and (
                            destino_encomienda_direccion in destino_viaje_direccion
                            or destino_viaje_direccion in destino_encomienda_direccion
                        )
                    )
                )

            # Si no coincide ni por nombre ni por dirección, rechazar
            if not coincide_nombre and not coincide_direccion:
                return Response(
                    {
                        "error": f"El destino del viaje ({viaje.destino.nombre}) no coincide con el destino de la encomienda ({encomienda.destino_ciudad})"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Asignar viaje
            encomienda.viaje = viaje

            # Si el viaje tiene conductor, asignarlo también
            if (
                viaje.vehiculo
                and hasattr(viaje.vehiculo, "conductor")
                and viaje.vehiculo.conductor
            ):
                encomienda.conductor_asignado = viaje.vehiculo.conductor

            encomienda.save()

            # Crear seguimiento
            Seguimiento.objects.create(
                encomienda=encomienda,
                evento="Asignada a viaje",
                descripcion=f"Encomienda asignada al viaje {viaje.id} ({viaje.origen.nombre} → {viaje.destino.nombre})",
            )

            serializer = EncomiendaSerializer(encomienda)
            return Response(serializer.data)

        except Viaje.DoesNotExist:
            return Response(
                {"error": "Viaje no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Error al asignar viaje: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def asignar_conductor(self, request, pk=None):
        """Asignar conductor a encomienda"""
        encomienda = self.get_object()
        serializer = AsignarConductorSerializer(data=request.data)

        if serializer.is_valid():
            conductor_id = serializer.validated_data["conductor_id"]

            try:
                conductor = Conductor.objects.get(id=conductor_id, activo=True)
                encomienda.conductor_asignado = conductor
                encomienda.save()

                # Crear seguimiento
                Seguimiento.objects.create(
                    encomienda=encomienda,
                    evento="Conductor asignado",
                    descripcion=f"Conductor {conductor.nombre} asignado a la encomienda.",
                )

                return Response(EncomiendaSerializer(encomienda).data)

            except Conductor.DoesNotExist:
                return Response(
                    {"error": "Conductor no encontrado o inactivo"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def actualizar_estado(self, request, pk=None):
        """Actualizar estado de la encomienda"""
        encomienda = self.get_object()
        serializer = ActualizarEstadoSerializer(data=request.data)

        if serializer.is_valid():
            nuevo_estado = serializer.validated_data["estado"]
            notas = serializer.validated_data.get("notas", "")

            # Actualizar estado
            encomienda.estado = nuevo_estado

            # Si se marca como entregado, establecer fecha de entrega
            if nuevo_estado == "entregado" and not encomienda.fecha_entrega_real:
                encomienda.fecha_entrega_real = timezone.now()

            encomienda.save()

            # Crear seguimiento
            evento = f"Estado actualizado a {nuevo_estado}"
            descripcion = f"La encomienda ha sido marcada como {nuevo_estado}."
            if notas:
                descripcion += f" Notas: {notas}"

            Seguimiento.objects.create(
                encomienda=encomienda, evento=evento, descripcion=descripcion
            )

            return Response(EncomiendaSerializer(encomienda).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=False,
        methods=["get"],
        url_path="seguimiento/(?P<codigo>[^/.]+)",
        permission_classes=[AllowAny],
    )
    def seguimiento(self, request, codigo=None):
        """
        Obtener encomienda por código de seguimiento (público)
        Incluye información de tracking en tiempo real si hay viaje asignado
        """
        try:
            encomienda = (
                Encomienda.objects.select_related(
                    "viaje",
                    "viaje__origen",
                    "viaje__destino",
                    "viaje__vehiculo",
                    "viaje__vehiculo__conductor",
                    "conductor_asignado",
                )
                .prefetch_related("seguimientos")
                .get(codigo_seguimiento=codigo)
            )

            serializer = EncomiendaSerializer(encomienda)
            data = serializer.data

            # Si hay viaje asignado, incluir información del viaje
            if encomienda.viaje:
                # Inicializar tracking_info si no existe
                if "tracking_info" not in data or not data["tracking_info"]:
                    data["tracking_info"] = {}

                # Siempre incluir información del viaje (origen y destino)
                data["tracking_info"]["viaje_asignado"] = True
                data["tracking_info"]["viaje_estado"] = encomienda.viaje.estado

                # Si el viaje tiene origen y destino, incluirlos
                if encomienda.viaje.origen:
                    data["tracking_info"]["origen_viaje"] = {
                        "nombre": encomienda.viaje.origen.nombre,
                        "lat": float(encomienda.viaje.origen.lat),
                        "lng": float(encomienda.viaje.origen.lng),
                    }
                if encomienda.viaje.destino:
                    data["tracking_info"]["destino_viaje"] = {
                        "nombre": encomienda.viaje.destino.nombre,
                        "lat": float(encomienda.viaje.destino.lat),
                        "lng": float(encomienda.viaje.destino.lng),
                    }

            # Si hay viaje asignado y está en curso, calcular ETA y obtener ubicación del conductor
            if encomienda.viaje and encomienda.viaje.estado == "en_curso":
                conductor = None
                if encomienda.viaje.vehiculo and hasattr(
                    encomienda.viaje.vehiculo, "conductor"
                ):
                    conductor = encomienda.viaje.vehiculo.conductor

                if (
                    conductor
                    and conductor.ultima_ubicacion_lat
                    and conductor.ultima_ubicacion_lng
                ):
                    # Inicializar tracking_info si no existe
                    if "tracking_info" not in data or not data["tracking_info"]:
                        data["tracking_info"] = {}

                    # Agregar información del conductor y viaje
                    data["tracking_info"]["viaje_en_curso"] = True
                    data["tracking_info"]["conductor_ubicacion"] = {
                        "lat": float(conductor.ultima_ubicacion_lat),
                        "lng": float(conductor.ultima_ubicacion_lng),
                        "ultima_actualizacion": conductor.ultima_ubicacion_fecha.isoformat()
                        if hasattr(conductor, "ultima_ubicacion_fecha")
                        and conductor.ultima_ubicacion_fecha
                        else None,
                    }

                    # Calcular ETA usando OSRM
                    try:
                        from rutas_optimizadas.services.osrm_service import OSRMService
                        from datetime import datetime, timedelta

                        osrm = OSRMService()
                        origen = (
                            float(conductor.ultima_ubicacion_lat),
                            float(conductor.ultima_ubicacion_lng),
                        )
                        destino_coords = (
                            float(encomienda.viaje.destino.lat),
                            float(encomienda.viaje.destino.lng),
                        )

                        if osrm.is_available():
                            ruta = osrm.obtener_ruta_detallada(origen, destino_coords)
                            distancia_metros = ruta["distance"]
                            duracion_segundos = ruta["duration"]

                            distancia_km = distancia_metros / 1000
                            tiempo_minutos = int(duracion_segundos / 60)
                            tiempo_llegada = datetime.now() + timedelta(
                                seconds=duracion_segundos
                            )

                            geometria_geojson = ruta.get("geometry", {})
                            geometria_coords = (
                                geometria_geojson.get("coordinates", [])
                                if isinstance(geometria_geojson, dict)
                                else []
                            )

                            # Agregar ETA al tracking_info
                            data["tracking_info"]["eta"] = {
                                "disponible": True,
                                "distancia_km": round(distancia_km, 2),
                                "tiempo_minutos": tiempo_minutos,
                                "tiempo_llegada_estimado": tiempo_llegada.isoformat(),
                                "geometria_ruta": geometria_coords,
                                "modo_calculo": "osrm",
                            }
                    except Exception as e:
                        # Si falla el cálculo de ETA, no romper la respuesta
                        import logging

                        logger = logging.getLogger(__name__)
                        logger.warning(
                            f"Error calculando ETA para encomienda {codigo}: {str(e)}"
                        )

            return Response(data)
        except Encomienda.DoesNotExist:
            return Response(
                {"error": "Encomienda no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        """Estadísticas de encomiendas"""
        user = request.user

        if user.is_staff:
            # Estadísticas para admin
            total = Encomienda.objects.count()
            pendientes = Encomienda.objects.filter(estado="pendiente").count()
            en_ruta = Encomienda.objects.filter(estado="en_ruta").count()
            entregados = Encomienda.objects.filter(estado="entregado").count()
            cancelados = Encomienda.objects.filter(estado="cancelado").count()
            ingresos_totales = (
                Encomienda.objects.aggregate(total=Sum("precio"))["total"] or 0
            )
        else:
            # Estadísticas para usuario normal
            total = Encomienda.objects.filter(creado_por=user).count()
            pendientes = Encomienda.objects.filter(
                creado_por=user, estado="pendiente"
            ).count()
            en_ruta = Encomienda.objects.filter(
                creado_por=user, estado="en_ruta"
            ).count()
            entregados = Encomienda.objects.filter(
                creado_por=user, estado="entregado"
            ).count()
            cancelados = Encomienda.objects.filter(
                creado_por=user, estado="cancelado"
            ).count()
            ingresos_totales = (
                Encomienda.objects.filter(creado_por=user).aggregate(
                    total=Sum("precio")
                )["total"]
                or 0
            )

        stats = {
            "total": total,
            "pendientes": pendientes,
            "en_ruta": en_ruta,
            "entregados": entregados,
            "cancelados": cancelados,
            "ingresos_totales": float(ingresos_totales),
        }

        return Response(stats)

    # Métodos para integración con pagos
    @action(detail=True, methods=["post"])
    def crear_pago_stripe(self, request, pk=None):
        """Crear pago en Stripe"""
        encomienda = self.get_object()

        # Verificar que no tenga pago completado
        if encomienda.estado_pago == "completado":
            return Response(
                {"error": "La encomienda ya tiene un pago completado"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Aquí integrar con la app de pagos
        # Por ahora simulamos la creación
        try:
            # Esta parte se integraría con tu app de pagos
            # payment_intent = stripe.PaymentIntent.create(...)

            # Simulación
            payment_intent = {
                "id": f"pi_{encomienda.codigo_seguimiento.lower()}",
                "client_secret": f"secret_{encomienda.codigo_seguimiento.lower()}",
                "amount": int(encomienda.precio * 100),  # En centavos
                "currency": "bob",
            }

            # Actualizar encomienda
            encomienda.estado_pago = "procesando"
            encomienda.pago_info = payment_intent
            encomienda.save()

            return Response(payment_intent)

        except Exception as e:
            return Response(
                {"error": f"Error al crear pago: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def confirmar_pago(self, request, pk=None):
        """Confirmar pago de Stripe"""
        encomienda = self.get_object()
        payment_intent_id = request.data.get("payment_intent_id")

        if not payment_intent_id:
            return Response(
                {"error": "payment_intent_id es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Aquí integrar con la app de pagos para confirmar
        try:
            # Simulación de confirmación exitosa
            encomienda.estado_pago = "completado"
            encomienda.save()

            # Crear seguimiento
            Seguimiento.objects.create(
                encomienda=encomienda,
                evento="Pago confirmado",
                descripcion="El pago ha sido confirmado exitosamente.",
            )

            return Response(EncomiendaSerializer(encomienda).data)

        except Exception as e:
            return Response(
                {"error": f"Error al confirmar pago: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def marcar_pago_efectivo(self, request, pk=None):
        """Marcar pago en efectivo como completado (admin o dueño de la encomienda)"""
        encomienda = self.get_object()

        # ✅ PERMITIR A:
        # 1. Administradores (is_staff)
        # 2. Dueño de la encomienda (creado_por)
        puede_marcar_pago = (
            request.user.is_staff or encomienda.creado_por == request.user
        )

        if not puede_marcar_pago:
            return Response(
                {
                    "error": "No tienes permisos para realizar esta acción. Solo el administrador o el dueño de la encomienda pueden marcar el pago."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Verificar que el pago no esté ya completado
        if encomienda.estado_pago == "completado":
            return Response(
                {"error": "La encomienda ya tiene un pago completado"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar que la encomienda no esté cancelada
        if encomienda.estado == "cancelado":
            return Response(
                {"error": "No se puede pagar una encomienda cancelada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Marcar como pagado
        encomienda.estado_pago = "completado"
        encomienda.save()

        # Determinar quién realizó el pago para el mensaje
        if request.user.is_staff:
            quien_pago = "el administrador"
        else:
            quien_pago = "el cliente"

        # Crear seguimiento
        Seguimiento.objects.create(
            encomienda=encomienda,
            evento="Pago en efectivo confirmado",
            descripcion=f"El pago en efectivo ha sido marcado como completado por {quien_pago}. El cliente debe llevar el paquete a la sucursal para completar la entrega.",
        )

        return Response(
            {
                "success": True,
                "message": f"Pago en efectivo marcado como completado por {quien_pago}.",
                "data": EncomiendaSerializer(encomienda).data,
            }
        )
