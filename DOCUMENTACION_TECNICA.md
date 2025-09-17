# Documentación Técnica - Sistema de Transporte SI2

## Resumen Ejecutivo

Este documento describe la implementación completa del sistema de información para una empresa de transporte, incluyendo la auditoría del sistema existente, el refactor propuesto y la implementación de los módulos de gestión de personal, conductores y usuarios.

## 1. Auditoría del Sistema Existente

### 1.1 Estructura Backend Identificada

**Apps Django existentes:**
- `users`: Gestión de usuarios, roles y permisos
- `personal`: Gestión de personal de la empresa (modelo `PersonalEmpresa`)
- `conductores`: Gestión de conductores (modelo `Conductor`)
- `bitacora`: Sistema de auditoría (no modificado)

### 1.2 Problemas Identificados

1. **Duplicación de datos**: Información personal duplicada entre `CustomUser`, `PersonalEmpresa` y `Conductor`
2. **Falta de validaciones**: Campos obligatorios sin validación, falta de restricciones de unicidad
3. **Relaciones inconsistentes**: Relaciones entre modelos no optimizadas
4. **Falta de autocompletado**: No existe funcionalidad para autocompletar datos de usuario desde personal/conductor
5. **Permisos incompletos**: Sistema de permisos no implementado completamente
6. **Frontend incompleto**: Faltan páginas y formularios para los CRUDs

### 1.3 Estructura Frontend Identificada

- React + TypeScript + Vite
- shadcn/ui para componentes
- Context API para autenticación
- Estructura de páginas admin existente

## 2. Propuesta de Refactor

### 2.1 Opción Elegida: Opción A (Mínimo Cambio)

**Justificación:**
- Mantiene la estructura existente de apps
- Minimiza el impacto en el sistema de bitácora
- Permite implementación incremental
- Reduce el riesgo de errores

### 2.2 Estructura Final Propuesta

```
backend/
├── users/           # CustomUser + roles + permisos
├── personal/        # Personal (refactorizado)
├── conductores/     # Conductor (refactorizado)
└── bitacora/        # Sin cambios
```

### 2.3 Modelos Finales

#### CustomUser
```python
class CustomUser(AbstractUser):
    ci = CharField(max_length=20, unique=True, null=True, blank=True)
    fecha_nacimiento = DateField(null=True, blank=True)
    is_admin_portal = BooleanField(default=False)
    personal = OneToOneField('personal.Personal', null=True, blank=True)
    conductor = OneToOneField('conductores.Conductor', null=True, blank=True)
```

#### Personal
```python
class Personal(models.Model):
    nombre = CharField(max_length=100)
    apellido = CharField(max_length=100)
    fecha_nacimiento = DateField()
    telefono = CharField(max_length=20)
    email = EmailField(unique=True)
    ci = CharField(max_length=20, unique=True)
    # ... otros campos opcionales
```

#### Conductor
```python
class Conductor(models.Model):
    personal = OneToOneField('personal.Personal', on_delete=CASCADE)
    nro_licencia = CharField(max_length=20, unique=True)
    fecha_venc_licencia = DateField()
    experiencia_anios = IntegerField(default=0)
    # ... otros campos
```

## 3. Implementación Backend

### 3.1 Modelos Implementados

**Archivos modificados:**
- `backend/users/models.py`: CustomUser actualizado
- `backend/personal/models.py`: PersonalEmpresa → Personal
- `backend/conductores/models.py`: Conductor refactorizado

**Características principales:**
- Validaciones de unicidad para CI, email, nro_licencia
- Relaciones OneToOne optimizadas
- Índices para campos de búsqueda frecuente
- Propiedades calculadas (licencia_vencida, nombre_completo)

### 3.2 Serializers DRF

**Archivos creados/modificados:**
- `backend/users/serializers.py`: UserSerializer con autocompletado
- `backend/personal/serializers.py`: PersonalSerializer
- `backend/conductores/serializers.py`: ConductorSerializer

**Funcionalidades:**
- Validaciones de unicidad
- Autocompletado de datos de usuario desde personal/conductor
- Campos de solo lectura para IDs y timestamps
- Validación de contraseñas

### 3.3 ViewSets y Permisos

**ViewSets implementados:**
- `PersonalViewSet`: CRUD completo para personal
- `ConductorViewSet`: CRUD completo para conductores
- `UserViewSet`: CRUD para usuarios + autocompletado

**Permisos personalizados:**
- `IsAdminOrStaffReadOnly`: Lectura para staff, escritura para admin
- `IsStaffAdmin`: Acceso completo para admin/supervisor/operador

### 3.4 URLs y Routing

**Endpoints implementados:**
- `/api/personal/` - CRUD personal
- `/api/conductores/` - CRUD conductores
- `/api/users/` - CRUD usuarios
- `/api/users/personal_disponible/` - Autocompletado personal
- `/api/users/conductores_disponibles/` - Autocompletado conductores

## 4. Implementación Frontend

### 4.1 Tipos TypeScript

**Archivo:** `frontend/src/types/index.ts`
- `User`: Tipo actualizado con nuevos campos
- `Personal`: Tipo para personal
- `Conductor`: Tipo para conductores
- `Role`: Tipo para roles

### 4.2 Servicios API

**Archivos creados:**
- `frontend/src/services/personalService.ts`
- `frontend/src/services/conductorService.ts`
- `frontend/src/services/api.ts` (actualizado)

**Funcionalidades:**
- CRUD completo para cada entidad
- Manejo de errores consistente
- Autocompletado para usuarios

### 4.3 Hooks Personalizados

