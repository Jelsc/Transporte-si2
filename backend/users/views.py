from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from bitacora.utils import registrar_bitacora

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from dj_rest_auth.views import LoginView, LogoutView
from dj_rest_auth.registration.views import RegisterView
from django.utils.timezone import now


from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
import requests
import json
from .models import Rol
from .serializers import (
    UserSerializer,
    AdminLoginSerializer,
    AdminRegistrationSerializer,
    ChangePasswordSerializer,
    RolSerializer,
)

User = get_user_model()


class AdminTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para login de administradores con JWT"""

    serializer_class = AdminLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        # Actualizar último acceso
        user.fecha_ultimo_acceso = timezone.now()
        
        #BITACORA
        registrar_bitacora(
        request=request,
        usuario=user,
        accion="Login",
        descripcion="Administrador inicio sesion",
        modulo="ADMINISTRACION"
        )    
        
        user.save(update_fields=["fecha_ultimo_acceso"])

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            }
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def admin_logout(request):
    """Logout para administradores (invalidar token)"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {"message": "Logout exitoso"}, status=status.HTTP_205_RESET_CONTENT
        )
    
    except Exception as e:
        registrar_bitacora(
        request=request,
        accion="Logout",
        descripcion="Administrador cerro sesion",
        modulo="ADMINISTRACION"
        )   
        return Response({"error": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)


class AdminRegistrationView(generics.CreateAPIView):
    """Registro de nuevos usuarios administrativos (solo para superusuarios)"""

    queryset = User.objects.all()
    serializer_class = AdminRegistrationSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        # Solo superusuarios pueden crear usuarios administrativos
        if not self.request.user.is_superuser:
            raise permissions.PermissionDenied(
                "Solo superusuarios pueden crear usuarios administrativos"
            )
        
        serializer.save()


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Perfil del usuario actual"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """Cambio de contraseña"""

    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Verificar contraseña actual
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response(
                    {"old_password": ["Contraseña actual incorrecta"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Establecer nueva contraseña
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response(
                {"message": "Contraseña actualizada exitosamente"},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RolListCreateView(generics.ListCreateAPIView):
    """Lista y creación de roles"""

    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAdminUser]


class UserListCreateView(generics.ListCreateAPIView):
    """Lista y creación de usuarios (solo administrativos)"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo mostrar usuarios administrativos
        return User.objects.filter(rol__es_administrativo=True)

    def perform_create(self, serializer):
        # Solo superusuarios pueden crear usuarios
        if not self.request.user.is_superuser:
            raise permissions.PermissionDenied(
                "Solo superusuarios pueden crear usuarios"
            )
        serializer.save()


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard_data(request):
    """Datos del dashboard del usuario"""
    user = request.user

    if user.es_administrativo:
        # Datos para administradores
        data = {
            "tipo_usuario": "administrativo",
            "rol": user.rol.nombre if user.rol else "Sin rol",
            "permisos": user.rol.permisos if user.rol else [],
            "departamento": user.departamento,
            "codigo_empleado": user.codigo_empleado,
        }
    else:
        # Datos para clientes
        data = {
            "tipo_usuario": "cliente",
            "rol": user.rol.nombre if user.rol else "Sin rol",
        }

    return Response(data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    """
    Vista para autenticación con Google OAuth
    """
    try:
        access_token = request.data.get("access_token")

        if not access_token:
            return Response(
                {"error": "Token de acceso requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar si es un token de prueba
        if access_token == "mock_google_token_for_testing":
            # Usar datos de prueba
            google_data = {
                "email": "test@example.com",
                "given_name": "Usuario",
                "family_name": "Prueba",
            }
            email = google_data["email"]
            first_name = google_data["given_name"]
            last_name = google_data["family_name"]
            username = email
        else:
            # Verificar el token con Google
            google_response = requests.get(
                f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
            )

            if google_response.status_code != 200:
                return Response(
                    {"error": "Token de Google inválido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            google_data = google_response.json()
            email = google_data.get("email")
            first_name = google_data.get("given_name", "")
            last_name = google_data.get("family_name", "")
            username = google_data.get("email")  # Usar email como username

        if not email:
            return Response(
                {"error": "Email no proporcionado por Google"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Buscar o crear usuario
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Crear nuevo usuario
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=None,  # No password para OAuth
                is_active=True,
            )

            # Asignar rol de Cliente por defecto
            try:
                cliente_rol = Rol.objects.get(nombre="Cliente")
                user.rol = cliente_rol
                user.save()
            except Rol.DoesNotExist:
                # Crear rol Cliente si no existe
                cliente_rol = Rol.objects.create(
                    nombre="Cliente",
                    descripcion="Cliente regular del sistema",
                    es_administrativo=False,
                )
                user.rol = cliente_rol
                user.save()

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response(
            {
                "access": str(access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )

    except Exception as e:
        return Response(
            {"error": f"Error en autenticación con Google: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


###PRUEBAS####
User = get_user_model()

class CustomLoginView(LoginView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        # Obtener usuario autenticado real
        username = response.data.get('user', {}).get('username')
        user = User.objects.filter(username=username).first() if username else None

        if user:
            registrar_bitacora(
                request=request,
                accion="Login",
                descripcion=f"El usuario {user.username} inició sesión",
                modulo="AUTENTICACION"
            )

        return response


class CustomLogoutView(LogoutView):
    def post(self, request, *args, **kwargs):
        user = None

        
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                jwt_auth = JWTAuthentication()
                token_str = auth_header.split()[1]  # Bearer <token>
                validated_token = jwt_auth.get_validated_token(token_str)
                user = jwt_auth.get_user(validated_token)
            except Exception:
                user = None

        response = super().post(request, *args, **kwargs)

        if user:
            registrar_bitacora(
                request=request,
                usuario=user,
                accion="Logout",
                descripcion=f"El usuario {user.username} cerró sesión.",
                modulo="AUTENTICACION"
            )

        return response


class CustomRegisterView(RegisterView):
    """Registro con bitácora"""
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        # Obtener usuario recién creado desde el email (campo único)
        email = request.data.get('email')
        user = User.objects.filter(email=email).first() if email else None

        if user:
            registrar_bitacora(
                request=request,
                usuario=user,
                accion="Registro",
                descripcion=f"Se registró el usuario {user.username}",
                modulo="AUTENTICACION"
            )

        return response