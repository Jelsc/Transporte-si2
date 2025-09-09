from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser, Rol


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ["nombre", "es_administrativo", "descripcion"]
    list_filter = ["es_administrativo"]
    search_fields = ["nombre", "descripcion"]


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "rol",
        "es_activo",
        "fecha_creacion",
    ]
    list_filter = ["rol", "es_activo", "is_staff", "is_superuser", "fecha_creacion"]
    search_fields = ["username", "email", "first_name", "last_name", "codigo_empleado"]
    ordering = ["-fecha_creacion"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Información Personal",
            {"fields": ("telefono", "direccion", "fecha_nacimiento")},
        ),
        (
            "Información Laboral",
            {"fields": ("rol", "codigo_empleado", "departamento", "es_activo")},
        ),
        (
            "Fechas",
            {
                "fields": ("fecha_creacion", "fecha_ultimo_acceso"),
                "classes": ("collapse",),
            },
        ),
    )

    readonly_fields = ["fecha_creacion", "fecha_ultimo_acceso"]
