# reclamos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categorias', views.ReclamosCategoriaViewSet, basename='categorias')
router.register(r'reclamos', views.ReclamoViewSet, basename='reclamos')
router.register(r'reclamos/(?P<reclamo_pk>\d+)/detalles', views.ReclamoDetalleViewSet, basename='reclamo-detalles')

urlpatterns = [
    path('', include(router.urls)),
]