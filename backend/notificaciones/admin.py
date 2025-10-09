from django.contrib import admin
from .models import DispositivoFCM, TipoNotificacion, Notificacion, PreferenciaNotificacion


@admin.register(DispositivoFCM)
class DispositivoFCMAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'tipo_dispositivo', 'nombre_dispositivo', 'activo', 'fecha_registro', 'fecha_ultimo_uso']
    list_filter = ['tipo_dispositivo', 'activo', 'fecha_registro']
    search_fields = ['usuario__username', 'usuario__email', 'nombre_dispositivo']
    readonly_fields = ['fecha_registro', 'fecha_ultimo_uso']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('usuario')


@admin.register(TipoNotificacion)
class TipoNotificacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'activo', 'requiere_autenticacion', 'fecha_creacion']
    list_filter = ['activo', 'requiere_autenticacion']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['fecha_creacion']


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'usuario', 'tipo', 'estado', 'prioridad', 'fecha_creacion', 'fecha_envio']
    list_filter = ['estado', 'prioridad', 'tipo', 'fecha_creacion']
    search_fields = ['titulo', 'mensaje', 'usuario__username']
    readonly_fields = ['fecha_creacion', 'fecha_envio', 'fecha_entrega', 'fecha_lectura']
    date_hierarchy = 'fecha_creacion'
    
    fieldsets = (
        ('Información básica', {
            'fields': ('titulo', 'mensaje', 'tipo', 'prioridad')
        }),
        ('Destinatario', {
            'fields': ('usuario', 'dispositivo')
        }),
        ('Estado', {
            'fields': ('estado', 'fecha_creacion', 'fecha_envio', 'fecha_entrega', 'fecha_lectura', 'mensaje_error')
        }),
        ('Programación', {
            'fields': ('programada_para', 'expira_en'),
            'classes': ('collapse',)
        }),
        ('Datos adicionales', {
            'fields': ('data_extra',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('usuario', 'tipo', 'dispositivo')


@admin.register(PreferenciaNotificacion)
class PreferenciaNotificacionAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'nuevos_viajes', 'cambios_viaje', 'push_mobile', 'push_web', 'fecha_actualizacion']
    list_filter = ['nuevos_viajes', 'cambios_viaje', 'push_mobile', 'push_web']
    search_fields = ['usuario__username', 'usuario__email']
    readonly_fields = ['fecha_actualizacion']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('usuario',)
        }),
        ('Tipos de notificaciones', {
            'fields': ('nuevos_viajes', 'cambios_viaje', 'recordatorios', 'promociones', 'sistema')
        }),
        ('Canales', {
            'fields': ('push_mobile', 'push_web', 'email')
        }),
        ('Horarios', {
            'fields': ('no_molestar_desde', 'no_molestar_hasta'),
            'classes': ('collapse',)
        }),
        ('Información', {
            'fields': ('fecha_actualizacion',)
        })
    )