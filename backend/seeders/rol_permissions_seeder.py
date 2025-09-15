from django.core.management.base import BaseCommand
from users.models import Rol
from users.constants import PERMISOS_SISTEMA, GRUPOS_PERMISOS


class Command(BaseCommand):
    help = 'Crea los roles y permisos del sistema'

    def handle(self, *args, **options):
        self.stdout.write('Creando roles y permisos...')
        
        # Crear roles con sus permisos correspondientes
        for rol_nombre, permisos in GRUPOS_PERMISOS.items():
            rol, created = Rol.objects.get_or_create(
                nombre=rol_nombre,
                defaults={
                    'descripcion': f'Rol de {rol_nombre}',
                    'es_administrativo': rol_nombre != 'cliente',
                    'permisos': permisos
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Rol "{rol_nombre}" creado con {len(permisos)} permisos')
                )
            else:
                # Actualizar permisos si el rol ya existe
                rol.permisos = permisos
                rol.save()
                self.stdout.write(
                    self.style.WARNING(f'⚠ Rol "{rol_nombre}" actualizado con {len(permisos)} permisos')
                )
        
        # Verificar que todos los permisos del sistema estén definidos
        permisos_sistema = [permiso[0] for permiso in PERMISOS_SISTEMA]
        permisos_asignados = set()
        
        for rol in Rol.objects.all():
            permisos_asignados.update(rol.permisos)
        
        permisos_no_asignados = set(permisos_sistema) - permisos_asignados
        if permisos_no_asignados:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠ Permisos no asignados a ningún rol: {", ".join(permisos_no_asignados)}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Seeder completado. {Rol.objects.count()} roles creados/actualizados.'
            )
        )
