# Documentación de la API - Sistema de Transporte

## Resumen del Sistema

El sistema está diseñado con dos tipos de login principales:

1. **Login Administrativo**: Para personal de la empresa (administradores, supervisores, operadores, conductores)
2. **Login de Clientes**: Para clientes que solicitan servicios de transporte

## Estructura de Módulos

### 1. Módulo de Usuarios (`users`)
- **Modelos**: `CustomUser`, `Rol`
- **Funcionalidades**: Autenticación, gestión de roles y permisos
- **Endpoints**: `/api/admin/`

### 2. Módulo de Conductores (`conductores`)
- **Modelos**: `Conductor`
- **Funcionalidades**: CRUD de conductores, gestión de licencias, estados
- **Endpoints**: `/api/conductores/`

### 3. Módulo de Personal (`personal`)
- **Modelos**: `PersonalEmpresa`, `Departamento`
- **Funcionalidades**: CRUD de personal administrativo, gestión de departamentos
- **Endpoints**: `/api/personal/`

## Endpoints de Autenticación

### Login Administrativo
```http
POST /api/admin/admin/login/
Content-Type: application/json

{
    "username": "admin_user",
    "password": "password123"
}
```

**Respuesta:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "admin_user",
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "rol": {
            "id": 1,
            "nombre": "administrador",
            "permisos": ["gestionar_usuarios", "gestionar_roles", ...]
        }
    },
    "tipo_login": "administrativo"
}
```

### Login de Clientes
```http
POST /api/admin/cliente/login/
Content-Type: application/json

{
    "username": "cliente_user",
    "password": "password123"
}
```

### Logout Universal
```http
POST /api/admin/logout/
Content-Type: application/json
Authorization: Bearer <access_token>

{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Endpoints de Conductores

### Listar Conductores
```http
GET /api/conductores/conductores/
Authorization: Bearer <access_token>
```

### Crear Conductor
```http
POST /api/conductores/conductores/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "username": "conductor_user",
    "email": "conductor@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "password": "password123",
    "numero_licencia": "LIC123456",
    "tipo_licencia": "B",
    "fecha_vencimiento_licencia": "2025-12-31",
    "experiencia_anos": 5,
    "telefono_emergencia": "123456789",
    "contacto_emergencia": "María Pérez"
}
```

### Actualizar Estado del Conductor
```http
POST /api/conductores/conductores/{id}/cambiar_estado/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "estado": "disponible"
}
```

### Actualizar Ubicación
```http
POST /api/conductores/conductores/{id}/actualizar_ubicacion/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "ultima_ubicacion_lat": -16.5000,
    "ultima_ubicacion_lng": -68.1500
}
```

### Estadísticas de Conductores
```http
GET /api/conductores/conductores/estadisticas/
Authorization: Bearer <access_token>
```

## Endpoints de Personal

### Listar Personal
```http
GET /api/personal/personal/
Authorization: Bearer <access_token>
```

### Crear Empleado
```http
POST /api/personal/personal/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "username": "empleado_user",
    "email": "empleado@example.com",
    "first_name": "Carlos",
    "last_name": "González",
    "password": "password123",
    "tipo_personal": "operador",
    "codigo_empleado": "EMP001",
    "departamento": "Operaciones",
    "cargo": "Operador de Transporte",
    "fecha_ingreso": "2024-01-15",
    "salario": 5000.00,
    "horario_trabajo": "8:00 - 17:00"
}
```

### Listar Departamentos
```http
GET /api/personal/departamentos/
Authorization: Bearer <access_token>
```

## Endpoints de Roles y Permisos

### Listar Roles
```http
GET /api/admin/roles/
Authorization: Bearer <access_token>
```

### Crear Rol
```http
POST /api/admin/roles/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "nombre": "nuevo_rol",
    "descripcion": "Descripción del nuevo rol",
    "es_administrativo": true,
    "permisos": ["gestionar_usuarios", "ver_reportes_basicos"]
}
```

### Asignar Permisos a Rol
```http
POST /api/admin/roles/{id}/asignar_permisos/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "permisos": ["gestionar_conductores", "ver_vehiculos", "monitorear_rutas"]
}
```

### Ver Permisos Disponibles
```http
GET /api/admin/roles/permisos_disponibles/
Authorization: Bearer <access_token>
```

## Sistema de Permisos

### Permisos Administrativos
- `gestionar_usuarios`: Gestionar usuarios del sistema
- `gestionar_roles`: Gestionar roles y permisos
- `ver_dashboard_admin`: Ver dashboard administrativo
- `gestionar_configuracion`: Gestionar configuración del sistema

### Permisos de Conductores
- `gestionar_conductores`: Gestionar conductores del sistema
- `crear_conductor`: Crear nuevos conductores
- `editar_conductor`: Editar información de conductores
- `eliminar_conductor`: Eliminar conductores
- `ver_conductores`: Ver lista de conductores

### Permisos de Personal
- `gestionar_personal`: Gestionar personal de empresa
- `crear_personal`: Crear nuevo personal de empresa
- `editar_personal`: Editar información del personal
- `eliminar_personal`: Eliminar personal de empresa
- `ver_personal`: Ver lista de personal de empresa
- `gestionar_departamentos`: Gestionar departamentos

## Roles Predefinidos

### Administrador
- Todos los permisos administrativos
- Gestión completa de usuarios, roles, conductores y personal
- Acceso a reportes avanzados

### Supervisor
- Monitoreo de operaciones
- Gestión de viajes y vehículos
- Reportes básicos
- Ver información de conductores y personal

### Operador
- Asignación de viajes
- Monitoreo básico
- Ver información de conductores y vehículos

### Conductor
- Actualizar estado (disponible/ocupado)
- Ver viajes asignados
- Iniciar/finalizar viajes
- Reportar incidentes

### Cliente
- Solicitar viajes
- Ver historial de viajes
- Gestionar perfil personal

## Configuración Inicial

### 1. Crear Roles y Permisos
```bash
python manage.py runseeders rol_permissions_seeder
```

### 2. Crear Usuario Administrador
```bash
python manage.py createsuperuser
```

### 3. Migrar Base de Datos
```bash
python manage.py makemigrations
python manage.py migrate
```

## Autenticación y Autorización

### Headers Requeridos
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Manejo de Errores
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Sin permisos para la acción
- **400 Bad Request**: Datos inválidos
- **404 Not Found**: Recurso no encontrado

### Renovación de Token
```http
POST /api/admin/token/refresh/
Content-Type: application/json

{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Ejemplos de Uso

### Flujo de Login Administrativo
1. POST `/api/admin/admin/login/` con credenciales
2. Recibir tokens JWT
3. Usar `access_token` en header `Authorization: Bearer <token>`
4. Acceder a endpoints administrativos

### Flujo de Login Cliente
1. POST `/api/admin/cliente/login/` con credenciales
2. Recibir tokens JWT
3. Usar `access_token` en header `Authorization: Bearer <token>`
4. Acceder a endpoints de cliente

### Gestión de Conductores
1. Login como administrador
2. POST `/api/conductores/conductores/` para crear conductor
3. GET `/api/conductores/conductores/` para listar
4. POST `/api/conductores/conductores/{id}/cambiar_estado/` para cambiar estado

## Notas Importantes

- Los clientes solo pueden acceder a endpoints de cliente
- Los administrativos pueden acceder a endpoints administrativos según sus permisos
- Cada acción se registra en la bitácora del sistema
- Los tokens JWT tienen tiempo de vida limitado
- Se requiere renovación periódica del token de acceso
