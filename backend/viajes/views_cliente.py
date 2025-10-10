# viajes/views_cliente.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from .models import Reserva, ItemReserva
from .serializers import ReservaSerializer

class MisReservasViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para que clientes gestionen SUS PROPIAS reservas
    URL: /api/mis-reservas/
    """
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]
    
    # ✅ Filtros para que el cliente pueda organizar sus reservas
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['estado', 'pagado']
    ordering_fields = ['fecha_reserva', 'total']
    ordering = ['-fecha_reserva']  # Más recientes primero
    
    def get_queryset(self):
        """
        Clientes solo ven SUS PROPIAS reservas
        """
        return Reserva.objects.filter(cliente=self.request.user).order_by('-fecha_reserva')

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar_reserva(self, request, pk=None):
        """
        Cancelar una reserva propia
        POST /api/mis-reservas/{id}/cancelar/
        """
        try:
            reserva = self.get_object()
            
            # Validaciones de negocio
            if reserva.estado == 'cancelada':
                return Response(
                    {"error": "Esta reserva ya está cancelada"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Puedes agregar más validaciones aquí:
            # - No cancelar reservas de viajes que ya pasaron
            # - No cancelar reservas ya pagadas (o aplicar reembolso)
            # - etc.
            
            with transaction.atomic():
                reserva.estado = 'cancelada'
                reserva.save()
                # Los asientos se liberan automáticamente por las señales post_delete
                items_count, _ = ItemReserva.objects.filter(reserva=reserva).delete()

            return Response({
                "success": True,
                "message": f"Reserva cancelada exitosamente. {items_count} asiento(s) liberado(s).",
                "reserva": ReservaSerializer(reserva).data
            })
            
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='marcar-pagada')
    def marcar_como_pagada(self, request, pk=None):
        """
        Marcar una reserva como pagada
        POST /api/mis-reservas/{id}/marcar-pagada/
        """
        try:
            reserva = self.get_object()
            
            if reserva.pagado:
                return Response(
                    {"error": "Esta reserva ya está pagada"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                reserva.pagado = True
                reserva.estado = 'confirmada'  # Cambiar estado a confirmada cuando se paga
                reserva.save()
                
            return Response({
                "success": True,
                "message": "Reserva marcada como pagada",
                "reserva": ReservaSerializer(reserva).data
            })
            
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'], url_path='detalle')
    def detalle_reserva(self, request, pk=None):
        """
        Obtener detalle completo de una reserva propia
        GET /api/mis-reservas/{id}/detalle/
        """
        try:
            reserva = self.get_object()
            serializer = ReservaSerializer(reserva)
            return Response(serializer.data)
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, 
                status=status.HTTP_404_NOT_FOUND
            )