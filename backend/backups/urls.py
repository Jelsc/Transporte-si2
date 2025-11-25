# backups/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BackupConfigViewSet, BackupViewSet

router = DefaultRouter()
router.register(r'configs', BackupConfigViewSet, basename='backupconfig')
router.register(r'backups', BackupViewSet, basename='backup')

urlpatterns = [
    path('', include(router.urls)),
]
