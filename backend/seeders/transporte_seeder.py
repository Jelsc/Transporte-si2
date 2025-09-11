"""
Seeder para datos de demostración o prueba específicos del proyecto de transporte.
"""
from .base_seeder import BaseSeeder
from django.contrib.auth import get_user_model

# Importa tus modelos aquí
# from app_nombre.models import ModeloEjemplo

User = get_user_model()

class TransporteSeeder(BaseSeeder):
    """
    Crea datos de demostración para el sistema de transporte.
    """
    
    @classmethod
    def run(cls):
        """
        Crea datos de prueba para el sistema de transporte.
        """
        # Asegúrate de que exista al menos un usuario administrador
        if not User.objects.filter(username='admin').exists():
            from .user_seeder import UserSeeder
            UserSeeder.seed()
        
        # Ejemplo: Crear rutas de transporte
        # if not Ruta.objects.exists():
        #     rutas = [
        #         {'nombre': 'Ruta Norte-Sur', 'descripcion': 'Conecta los extremos norte y sur de la ciudad'},
        #         {'nombre': 'Ruta Este-Oeste', 'descripcion': 'Conecta los extremos este y oeste de la ciudad'},
        #         {'nombre': 'Ruta Circular', 'descripcion': 'Recorre el perímetro de la ciudad'},
        #     ]
        #     
        #     for ruta_data in rutas:
        #         Ruta.objects.create(**ruta_data)
        #         print(f"Ruta '{ruta_data['nombre']}' creada")
        
        # Ejemplo: Crear vehículos
        # if Vehiculo.objects.count() < 5:
        #     vehiculos = [
        #         {'placa': 'ABC123', 'modelo': 'Bus Mercedes', 'capacidad': 40},
        #         {'placa': 'DEF456', 'modelo': 'Minibus Toyota', 'capacidad': 20},
        #         {'placa': 'GHI789', 'modelo': 'Bus Volvo', 'capacidad': 45},
        #     ]
        #     
        #     for vehiculo_data in vehiculos:
        #         Vehiculo.objects.create(**vehiculo_data)
        #         print(f"Vehículo '{vehiculo_data['placa']}' creado")
    
    @classmethod
    def should_run(cls):
        """
        Este seeder debería ejecutarse solo en entornos de desarrollo o prueba,
        o cuando la base de datos está vacía.
        """
        # Puedes implementar una lógica más específica aquí
        # Por ejemplo, verificar si algún modelo específico tiene datos
        
        # Ejemplo: return not Ruta.objects.exists() or not Vehiculo.objects.exists()
        return True  # Por defecto, siempre ejecutar para desarrollo
