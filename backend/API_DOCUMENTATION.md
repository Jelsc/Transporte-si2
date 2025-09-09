# API Documentation - Sistema de Transporte SI2

## Endpoints de Autenticación

### POST /api/admin/register/

Registrar nuevo usuario

```json
{
  "username": "usuario",
  "email": "usuario@example.com",
  "password1": "password123",
  "password2": "password123",
  "first_name": "Nombre",
  "last_name": "Apellido"
}
```

### POST /api/admin/login/

Iniciar sesión

```json
{
  "username": "usuario",
  "password": "password123"
}
```

### POST /api/admin/google/

Login con Google (experimental)

```json
{
  "access_token": "google_access_token"
}
```

### POST /api/admin/logout/

Cerrar sesión (requiere autenticación)

### GET /api/admin/profile/

Obtener perfil del usuario (requiere autenticación)

## Servicios de IA/ML

**⚠️ NOTA**: Estos endpoints existen pero NO tienen interfaz de usuario.

- `POST /api/ml/eta/` - Calcular ETA (requiere autenticación)
- `POST /api/ml/vrp/` - Optimizar rutas (requiere autenticación)
- `POST /api/ml/traffic/` - Información de tráfico (requiere autenticación)
- `GET /api/ml/status/` - Estado de servicios (requiere autenticación)

## Respuestas

### Éxito

```json
{
  "success": true,
  "data": {...}
}
```

### Error

```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

## Autenticación

Los endpoints protegidos requieren el header:

```
Authorization: Bearer <jwt_token>
```
