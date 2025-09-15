from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PersonalEmpresa, Departamento

User = get_user_model()


class PersonalEmpresaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo PersonalEmpresa"""
    
    # Campos del usuario relacionado (opcionales)
    username = serializers.CharField(source='usuario.username', read_only=True, allow_null=True)
    email = serializers.EmailField(source='usuario.email', read_only=True, allow_null=True)
    first_name = serializers.CharField(source='usuario.first_name', read_only=True, allow_null=True)
    last_name = serializers.CharField(source='usuario.last_name', read_only=True, allow_null=True)
    telefono = serializers.CharField(source='usuario.telefono', read_only=True, allow_null=True)
    
    # Campos calculados
    nombre_completo = serializers.CharField(read_only=True)
    anos_antiguedad = serializers.IntegerField(read_only=True)
    puede_acceder_sistema = serializers.BooleanField(read_only=True)
    
    # Información del supervisor
    supervisor_nombre = serializers.CharField(source='supervisor.nombre_completo', read_only=True)
    supervisor_codigo = serializers.CharField(source='supervisor.codigo_empleado', read_only=True)
    
    class Meta:
        model = PersonalEmpresa
        fields = [
            'id',
            'usuario',
            'username',
            'email',
            'first_name',
            'last_name',
            'telefono',
            'tipo_personal',
            'codigo_empleado',
            'departamento',
            'cargo',
            'fecha_ingreso',
            'salario',
            'horario_trabajo',
            'estado',
            'supervisor',
            'supervisor_nombre',
            'supervisor_codigo',
            'telefono_emergencia',
            'contacto_emergencia',
            'es_activo',
            'nombre_completo',
            'anos_antiguedad',
            'puede_acceder_sistema',
            'ultimo_acceso',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = [
            'id',
            'fecha_creacion',
            'fecha_actualizacion',
            'ultimo_acceso'
        ]
    
    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if self.instance and self.instance.codigo_empleado == value:
            return value
        
        if PersonalEmpresa.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value
    
    def validate_supervisor(self, value):
        """Valida que el supervisor sea válido"""
        if value:
            # No puede ser supervisor de sí mismo
            if self.instance and value.id == self.instance.id:
                raise serializers.ValidationError(
                    "Un empleado no puede ser supervisor de sí mismo."
                )
            
            # El supervisor debe ser de tipo supervisor o administrador
            if value.tipo_personal not in ['supervisor', 'administrador']:
                raise serializers.ValidationError(
                    "El supervisor debe ser de tipo supervisor o administrador."
                )
        return value


class PersonalEmpresaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear personal (solo datos del personal, sin usuario)"""
    
    # Campos personales básicos
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    tipo_personal = serializers.CharField(max_length=20, required=False, allow_blank=True)
    departamento = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    class Meta:
        model = PersonalEmpresa
        fields = [
            'first_name',
            'last_name',
            'email',
            'telefono',
            'tipo_personal',
            'codigo_empleado',
            'departamento',
            'cargo',
            'fecha_ingreso',
            'salario',
            'horario_trabajo',
            'supervisor',
            'telefono_emergencia',
            'contacto_emergencia',
            'es_activo'
        ]
    
    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if PersonalEmpresa.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value
    
    def create(self, validated_data):
        """Crea un nuevo empleado (sin usuario vinculado)"""
        # Extraer datos personales
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        telefono = validated_data.pop('telefono', '')
        
        # Crear empleado sin usuario vinculado
        empleado = PersonalEmpresa.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            telefono=telefono,
            **validated_data
        )
        
        return empleado


class PersonalEmpresaUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar personal"""
    
    class Meta:
        model = PersonalEmpresa
        fields = [
            'tipo_personal',
            'codigo_empleado',
            'departamento',
            'cargo',
            'fecha_ingreso',
            'salario',
            'horario_trabajo',
            'estado',
            'supervisor',
            'telefono_emergencia',
            'contacto_emergencia',
            'es_activo'
        ]
    
    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if self.instance and self.instance.codigo_empleado == value:
            return value
        
        if PersonalEmpresa.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value


class PersonalEmpresaEstadoSerializer(serializers.ModelSerializer):
    """Serializer para cambiar estado del empleado"""
    
    class Meta:
        model = PersonalEmpresa
        fields = ['estado']
    
    def validate_estado(self, value):
        """Valida que el estado sea válido"""
        estados_validos = [choice[0] for choice in PersonalEmpresa.ESTADOS_CHOICES]
        if value not in estados_validos:
            raise serializers.ValidationError(
                f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}"
            )
        return value


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Departamento"""
    
    empleados_count = serializers.IntegerField(read_only=True)
    jefe_nombre = serializers.CharField(source='jefe_departamento.nombre_completo', read_only=True)
    
    class Meta:
        model = Departamento
        fields = [
            'id',
            'nombre',
            'descripcion',
            'jefe_departamento',
            'jefe_nombre',
            'presupuesto',
            'es_activo',
            'empleados_count',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = [
            'id',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
    
    def validate_nombre(self, value):
        """Valida que el nombre del departamento sea único"""
        if self.instance and self.instance.nombre == value:
            return value
        
        if Departamento.objects.filter(nombre=value).exists():
            raise serializers.ValidationError(
                "Ya existe un departamento con este nombre."
            )
        return value
    
    def validate_jefe_departamento(self, value):
        """Valida que el jefe de departamento sea válido"""
        if value:
            # El jefe debe ser de tipo supervisor o administrador
            if value.tipo_personal not in ['supervisor', 'administrador']:
                raise serializers.ValidationError(
                    "El jefe de departamento debe ser de tipo supervisor o administrador."
                )
        return value
