from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Viaje, Asiento, Reserva, ItemReserva
from .serializers import (
    ViajeSerializer, 
    AsientoSerializer, 
    ReservaSerializer,
    ReservaSimpleSerializer,
    ItemReservaSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny

class ViajeViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Viaje.objects.all().order_by('fecha', 'hora')
    serializer_class = ViajeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['origen', 'destino', 'vehiculo__nombre', 'vehiculo__placa']
    filterset_fields = {
        'origen': ['exact'],
        'destino': ['exact'],
        'fecha': ['gte', 'lte'],
        'vehiculo': ['exact'],
        'estado': ['exact'],
    }

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
    
    # ✅ CONFIGURACIÓN DE FILTROS AGREGADA
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'codigo_reserva', 
        'cliente__username', 
        'cliente__email',
        'cliente__first_name', 
        'cliente__last_name',
        'items__asiento__viaje__origen',
        'items__asiento__viaje__destino'
    ]
    filterset_fields = {
        'cliente': ['exact'],
        'estado': ['exact'],
        'pagado': ['exact'],
        'fecha_reserva': ['gte', 'lte', 'exact'],
    }
    ordering_fields = ['fecha_reserva', 'total', 'codigo_reserva']
    ordering = ['-fecha_reserva']

    def get_queryset(self):
        """
        Los usuarios normales solo ven sus reservas
        Los staff ven todas las reservas
        """
        queryset = Reserva.objects.all()
        
        # ✅ FILTRO PERSONALIZADO PARA VIAJE (a través de items)
        viaje_id = self.request.query_params.get('viaje')
        if viaje_id:
            queryset = queryset.filter(items__asiento__viaje_id=viaje_id).distinct()
        
        # ✅ FILTRO PERSONALIZADO PARA CÓDIGO DE RESERVA (búsqueda exacta)
        codigo_reserva = self.request.query_params.get('codigo_reserva')
        if codigo_reserva:
            queryset = queryset.filter(codigo_reserva__icontains=codigo_reserva)
        
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset.order_by('-fecha_reserva')
        return queryset.filter(cliente=self.request.user).order_by('-fecha_reserva')

    def get_serializer_class(self):
        """
        Usa ReservaSimpleSerializer para acciones específicas si es necesario
        Por defecto usa ReservaSerializer (múltiples asientos)
        """
        if self.action == 'create_simple':
            return ReservaSimpleSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """
        El cliente se asigna automáticamente desde el usuario autenticado
        Esto ya lo maneja el serializer, pero lo mantenemos por seguridad
        """
        serializer.save(cliente=self.request.user)

    @action(detail=False, methods=['post'], url_path='simple')
    def create_simple(self, request):
        """
        Endpoint para crear reservas simples (compatibilidad)
        POST /api/reservas/simple/
        """
        serializer = ReservaSimpleSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='detalle-completo')
    def detalle_completo(self, request, pk=None):
        """
        Obtiene el detalle completo de una reserva con todos sus items
        GET /api/reservas/{id}/detalle-completo/
        """
        try:
            reserva = self.get_object()
            
            # Verificar permisos: usuario solo puede ver sus propias reservas
            if not (request.user.is_staff or request.user.is_superuser) and reserva.cliente != request.user:
                return Response(
                    {"error": "No tiene permisos para ver esta reserva"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = ReservaSerializer(reserva)
            return Response(serializer.data)
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='agregar-asientos')
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
            
            # Verificar que la reserva pertenezca al usuario
            if reserva.cliente != request.user and not (request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "No tiene permisos para modificar esta reserva"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Verificar que la reserva esté en estado modificable
            if reserva.estado not in ['pendiente', 'confirmada']:
                return Response(
                    {"error": "No se puede modificar una reserva en estado: " + reserva.estado}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            asientos_ids = request.data.get('asientos_ids', [])
            
            if not asientos_ids:
                return Response(
                    {"error": "Debe proporcionar asientos_ids"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar y agregar asientos
            from django.db import transaction
            
            with transaction.atomic():
                asientos = Asiento.objects.filter(id__in=asientos_ids)
                
                # Verificar que todos existan y estén libres
                if len(asientos) != len(asientos_ids):
                    return Response(
                        {"error": "Algunos asientos no existen"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                asientos_ocupados = asientos.filter(estado__in=['ocupado', 'reservado'])
                if asientos_ocupados.exists():
                    numeros_ocupados = list(asientos_ocupados.values_list('numero', flat=True))
                    return Response(
                        {"error": f"Los asientos {numeros_ocupados} no están disponibles"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Crear nuevos items de reserva
                nuevos_items = []
                for asiento in asientos:
                    nuevos_items.append(
                        ItemReserva(
                            reserva=reserva,
                            asiento=asiento,
                            precio=asiento.viaje.precio
                        )
                    )
                
                ItemReserva.objects.bulk_create(nuevos_items)
            
            # Recargar la reserva para obtener los datos actualizados
            reserva.refresh_from_db()
            serializer = ReservaSerializer(reserva)
            
            return Response({
                "success": True,
                "message": f"Se agregaron {len(nuevos_items)} asientos a la reserva",
                "reserva": serializer.data
            })
            
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ItemReservaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet solo lectura para items de reserva
    """
    queryset = ItemReserva.objects.all()
    serializer_class = ItemReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Usuarios normales solo ven items de sus propias reservas
        Staff ven todos los items
        """
        if self.request.user.is_staff or self.request.user.is_superuser:
            return ItemReserva.objects.all()
        return ItemReserva.objects.filter(reserva__cliente=self.request.user)