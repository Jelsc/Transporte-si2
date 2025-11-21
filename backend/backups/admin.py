# backups/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import BackupConfig, Backup


@admin.register(BackupConfig)
class BackupConfigAdmin(admin.ModelAdmin):
    list_display = [
        'nombre',
        'activo_badge',
        'frecuencia',
        'hora_ejecucion',
        'max_backups',
        'ultima_ejecucion',
        'proximo_backup'
    ]
    list_filter = ['activo', 'frecuencia', 'creado_en']
    search_fields = ['nombre']
    readonly_fields = ['creado_en', 'actualizado_en', 'ultima_ejecucion', 'proximo_backup']
    
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'activo')
        }),
        ('Configuración de Frecuencia', {
            'fields': (
                'frecuencia',
                'hora_ejecucion',
                'dia_semana',
                'dia_mes'
            )
        }),
        ('Opciones', {
            'fields': ('max_backups', 'incluir_media')
        }),
        ('Ejecución', {
            'fields': ('ultima_ejecucion', 'proximo_backup'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('creado_por', 'modificado_por', 'creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        })
    )
    
    def activo_badge(self, obj):
        if obj.activo:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Activo</span>'
            )
        return format_html(
            '<span style="color: gray;">✗ Inactivo</span>'
        )
    activo_badge.short_description = 'Estado'


@admin.register(Backup)
class BackupAdmin(admin.ModelAdmin):
    list_display = [
        'nombre_archivo',
        'config',
        'estado_badge',
        'tipo',
        'tamanio_legible',
        'duracion_formateada',
        'inicio',
        'creado_por'
    ]
    list_filter = ['estado', 'tipo', 'inicio', 'config']
    search_fields = ['nombre_archivo', 'config__nombre']
    readonly_fields = [
        'config',
        'nombre_archivo',
        'ruta_archivo',
        'tamanio',
        'estado',
        'tipo',
        'inicio',
        'fin',
        'duracion',
        'creado_por',
        'mensaje_error'
    ]
    
    fieldsets = (
        ('Información del Backup', {
            'fields': ('config', 'nombre_archivo', 'tipo', 'estado')
        }),
        ('Archivos', {
            'fields': ('ruta_archivo', 'tamanio')
        }),
        ('Ejecución', {
            'fields': ('inicio', 'fin', 'duracion', 'mensaje_error')
        }),
        ('Auditoría', {
            'fields': ('creado_por',)
        })
    )
    
    def estado_badge(self, obj):
        colores = {
            'pending': 'gray',
            'processing': 'blue',
            'completed': 'green',
            'failed': 'red'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colores.get(obj.estado, 'black'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def duracion_formateada(self, obj):
        if obj.duracion:
            minutos = obj.duracion // 60
            segundos = obj.duracion % 60
            return f"{minutos}m {segundos}s"
        return "-"
    duracion_formateada.short_description = 'Duración'
    
    def has_add_permission(self, request):
        # No permitir crear backups desde el admin
        return False
    
    def has_change_permission(self, request, obj=None):
        # No permitir editar backups
        return False
