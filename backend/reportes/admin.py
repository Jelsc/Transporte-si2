from django.contrib import admin
from .models import ReporteGenerado


@admin.register(ReporteGenerado)
class ReporteGeneradoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'categoria', 'usuario', 'fecha_generacion', 'tamaño_archivo']
    list_filter = ['tipo', 'categoria', 'fecha_generacion']
    search_fields = ['titulo', 'usuario__username', 'usuario__email']
    readonly_fields = ['fecha_generacion', 'tamaño_archivo', 'tiempo_generacion']
    date_hierarchy = 'fecha_generacion'
    
    fieldsets = (
        ('Información del Reporte', {
            'fields': ('titulo', 'tipo', 'categoria', 'archivo')
        }),
        ('Metadata', {
            'fields': ('usuario', 'fecha_generacion', 'parametros', 'tamaño_archivo', 'tiempo_generacion')
        }),
    )
    
    def has_add_permission(self, request):
        # No permitir crear reportes desde el admin
        return False
