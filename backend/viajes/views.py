from rest_framework import viewsets, filters
from .models import Viaje
from .serializers import ViajeSerializer

from rest_framework.permissions import AllowAny

class ViajeViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Viaje.objects.all().order_by('fecha', 'hora')
    serializer_class = ViajeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['origen', 'destino', 'vehiculo_nombre','vehiculo_placa']



