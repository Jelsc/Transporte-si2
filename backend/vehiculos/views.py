from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Vehiculo
from .serializers import VehiculoSerializer

class VehiculoViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all().order_by('id')
    serializer_class = VehiculoSerializer
    permission_classes = [AllowAny]   