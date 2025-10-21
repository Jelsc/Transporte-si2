from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Ubicacion, TipoUbicacion, SourceUbicacion


class UbicacionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Ubicacion"""
    
    # Campos calculados
    coordenadas = serializers.SerializerMethodField()
    geohash_cercano = serializers.SerializerMethodField()
    
    class Meta:
        model = Ubicacion
        fields = [
            'id',
            'tipo',
            'nombre',
            'direccion_texto',
            'descripcion',
            'lat',
            'lng',
            'service_min',
            'source',
            'place_id',
            'osm_id',
            'geohash',
            'activo',
            'created_at',
            'updated_at',
            # Campos calculados
            'coordenadas',
            'geohash_cercano',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'geohash']
    
    def get_coordenadas(self, obj):
        """Retorna las coordenadas como tupla"""
        return obj.coordenadas
    
    def get_geohash_cercano(self, obj):
        """Retorna geohash de menor precisión para búsquedas cercanas"""
        return obj.geohash_cercano
    
    def validate_nombre(self, value):
        """Validación personalizada para el nombre"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError(
                "El nombre debe tener al menos 3 caracteres"
            )
        
        if len(value.strip()) > 120:
            raise serializers.ValidationError(
                "El nombre no puede exceder 120 caracteres"
            )
        
        return value.strip()
    
    def validate_lat(self, value):
        """Validación para latitud"""
        if value is None:
            raise serializers.ValidationError("La latitud es obligatoria")
        
        if not (-90 <= float(value) <= 90):
            raise serializers.ValidationError(
                "La latitud debe estar entre -90 y 90 grados"
            )
        
        return value
    
    def validate_lng(self, value):
        """Validación para longitud"""
        if value is None:
            raise serializers.ValidationError("La longitud es obligatoria")
        
        if not (-180 <= float(value) <= 180):
            raise serializers.ValidationError(
                "La longitud debe estar entre -180 y 180 grados"
            )
        
        return value
    
    def validate_service_min(self, value):
        """Validación para tiempo de servicio"""
        if value is None or value < 0:
            raise serializers.ValidationError(
                "El tiempo de servicio debe ser mayor o igual a 0"
            )
        
        return value
    
    def validate(self, attrs):
        """Validaciones a nivel de objeto"""
        # Verificar que las coordenadas estén presentes
        lat = attrs.get('lat')
        lng = attrs.get('lng')
        
        if lat is None or lng is None:
            raise serializers.ValidationError({
                'lat': 'Las coordenadas lat/lng son obligatorias',
                'lng': 'Las coordenadas lat/lng son obligatorias'
            })
        
        return attrs


class UbicacionCreateSerializer(serializers.ModelSerializer):
    """Serializer específico para crear ubicaciones"""
    
    class Meta:
        model = Ubicacion
        fields = [
            'tipo',
            'nombre',
            'direccion_texto',
            'descripcion',
            'lat',
            'lng',
            'service_min',
            'source',
            'place_id',
            'osm_id',
            'activo',
        ]
    
    def validate_nombre(self, value):
        """Validación personalizada para el nombre"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError(
                "El nombre debe tener al menos 3 caracteres"
            )
        
        if len(value.strip()) > 120:
            raise serializers.ValidationError(
                "El nombre no puede exceder 120 caracteres"
            )
        
        return value.strip()


class UbicacionUpdateSerializer(serializers.ModelSerializer):
    """Serializer específico para actualizar ubicaciones"""
    
    class Meta:
        model = Ubicacion
        fields = [
            'tipo',
            'nombre',
            'direccion_texto',
            'descripcion',
            'lat',
            'lng',
            'service_min',
            'source',
            'place_id',
            'osm_id',
            'activo',
        ]
    
    def validate_nombre(self, value):
        """Validación personalizada para el nombre"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError(
                "El nombre debe tener al menos 3 caracteres"
            )
        
        if len(value.strip()) > 120:
            raise serializers.ValidationError(
                "El nombre no puede exceder 120 caracteres"
            )
        
        return value.strip()


class GeocodeRequestSerializer(serializers.Serializer):
    """Serializer para requests de geocodificación"""
    direccion_texto = serializers.CharField(
        max_length=255,
        help_text="Dirección a geocodificar"
    )
    
    def validate_direccion_texto(self, value):
        """Validación para la dirección"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError(
                "La dirección debe tener al menos 3 caracteres"
            )
        
        return value.strip()


class GeocodeResponseSerializer(serializers.Serializer):
    """Serializer para responses de geocodificación"""
    lat = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Latitud encontrada"
    )
    lng = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Longitud encontrada"
    )
    osm_id = serializers.CharField(
        allow_null=True,
        help_text="ID de OpenStreetMap"
    )
    place_id = serializers.CharField(
        allow_null=True,
        help_text="ID del lugar"
    )
    source = serializers.ChoiceField(
        choices=SourceUbicacion.choices,
        default=SourceUbicacion.GEOCODED_NOMINATIM,
        help_text="Fuente de las coordenadas"
    )
    direccion_encontrada = serializers.CharField(
        help_text="Dirección formateada encontrada"
    )
    confianza = serializers.FloatField(
        help_text="Nivel de confianza de la geocodificación (0-1)"
    )
