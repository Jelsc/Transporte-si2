from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReporteViewSet, generar_reporte, interpretar_comando

router = DefaultRouter()
router.register(r'', ReporteViewSet, basename='reporte')

app_name = 'reportes'

urlpatterns = [
    # Endpoints de reportes inteligentes (deben ir ANTES del router para evitar conflictos)
    path('generar-inteligente/', generar_reporte, name='generar_reporte_inteligente'),
    path('interpretar/', interpretar_comando, name='interpretar_comando'),
    # Router debe ir al final
    path('', include(router.urls)),
]
