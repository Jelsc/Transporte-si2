from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Endpoints para la gestión de usuarios y autenticación administrativa
# Todos estos endpoints están bajo /api/admin/ en la URL completa
urlpatterns = [
    # ===== AUTENTICACIÓN ADMINISTRATIVA =====
    # Login administrativo (POST: username, password)
    path("admin/login/", views.AdminTokenObtainPairView.as_view(), name="admin_login"),
    
    # Logout administrativo (POST)
    path("admin/logout/", views.admin_logout, name="admin_logout"),
    
    # Registro de nuevos administradores (POST: username, email, password, etc.)
    path("admin/register/", views.AdminRegistrationView.as_view(), name="admin_register"),
    
    # Renovación de token JWT (POST: refresh)
    path("admin/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # ===== GESTIÓN DE PERFIL =====
    # Ver/editar perfil propio (GET, PUT, PATCH)
    path("profile/", views.UserProfileView.as_view(), name="user_profile"),
    
    # Cambiar contraseña (POST: old_password, new_password, new_password_confirm)
    path(
        "change-password/", views.ChangePasswordView.as_view(), name="change_password"
    ),
    
    # Datos del dashboard del usuario (GET)
    path("dashboard-data/", views.user_dashboard_data, name="dashboard_data"),
    
    # ===== GESTIÓN DE ROLES Y USUARIOS =====
    # Listar y crear roles (GET, POST)
    path("roles/", views.RolListCreateView.as_view(), name="role_list_create"),
    
    # Listar y crear usuarios (GET, POST)
    path("users/", views.UserListCreateView.as_view(), name="user_list_create"),
    
    # ===== AUTENTICACIÓN SOCIAL =====
    # Autenticación con Google (POST: token_id)
    path("google/", views.google_auth, name="google_auth"),
]
