# reclamos/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import render
from django.contrib import messages
from django.http import HttpResponseRedirect
from .models import ReclamosCategoria, Reclamo, ReclamoDetalle, ReclamoAdjunto

class ReclamoDetalleInline(admin.TabularInline):
    model = ReclamoDetalle
    extra = 0
    readonly_fields = ['fecha', 'autor_nombre']
    fields = ['autor_nombre', 'mensaje', 'fecha']
    
    def autor_nombre(self, obj):
        if obj.autor:
            return obj.autor.get_full_name() or getattr(obj.autor, 'username', 'Usuario')
        return "Usuario eliminado"
    autor_nombre.short_description = 'Autor'

class ReclamoAdjuntoInline(admin.TabularInline):
    model = ReclamoAdjunto
    extra = 0
    readonly_fields = ['fecha_subida', 'tipo_archivo_display', 'enlace_archivo']
    fields = ['nombre_archivo', 'enlace_archivo', 'tipo_archivo_display', 'fecha_subida']
    
    def tipo_archivo_display(self, obj):
        return obj.tipo_archivo().title()
    tipo_archivo_display.short_description = 'Tipo'
    
    def enlace_archivo(self, obj):
        if obj.archivo:
            return format_html('<a href="{}" target="_blank">Ver archivo</a>', obj.archivo.url)
        return "Sin archivo"
    enlace_archivo.short_description = 'Archivo'

@admin.register(ReclamosCategoria)
class ReclamosCategoriaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'cantidad_reclamos']
    search_fields = ['nombre']
    list_display_links = ['id', 'nombre']
    ordering = ['nombre']
    
    def cantidad_reclamos(self, obj):
        return obj.reclamo_set.count()
    cantidad_reclamos.short_description = 'Cant. Reclamos'

@admin.register(Reclamo)
class ReclamoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'numero_reclamo_display', 
        'titulo_truncado', 
        'usuario_nombre', 
        'categoria', 
        'estado_badge', 
        'prioridad_badge', 
        'agente_nombre',
        'fecha_creacion_formateada',
        'dias_desde_creacion'
    ]
    
    list_filter = [
        'estado', 
        'prioridad', 
        'categoria', 
        'fecha_creacion',
        'agente'
    ]
    
    search_fields = [
        'titulo', 
        'descripcion', 
        'numero_guia', 
        'usuario__username', 
        'usuario__first_name', 
        'usuario__last_name',
        'agente__username',
        'agente__first_name',
        'agente__last_name'
    ]
    
    readonly_fields = [
        'fecha_creacion', 
        'fecha_cierre',
        'numero_reclamo_display',
        'dias_desde_creacion'
    ]
    
    list_select_related = ['usuario', 'categoria', 'agente']
    inlines = [ReclamoDetalleInline, ReclamoAdjuntoInline]
    
    fieldsets = [
        ('Información del Reclamo', {
            'fields': [
                'numero_reclamo_display',
                'titulo', 
                'descripcion', 
                'categoria', 
                'usuario',
                'dias_desde_creacion'
            ]
        }),
        ('Información del Servicio', {
            'fields': [
                'numero_guia', 
                'servicio_relacionado'
            ]
        }),
        ('Gestión del Reclamo', {
            'fields': [
                'estado', 
                'prioridad', 
                'agente', 
                'fecha_creacion', 
                'fecha_cierre'
            ]
        }),
    ]
    
    actions = ['marcar_como_cerrado', 'marcar_como_en_proceso', 'asignar_alta_prioridad']
    
    def numero_reclamo_display(self, obj):
        return f"REC-{obj.id:04d}"
    numero_reclamo_display.short_description = 'Número de Reclamo'
    
    def titulo_truncado(self, obj):
        return obj.titulo[:50] + '...' if len(obj.titulo) > 50 else obj.titulo
    titulo_truncado.short_description = 'Título'
    
    def usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or getattr(obj.usuario, 'username', 'Usuario')
        return "Usuario eliminado"
    usuario_nombre.short_description = 'Cliente'
    
    def agente_nombre(self, obj):
        if obj.agente:
            return obj.agente.get_full_name() or getattr(obj.agente, 'username', 'Agente')
        return "Sin asignar"
    agente_nombre.short_description = 'Agente'
    
    def estado_badge(self, obj):
        colors = {
            'abierto': 'orange',
            'en_proceso': 'blue',
            'cerrado': 'green',
            'cancelado': 'red'
        }
        color = colors.get(obj.estado, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    estado_badge.admin_order_field = 'estado'
    
    def prioridad_badge(self, obj):
        colors = {
            'baja': 'gray',
            'media': 'blue',
            'alta': 'orange',
            'urgente': 'red'
        }
        color = colors.get(obj.prioridad, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">{}</span>',
            color,
            obj.get_prioridad_display()
        )
    prioridad_badge.short_description = 'Prioridad'
    prioridad_badge.admin_order_field = 'prioridad'
    
    def fecha_creacion_formateada(self, obj):
        return obj.fecha_creacion.strftime("%d/%m/%Y %H:%M")
    fecha_creacion_formateada.short_description = 'Fecha Creación'
    fecha_creacion_formateada.admin_order_field = 'fecha_creacion'
    
    def dias_desde_creacion(self, obj):
        from django.utils import timezone
        if obj.fecha_creacion:
            delta = timezone.now() - obj.fecha_creacion
            return f"{delta.days} días"
        return "N/A"
    dias_desde_creacion.short_description = 'Días desde creación'
    
    # Acciones personalizadas
    def marcar_como_cerrado(self, request, queryset):
        updated = queryset.update(estado='cerrado')
        self.message_user(request, f"{updated} reclamos marcados como cerrados.")
    marcar_como_cerrado.short_description = "Marcar como CERRADO"
    
    def marcar_como_en_proceso(self, request, queryset):
        updated = queryset.update(estado='en_proceso')
        self.message_user(request, f"{updated} reclamos marcados como en proceso.")
    marcar_como_en_proceso.short_description = "Marcar como EN PROCESO"
    
    def asignar_alta_prioridad(self, request, queryset):
        updated = queryset.update(prioridad='alta')
        self.message_user(request, f"{updated} reclamos marcados con prioridad ALTA.")
    asignar_alta_prioridad.short_description = "Asignar prioridad ALTA"

@admin.register(ReclamoDetalle)
class ReclamoDetalleAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'reclamo_numero', 
        'autor_nombre', 
        'mensaje_truncado', 
        'fecha_formateada'
    ]
    
    list_filter = [
        'fecha', 
        'autor',
        'reclamo__categoria'
    ]
    
    search_fields = [
        'mensaje', 
        'reclamo__titulo', 
        'autor__username',
        'autor__first_name',
        'autor__last_name'
    ]
    
    readonly_fields = ['fecha']
    list_select_related = ['reclamo', 'autor']
    
    def reclamo_numero(self, obj):
        return f"REC-{obj.reclamo.id:04d}"
    reclamo_numero.short_description = 'Reclamo'
    reclamo_numero.admin_order_field = 'reclamo__id'
    
    def autor_nombre(self, obj):
        if obj.autor:
            return obj.autor.get_full_name() or getattr(obj.autor, 'username', 'Usuario')
        return "Usuario eliminado"
    autor_nombre.short_description = 'Autor'
    
    def mensaje_truncado(self, obj):
        return obj.mensaje[:80] + '...' if len(obj.mensaje) > 80 else obj.mensaje
    mensaje_truncado.short_description = 'Mensaje'
    
    def fecha_formateada(self, obj):
        return obj.fecha.strftime("%d/%m/%Y %H:%M")
    fecha_formateada.short_description = 'Fecha'
    fecha_formateada.admin_order_field = 'fecha'

