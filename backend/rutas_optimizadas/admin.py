from django.contrib import admin
from .models import SolicitudRuta, Entrega, RutaOptimizada, Parada


class EntregaInline(admin.TabularInline):
    model = Entrega
    extra = 1
    fields = ('ubicacion', 'tipo', 'demanda_peso', 'prioridad')


class ParadaInline(admin.TabularInline):
    model = Parada
    extra = 0
    readonly_fields = ('orden', 'ubicacion', 'tiempo_llegada_estimado', 'distancia_desde_anterior_km')
    fields = readonly_fields + ('completada',)


@admin.register(SolicitudRuta)
class SolicitudRutaAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_viaje', 'hora_inicio', 'estado', 'numero_entregas', 'fecha_creacion')
    list_filter = ('estado', 'fecha_viaje')
    search_fields = ('id',)
    readonly_fields = ('fecha_creacion', 'fecha_procesamiento', 'tiene_rutas', 'numero_entregas')
    inlines = [EntregaInline]
    
    fieldsets = (
        ('Información del Viaje', {
            'fields': ('fecha_viaje', 'hora_inicio', 'depot')
        }),
        ('Vehículos', {
            'fields': ('vehiculos_disponibles',)
        }),
        ('Estado', {
            'fields': ('estado', 'mensaje_resultado', 'fecha_procesamiento')
        }),
        ('Estadísticas', {
            'fields': ('tiene_rutas', 'numero_entregas', 'fecha_creacion'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Entrega)
class EntregaAdmin(admin.ModelAdmin):
    list_display = ('id', 'solicitud', 'ubicacion', 'tipo', 'demanda_peso', 'prioridad')
    list_filter = ('tipo', 'prioridad')
    search_fields = ('ubicacion__nombre',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('solicitud', 'ubicacion', 'tipo')
        }),
        ('Ventanas de Tiempo', {
            'fields': ('ventana_tiempo_inicio', 'ventana_tiempo_fin')
        }),
        ('Demanda', {
            'fields': ('demanda_peso', 'demanda_volumen', 'tiempo_servicio_min')
        }),
        ('Configuración', {
            'fields': ('prioridad', 'observaciones')
        }),
    )


@admin.register(RutaOptimizada)
class RutaOptimizadaAdmin(admin.ModelAdmin):
    list_display = ('id', 'numero_ruta', 'solicitud', 'vehiculo', 'distancia_total_km', 'tiempo_total_min', 'completada')
    list_filter = ('completada', 'solicitud')
    search_fields = ('vehiculo__nombre',)
    readonly_fields = ('numero_paradas', 'utilizacion_capacidad', 'fecha_creacion', 'fecha_actualizacion')
    inlines = [ParadaInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('solicitud', 'vehiculo', 'numero_ruta')
        }),
        ('Métricas', {
            'fields': ('distancia_total_km', 'tiempo_total_min', 'carga_total_kg', 'costo_estimado')
        }),
        ('Horarios', {
            'fields': ('hora_inicio', 'hora_fin_estimada')
        }),
        ('Estado', {
            'fields': ('completada',)
        }),
        ('Estadísticas', {
            'fields': ('numero_paradas', 'utilizacion_capacidad', 'fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Parada)
class ParadaAdmin(admin.ModelAdmin):
    list_display = ('id', 'ruta', 'orden', 'ubicacion', 'es_depot', 'tiempo_llegada_estimado', 'completada')
    list_filter = ('es_depot', 'completada')
    search_fields = ('ubicacion__nombre', 'ruta__vehiculo__nombre')
    readonly_fields = ('hora_llegada_real', 'hora_salida_real')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('ruta', 'entrega', 'ubicacion', 'orden', 'es_depot')
        }),
        ('Tiempos Estimados', {
            'fields': ('tiempo_llegada_estimado', 'tiempo_salida_estimado', 'tiempo_servicio_min')
        }),
        ('Distancia', {
            'fields': ('distancia_desde_anterior_km',)
        }),
        ('Estado', {
            'fields': ('completada', 'hora_llegada_real', 'hora_salida_real')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
    )
