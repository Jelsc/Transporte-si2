from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conductor

User = get_user_model()


class ConductorSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Conductor"""
    
    # Campos del usuario relacionado
    username = serializers.CharField(source='usuario.username', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)
    first_name = serializers.CharField(source='usuario.first_name', read_only=True)
    last_name = serializers.CharField(source='usuario.last_name', read_only=True)
    telefono = serializers.CharField(source='usuario.telefono', read_only=True)
    
    # Campos calculados
    nombre_completo = serializers.CharField(read_only=True)
    licencia_vencida = serializers.BooleanField(read_only=True)
    dias_para_vencer_licencia = serializers.IntegerField(read_only=True)
    puede_conducir = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Conductor
        fields = [
            'id',
            'usuario',
            'username',
            'email',
            'first_name',
            'last_name',
            'telefono',
            'numero_licencia',
            'tipo_licencia',
            'fecha_vencimiento_licencia',
            'estado',
            'experiencia_anos',
            'telefono_emergencia',
            'contacto_emergencia',
            'es_activo',
            'nombre_completo',
            'licencia_vencida',
            'dias_para_vencer_licencia',
            'puede_conducir',
            'ultima_ubicacion_lat',
            'ultima_ubicacion_lng',
            'ultima_actualizacion_ubicacion',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = [
            'id',
            'fecha_creacion',
            'fecha_actualizacion',
            'ultima_actualizacion_ubicacion'
        ]
    
    def validate_numero_licencia(self, value):
        """Valida que el número de licencia sea único"""
        if self.instance and self.instance.numero_licencia == value:
            return value
        
        if Conductor.objects.filter(numero_licencia=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este número de licencia."
            )
        return value
    
    def validate_fecha_vencimiento_licencia(self, value):
        """Valida que la fecha de vencimiento no sea en el pasado"""
        from django.utils import timezone
        
        if value < timezone.now().date():
            raise serializers.ValidationError(
                "La fecha de vencimiento de la licencia no puede ser en el pasado."
            )
        return value


class ConductorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear conductores (solo datos del conductor, sin usuario)"""
    
    # Campos personales básicos
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    class Meta:
        model = Conductor
        fields = [
            'first_name',
            'last_name',
            'email',
            'telefono',
            'numero_licencia',
            'tipo_licencia',
            'fecha_vencimiento_licencia',
            'experiencia_anos',
            'telefono_emergencia',
            'contacto_emergencia',
            'es_activo'
        ]
    
    def validate_numero_licencia(self, value):
        """Valida que el número de licencia sea único"""
        if Conductor.objects.filter(numero_licencia=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este número de licencia."
            )
        return value
    
    def create(self, validated_data):
        """Crea un nuevo conductor (sin usuario vinculado)"""
        # Extraer datos personales
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        telefono = validated_data.pop('telefono', '')
        
        # Crear conductor sin usuario vinculado
        conductor = Conductor.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            telefono=telefono,
            **validated_data
        )
        
        return conductor


class ConductorUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar conductores"""
    
    class Meta:
        model = Conductor
        fields = [
            'numero_licencia',
            'tipo_licencia',
            'fecha_vencimiento_licencia',
            'estado',
            'experiencia_anos',
            'telefono_emergencia',
            'contacto_emergencia',
            'es_activo'
        ]
    
    def validate_numero_licencia(self, value):
        """Valida que el número de licencia sea único"""
        if self.instance and self.instance.numero_licencia == value:
            return value
        
        if Conductor.objects.filter(numero_licencia=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este número de licencia."
            )
        return value


class ConductorUbicacionSerializer(serializers.ModelSerializer):
    """Serializer para actualizar ubicación del conductor"""
    
    class Meta:
        model = Conductor
        fields = ['ultima_ubicacion_lat', 'ultima_ubicacion_lng']
    
    def validate_ultima_ubicacion_lat(self, value):
        """Valida la latitud"""
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError(
                "La latitud debe estar entre -90 y 90 grados."
            )
        return value
    
    def validate_ultima_ubicacion_lng(self, value):
        """Valida la longitud"""
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError(
                "La longitud debe estar entre -180 y 180 grados."
            )
        return value


class ConductorEstadoSerializer(serializers.ModelSerializer):
    """Serializer para cambiar estado del conductor"""
    
    class Meta:
        model = Conductor
        fields = ['estado']
    
    def validate_estado(self, value):
        """Valida que el estado sea válido"""
        estados_validos = [choice[0] for choice in Conductor.ESTADOS_CHOICES]
        if value not in estados_validos:
            raise serializers.ValidationError(
                f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}"
            )
        return value
