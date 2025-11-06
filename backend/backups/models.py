# backups/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class BackupConfig(models.Model):
    """Configuración de backups automáticos"""
    FREQUENCY_CHOICES = [
        ('manual', 'Manual'),
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
    ]
    
    nombre = models.CharField(max_length=200, unique=True)
    activo = models.BooleanField(default=True)
    frecuencia = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='manual')
    hora_ejecucion = models.TimeField(default=timezone.now)
    dia_semana = models.IntegerField(null=True, blank=True, help_text='0=Lunes, 6=Domingo')
    dia_mes = models.IntegerField(null=True, blank=True, help_text='Día del mes (1-31)')
    max_backups = models.IntegerField(default=7, help_text='Número máximo de backups a mantener')
    incluir_media = models.BooleanField(default=False, help_text='Incluir archivos media')
    
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='backups_config_creados')
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    ultima_ejecucion = models.DateTimeField(null=True, blank=True)
    proximo_backup = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'backups_config'
        verbose_name = 'Configuración de Backup'
        verbose_name_plural = 'Configuraciones de Backups'
        ordering = ['-creado_en']
    
    def __str__(self):
        return f"{self.nombre} - {self.get_frecuencia_display()}"


class Backup(models.Model):
    """Registro de backups realizados"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    config = models.ForeignKey(BackupConfig, on_delete=models.CASCADE, related_name='backups', null=True, blank=True)
    nombre_archivo = models.CharField(max_length=255)
    ruta_archivo = models.CharField(max_length=500)
    tamanio = models.BigIntegerField(default=0, help_text='Tamaño en bytes')
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    tipo = models.CharField(max_length=50, default='database', help_text='database, full, media')
    
    inicio = models.DateTimeField(auto_now_add=True)
    fin = models.DateTimeField(null=True, blank=True)
    duracion = models.FloatField(null=True, blank=True, help_text='Duración en segundos')
    
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='backups_creados')
    mensaje_error = models.TextField(blank=True)
    
    class Meta:
        db_table = 'backups'
        verbose_name = 'Backup'
        verbose_name_plural = 'Backups'
        ordering = ['-inicio']
    
    def __str__(self):
        return f"{self.nombre_archivo} - {self.get_estado_display()}"
    
    @property
    def tamanio_legible(self):
        """Retorna el tamaño en formato legible"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.tamanio < 1024.0:
                return f"{self.tamanio:.2f} {unit}"
            self.tamanio /= 1024.0
        return f"{self.tamanio:.2f} TB"
