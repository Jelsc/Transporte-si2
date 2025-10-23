from django.contrib import admin
from .models import Encomienda, Seguimiento
from django.conf import settings

@admin.register(Encomienda)
class EncomiendaAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_seguimiento', 'destinatario_nombre', 'destino_ciudad', 
        'estado', 'estado_pago', 'precio', 'fecha_creacion', 'conductor_asignado_id'  # Cambiado aquí
    ]
    list_filter = ['estado', 'estado_pago', 'destino_ciudad', 'fecha_creacion']
    search_fields = ['codigo_seguimiento', 'destinatario_nombre', 'remitente_nombre']
    readonly_fields = ['codigo_seguimiento', 'fecha_creacion']
    ordering = ['-fecha_creacion']

@admin.register(Seguimiento)
class SeguimientoAdmin(admin.ModelAdmin):
    list_display = ['encomienda', 'evento', 'fecha']
    list_filter = ['evento', 'fecha']
    search_fields = ['encomienda__codigo_seguimiento', 'evento']
    readonly_fields = ['fecha']
    ordering = ['-fecha']