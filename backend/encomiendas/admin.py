from django.contrib import admin
from .models import Encomienda, EncomiendaSeguimiento, TarifaEncomienda

@admin.register(Encomienda)
class EncomiendaAdmin(admin.ModelAdmin):
    list_display = ['codigo_seguimiento', 'destinatario_nombre', 'destino_ciudad', 'estado', 'precio', 'fecha_creacion']
    list_filter = ['estado', 'destino_ciudad', 'fecha_creacion']
    search_fields = ['codigo_seguimiento', 'destinatario_nombre', 'remitente_nombre']
    readonly_fields = ['codigo_seguimiento', 'fecha_creacion']
    fieldsets = [
        ('Información Básica', {
            'fields': ['codigo_seguimiento', 'estado', 'fecha_creacion']
        }),
        ('Remitente', {
            'fields': ['remitente_nombre', 'remitente_telefono', 'remitente_direccion']
        }),
        ('Destinatario', {
            'fields': ['destinatario_nombre', 'destinatario_telefono', 'destino_ciudad', 'destino_direccion']
        }),
        ('Detalles del Paquete', {
            'fields': ['descripcion', 'peso', 'precio', 'notas']
        }),
        ('Asignaciones', {
            'fields': ['conductor_asignado', 'vehiculo_asignado', 'viaje_asociado']
        }),
        ('Fechas', {
            'fields': ['fecha_entrega_estimada', 'fecha_entrega_real']
        }),
        ('Sistema', {
            'fields': ['creado_por']
        }),
    ]

@admin.register(EncomiendaSeguimiento)
class EncomiendaSeguimientoAdmin(admin.ModelAdmin):
    list_display = ['encomienda', 'evento', 'fecha', 'ubicacion']
    list_filter = ['fecha', 'evento']
    search_fields = ['encomienda__codigo_seguimiento', 'evento']
    readonly_fields = ['fecha']

@admin.register(TarifaEncomienda)
class TarifaEncomiendaAdmin(admin.ModelAdmin):
    list_display = ['ciudad', 'precio_base', 'precio_kg_adicional', 'activo']
    list_filter = ['activo']
    search_fields = ['ciudad']