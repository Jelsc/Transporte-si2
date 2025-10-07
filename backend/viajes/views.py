from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Viaje
from .serializers import ViajeSerializer

from rest_framework.permissions import AllowAny

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



