"""
Seeder para datos de Vehículos.
"""
from .base_seeder import BaseSeeder
from datetime import date, timedelta
import random

class VehiculoSeeder(BaseSeeder):
    """
    Crea datos de Vehículos para el sistema de transporte.
    """
    
    @classmethod
    def run(cls):
        """
        Crea registros de vehículos de prueba.
        """
        try:
            from vehiculos.models import Vehiculo
            from conductores.models import Conductor
            
            # Datos de vehículos de prueba (todos sin conductor asignado)
            vehiculos_data = [
                {
                    "nombre": "Bus Interurbano 001",
                    "tipo_vehiculo": "Bus",
                    "placa": "ABC-123",
                    "marca": "Mercedes-Benz",
                    "modelo": "OF-1724",
                    "año_fabricacion": 2020,
                    "capacidad_pasajeros": 50,
                    "capacidad_carga": 2000.00,
                    "estado": "activo",
                    "kilometraje": 45000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=30),
                    "proximo_mantenimiento": date.today() + timedelta(days=30),
                    "conductor": None
                },
                {
                    "nombre": "Bus Cama Premium",
                    "tipo_vehiculo": "Bus Cama",
                    "placa": "XYZ-456",
                    "marca": "Volvo",
                    "modelo": "B12M",
                    "año_fabricacion": 2019,
                    "capacidad_pasajeros": 40,
                    "capacidad_carga": 1500.00,
                    "estado": "activo",
                    "kilometraje": 78000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=15),
                    "proximo_mantenimiento": date.today() + timedelta(days=45),
                    "conductor": None
                },
                {
                    "nombre": "Minibús Ejecutivo",
                    "tipo_vehiculo": "Minibús",
                    "placa": "DEF-789",
                    "marca": "Toyota",
                    "modelo": "Coaster",
                    "año_fabricacion": 2021,
                    "capacidad_pasajeros": 25,
                    "capacidad_carga": 800.00,
                    "estado": "activo",
                    "kilometraje": 25000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=7),
                    "proximo_mantenimiento": date.today() + timedelta(days=53),
                    "conductor": None
                },
                {
                    "nombre": "Camión de Carga",
                    "tipo_vehiculo": "Camión",
                    "placa": "GHI-012",
                    "marca": "Scania",
                    "modelo": "R450",
                    "año_fabricacion": 2018,
                    "capacidad_pasajeros": 3,
                    "capacidad_carga": 15000.00,
                    "estado": "mantenimiento",
                    "kilometraje": 120000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=5),
                    "proximo_mantenimiento": date.today() + timedelta(days=25),
                    "conductor": None
                },
                {
                    "nombre": "Van de Reparto",
                    "tipo_vehiculo": "Van",
                    "placa": "JKL-345",
                    "marca": "Ford",
                    "modelo": "Transit",
                    "año_fabricacion": 2022,
                    "capacidad_pasajeros": 8,
                    "capacidad_carga": 1200.00,
                    "estado": "activo",
                    "kilometraje": 15000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=20),
                    "proximo_mantenimiento": date.today() + timedelta(days=40),
                    "conductor": None
                },
                {
                    "nombre": "Bus Rural",
                    "tipo_vehiculo": "Bus",
                    "placa": "MNO-678",
                    "marca": "Hino",
                    "modelo": "AK",
                    "año_fabricacion": 2017,
                    "capacidad_pasajeros": 45,
                    "capacidad_carga": 1800.00,
                    "estado": "activo",
                    "kilometraje": 95000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=10),
                    "proximo_mantenimiento": date.today() + timedelta(days=50),
                    "conductor": None
                },
                {
                    "nombre": "Bus Ejecutivo",
                    "tipo_vehiculo": "Bus",
                    "placa": "PQR-901",
                    "marca": "Mercedes-Benz",
                    "modelo": "OF-1418",
                    "año_fabricacion": 2020,
                    "capacidad_pasajeros": 35,
                    "capacidad_carga": 1200.00,
                    "estado": "baja",
                    "kilometraje": 110000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=90),
                    "proximo_mantenimiento": None,  # Vehículo dado de baja
                    "conductor": None
                },
                {
                    "nombre": "Minibús Turístico",
                    "tipo_vehiculo": "Minibús",
                    "placa": "STU-234",
                    "marca": "Nissan",
                    "modelo": "Civilian",
                    "año_fabricacion": 2019,
                    "capacidad_pasajeros": 30,
                    "capacidad_carga": 1000.00,
                    "estado": "activo",
                    "kilometraje": 65000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=25),
                    "proximo_mantenimiento": date.today() + timedelta(days=35),
                    "conductor": None
                },
                {
                    "nombre": "Bus Urbano",
                    "tipo_vehiculo": "Bus",
                    "placa": "VWX-567",
                    "marca": "Volvo",
                    "modelo": "B270F",
                    "año_fabricacion": 2021,
                    "capacidad_pasajeros": 55,
                    "capacidad_carga": 2200.00,
                    "estado": "mantenimiento",
                    "kilometraje": 35000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=3),
                    "proximo_mantenimiento": date.today() + timedelta(days=27),
                    "conductor": None
                },
                {
                    "nombre": "Camión Refrigerado",
                    "tipo_vehiculo": "Camión",
                    "placa": "YZA-890",
                    "marca": "Iveco",
                    "modelo": "Daily",
                    "año_fabricacion": 2020,
                    "capacidad_pasajeros": 2,
                    "capacidad_carga": 3500.00,
                    "estado": "activo",
                    "kilometraje": 42000,
                    "ultimo_mantenimiento": date.today() - timedelta(days=12),
                    "proximo_mantenimiento": date.today() + timedelta(days=48),
                    "conductor": None
                }
            ]
            
            for data in vehiculos_data:
                vehiculo, created = Vehiculo.objects.get_or_create(
                    placa=data["placa"],
                    defaults=data
                )
                if created:
                    conductor_info = f" - Conductor: {vehiculo.conductor.nombre} {vehiculo.conductor.apellido}" if vehiculo.conductor else " - Sin conductor asignado"
                    print(f"✓ Vehículo creado: {vehiculo.nombre} ({vehiculo.placa}) - Estado: {vehiculo.estado}{conductor_info}")
                else:
                    print(f"- Vehículo ya existe: {vehiculo.nombre} ({vehiculo.placa})")
                    
        except ImportError:
            print("❌ Error: No se pudo importar el modelo Vehiculo. Verifica que existe en vehiculos.models.")
        except Exception as e:
            print(f"❌ Error al crear vehículos: {str(e)}")
    
    @classmethod
    def should_run(cls):
        """
        El seeder de vehículos debe ejecutarse si no existen registros de vehículos.
        """
        try:
            from vehiculos.models import Vehiculo
            return Vehiculo.objects.count() == 0
        except ImportError:
            return False
