"""
Comando para limpiar reportes generados hace más de X días
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import os
from reportes.models import ReporteGenerado
from django.conf import settings


class Command(BaseCommand):
    help = 'Elimina reportes generados hace más de X días'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dias',
            type=int,
            default=7,
            help='Número de días. Reportes más antiguos serán eliminados (default: 7)'
        )

    def handle(self, *args, **options):
        dias = options['dias']
        fecha_limite = timezone.now() - timedelta(days=dias)
        
        self.stdout.write(f'🗑️  Buscando reportes generados antes de {fecha_limite.strftime("%Y-%m-%d %H:%M:%S")}...')
        
        # Buscar reportes antiguos
        reportes_antiguos = ReporteGenerado.objects.filter(
            fecha_generacion__lt=fecha_limite
        )
        
        total = reportes_antiguos.count()
        eliminados = 0
        errores = 0
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS('✅ No hay reportes antiguos para eliminar'))
            return
        
        self.stdout.write(f'📊 Encontrados {total} reportes para eliminar...')
        
        for reporte in reportes_antiguos:
            try:
                # Intentar eliminar el archivo físico si existe
                if reporte.archivo:
                    file_path = os.path.join(settings.MEDIA_ROOT, str(reporte.archivo))
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        self.stdout.write(f'  ✓ Archivo eliminado: {reporte.archivo}')
                
                # Eliminar el registro de la base de datos
                reporte.delete()
                eliminados += 1
                
            except Exception as e:
                errores += 1
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️  Error al eliminar {reporte.titulo}: {str(e)}')
                )
        
        # Resumen
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Proceso completado:'))
        self.stdout.write(f'   - Eliminados: {eliminados}')
        if errores > 0:
            self.stdout.write(self.style.WARNING(f'   - Errores: {errores}'))
        
        # Limpiar directorios vacíos
        self.limpiar_directorios_vacios()
    
    def limpiar_directorios_vacios(self):
        """Elimina directorios vacíos en la carpeta de reportes"""
        reportes_dir = os.path.join(settings.MEDIA_ROOT, 'reportes')
        
        if not os.path.exists(reportes_dir):
            return
        
        directorios_eliminados = 0
        
        # Recorrer todos los subdirectorios
        for root, dirs, files in os.walk(reportes_dir, topdown=False):
            for dir_name in dirs:
                dir_path = os.path.join(root, dir_name)
                try:
                    # Intentar eliminar si está vacío
                    if not os.listdir(dir_path):
                        os.rmdir(dir_path)
                        directorios_eliminados += 1
                except Exception:
                    pass
        
        if directorios_eliminados > 0:
            self.stdout.write(f'   - Directorios vacíos eliminados: {directorios_eliminados}')
