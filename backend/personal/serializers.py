from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Personal, Departamento

User = get_user_model()


class PersonalSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Personal"""

    # Campos del usuario relacionado (opcionales)
    username = serializers.CharField(
        source="usuario.username", read_only=True, allow_null=True
    )

    # Campos calculados
    nombre_completo = serializers.CharField(read_only=True)
    anos_antiguedad = serializers.IntegerField(read_only=True)
    puede_acceder_sistema = serializers.BooleanField(read_only=True)

    # Información del supervisor
    supervisor_nombre = serializers.CharField(
        source="supervisor.nombre_completo", read_only=True
    )
    supervisor_codigo = serializers.CharField(
        source="supervisor.codigo_empleado", read_only=True
    )

    class Meta:
        model = Personal
        fields = [
            "id",
            "usuario",
            "username",
            "nombre",
            "apellido",
            "fecha_nacimiento",
            "telefono",
            "email",
            "ci",
            "codigo_empleado",
            "departamento",
            "fecha_ingreso",
            "horario_trabajo",
            "estado",
            "supervisor",
            "supervisor_nombre",
            "supervisor_codigo",
            "telefono_emergencia",
            "contacto_emergencia",
            "es_activo",
            "nombre_completo",
            "anos_antiguedad",
            "puede_acceder_sistema",
            "ultimo_acceso",
            "fecha_creacion",
            "fecha_actualizacion",
        ]
        read_only_fields = [
            "id",
            "fecha_creacion",
            "fecha_actualizacion",
            "ultimo_acceso",
        ]

    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if self.instance and self.instance.codigo_empleado == value:
            return value

        if Personal.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value

    def validate_email(self, value):
        """Valida que el email sea único"""
        if self.instance and self.instance.email == value:
            return value

        if Personal.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un empleado con este email.")
        return value

    def validate_ci(self, value):
        """Valida que la CI sea única"""
        if self.instance and self.instance.ci == value:
            return value

        if Personal.objects.filter(ci=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con esta cédula de identidad."
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
        return value


class PersonalCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear personal"""

    class Meta:
        model = Personal
        fields = [
            "nombre",
            "apellido",
            "fecha_nacimiento",
            "telefono",
            "email",
            "ci",
            "codigo_empleado",
            "departamento",
            "fecha_ingreso",
            "horario_trabajo",
            "supervisor",
            "telefono_emergencia",
            "contacto_emergencia",
            "es_activo",
        ]

    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if Personal.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value

    def validate_email(self, value):
        """Valida que el email sea único"""
        if Personal.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un empleado con este email.")
        return value

    def validate_ci(self, value):
        """Valida que la CI sea única"""
        if Personal.objects.filter(ci=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con esta cédula de identidad."
            )
        return value


class PersonalUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar personal"""

    class Meta:
        model = Personal
        fields = [
            "codigo_empleado",
            "departamento",
            "fecha_ingreso",
            "horario_trabajo",
            "estado",
            "supervisor",
            "telefono_emergencia",
            "contacto_emergencia",
            "es_activo",
        ]

    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if self.instance and self.instance.codigo_empleado == value:
            return value

        if Personal.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value


class PersonalEstadoSerializer(serializers.ModelSerializer):
    """Serializer para cambiar estado del empleado"""

    class Meta:
        model = Personal
        fields = ["estado"]

    def validate_estado(self, value):
        """Valida que el estado sea válido"""
        estados_validos = [choice[0] for choice in Personal.ESTADOS_CHOICES]
        if value not in estados_validos:
            raise serializers.ValidationError(
                f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}"
            )
        return value


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Departamento"""

    empleados_count = serializers.IntegerField(read_only=True)
    jefe_nombre = serializers.CharField(
        source="jefe_departamento.nombre_completo", read_only=True
    )

    class Meta:
        model = Departamento
        fields = [
            "id",
            "nombre",
            "descripcion",
            "jefe_departamento",
            "jefe_nombre",
            "presupuesto",
            "es_activo",
            "empleados_count",
            "fecha_creacion",
            "fecha_actualizacion",
        ]
        read_only_fields = ["id", "fecha_creacion", "fecha_actualizacion"]

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
            # Validación básica - el jefe debe ser un empleado activo
            if not value.es_activo:
                raise serializers.ValidationError(
                    "El jefe de departamento debe ser un empleado activo."
                )
        return value
