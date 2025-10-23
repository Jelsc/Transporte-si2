# viajes/management/commands/limpiar_reservas_expiradas.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from viajes.models import Reserva, Asiento, reparar_todos_contadores, forzar_actualizacion_contadores_viaje
from django.db import transaction

class Command(BaseCommand):
    help = 'Limpia reservas expiradas, libera asientos y repara contadores'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Muestra detalles de cada reserva limpiada',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la limpieza sin hacer cambios reales',
        )
        parser.add_argument(
            '--reparar-contadores',
            action='store_true',
            help='Repara los contadores de asientos de todos los viajes',
        )
        parser.add_argument(
            '--reparar-viaje',
            type=int,
            help='Repara los contadores de un viaje específico por ID',
        )
        parser.add_argument(
            '--solo-contadores',
            action='store_true',
            help='Solo repara contadores sin limpiar reservas',
        )

    def handle(self, *args, **options):
        verbose = options['verbose']
        dry_run = options['dry_run']
        reparar_contadores = options['reparar_contadores']
        reparar_viaje = options['reparar_viaje']
        solo_contadores = options['solo_contadores']
        
        # ✅ OPCIÓN 1: Reparar contadores de un viaje específico
        if reparar_viaje:
            self.stdout.write(f'🔄 Reparando contadores del viaje {reparar_viaje}...')
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(f'🔍 SIMULACIÓN: Se repararían contadores del viaje {reparar_viaje}')
                )
            else:
                if forzar_actualizacion_contadores_viaje(reparar_viaje):
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Contadores del viaje {reparar_viaje} reparados correctamente')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error reparando contadores del viaje {reparar_viaje}')
                    )
            return
        
        # ✅ OPCIÓN 2: Reparar todos los contadores
        if reparar_contadores or solo_contadores:
            self.stdout.write('🔄 Reparando contadores de todos los viajes...')
            if dry_run:
                self.stdout.write(
                    self.style.WARNING('🔍 SIMULACIÓN: Se repararían todos los contadores')
                )
            else:
                total_reparados = reparar_todos_contadores()
                if total_reparados > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Reparados {total_reparados} viajes correctamente')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING('ℹ️ No se necesitó reparar ningún viaje')
                    )
            
            if solo_contadores:
                return  # Salir si solo queremos reparar contadores
        
        # ✅ OPCIÓN 3: Limpiar reservas expiradas (comportamiento original)
        self.stdout.write('🔄 Buscando reservas expiradas...')
        
        try:
            with transaction.atomic():
                # Encontrar reservas pendientes que han expirado
                reservas_expiradas = Reserva.objects.filter(
                    estado='pendiente_pago',
                    fecha_expiracion__lt=timezone.now()
                )
                
                count = reservas_expiradas.count()
                
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f'🔍 MODO SIMULACIÓN: Se limpiarían {count} reservas expiradas'
                        )
                    )
                    
                    # Mostrar detalles en modo verbose
                    if verbose and count > 0:
                        for reserva in reservas_expiradas:
                            self.stdout.write(
                                f'   🗑️  Reserva {reserva.codigo_reserva} - '
                                f'Cliente: {reserva.cliente.username} - '
                                f'Viaje: {reserva.viaje.origen} → {reserva.viaje.destino}'
                            )
                else:
                    # Procesar cada reserva expirada
                    reservas_procesadas = 0
                    asientos_liberados_total = 0
                    
                    for reserva in reservas_expiradas:
                        if verbose:
                            self.stdout.write(
                                f'   🗑️  Limpiando reserva {reserva.codigo_reserva}'
                            )
                        
                        # ✅ MEJORADO: Usar el método liberar_asientos que actualiza contadores
                        asientos_liberados = 0
                        try:
                            # Liberar asientos temporales
                            asientos_temp = Asiento.objects.filter(
                                reserva_temporal=reserva
                            ).update(estado='libre', reserva_temporal=None)
                            
                            # Liberar asientos de items de reserva
                            for item in reserva.items.all():
                                if item.asiento:
                                    item.asiento.estado = 'libre'
                                    item.asiento.reserva_temporal = None
                                    item.asiento.save()
                                    asientos_liberados += 1
                            
                            # Marcar reserva como expirada
                            reserva.estado = 'expirada'
                            reserva.save()
                            
                            asientos_liberados_total += asientos_liberados
                            reservas_procesadas += 1
                            
                            if verbose:
                                self.stdout.write(
                                    f'   ✅ Liberados {asientos_liberados} asientos'
                                )
                                
                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(f'   ❌ Error procesando reserva {reserva.codigo_reserva}: {str(e)}')
                            )
                
                    if reservas_procesadas > 0:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✅ Limpiadas {reservas_procesadas} reservas expiradas '
                                f'({asientos_liberados_total} asientos liberados)'
                            )
                        )
                    else:
                        self.stdout.write('ℹ️ No se encontraron reservas expiradas')
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error limpiando reservas: {str(e)}')
            )

    def print_usage_examples(self):
        """Muestra ejemplos de uso del comando"""
        self.stdout.write("\n📖 EJEMPLOS DE USO:")
        self.stdout.write("  python manage.py limpiar_reservas_expiradas")
        self.stdout.write("  # Limpia reservas expiradas (comportamiento normal)")
        
        self.stdout.write("\n  python manage.py limpiar_reservas_expiradas --verbose")
        self.stdout.write("  # Limpia reservas mostrando detalles")
        
        self.stdout.write("\n  python manage.py limpiar_reservas_expiradas --dry-run")
        self.stdout.write("  # Simula la limpieza sin hacer cambios")
        
        self.stdout.write("\n  python manage.py limpiar_reservas_expiradas --reparar-contadores")
        self.stdout.write("  # Repara contadores Y limpia reservas")
        
        self.stdout.write("\n  python manage.py limpiar_reservas_expiradas --solo-contadores")
        self.stdout.write("  # Solo repara contadores sin limpiar reservas")
        
        self.stdout.write("\n  python manage.py limpiar_reservas_expiradas --reparar-viaje 5")
        self.stdout.write("  # Repara contadores del viaje con ID 5")