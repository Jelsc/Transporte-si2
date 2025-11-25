from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ReporteGenerado(models.Model):
    """
    Modelo para almacenar historial de reportes generados
    """
    TIPO_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('imagen', 'Imagen'),
    ]
    
    CATEGORIA_CHOICES = [
        ('viajes', 'Viajes'),
        ('encomiendas', 'Encomiendas'),
        ('conductores', 'Conductores'),
        ('vehiculos', 'Vehículos'),
        ('financiero', 'Financiero'),
        ('general', 'General'),
    ]
    
    titulo = models.CharField(max_length=255, verbose_name="Título del Reporte")
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, verbose_name="Tipo de Reporte")
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES, verbose_name="Categoría")
    archivo = models.FileField(upload_to='reportes/%Y/%m/', verbose_name="Archivo Generado", blank=True, null=True)
    parametros = models.JSONField(default=dict, verbose_name="Parámetros utilizados", blank=True)
    
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reportes_generados', verbose_name="Usuario")
    fecha_generacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Generación")
    
    tamaño_archivo = models.PositiveIntegerField(null=True, blank=True, verbose_name="Tamaño (bytes)")
    tiempo_generacion = models.FloatField(null=True, blank=True, verbose_name="Tiempo de Generación (seg)")
    
    class Meta:
        verbose_name = "Reporte Generado"
        verbose_name_plural = "Reportes Generados"
        ordering = ['-fecha_generacion']
        indexes = [
            models.Index(fields=['-fecha_generacion']),
            models.Index(fields=['categoria', '-fecha_generacion']),
            models.Index(fields=['usuario', '-fecha_generacion']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.get_tipo_display()} ({self.fecha_generacion.strftime('%Y-%m-%d %H:%M')})"
