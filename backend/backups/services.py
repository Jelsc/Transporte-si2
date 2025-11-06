# backups/services.py
import os
import subprocess
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from django.conf import settings
from django.utils import timezone
from django.db import models as django_models
from .models import Backup, BackupConfig


class BackupService:
    """Servicio para gestionar backups de la base de datos"""
    
    def __init__(self):
        self.backup_dir = Path(settings.BASE_DIR) / 'backups_storage'
        self.backup_dir.mkdir(exist_ok=True)
    
    def crear_backup_database(self, usuario=None, config=None):
        """Crea un backup de la base de datos PostgreSQL"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nombre_archivo = f"db_backup_{timestamp}.sql"
        ruta_completa = self.backup_dir / nombre_archivo
        
        # Crear registro de backup
        backup = Backup.objects.create(
            config=config,
            nombre_archivo=nombre_archivo,
            ruta_archivo=str(ruta_completa),
            estado='processing',
            tipo='database',
            creado_por=usuario
        )
        
        try:
            inicio = timezone.now()
            
            # Obtener configuración de la base de datos
            db_config = settings.DATABASES['default']
            db_name = db_config.get('NAME', 'transporte')
            db_user = db_config.get('USER', 'postgres')
            db_password = db_config.get('PASSWORD', 'postgres')
            db_host = db_config.get('HOST', 'localhost')
            db_port = db_config.get('PORT', '5432')
            
            # Comando pg_dump
            env = os.environ.copy()
            env['PGPASSWORD'] = db_password
            
            cmd = [
                'pg_dump',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-F', 'c',  # Formato custom (comprimido)
                '-b',  # Incluir blobs
                '-v',  # Verbose
                '-f', str(ruta_completa),
                db_name
            ]
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=600  # 10 minutos timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Error en pg_dump: {result.stderr}")
            
            # Actualizar backup
            fin = timezone.now()
            backup.estado = 'completed'
            backup.fin = fin
            backup.duracion = (fin - inicio).total_seconds()
            backup.tamanio = ruta_completa.stat().st_size
            backup.save()
            
            # Limpiar backups antiguos
            if config:
                self.limpiar_backups_antiguos(config)
            
            return {
                'success': True,
                'backup': backup,
                'mensaje': f'Backup creado exitosamente: {nombre_archivo}'
            }
            
        except subprocess.TimeoutExpired:
            backup.estado = 'failed'
            backup.mensaje_error = 'Timeout: El backup tardó más de 10 minutos'
            backup.fin = timezone.now()
            backup.save()
            
            return {
                'success': False,
                'error': 'Timeout en la creación del backup',
                'backup': backup
            }
            
        except Exception as e:
            backup.estado = 'failed'
            backup.mensaje_error = str(e)
            backup.fin = timezone.now()
            backup.save()
            
            # Eliminar archivo si existe
            if ruta_completa.exists():
                ruta_completa.unlink()
            
            return {
                'success': False,
                'error': str(e),
                'backup': backup
            }
    
    def restaurar_backup(self, backup_id, usuario=None):
        """Restaura un backup de la base de datos"""
        try:
            backup = Backup.objects.get(id=backup_id)
            ruta_archivo = Path(backup.ruta_archivo)
            
            if not ruta_archivo.exists():
                return {
                    'success': False,
                    'error': 'Archivo de backup no encontrado'
                }
            
            # Obtener configuración de la base de datos
            db_config = settings.DATABASES['default']
            db_name = db_config.get('NAME', 'transporte')
            db_user = db_config.get('USER', 'postgres')
            db_password = db_config.get('PASSWORD', 'postgres')
            db_host = db_config.get('HOST', 'localhost')
            db_port = db_config.get('PORT', '5432')
            
            # Comando pg_restore
            env = os.environ.copy()
            env['PGPASSWORD'] = db_password
            
            cmd = [
                'pg_restore',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                '-c',  # Clean (drop) antes de restaurar
                '-v',  # Verbose
                str(ruta_archivo)
            ]
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=600
            )
            
            if result.returncode != 0:
                # pg_restore puede retornar warning codes que no son errores críticos
                if 'ERROR' in result.stderr:
                    raise Exception(f"Error en pg_restore: {result.stderr}")
            
            return {
                'success': True,
                'mensaje': f'Backup restaurado exitosamente desde {backup.nombre_archivo}'
            }
            
        except Backup.DoesNotExist:
            return {
                'success': False,
                'error': 'Backup no encontrado'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def descargar_backup(self, backup_id):
        """Obtiene la ruta del archivo de backup para descarga"""
        try:
            backup = Backup.objects.get(id=backup_id)
            ruta_archivo = Path(backup.ruta_archivo)
            
            if not ruta_archivo.exists():
                return None
            
            return ruta_archivo
            
        except Backup.DoesNotExist:
            return None
    
    def eliminar_backup(self, backup_id):
        """Elimina un backup físicamente y de la base de datos"""
        try:
            backup = Backup.objects.get(id=backup_id)
            ruta_archivo = Path(backup.ruta_archivo)
            
            # Eliminar archivo físico
            if ruta_archivo.exists():
                ruta_archivo.unlink()
            
            # Eliminar registro
            backup.delete()
            
            return {
                'success': True,
                'mensaje': 'Backup eliminado exitosamente'
            }
            
        except Backup.DoesNotExist:
            return {
                'success': False,
                'error': 'Backup no encontrado'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def limpiar_backups_antiguos(self, config):
        """Elimina backups antiguos según la configuración"""
        try:
            backups = Backup.objects.filter(
                config=config,
                estado='completed'
            ).order_by('-inicio')
            
            # Mantener solo los N backups más recientes
            backups_a_eliminar = backups[config.max_backups:]
            
            for backup in backups_a_eliminar:
                ruta_archivo = Path(backup.ruta_archivo)
                if ruta_archivo.exists():
                    ruta_archivo.unlink()
                backup.delete()
            
            return len(backups_a_eliminar)
            
        except Exception as e:
            print(f"Error limpiando backups antiguos: {e}")
            return 0
    
    def calcular_proximo_backup(self, config):
        """Calcula la fecha del próximo backup"""
        ahora = timezone.now()
        hora = config.hora_ejecucion
        
        if config.frecuencia == 'daily':
            # Diario a la hora configurada
            proximo = ahora.replace(hour=hora.hour, minute=hora.minute, second=0, microsecond=0)
            if proximo <= ahora:
                proximo += timedelta(days=1)
            return proximo
            
        elif config.frecuencia == 'weekly':
            # Semanal en el día configurado
            dias_hasta_objetivo = (config.dia_semana - ahora.weekday()) % 7
            if dias_hasta_objetivo == 0:
                # Es hoy, verificar si ya pasó la hora
                proximo = ahora.replace(hour=hora.hour, minute=hora.minute, second=0, microsecond=0)
                if proximo <= ahora:
                    dias_hasta_objetivo = 7
            
            proximo = ahora + timedelta(days=dias_hasta_objetivo)
            return proximo.replace(hour=hora.hour, minute=hora.minute, second=0, microsecond=0)
            
        elif config.frecuencia == 'monthly':
            # Mensual en el día configurado
            proximo = ahora.replace(day=config.dia_mes, hour=hora.hour, minute=hora.minute, second=0, microsecond=0)
            if proximo <= ahora:
                # Próximo mes
                if ahora.month == 12:
                    proximo = proximo.replace(year=ahora.year + 1, month=1)
                else:
                    proximo = proximo.replace(month=ahora.month + 1)
            return proximo
        
        return None
    
    def obtener_estadisticas(self):
        """Obtiene estadísticas de backups"""
        total_backups = Backup.objects.count()
        completados = Backup.objects.filter(estado='completed').count()
        fallidos = Backup.objects.filter(estado='failed').count()
        
        # Tamaño total
        tamanio_total = Backup.objects.filter(estado='completed').aggregate(
            total=django_models.Sum('tamanio')
        )['total'] or 0
        
        # Último backup
        ultimo_backup = Backup.objects.filter(estado='completed').order_by('-inicio').first()
        
        return {
            'total_backups': total_backups,
            'completados': completados,
            'fallidos': fallidos,
            'tamanio_total': tamanio_total,
            'ultimo_backup': ultimo_backup
        }
