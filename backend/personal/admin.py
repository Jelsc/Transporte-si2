from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Personal, Departamento


@admin.register(Personal)
class PersonalAdmin(admin.ModelAdmin):
    list_display = [
        "nombre_completo",
        "ci",
        "email",
        "departamento",
        "estado",
        "es_activo",
        "anos_antiguedad",
        "fecha_creacion",
    ]

    list_filter = [
        "departamento",
        "estado",
        "es_activo",
        "fecha_ingreso",
        "fecha_creacion",
    ]

    search_fields = ["nombre", "apellido", "email", "ci", "departamento"]

    readonly_fields = [
        "fecha_creacion",
        "fecha_actualizacion",
        "ultimo_acceso",
        "anos_antiguedad",
    ]

    fieldsets = [
        (
            "Información Personal",
            {
                "fields": [
                    "nombre",
                    "apellido",
                    "ci",
                    "email",
                    "telefono",
                    "fecha_nacimiento",
                ]
            },
        ),
        (
            "Información Laboral",
            {"fields": ["departamento", "fecha_ingreso", "anos_antiguedad"]},
        ),
        ("Estado y Jerarquía", {"fields": ["estado", "supervisor", "es_activo"]}),
        (
            "Información Laboral Adicional",
            {"fields": ["horario_trabajo"], "classes": ["collapse"]},
        ),
        (
            "Contacto de Emergencia",
            {
                "fields": ["telefono_emergencia", "contacto_emergencia"],
                "classes": ["collapse"],
            },
        ),
        (
            "Fechas",
            {
                "fields": ["fecha_creacion", "fecha_actualizacion", "ultimo_acceso"],
                "classes": ["collapse"],
            },
        ),
    ]

    def nombre_completo(self, obj):
        """Muestra el nombre completo del empleado"""
        return obj.nombre_completo

    nombre_completo.short_description = "Nombre Completo"
    nombre_completo.admin_order_field = "nombre"

    def anos_antiguedad(self, obj):
        """Muestra los años de antigüedad"""
        return f"{obj.anos_antiguedad} años"

    anos_antiguedad.short_description = "Antigüedad"

    def get_queryset(self, request):
        """Optimiza las consultas"""
        return super().get_queryset(request).select_related("supervisor")

    def save_model(self, request, obj, form, change):
        """Personaliza el guardado del modelo"""
        super().save_model(request, obj, form, change)

    actions = ["activar_empleados", "desactivar_empleados", "marcar_vacaciones"]

    def activar_empleados(self, request, queryset):
        """Acción para activar empleados seleccionados"""
        updated = queryset.update(es_activo=True, estado="activo")
        self.message_user(request, f"{updated} empleado(s) activado(s) exitosamente.")

    activar_empleados.short_description = "Activar empleados seleccionados"

    def desactivar_empleados(self, request, queryset):
        """Acción para desactivar empleados seleccionados"""
        updated = queryset.update(es_activo=False, estado="inactivo")
        self.message_user(
            request, f"{updated} empleado(s) desactivado(s) exitosamente."
        )

    desactivar_empleados.short_description = "Desactivar empleados seleccionados"

    def marcar_vacaciones(self, request, queryset):
        """Acción para marcar empleados en vacaciones"""
        updated = queryset.filter(es_activo=True).update(estado="vacaciones")
        self.message_user(request, f"{updated} empleado(s) marcado(s) en vacaciones.")

    marcar_vacaciones.short_description = "Marcar en vacaciones"


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = [
        "nombre",
        "jefe_departamento",
        "empleados_count",
        "presupuesto",
        "es_activo",
        "fecha_creacion",
    ]

    list_filter = ["es_activo", "fecha_creacion"]

    search_fields = [
        "nombre",
        "descripcion",
        "jefe_departamento__nombre",
        "jefe_departamento__apellido",
    ]

    readonly_fields = ["fecha_creacion", "fecha_actualizacion", "empleados_count"]

    fieldsets = [
        ("Información Básica", {"fields": ["nombre", "descripcion"]}),
        (
            "Administración",
            {"fields": ["jefe_departamento", "presupuesto", "empleados_count"]},
        ),
        ("Estado", {"fields": ["es_activo"]}),
        (
            "Fechas",
            {
                "fields": ["fecha_creacion", "fecha_actualizacion"],
                "classes": ["collapse"],
            },
        ),
    ]

    def empleados_count(self, obj):
        """Muestra el número de empleados del departamento"""
        count = obj.get_empleados_count()
        if count > 0:
            url = reverse("admin:personal_personal_changelist")
            return format_html(
                '<a href="{}?departamento__exact={}">{} empleado(s)</a>',
                url,
                obj.nombre,
                count,
            )
        return "0 empleados"

    empleados_count.short_description = "Empleados"

    def get_queryset(self, request):
        """Optimiza las consultas"""
        return super().get_queryset(request).select_related("jefe_departamento")
