import django_filters
from .models import Encomienda
from django.db.models import Q

class EncomiendaFilter(django_filters.FilterSet):
    estado = django_filters.ChoiceFilter(choices=Encomienda.ESTADO_CHOICES)
    destino_ciudad = django_filters.CharFilter(lookup_expr='icontains')
    fecha_desde = django_filters.DateFilter(field_name='fecha_creacion', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='fecha_creacion', lookup_expr='lte')
    conductor_asignado = django_filters.NumberFilter(field_name='conductor_asignado__id')
    codigo_seguimiento = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Encomienda
        fields = ['estado', 'destino_ciudad', 'fecha_desde', 'fecha_hasta', 'conductor_asignado', 'codigo_seguimiento']