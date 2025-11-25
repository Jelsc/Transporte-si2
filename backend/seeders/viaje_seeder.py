"""
Seeder para datos de Viajes históricos.
Genera viajes con diferentes estados, fechas, precios y ocupaciones
para entrenar los modelos de predicción.
"""
from .base_seeder import BaseSeeder
from django.utils import timezone
from datetime import timedelta, date, time
from decimal import Decimal
import random


class ViajeSeeder(BaseSeeder):
    """
    Crea datos históricos de viajes para el sistema de transporte.
    Genera viajes en los últimos 60 días con diferentes estados y ocupaciones.
    Los datos están distribuidos uniformemente para predicciones más concisas.
    """
    
    @classmethod
    def run(cls):
        """
        Crea registros de viajes históricos con datos variados.
        """
        try:
            from viajes.models import Viaje, Reserva, ItemReserva, Asiento
            from ubicaciones.models import Ubicacion
            from vehiculos.models import Vehiculo
            from users.models import CustomUser
            
            # Verificar que existan ubicaciones y vehículos
            from ubicaciones.models import TipoUbicacion
            ubicaciones = list(Ubicacion.objects.filter(activo=True, tipo=TipoUbicacion.TERMINAL))
            vehiculos = list(Vehiculo.objects.filter(estado='activo'))
            usuarios = list(CustomUser.objects.filter(is_active=True))
            
            if len(ubicaciones) < 2:
                print("❌ Error: Se necesitan al menos 2 ubicaciones activas para crear viajes")
                return
            
            if len(vehiculos) == 0:
                print("❌ Error: Se necesitan al menos 1 vehículo activo para crear viajes")
                return
            
            if len(usuarios) == 0:
                print("⚠️ Advertencia: No hay usuarios disponibles para crear reservas")
            
            print(f"📊 Creando viajes históricos con {len(ubicaciones)} ubicaciones y {len(vehiculos)} vehículos...")
            
            # Generar viajes para los últimos 60 días (distribuidos uniformemente)
            hoy = timezone.now().date()
            fecha_inicio = hoy - timedelta(days=60)
            
            viajes_creados = 0
            reservas_creadas = 0
            
            # Horarios comunes de salida
            horarios = [
                time(6, 0),   # 06:00
                time(8, 0),   # 08:00
                time(10, 0), # 10:00
                time(12, 0), # 12:00
                time(14, 0), # 14:00
                time(16, 0), # 16:00
                time(18, 0), # 18:00
                time(20, 0), # 20:00
                time(22, 0), # 22:00
            ]
            
            # Precios base por ruta (simulando diferentes distancias)
            precios_base = {
                'corta': Decimal('25.00'),   # Rutas cortas
                'media': Decimal('50.00'),   # Rutas medias
                'larga': Decimal('80.00'),   # Rutas largas
            }
            
            # Generar viajes día por día (distribución uniforme)
            fecha_actual = fecha_inicio
            total_dias = (hoy - fecha_inicio).days + 1
            
            # Calcular número promedio de viajes por día para distribución uniforme
            # Objetivo: ~400-500 viajes en 60 días = ~7-8 viajes por día en promedio
            viajes_objetivo = random.randint(400, 500)
            viajes_por_dia_promedio = viajes_objetivo / total_dias
            
            while fecha_actual <= hoy:
                # Más viajes en días laborables (lunes a viernes)
                es_fin_semana = fecha_actual.weekday() >= 5
                
                # Distribución más uniforme: días laborables más viajes, fines de semana menos
                if not es_fin_semana:
                    # Días laborables: 6-10 viajes (más variación)
                    num_viajes_dia = random.randint(
                        max(4, int(viajes_por_dia_promedio * 0.7)),
                        int(viajes_por_dia_promedio * 1.3)
                    )
                else:
                    # Fines de semana: 2-5 viajes
                    num_viajes_dia = random.randint(
                        max(1, int(viajes_por_dia_promedio * 0.3)),
                        int(viajes_por_dia_promedio * 0.6)
                    )
                
                for _ in range(num_viajes_dia):
                    # Seleccionar origen y destino aleatorios (diferentes)
                    origen = random.choice(ubicaciones)
                    destino = random.choice([u for u in ubicaciones if u.id != origen.id])
                    
                    # Seleccionar vehículo aleatorio
                    vehiculo = random.choice(vehiculos)
                    
                    # Seleccionar horario aleatorio
                    hora_salida = random.choice(horarios)
                    
                    # Determinar precio según "distancia" (simulado)
                    distancia_tipo = random.choice(['corta', 'media', 'larga'])
                    precio_base = precios_base[distancia_tipo]
                    # Variación de precio ±20%
                    variacion = Decimal(str(random.uniform(0.8, 1.2)))
                    precio = (precio_base * variacion).quantize(Decimal('0.01'))
                    
                    # Determinar estado según la fecha (distribución más realista)
                    dias_desde_hoy = (fecha_actual - hoy).days
                    
                    if dias_desde_hoy < -7:
                        # Viajes antiguos (más de 7 días atrás): completados o cancelados
                        estado = random.choices(
                            ['completado', 'cancelado'],
                            weights=[88, 12]  # 88% completados, 12% cancelados
                        )[0]
                    elif dias_desde_hoy < 0:
                        # Viajes recientes (últimos 7 días): completados o en curso
                        # Más probabilidad de completados cuanto más antiguo
                        probabilidad_completado = min(95, 70 + abs(dias_desde_hoy) * 3)
                        estado = random.choices(
                            ['completado', 'en_curso'],
                            weights=[probabilidad_completado, 100 - probabilidad_completado]
                        )[0]
                    elif dias_desde_hoy == 0:
                        # Hoy: puede estar en curso o programado
                        estado = random.choices(
                            ['en_curso', 'programado'],
                            weights=[40, 60]
                        )[0]
                    else:
                        # Viajes futuros: programados
                        estado = 'programado'
                    
                    # Crear el viaje
                    viaje = Viaje.objects.create(
                        origen=origen,
                        destino=destino,
                        fecha=fecha_actual,
                        hora=hora_salida,
                        vehiculo=vehiculo,
                        precio=precio,
                        estado=estado,
                        asientos_disponibles=vehiculo.capacidad_pasajeros,
                        asientos_ocupados=0,
                    )
                    
                    viajes_creados += 1
                    
                    # Para viajes completados o en curso, generar reservas
                    num_reservas_creadas = 0
                    if estado in ['completado', 'en_curso'] and len(usuarios) > 0:
                        # Ocupación variada: algunos viajes llenos, otros parciales
                        ocupacion_porcentaje = random.choices(
                            [0.2, 0.4, 0.6, 0.8, 0.95, 1.0],  # 20%, 40%, 60%, 80%, 95%, 100%
                            weights=[5, 10, 15, 20, 25, 25]  # Más probabilidad de alta ocupación
                        )[0]
                        
                        num_reservas = int(vehiculo.capacidad_pasajeros * ocupacion_porcentaje)
                        num_reservas = min(num_reservas, vehiculo.capacidad_pasajeros)
                        
                        # Crear reservas confirmadas/pagadas
                        for i in range(num_reservas):
                            if i >= len(usuarios):
                                break
                            
                            cliente = random.choice(usuarios)
                            
                            # Fecha de reserva: antes de la fecha del viaje
                            dias_antes = random.randint(1, 30)
                            fecha_reserva = fecha_actual - timedelta(days=dias_antes)
                            
                            # Estado de reserva
                            estado_reserva = random.choices(
                                ['pagada', 'confirmada'],
                                weights=[80, 20]
                            )[0]
                            
                            reserva = Reserva.objects.create(
                                cliente=cliente,
                                viaje=viaje,
                                fecha_reserva=timezone.make_aware(
                                    timezone.datetime.combine(fecha_reserva, time(12, 0))
                                ),
                                estado=estado_reserva,
                                total=precio,
                                pagado=(estado_reserva == 'pagada'),
                            )
                            
                            # Obtener un asiento disponible
                            asiento = Asiento.objects.filter(viaje=viaje, estado='libre').first()
                            if asiento:
                                asiento.estado = 'ocupado'
                                asiento.save()
                                
                                # Crear item de reserva
                                ItemReserva.objects.create(
                                    reserva=reserva,
                                    asiento=asiento,
                                    precio=precio,
                                )
                                
                                num_reservas_creadas += 1
                                reservas_creadas += 1
                    
                    # Actualizar contadores del viaje
                    viaje.refresh_from_db()
                    asientos_ocupados = Asiento.objects.filter(
                        viaje=viaje,
                        estado='ocupado'
                    ).count()
                    
                    # Calcular asientos disponibles correctamente
                    asientos_disponibles = max(0, vehiculo.capacidad_pasajeros - asientos_ocupados)
                    
                    # Actualizar usando update() para evitar validaciones
                    Viaje.objects.filter(id=viaje.id).update(
                        asientos_ocupados=asientos_ocupados,
                        asientos_disponibles=asientos_disponibles
                    )
                
                # Avanzar al siguiente día
                fecha_actual += timedelta(days=1)
            
            print(f"✅ Se crearon {viajes_creados} viajes históricos")
            print(f"✅ Se crearon {reservas_creadas} reservas")
            print(f"📅 Rango de fechas: {fecha_inicio} a {hoy} ({total_dias} días)")
            print(f"📊 Promedio: {viajes_creados / total_dias:.1f} viajes por día")
            
            return viajes_creados
            
        except ImportError as e:
            print(f"❌ Error de importación: {str(e)}")
            print("Verifica que los modelos estén correctamente importados")
        except Exception as e:
            print(f"❌ Error al crear viajes: {str(e)}")
            import traceback
            traceback.print_exc()
    
    @classmethod
    def should_run(cls):
        """
        El seeder de viajes puede ejecutarse siempre, pero es recomendable
        ejecutarlo solo si hay pocos viajes o si se usa --force.
        """
        try:
            from viajes.models import Viaje
            # Solo ejecutar si hay menos de 50 viajes
            return Viaje.objects.count() < 50
        except ImportError:
            return False

