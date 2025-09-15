from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from dj_rest_auth.registration.serializers import RegisterSerializer
from .models import CustomUser, Rol


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ["id", "nombre", "descripcion", "es_administrativo", "permisos"]


class UserSerializer(serializers.ModelSerializer):
    rol = RolSerializer(read_only=True)
    rol_id = serializers.IntegerField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "telefono",
            "direccion",
            "rol",
            "rol_id",
            "password",
            "es_activo",
            "fecha_creacion",
            "fecha_ultimo_acceso",
            "fecha_nacimiento",
            "codigo_empleado",
            "departamento",
        ]
        read_only_fields = ["id", "fecha_creacion", "fecha_ultimo_acceso"]

    def create(self, validated_data):
        """Crear un nuevo usuario"""
        password = validated_data.pop('password', None)
        rol_id = validated_data.pop('rol_id', None)
        
        user = CustomUser.objects.create_user(**validated_data)
        
        if password:
            user.set_password(password)
        
        if rol_id:
            try:
                rol = Rol.objects.get(id=rol_id)
                user.rol = rol
            except Rol.DoesNotExist:
                pass
        
        user.save()
        return user

    def update(self, instance, validated_data):
        """Actualizar un usuario existente"""
        password = validated_data.pop('password', None)
        rol_id = validated_data.pop('rol_id', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Actualizar contraseña si se proporciona
        if password:
            instance.set_password(password)
        
        # Actualizar rol si se proporciona
        if rol_id:
            try:
                rol = Rol.objects.get(id=rol_id)
                instance.rol = rol
            except Rol.DoesNotExist:
                pass
        
        instance.save()
        return instance


class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Credenciales inválidas")
            if not user.is_active:
                raise serializers.ValidationError("Usuario inactivo")
            if not user.es_administrativo:
                raise serializers.ValidationError(
                    "Acceso denegado: se requiere rol administrativo"
                )
            attrs["user"] = user
        else:
            raise serializers.ValidationError("Debe proporcionar username y password")
        return attrs


class AdminRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    rol_id = serializers.IntegerField()

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
            "rol_id",
            "telefono",
            "direccion",
            "codigo_empleado",
            "departamento",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        # Verificar que el rol sea administrativo
        try:
            rol = Rol.objects.get(id=attrs["rol_id"])
            if not rol.es_administrativo:
                raise serializers.ValidationError("El rol debe ser administrativo")
        except Rol.DoesNotExist:
            raise serializers.ValidationError("Rol no válido")

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        rol_id = validated_data.pop("rol_id")

        user = CustomUser.objects.create_user(
            password=password, rol_id=rol_id, **validated_data
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError("Las contraseñas nuevas no coinciden")
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta")
        return value


class CustomRegisterSerializer(RegisterSerializer):
    """Serializer personalizado para registro de clientes"""

    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_username(self, value):
        """Validar que el username sea único"""
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value

    def validate_email(self, value):
        """Validar que el email sea único"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value

    def get_cleaned_data(self):
        return {
            "username": self.validated_data.get("username", ""),
            "password1": self.validated_data.get("password1", ""),
            "password2": self.validated_data.get("password2", ""),
            "email": self.validated_data.get("email", ""),
            "first_name": self.validated_data.get("first_name", ""),
            "last_name": self.validated_data.get("last_name", ""),
            "telefono": self.validated_data.get("telefono", ""),
        }

    def save(self, request):
        # Obtener el rol de cliente por defecto
        try:
            cliente_rol = Rol.objects.get(nombre="Cliente")
        except Rol.DoesNotExist:
            # Si no existe el rol Cliente, crear uno por defecto
            cliente_rol = Rol.objects.create(
                nombre="Cliente",
                descripcion="Rol para clientes del sistema",
                es_administrativo=False,
                permisos=[],
            )

        # Crear el usuario con el rol de cliente
        user = super().save(request)
        
        # Agregar el teléfono y otros campos adicionales
        user.rol = cliente_rol
        user.telefono = self.validated_data.get('telefono', '')
        user.save()
        
        return user
