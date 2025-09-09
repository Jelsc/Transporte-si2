import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from users.models import Rol, CustomUser


def create_initial_roles():
    """Crear roles iniciales del sistema"""
    roles_data = [
        {
            "nombre": "Cliente",
            "descripcion": "Usuario final que utiliza el servicio de transporte",
            "es_administrativo": False,
            "permisos": ["ver_perfil", "solicitar_viaje", "ver_historial"],
        },
        {
            "nombre": "Administrador",
            "descripcion": "Administrador general del sistema",
            "es_administrativo": True,
            "permisos": [
                "gestionar_usuarios",
                "gestionar_vehiculos",
                "ver_reportes",
                "gestionar_rutas",
            ],
        },
        {
            "nombre": "Supervisor",
            "descripcion": "Supervisor de operaciones",
            "es_administrativo": True,
            "permisos": [
                "ver_reportes",
                "gestionar_conductores",
                "gestionar_vehiculos",
            ],
        },
        {
            "nombre": "Conductor",
            "descripcion": "Conductor de vehículos",
            "es_administrativo": False,
            "permisos": ["ver_viajes_asignados", "actualizar_estado", "ver_perfil"],
        },
        {
            "nombre": "Operador",
            "descripcion": "Operador de centro de control",
            "es_administrativo": True,
            "permisos": ["asignar_viajes", "monitorear_vehiculos", "ver_reportes"],
        },
    ]

    for role_data in roles_data:
        rol, created = Rol.objects.get_or_create(
            nombre=role_data["nombre"], defaults=role_data
        )
        if created:
            print(f"✓ Rol creado: {rol.nombre}")
        else:
            print(f"- Rol ya existe: {rol.nombre}")


def create_admin_user():
    """Crear usuario administrador inicial"""
    admin_rol = Rol.objects.get(nombre="Administrador")

    if not CustomUser.objects.filter(username="admin").exists():
        admin_user = CustomUser.objects.create_superuser(
            username="admin",
            email="admin@transporte.com",
            password="admin123",
            first_name="Administrador",
            last_name="Sistema",
            rol=admin_rol,
            codigo_empleado="ADM001",
            departamento="Administración",
        )
        print("✓ Usuario administrador creado: admin/admin123")
    else:
        print("- Usuario administrador ya existe")


if __name__ == "__main__":
    print("Creando datos iniciales...")
    create_initial_roles()
    create_admin_user()
    print("✓ Datos iniciales creados exitosamente")
