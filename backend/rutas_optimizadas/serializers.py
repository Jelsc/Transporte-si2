from rest_framework import serializers
from .models import SolicitudRuta, Entrega, RutaOptimizada, Parada
from ubicaciones.serializers import UbicacionSerializer
from vehiculos.serializers import VehiculoSerializer


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
    depot_detalle = UbicacionSerializer(source='depot', read_only=True)
    tiene_rutas = serializers.BooleanField(read_only=True)
    numero_entregas = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SolicitudRuta
        fields = [
            'id', 'fecha_creacion', 'fecha_viaje', 'hora_inicio',
            'estado', 'vehiculos_disponibles', 'vehiculos_disponibles_detalle',
            'depot', 'depot_detalle', 'mensaje_resultado', 'fecha_procesamiento',
            'entregas', 'rutas_optimizadas', 'tiene_rutas', 'numero_entregas'
        ]
        read_only_fields = [
            'id', 'fecha_creacion', 'estado', 'mensaje_resultado',
            'fecha_procesamiento', 'tiene_rutas', 'numero_entregas'
        ]


class SolicitudRutaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitudes de ruta con entregas anidadas"""
    entregas = EntregaCreateSerializer(many=True)
    
    class Meta:
        model = SolicitudRuta
        fields = [
            'fecha_viaje', 'hora_inicio', 'vehiculos_disponibles',
            'depot', 'entregas'
        ]
    
    def create(self, validated_data):
        """Crear solicitud con entregas"""
        entregas_data = validated_data.pop('entregas')
        vehiculos = validated_data.pop('vehiculos_disponibles')
        
        # Crear solicitud
        solicitud = SolicitudRuta.objects.create(**validated_data)
        
        # Asignar vehículos
        solicitud.vehiculos_disponibles.set(vehiculos)
        
        # Crear entregas
        for entrega_data in entregas_data:
            Entrega.objects.create(solicitud=solicitud, **entrega_data)
        
        return solicitud
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que haya al menos una entrega
        if not data.get('entregas'):
            raise serializers.ValidationError(
                "Debe haber al menos una entrega en la solicitud"
            )
        
        # Validar que haya al menos un vehículo
        if not data.get('vehiculos_disponibles'):
            raise serializers.ValidationError(
                "Debe haber al menos un vehículo disponible"
            )
        
        return data


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

