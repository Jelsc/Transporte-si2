# reclamos/models.py - CORREGIDO
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

class ReclamosCategoria(models.Model):
    nombre = models.CharField(max_length=80, unique=True)
    
    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Categoría de Reclamo'
        verbose_name_plural = 'Categorías de Reclamos'

class Reclamo(models.Model):
    ESTADOS = [
        ('abierto', 'Abierto'),
        ('en_proceso', 'En Proceso'),
        ('cerrado', 'Cerrado'),
        ('cancelado', 'Cancelado'),
    ]
    
    PRIORIDADES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    categoria = models.ForeignKey(ReclamosCategoria, on_delete=models.RESTRICT, verbose_name='Categoría')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='reclamos_usuario', verbose_name='Usuario')
    agente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reclamos_agente', verbose_name='Agente Asignado')
    titulo = models.CharField(max_length=200, default='', verbose_name='Título')
    descripcion = models.TextField(verbose_name='Descripción')
    numero_guia = models.CharField(max_length=50, blank=True, null=True, verbose_name='Número de Guía')
    servicio_relacionado = models.CharField(max_length=100, blank=True, null=True, verbose_name='Servicio Relacionado')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='abierto', verbose_name='Estado')
    prioridad = models.CharField(max_length=20, choices=PRIORIDADES, default='media', verbose_name='Prioridad')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    fecha_cierre = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Cierre')
    
    class Meta:
        db_table = 'reclamos'
        verbose_name = 'Reclamo'
        verbose_name_plural = 'Reclamos'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"REC-{self.id:04d} - {self.titulo}"
    
    @property
    def numero_reclamo(self):
        return f"REC-{self.id:04d}"

class ReclamoDetalle(models.Model):
    reclamo = models.ForeignKey(Reclamo, on_delete=models.CASCADE, related_name='detalles', verbose_name='Reclamo')
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='Autor')
    mensaje = models.TextField(verbose_name='Mensaje')
    fecha = models.DateTimeField(auto_now_add=True, verbose_name='Fecha')
    
    class Meta:
        db_table = 'reclamos_detalle'
        verbose_name = 'Detalle de Reclamo'
        verbose_name_plural = 'Detalles de Reclamos'
        ordering = ['fecha']

    def __str__(self):
        return f"Detalle #{self.id} - REC-{self.reclamo.id:04d}"

class ReclamoAdjunto(models.Model):
    reclamo = models.ForeignKey(Reclamo, on_delete=models.CASCADE, related_name='adjuntos', verbose_name='Reclamo')
    nombre_archivo = models.CharField(max_length=255, verbose_name='Nombre del Archivo')
    archivo = models.FileField(upload_to='reclamos/adjuntos/%Y/%m/%d/', verbose_name='Archivo')
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Subida')
    
    class Meta:
        db_table = 'reclamos_adjuntos'
        verbose_name = 'Adjunto de Reclamo'
        verbose_name_plural = 'Adjuntos de Reclamos'
        ordering = ['-fecha_subida']
    
    def __str__(self):
        return self.nombre_archivo
    
    def tipo_archivo(self):
        if not self.nombre_archivo:
            return 'otro'
        extension = self.nombre_archivo.split('.')[-1].lower()
        if extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp']:
            return 'imagen'
        elif extension == 'pdf':
            return 'pdf'
        else:
            return 'otro'
    
    def es_imagen(self):
        return self.tipo_archivo() == 'imagen'
    
    def es_pdf(self):
        return self.tipo_archivo() == 'pdf'