@admin.register(ReclamoAdjunto)
class ReclamoAdjuntoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'reclamo_numero', 
        'nombre_archivo_truncado', 
        'tipo_archivo_badge', 
        'enlace_descarga',
        'fecha_subida_formateada'
    ]
    
    list_filter = [
        'fecha_subida', 
        'reclamo'
    ]
    
    search_fields = [
        'nombre_archivo', 
        'reclamo__titulo'
    ]
    
    readonly_fields = ['fecha_subida', 'tipo_archivo_display']
    
    def reclamo_numero(self, obj):
        return f"REC-{obj.reclamo.id:04d}"
    reclamo_numero.short_description = 'Reclamo'
    reclamo_numero.admin_order_field = 'reclamo__id'
    
    def nombre_archivo_truncado(self, obj):
        return obj.nombre_archivo[:40] + '...' if len(obj.nombre_archivo) > 40 else obj.nombre_archivo
    nombre_archivo_truncado.short_description = 'Archivo'
    
    def tipo_archivo_badge(self, obj):
        tipo = obj.tipo_archivo()
        colors = {
            'imagen': 'green',
            'pdf': 'red',
            'otro': 'gray'
        }
        color = colors.get(tipo, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
            color,
            tipo.upper()
        )
    tipo_archivo_badge.short_description = 'Tipo'
    
    def enlace_descarga(self, obj):
        if obj.archivo:
            return format_html(
                '<a href="{}" target="_blank" style="background-color: #007bff; color: white; padding: 4px 12px; border-radius: 4px; text-decoration: none;">Descargar</a>',
                obj.archivo.url
            )
        return "Sin archivo"
    enlace_descarga.short_description = 'Descargar'
    
    def fecha_subida_formateada(self, obj):
        return obj.fecha_subida.strftime("%d/%m/%Y %H:%M")
    fecha_subida_formateada.short_description = 'Fecha Subida'
    fecha_subida_formateada.admin_order_field = 'fecha_subida'
    
    def tipo_archivo_display(self, obj):
        return obj.tipo_archivo().title()
    tipo_archivo_display.short_description = 'Tipo de Archivo'

# Personalización del título del admin
admin.site.site_header = "Sistema de Gestión de Reclamos"
admin.site.site_title = "Administración de Reclamos"
admin.site.index_title = "Panel de Administración"