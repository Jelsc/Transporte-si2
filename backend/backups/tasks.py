# backups/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import BackupConfig
from .services import BackupService
import logging

logger = logging.getLogger(__name__)


@shared_task
def ejecutar_backups_programados():
    """
    Tarea de Celery que ejecuta los backups programados
    Se ejecuta cada minuto verificando si hay backups pendientes
    """
    ahora = timezone.now()
    backup_service = BackupService()
    
    # Buscar configuraciones activas con backup pendiente
    # Usamos un margen de 1 minuto para asegurar que se ejecute cerca de la hora exacta
    margen = timedelta(minutes=1)
    configs_pendientes = BackupConfig.objects.filter(
        activo=True,
        frecuencia__in=['daily', 'weekly', 'monthly'],
        proximo_backup__lte=ahora + margen
    )
    
    logger.info(f"Ejecutando backups programados. Encontradas {configs_pendientes.count()} configuraciones pendientes")
    
    for config in configs_pendientes:
        try:
            # Verificar que el backup realmente debe ejecutarse ahora
            # Solo ejecutar si la hora programada ya pasó (con un margen de 1 minuto)
            hora_programada = config.proximo_backup
            if hora_programada and hora_programada <= ahora + margen:
                logger.info(f"Ejecutando backup para configuración: {config.nombre} (programado para {hora_programada})")
                
                # Crear backup
                resultado = backup_service.crear_backup_database(
                    usuario=config.creado_por,
                    config=config
                )
                
                if resultado['success']:
                    # Actualizar fechas
                    config.ultima_ejecucion = timezone.now()
                    config.proximo_backup = backup_service.calcular_proximo_backup(config)
                    config.save()
                    
                    logger.info(f"Backup completado exitosamente: {resultado['backup'].nombre_archivo}")
                    logger.info(f"Próximo backup programado para: {config.proximo_backup}")
                else:
                    logger.error(f"Error al crear backup para {config.nombre}: {resultado['error']}")
            else:
                logger.debug(f"Backup {config.nombre} aún no está listo (programado para {hora_programada})")
                
        except Exception as e:
            logger.error(f"Error inesperado al procesar configuración {config.nombre}: {str(e)}")
    
    return f"Backups programados ejecutados: {configs_pendientes.count()} configuraciones procesadas"


@shared_task
def limpiar_backups_antiguos_tarea():
    """
    Tarea que limpia backups antiguos según la política de retención
    Se ejecuta diariamente
    """
    backup_service = BackupService()
    configs_activas = BackupConfig.objects.filter(activo=True)
    
    total_eliminados = 0
    
    for config in configs_activas:
        try:
            logger.info(f"Limpiando backups antiguos para configuración: {config.nombre}")
            backup_service.limpiar_backups_antiguos(config)
            
        except Exception as e:
            logger.error(f"Error al limpiar backups para {config.nombre}: {str(e)}")
    
    logger.info(f"Limpieza de backups completada")
    return f"Limpieza completada para {configs_activas.count()} configuraciones"
