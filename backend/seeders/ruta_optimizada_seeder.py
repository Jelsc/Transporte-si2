from decimal import Decimal
from datetime import date, time, datetime, timedelta
from django.db import transaction
from .base_seeder import BaseSeeder
from rutas_optimizadas.models import SolicitudRuta, Entrega
from ubicaciones.models import Ubicacion
from vehiculos.models import Vehiculo


class RutaOptimizadaSeeder(BaseSeeder):
    """Seeder para solicitudes de rutas optimizadas de ejemplo"""
    
    @classmethod
    def run(cls):
        """Crear solicitudes de rutas optimizadas de ejemplo"""
        
        # Obtener ubicaciones necesarias
        try:
            depot = Ubicacion.objects.filter(tipo='TERMINAL').first()
            if not depot:
                print("⚠️  No hay terminales disponibles como depot")
                return
            
            ubicaciones_entrega = list(Ubicacion.objects.filter(
                tipo__in=['AGENCIA', 'PRIVADO'],
                activo=True
            )[:6])
            
            if len(ubicaciones_entrega) < 3:
                print("⚠️  No hay suficientes ubicaciones para entregas")
                return
            
            # Obtener vehículos (cualquier estado, priorizando disponibles)
            vehiculos = list(Vehiculo.objects.filter(estado='disponible')[:3])
            if len(vehiculos) < 2:
                # Si no hay suficientes disponibles, tomar cualquier vehículo
                vehiculos = list(Vehiculo.objects.exclude(estado='fuera_servicio')[:3])
                if len(vehiculos) < 2:
                    print("⚠️  No hay suficientes vehículos en el sistema")
                    return
                print(f"ℹ️  Usando {len(vehiculos)} vehículos (no todos están disponibles)")
            
        except Exception as e:
            print(f"❌ Error al obtener datos: {str(e)}")
            return
        
        # Solicitud 1: Ruta de entregas matutina
        print("📦 Creando solicitud de ruta 1: Entregas Matutinas...")
        try:
            solicitud1 = SolicitudRuta.objects.create(
                fecha_viaje=date.today() + timedelta(days=1),
                hora_inicio=time(8, 0),
                estado='pendiente',
                depot=depot,
                mensaje_resultado=None
            )
            
            # Agregar vehículos disponibles
            solicitud1.vehiculos_disponibles.set(vehiculos[:2])
            
            # Crear entregas para la solicitud 1
            entregas_1 = [
                {
                    'solicitud': solicitud1,
                    'ubicacion': ubicaciones_entrega[0],
                    'tipo': 'delivery',
                    'ventana_tiempo_inicio': time(8, 0),
                    'ventana_tiempo_fin': time(18, 0),
                    'demanda_peso': Decimal('15.50'),
                    'demanda_volumen': Decimal('0.25'),
                    'tiempo_servicio_min': 10,
                    'prioridad': 1,
                    'observaciones': 'Paquete frágil - manejar con cuidado'
                },
                {
                    'solicitud': solicitud1,
                    'ubicacion': ubicaciones_entrega[1],
                    'tipo': 'delivery',
                    'ventana_tiempo_inicio': time(8, 0),
                    'ventana_tiempo_fin': time(18, 0),
                    'demanda_peso': Decimal('8.20'),
                    'demanda_volumen': Decimal('0.15'),
                    'tiempo_servicio_min': 8,
                    'prioridad': 2,
                    'observaciones': 'Documentos importantes - requiere firma'
                },
                {
                    'solicitud': solicitud1,
                    'ubicacion': ubicaciones_entrega[2],
                    'tipo': 'delivery',
                    'ventana_tiempo_inicio': time(8, 0),
                    'ventana_tiempo_fin': time(18, 0),
                    'demanda_peso': Decimal('25.00'),
                    'demanda_volumen': Decimal('0.50'),
                    'tiempo_servicio_min': 15,
                    'prioridad': 1,
                    'observaciones': 'Entrega de equipos electrónicos'
                },
                {
                    'solicitud': solicitud1,
                    'ubicacion': ubicaciones_entrega[3] if len(ubicaciones_entrega) > 3 else ubicaciones_entrega[0],
                    'tipo': 'pickup',
                    'ventana_tiempo_inicio': time(8, 0),
                    'ventana_tiempo_fin': time(18, 0),
                    'demanda_peso': Decimal('12.30'),
                    'demanda_volumen': Decimal('0.20'),
                    'tiempo_servicio_min': 12,
                    'prioridad': 1,
                    'observaciones': 'Recoger paquetes para devolución'
                }
            ]
            
            for entrega_data in entregas_1:
                Entrega.objects.create(**entrega_data)
            
            print(f"✅ Solicitud 1 creada: {solicitud1.numero_entregas} entregas")
            
        except Exception as e:
            print(f"❌ Error creando solicitud 1: {str(e)}")
        
        # Solicitud 2: Ruta de entregas y recogidas vespertina
        print("📦 Creando solicitud de ruta 2: Entregas Vespertinas...")
        try:
            solicitud2 = SolicitudRuta.objects.create(
                fecha_viaje=date.today() + timedelta(days=2),
                hora_inicio=time(14, 0),
                estado='pendiente',
                depot=depot,
                mensaje_resultado=None
            )
            
            # Agregar vehículos disponibles (todos los disponibles)
            solicitud2.vehiculos_disponibles.set(vehiculos)
            
            # Crear entregas para la solicitud 2
            entregas_2 = [
                {
                    'solicitud': solicitud2,
                    'ubicacion': ubicaciones_entrega[1],
                    'tipo': 'delivery',
                    'ventana_tiempo_inicio': time(13, 0),
                    'ventana_tiempo_fin': time(19, 0),
                    'demanda_peso': Decimal('18.75'),
                    'demanda_volumen': Decimal('0.30'),
                    'tiempo_servicio_min': 10,
                    'prioridad': 3,
                    'observaciones': 'Entrega urgente - prioridad alta'
                },
                {
                    'solicitud': solicitud2,
                    'ubicacion': ubicaciones_entrega[2],
                    'tipo': 'pickup',
                    'ventana_tiempo_inicio': time(13, 0),
                    'ventana_tiempo_fin': time(19, 0),
                    'demanda_peso': Decimal('10.50'),
                    'demanda_volumen': Decimal('0.18'),
                    'tiempo_servicio_min': 8,
                    'prioridad': 1,
                    'observaciones': 'Recoger documentación para archivo'
                },
                {
                    'solicitud': solicitud2,
                    'ubicacion': ubicaciones_entrega[4] if len(ubicaciones_entrega) > 4 else ubicaciones_entrega[1],
                    'tipo': 'delivery',
                    'ventana_tiempo_inicio': time(13, 0),
                    'ventana_tiempo_fin': time(19, 0),
                    'demanda_peso': Decimal('30.00'),
                    'demanda_volumen': Decimal('0.60'),
                    'tiempo_servicio_min': 20,
                    'prioridad': 2,
                    'observaciones': 'Materiales de construcción - requiere ayuda para descarga'
                },
                {
                    'solicitud': solicitud2,
                    'ubicacion': ubicaciones_entrega[5] if len(ubicaciones_entrega) > 5 else ubicaciones_entrega[2],
                    'tipo': 'delivery',
                    'ventana_tiempo_inicio': time(13, 0),
                    'ventana_tiempo_fin': time(19, 0),
                    'demanda_peso': Decimal('5.25'),
                    'demanda_volumen': Decimal('0.10'),
                    'tiempo_servicio_min': 5,
                    'prioridad': 1,
                    'observaciones': 'Paquete pequeño - medicamentos'
                },
                {
                    'solicitud': solicitud2,
                    'ubicacion': ubicaciones_entrega[3] if len(ubicaciones_entrega) > 3 else ubicaciones_entrega[0],
                    'tipo': 'both',
                    'ventana_tiempo_inicio': time(13, 0),
                    'ventana_tiempo_fin': time(19, 0),
                    'demanda_peso': Decimal('14.80'),
                    'demanda_volumen': Decimal('0.25'),
                    'tiempo_servicio_min': 15,
                    'prioridad': 2,
                    'observaciones': 'Intercambio de mercancía - entrega y recogida'
                }
            ]
            
            for entrega_data in entregas_2:
                Entrega.objects.create(**entrega_data)
            
            print(f"✅ Solicitud 2 creada: {solicitud2.numero_entregas} entregas")
            
        except Exception as e:
            print(f"❌ Error creando solicitud 2: {str(e)}")
        
        # Resumen
        total_solicitudes = SolicitudRuta.objects.count()
        total_entregas = Entrega.objects.count()
        print(f"\n📊 Resumen:")
        print(f"   • Solicitudes de ruta creadas: {total_solicitudes}")
        print(f"   • Total de entregas: {total_entregas}")
    
    @classmethod
    def should_run(cls):
        """Solo ejecutar si no existen solicitudes de ruta"""
        return SolicitudRuta.objects.count() == 0
