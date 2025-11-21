# backups/serializers.py
from rest_framework import serializers
from .models import BackupConfig, Backup


class BackupConfigSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    class Meta:
        model = BackupConfig
        fields = [
            'id', 'nombre', 'activo', 'frecuencia', 'hora_ejecucion',
            'dia_semana', 'dia_mes', 'max_backups', 'incluir_media',
            'creado_por', 'creado_por_nombre', 'creado_en', 'actualizado_en',
            'ultima_ejecucion', 'proximo_backup'
        ]
        read_only_fields = ['creado_por', 'creado_en', 'actualizado_en', 'ultima_ejecucion', 'proximo_backup']


class BackupSerializer(serializers.ModelSerializer):
    config_nombre = serializers.CharField(source='config.nombre', read_only=True, allow_null=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    tamanio_legible = serializers.CharField(read_only=True)
    
    class Meta:
        model = Backup
        fields = [
            'id', 'config', 'config_nombre', 'nombre_archivo', 'ruta_archivo',
            'tamanio', 'tamanio_legible', 'estado', 'tipo', 'inicio', 'fin',
            'duracion', 'creado_por', 'creado_por_nombre', 'mensaje_error'
        ]
        read_only_fields = ['creado_por', 'inicio', 'fin', 'duracion', 'tamanio_legible']


class CreateBackupSerializer(serializers.Serializer):
    """Serializer para crear backups manuales"""
    incluir_media = serializers.BooleanField(default=False)
    tipo = serializers.ChoiceField(choices=['database', 'full', 'media'], default='database')
    descripcion = serializers.CharField(required=False, allow_blank=True)