**Archivos creados:**
- `frontend/src/hooks/useCrud.ts`: Hook genérico para CRUD
- `frontend/src/hooks/usePersonal.ts`: Hook específico para personal
- `frontend/src/hooks/useConductores.ts`: Hook específico para conductores
- `frontend/src/hooks/useUsuarios.ts`: Hook específico para usuarios
- `frontend/src/hooks/useRoles.ts`: Hook para roles

### 4.4 Páginas Administrativas

**Páginas implementadas:**
- `/admin/personal` - Gestión de personal
- `/admin/conductores` - Gestión de conductores
- `/admin/usuarios` - Gestión de usuarios

**Características:**
- Tablas con búsqueda y paginación
- Formularios modales con validación
- Autocompletado de datos
- Manejo de errores con toasts

### 4.5 Formularios

**Formularios implementados:**
- `PersonalForm`: Formulario para personal con validación zod
- `ConductorForm`: Formulario para conductores con validación zod
- `UsuarioForm`: Formulario para usuarios con autocompletado

**Tecnologías:**
- react-hook-form para manejo de formularios
- zod para validación de esquemas
- shadcn/ui para componentes

## 5. Configuración Docker

### 5.1 Servicios Configurados

- **PostgreSQL**: Base de datos principal
- **Redis**: Cache y sesiones
- **MailHog**: Servidor SMTP para desarrollo
- **Backend**: Django + DRF
- **Frontend**: React + Vite

### 5.2 Variables de Entorno

**Archivo:** `env.example`
- Configuración de base de datos
- URLs del frontend
- Configuración de email
- Configuración de CORS
- Configuración de JWT

### 5.3 Makefile

**Comandos disponibles:**
- `make setup`: Configuración inicial
- `make up`: Levantar servicios
- `make migrate`: Ejecutar migraciones
- `make seed`: Ejecutar seeders
- `make test`: Ejecutar tests

## 6. Reglas de Negocio Implementadas

### 6.1 CRUD Personal

**Campos obligatorios:**
- nombre, apellido, fecha_nacimiento, telefono, email, ci

**Restricciones:**
- email único
- ci único

### 6.2 CRUD Conductores

**Campos obligatorios:**
- personal (relación), nro_licencia, fecha_venc_licencia, experiencia_anios

**Restricciones:**
- nro_licencia único
- experiencia_anios >= 0
- Validación de fecha de vencimiento

### 6.3 CRUD Usuarios

**Funcionalidades:**
- Autocompletado desde personal/conductor
- Control de acceso administrativo (is_admin_portal)
- Roles: Administrador, Cliente, Supervisor, Conductor, Operador
- Registro público siempre crea usuarios 'Cliente' sin acceso admin

## 7. Autenticación y Permisos

### 7.1 Flujos de Autenticación

1. **Login Administrativo**: Username/email + password → Panel admin
2. **Registro Cliente**: Email + datos → Verificación email → Login → Panel cliente

### 7.2 Control de Acceso

- `is_admin_portal`: Controla acceso al panel administrativo
- Roles con permisos específicos
- Middleware de verificación de acceso

## 8. Casos de Prueba

### 8.1 Casos de Prueba Backend

1. **Validaciones de Unicidad**
   - CI único en personal y usuarios
   - Email único en personal y usuarios
   - Nro_licencia único en conductores

2. **Autocompletado**
   - Crear usuario vinculado a personal
   - Crear usuario vinculado a conductor
   - Verificar autocompletado de datos

3. **Permisos**
   - Solo admin puede crear/editar usuarios
   - Staff puede leer, admin puede escribir
   - Verificar acceso al panel administrativo

4. **Registro Público**
   - Registro siempre crea rol 'Cliente'
   - is_admin_portal siempre False
   - Requiere verificación de email

### 8.2 Casos de Prueba Frontend

1. **Formularios**
   - Validación de campos obligatorios
   - Autocompletado funciona correctamente
   - Manejo de errores de validación

2. **Tablas**
   - Búsqueda funciona
   - Paginación funciona
   - Filtros funcionan

3. **Navegación**
   - Protección de rutas admin
   - Redirección según tipo de usuario

## 9. Instrucciones de Ejecución

### 9.1 Configuración Inicial

```bash
# Clonar y configurar
git clone <repo>
cd transporte-si2
cp env.example .env
make setup
```

### 9.2 Comandos de Desarrollo

```bash
# Levantar servicios
make up

# Ver logs
make logs

# Ejecutar migraciones
make migrate

# Crear superusuario
make createsuperuser

# Ejecutar tests
make test
```

### 9.3 URLs del Sistema

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Django: http://localhost:8000/admin
- MailHog: http://localhost:8025

## 10. Próximos Pasos

### 10.1 Implementaciones Pendientes

1. **Tests Unitarios**: Completar suite de tests
2. **Documentación API**: Swagger/OpenAPI actualizado
3. **Monitoreo**: Logs y métricas
4. **Seguridad**: Rate limiting, validaciones adicionales

### 10.2 Mejoras Futuras

1. **Módulos Adicionales**: Vehículos, rutas, viajes
2. **Notificaciones**: Sistema de notificaciones en tiempo real
3. **Reportes**: Dashboard con métricas
4. **Mobile**: App móvil para conductores

## 11. Conclusión

El refactor implementado resuelve los problemas identificados en la auditoría, manteniendo la compatibilidad con el sistema existente y proporcionando una base sólida para futuras expansiones. La implementación sigue las mejores prácticas de Django, React y Docker, asegurando mantenibilidad y escalabilidad.
