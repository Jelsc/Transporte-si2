from django.contrib import admin
from django.utils.html import format_html
from .models import Ubicacion


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    """Configuración del admin para el modelo Ubicacion"""
    
    list_display = [
        'nombre', 
        'tipo', 
        'direccion_texto', 
        'coordenadas_display',
        'service_min',
        'source',
        'activo',
        'updated_at'
    ]
    
    list_filter = [
        'tipo',
        'source',
        'activo',
        'created_at',
        'updated_at'
    ]
    
    search_fields = [
        'nombre',
        'direccion_texto',
        'descripcion',
        'geohash'
    ]
    
    readonly_fields = [
        'geohash',
        'created_at',
        'updated_at',
        'coordenadas_display'
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('tipo', 'nombre', 'direccion_texto', 'descripcion', 'activo')
        }),
        ('Coordenadas', {
            'fields': ('lat', 'lng', 'coordenadas_display', 'geohash')
        }),
        ('Metadatos de Geocodificación', {
            'fields': ('source', 'place_id', 'osm_id'),
            'classes': ('collapse',)
        }),
        ('Configuración', {
            'fields': ('service_min',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-updated_at']
    
    def coordenadas_display(self, obj):
        """Muestra las coordenadas de forma legible"""
        if obj.lat and obj.lng:
            return format_html(
                '<span style="font-family: monospace;">{:.6f}, {:.6f}</span>',
                float(obj.lat),
                float(obj.lng)
            )
        return '-'
    coordenadas_display.short_description = 'Coordenadas (lat, lng)'
    
    def get_queryset(self, request):
        """Optimizar consultas"""
        return super().get_queryset(request).select_related()
    
    actions = ['activar_ubicaciones', 'desactivar_ubicaciones']
    
    def activar_ubicaciones(self, request, queryset):
        """Acción para activar ubicaciones seleccionadas"""
        updated = queryset.update(activo=True)
        self.message_user(
            request,
            f'{updated} ubicaciones fueron activadas.'
        )
    activar_ubicaciones.short_description = "Activar ubicaciones seleccionadas"
    
    def desactivar_ubicaciones(self, request, queryset):
        """Acción para desactivar ubicaciones seleccionadas"""
        updated = queryset.update(activo=False)
        self.message_user(
            request,
            f'{updated} ubicaciones fueron desactivadas.'
        )
    desactivar_ubicaciones.short_description = "Desactivar ubicaciones seleccionadas"
