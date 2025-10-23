from decimal import Decimal
from django.db import transaction
from .base_seeder import BaseSeeder
from ubicaciones.models import Ubicacion, TipoUbicacion, SourceUbicacion


class UbicacionSeeder(BaseSeeder):
    """Seeder para ubicaciones de ejemplo"""
    
    @classmethod
    def run(cls):
        """Crear ubicaciones de ejemplo para el sistema"""
        ubicaciones_data = [
            # Terminales principales
            {
                'tipo': TipoUbicacion.TERMINAL,
                'nombre': 'Terminal Bimodal - Santa Cruz',
                'direccion_texto': 'Av. Intermodal s/n, Santa Cruz',
                'descripcion': 'Terminal principal de Santa Cruz con servicios de buses y trenes',
                'lat': Decimal('-17.7849'),
                'lng': Decimal('-63.1806'),
                'service_min': 15,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            {
                'tipo': TipoUbicacion.TERMINAL,
                'nombre': 'Terminal de Buses - La Paz',
                'direccion_texto': 'Av. Ismael Montes, La Paz',
                'descripcion': 'Terminal principal de buses de La Paz',
                'lat': Decimal('-16.5000'),
                'lng': Decimal('-68.1500'),
                'service_min': 12,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            {
                'tipo': TipoUbicacion.TERMINAL,
                'nombre': 'Terminal Terrestre - Cochabamba',
                'direccion_texto': 'Av. Ayacucho, Cochabamba',
                'descripcion': 'Terminal terrestre de Cochabamba',
                'lat': Decimal('-17.3895'),
                'lng': Decimal('-66.1568'),
                'service_min': 10,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            
            # Agencias
            {
                'tipo': TipoUbicacion.AGENCIA,
                'nombre': 'Agencia Central - Santa Cruz',
                'direccion_texto': 'Calle Sucre #123, Santa Cruz',
                'descripcion': 'Agencia principal en el centro de Santa Cruz',
                'lat': Decimal('-17.7863'),
                'lng': Decimal('-63.1812'),
                'service_min': 8,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            {
                'tipo': TipoUbicacion.AGENCIA,
                'nombre': 'Agencia Norte - La Paz',
                'direccion_texto': 'Av. 6 de Agosto #456, La Paz',
                'descripcion': 'Agencia en la zona norte de La Paz',
                'lat': Decimal('-16.4950'),
                'lng': Decimal('-68.1450'),
                'service_min': 6,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            {
                'tipo': TipoUbicacion.AGENCIA,
                'nombre': 'Agencia Sur - Cochabamba',
                'direccion_texto': 'Calle Heroínas #789, Cochabamba',
                'descripcion': 'Agencia en la zona sur de Cochabamba',
                'lat': Decimal('-17.3950'),
                'lng': Decimal('-66.1600'),
                'service_min': 7,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            
            # Ubicaciones privadas (para VRP/PDPTW)
            {
                'tipo': TipoUbicacion.PRIVADO,
                'nombre': 'Residencial Los Tajibos - Santa Cruz',
                'direccion_texto': 'Calle 5 Oeste #234, Santa Cruz',
                'descripcion': 'Residencial privado para entrega de encomiendas',
                'lat': Decimal('-17.8000'),
                'lng': Decimal('-63.1900'),
                'service_min': 5,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            {
                'tipo': TipoUbicacion.PRIVADO,
                'nombre': 'Oficina Corporativa - La Paz',
                'direccion_texto': 'Edificio Torre Central, Av. 16 de Julio #567, La Paz',
                'descripcion': 'Oficina corporativa para entrega de documentos',
                'lat': Decimal('-16.4900'),
                'lng': Decimal('-68.1400'),
                'service_min': 10,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            {
                'tipo': TipoUbicacion.PRIVADO,
                'nombre': 'Centro Comercial - Cochabamba',
                'direccion_texto': 'Mall Cochabamba, Av. América #890, Cochabamba',
                'descripcion': 'Centro comercial para entrega de paquetes',
                'lat': Decimal('-17.3800'),
                'lng': Decimal('-66.1500'),
                'service_min': 8,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            
            # Ubicaciones adicionales para testing
            {
                'tipo': TipoUbicacion.TERMINAL,
                'nombre': 'Terminal Minero - Potosí',
                'direccion_texto': 'Av. Industrial, Potosí',
                'descripcion': 'Terminal para transporte minero en Potosí',
                'lat': Decimal('-19.5836'),
                'lng': Decimal('-65.7531'),
                'service_min': 20,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
            {
                'tipo': TipoUbicacion.AGENCIA,
                'nombre': 'Agencia Fronteriza - Tarija',
                'direccion_texto': 'Av. Las Américas, Tarija',
                'descripcion': 'Agencia cerca de la frontera con Argentina',
                'lat': Decimal('-21.5318'),
                'lng': Decimal('-64.7312'),
                'service_min': 15,
                'source': SourceUbicacion.MANUAL,
                'activo': True
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        with transaction.atomic():
            for ubicacion_data in ubicaciones_data:
                ubicacion, created = Ubicacion.objects.get_or_create(
                    nombre=ubicacion_data['nombre'],
                    defaults=ubicacion_data
                )
                
                if created:
                    created_count += 1
                    print(f"✅ Ubicación creada: {ubicacion.nombre}")
                else:
                    # Actualizar campos si ya existe
                    for key, value in ubicacion_data.items():
                        if key != 'nombre':  # No actualizar el nombre que usamos para buscar
                            setattr(ubicacion, key, value)
                    ubicacion.save()
                    updated_count += 1
                    print(f"🔄 Ubicación actualizada: {ubicacion.nombre}")
        
        print(f"📊 Resumen: {created_count} creadas, {updated_count} actualizadas")
        return created_count + updated_count
