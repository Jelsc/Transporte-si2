from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Autenticación administrativa
    path("admin/login/", views.AdminTokenObtainPairView.as_view(), name="admin_login"),
    path("admin/logout/", views.admin_logout, name="admin_logout"),
    path(
        "admin/register/", views.AdminRegistrationView.as_view(), name="admin_register"
    ),
    path("admin/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Perfil y gestión de usuarios
    path("profile/", views.UserProfileView.as_view(), name="user_profile"),
    path(
        "change-password/", views.ChangePasswordView.as_view(), name="change_password"
    ),
    path("dashboard-data/", views.user_dashboard_data, name="dashboard_data"),
    # Gestión de roles y usuarios (solo admin)
    path("roles/", views.RolListCreateView.as_view(), name="role_list_create"),
    path("users/", views.UserListCreateView.as_view(), name="user_list_create"),
    # OAuth
    path("google/", views.google_auth, name="google_auth"),
]
