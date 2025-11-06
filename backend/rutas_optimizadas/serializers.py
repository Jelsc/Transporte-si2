from rest_framework import serializers
from .models import SolicitudRuta, Entrega, RutaOptimizada, Parada
from ubicaciones.serializers import UbicacionSerializer
from vehiculos.serializers import VehiculoSerializer
from vehiculos.models import Vehiculo


class EntregaSerializer(serializers.ModelSerializer):
    """Serializer para entregas/recogidas"""
    ubicacion_detalle = UbicacionSerializer(source='ubicacion', read_only=True)
    tiempo_servicio = serializers.SerializerMethodField()
    
    class Meta:
        model = Entrega
        fields = [
            'id', 'solicitud', 'ubicacion', 'ubicacion_detalle',
            'tipo', 'ventana_tiempo_inicio', 'ventana_tiempo_fin',
            'demanda_peso', 'demanda_volumen', 'tiempo_servicio_min',
            'tiempo_servicio', 'prioridad', 'observaciones'
        ]
        read_only_fields = ['id']
    
    def get_tiempo_servicio(self, obj):
        """Obtiene el tiempo de servicio efectivo"""
        return obj.get_tiempo_servicio()
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar ventanas de tiempo
        inicio = data.get('ventana_tiempo_inicio')
        fin = data.get('ventana_tiempo_fin')
        
        if inicio and fin and inicio >= fin:
            raise serializers.ValidationError(
                "La hora de fin debe ser posterior a la hora de inicio"
            )
        
        # Validar demandas
        if data.get('demanda_peso', 0) < 0:
            raise serializers.ValidationError("La demanda de peso no puede ser negativa")
        
        if data.get('demanda_volumen', 0) < 0:
            raise serializers.ValidationError("La demanda de volumen no puede ser negativa")
        
        return data


class EntregaCreateSerializer(serializers.ModelSerializer):
    """Serializer simplificado para crear entregas"""
    class Meta:
        model = Entrega
        fields = [
            'ubicacion', 'tipo', 'ventana_tiempo_inicio', 'ventana_tiempo_fin',
            'demanda_peso', 'demanda_volumen', 'tiempo_servicio_min',
            'prioridad', 'observaciones'
        ]


class ParadaSerializer(serializers.ModelSerializer):
    """Serializer para paradas en rutas optimizadas"""
    ubicacion_detalle = UbicacionSerializer(source='ubicacion', read_only=True)
    entrega_detalle = EntregaSerializer(source='entrega', read_only=True)
    
    class Meta:
        model = Parada
        fields = [
            'id', 'ruta', 'entrega', 'entrega_detalle', 'ubicacion', 'ubicacion_detalle',
            'orden', 'tiempo_llegada_estimado', 'tiempo_salida_estimado',
            'tiempo_servicio_min', 'distancia_desde_anterior_km',
            'es_depot', 'completada', 'hora_llegada_real', 'hora_salida_real',
            'observaciones'
        ]
        read_only_fields = ['id']


