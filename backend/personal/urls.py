from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonalEmpresaViewSet, DepartamentoViewSet

router = DefaultRouter()
router.register(r'personal', PersonalEmpresaViewSet)
router.register(r'departamentos', DepartamentoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
