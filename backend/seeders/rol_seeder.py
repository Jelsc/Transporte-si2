"""
Seeder para crear los roles iniciales del sistema.
"""
from .base_seeder import BaseSeeder

class RolSeeder(BaseSeeder):
    """
    Crea los roles iniciales del sistema.
    """
    
    @classmethod
    def run(cls):
        """
        Crea los roles predefinidos del sistema si no existen.
        """
        try:
            from users.models import Rol
            
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
                    
        except ImportError:
            print("❌ Error: No se pudo importar el modelo Rol. Verifica que existe en users.models.")
    
    @classmethod
    def should_run(cls):
        """
        El seeder de roles debe ejecutarse siempre para garantizar que existan todos los roles.
        """
        try:
            from users.models import Rol
            # Ejecutar si no existen todos los roles esperados
            roles_esperados = ["Cliente", "Administrador", "Supervisor", "Conductor", "Operador"]
            roles_existentes = set(Rol.objects.values_list("nombre", flat=True))
            return not all(rol in roles_existentes for rol in roles_esperados)
        except:
            # Si hay error al verificar, mejor ejecutar el seeder
            return True