class RutaOptimizadaSerializer(serializers.ModelSerializer):
    """Serializer para rutas optimizadas"""
    vehiculo_detalle = VehiculoSerializer(source='vehiculo', read_only=True)
    paradas = ParadaSerializer(many=True, read_only=True)
    numero_paradas = serializers.IntegerField(read_only=True)
    utilizacion_capacidad = serializers.FloatField(read_only=True)
    
    class Meta:
        model = RutaOptimizada
        fields = [
            'id', 'solicitud', 'vehiculo', 'vehiculo_detalle', 'numero_ruta',
            'distancia_total_km', 'tiempo_total_min', 'carga_total_kg',
            'costo_estimado', 'hora_inicio', 'hora_fin_estimada',
            'completada', 'paradas', 'numero_paradas', 'utilizacion_capacidad',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class SolicitudRutaSerializer(serializers.ModelSerializer):
    """Serializer para solicitudes de ruta"""
    entregas = EntregaSerializer(many=True, read_only=True)
    rutas_optimizadas = RutaOptimizadaSerializer(many=True, read_only=True)
    vehiculos_disponibles_detalle = VehiculoSerializer(source='vehiculos_disponibles', many=True, read_only=True)
    depot_salida_detalle = UbicacionSerializer(source='depot_salida', read_only=True)
    depot_regreso_detalle = UbicacionSerializer(source='depot_regreso', read_only=True)
    depot_detalle = UbicacionSerializer(source='depot', read_only=True)  # Legacy
    tiene_rutas = serializers.BooleanField(read_only=True)
    numero_entregas = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SolicitudRuta
        fields = [
            'id', 'fecha_creacion', 'fecha_viaje', 'hora_inicio',
            'estado', 'vehiculos_disponibles', 'vehiculos_disponibles_detalle',
            'depot_salida', 'depot_salida_detalle', 'depot_regreso', 'depot_regreso_detalle',
            'depot', 'depot_detalle',  # Legacy - mantener para compatibilidad
            'mensaje_resultado', 'fecha_procesamiento',
            'entregas', 'rutas_optimizadas', 'tiene_rutas', 'numero_entregas'
        ]
        read_only_fields = [
            'id', 'fecha_creacion', 'estado', 'mensaje_resultado',
            'fecha_procesamiento', 'tiene_rutas', 'numero_entregas'
        ]


class SolicitudRutaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitudes de ruta con entregas anidadas"""
    entregas = EntregaCreateSerializer(many=True, required=False)
    viajes_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        help_text="IDs de viajes a convertir en entregas"
    )
    
    # Hacer campos opcionales cuando se usan viajes
    fecha_viaje = serializers.DateField(required=False)
    hora_inicio = serializers.TimeField(required=False)
    vehiculos_disponibles = serializers.PrimaryKeyRelatedField(
        queryset=Vehiculo.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = SolicitudRuta
        fields = [
            'fecha_viaje', 'hora_inicio', 'vehiculos_disponibles',
            'depot_salida', 'depot_regreso', 'depot', 'entregas', 'viajes_ids'
        ]
    
    def validate(self, data):
        """Validaciones personalizadas"""
        entregas = data.get('entregas', [])
        viajes_ids = data.get('viajes_ids', [])
        
        # Debe haber entregas O viajes
        if not entregas and not viajes_ids:
            raise serializers.ValidationError({
                "entregas": "Debe haber al menos una entrega o seleccionar viajes"
            })
        
        # Si usa modo manual (entregas), validar campos requeridos
        if entregas and not viajes_ids:
            if not data.get('fecha_viaje'):
                raise serializers.ValidationError({
                    "fecha_viaje": "Este campo es requerido en modo manual"
                })
            if not data.get('hora_inicio'):
                raise serializers.ValidationError({
                    "hora_inicio": "Este campo es requerido en modo manual"
                })
            vehiculos = data.get('vehiculos_disponibles', [])
            if not vehiculos or len(vehiculos) == 0:
                raise serializers.ValidationError({
                    "vehiculos_disponibles": "Debe haber al menos un vehículo disponible"
                })
        
        # Validar entregas manuales si se proporcionan
        if entregas:
            for i, entrega in enumerate(entregas):
                if not entrega.get('ubicacion'):
                    raise serializers.ValidationError({
                        "entregas": f"La entrega #{i+1} debe tener una ubicación asignada"
                    })
        
        # Validar depósitos (prioridad a nuevos campos)
        depot_salida = data.get('depot_salida')
        depot_regreso = data.get('depot_regreso')
        depot_legacy = data.get('depot')
        
        # Si se usa depot_salida, depot_regreso es opcional (por defecto = depot_salida)
        if depot_salida:
            if not depot_regreso:
                data['depot_regreso'] = depot_salida
        # Si se usa depot legacy, copiar a ambos
        elif depot_legacy:
            data['depot_salida'] = depot_legacy
            data['depot_regreso'] = depot_legacy
        # Si no hay ninguno, error
        else:
            raise serializers.ValidationError({
                "depot_salida": "Debe seleccionar al menos un depósito de salida"
            })
        
        return data
    
    def create(self, validated_data):
        """Crear solicitud con entregas desde viajes o manual"""
        entregas_data = validated_data.pop('entregas', [])
        viajes_ids = validated_data.pop('viajes_ids', [])
        vehiculos = validated_data.pop('vehiculos_disponibles', [])
        
        # Si hay viajes, extraer datos de ellos
        if viajes_ids:
            from viajes.models import Viaje
            viajes = Viaje.objects.filter(id__in=viajes_ids, estado='programado')
            
            if not viajes.exists():
                raise serializers.ValidationError({
                    "viajes_ids": "No se encontraron viajes programados con los IDs proporcionados"
                })
            
            # Tomar fecha y hora del primer viaje
            primer_viaje = viajes.first()
            validated_data['fecha_viaje'] = primer_viaje.fecha
            validated_data['hora_inicio'] = primer_viaje.hora
            
            # Recopilar vehículos únicos de los viajes
            vehiculos_viajes = set()
            for viaje in viajes:
                if viaje.vehiculo:
                    vehiculos_viajes.add(viaje.vehiculo)
            
            if not vehiculos_viajes:
                raise serializers.ValidationError({
                    "viajes_ids": "Los viajes seleccionados no tienen vehículos asignados"
                })
        
        # Crear solicitud
        solicitud = SolicitudRuta.objects.create(**validated_data)
        
        # Asignar vehículos
        if viajes_ids:
            solicitud.vehiculos_disponibles.set(vehiculos_viajes)
        else:
            solicitud.vehiculos_disponibles.set(vehiculos)
        
        # Si hay viajes, convertirlos en entregas
        if viajes_ids:
            from viajes.models import Viaje
            viajes = Viaje.objects.filter(id__in=viajes_ids)
            
            for viaje in viajes:
                # Crear entrega para origen (pickup)
                Entrega.objects.create(
                    solicitud=solicitud,
                    ubicacion=viaje.origen,
                    tipo='pickup',
                    demanda_peso=viaje.asientos_ocupados * 70,  # Estimación: 70kg por persona
                    tiempo_servicio_min=viaje.origen.service_min,
                    prioridad=1,
                    observaciones=f'Origen viaje #{viaje.id}'
                )
                
                # Crear entrega para destino (delivery)
                Entrega.objects.create(
                    solicitud=solicitud,
                    ubicacion=viaje.destino,
                    tipo='delivery',
                    demanda_peso=viaje.asientos_ocupados * 70,
                    tiempo_servicio_min=viaje.destino.service_min,
                    prioridad=1,
                    observaciones=f'Destino viaje #{viaje.id}'
                )
                
                # Vincular viaje con solicitud
                solicitud.viaje_origen = viaje
                solicitud.save()
        
        # Crear entregas manuales
        for entrega_data in entregas_data:
            Entrega.objects.create(solicitud=solicitud, **entrega_data)
        
        return solicitud


class OptimizarRutaSerializer(serializers.Serializer):
    """Serializer para endpoint de optimización"""
    solicitud_id = serializers.IntegerField()
    algoritmo = serializers.ChoiceField(
        choices=['clarke_wright', 'or_tools', 'nearest_neighbor'],
        default='or_tools',
        help_text="Algoritmo de optimización a utilizar"
    )
    optimizar_tiempo = serializers.BooleanField(
        default=False,
        help_text="Si True, optimiza tiempo; si False, optimiza distancia"
    )
    
    def validate_solicitud_id(self, value):
        """Validar que la solicitud existe"""
        try:
            SolicitudRuta.objects.get(id=value)
        except SolicitudRuta.DoesNotExist:
            raise serializers.ValidationError("Solicitud no encontrada")
        return value

