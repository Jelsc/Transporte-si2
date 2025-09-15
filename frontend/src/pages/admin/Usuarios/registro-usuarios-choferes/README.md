# CRUD de Usuarios - Sistema de Transporte

## Descripción

Este módulo contiene los componentes para la gestión completa de usuarios del sistema de transporte, incluyendo la creación, edición, eliminación y vinculación con perfiles específicos (conductores y personal de empresa).

## Componentes

### 1. UsuariosCRUD.tsx
**Componente principal para la gestión de usuarios**

#### Características:
- **CRUD completo**: Crear, leer, actualizar y eliminar usuarios
- **Vinculación de perfiles**: Conectar usuarios con conductores o personal existente
- **Gestión de roles**: Asignar roles específicos a cada usuario
- **Búsqueda y filtrado**: Buscar usuarios por nombre, email, username o rol
- **Interfaz dual**: Vista en tarjetas y tabla tradicional
- **Validaciones**: Campos obligatorios y validaciones de negocio

#### Funcionalidades principales:

##### Crear Usuario
```typescript
// Campos del formulario
{
  username: string;        // Obligatorio
  email: string;          // Obligatorio
  first_name: string;
  last_name: string;
  password: string;       // Obligatorio para nuevos usuarios
  telefono: string;
  direccion: string;
  rol_id: string;         // Obligatorio
}
```

##### Vincular con Perfiles
- **Conductores**: Vincular usuario administrativo con perfil de conductor existente
- **Personal**: Vincular usuario administrativo con perfil de personal existente
- **Validación**: Solo usuarios administrativos pueden tener perfiles vinculados

##### Gestión de Roles
- Selección de rol desde lista de roles disponibles
- Indicación visual del tipo de rol (administrativo/cliente)
- Permisos automáticos según el rol asignado

### 2. ChoferesCRUD.tsx
**Componente para gestión de conductores**

#### Características:
- Gestión de información de conductores
- Validación de licencias
- Estados de conductor (disponible, ocupado, descanso, inactivo)
- Información de contacto y emergencia

### 3. PersonalCRUD.tsx
**Componente para gestión de personal de empresa**

#### Características:
- Gestión de empleados (administradores, supervisores, operadores)
- Información laboral (departamento, cargo, salario)
- Jerarquía organizacional
- Estados laborales

## Flujo de Trabajo

### 1. Crear Usuario Administrativo
1. **Crear Usuario**: Usar UsuariosCRUD para crear usuario con rol administrativo
2. **Crear Perfil**: Usar ChoferesCRUD o PersonalCRUD para crear perfil específico
3. **Vincular**: En UsuariosCRUD, vincular el usuario con el perfil creado

### 2. Crear Usuario Cliente
1. **Crear Usuario**: Usar UsuariosCRUD con rol "cliente"
2. **Sin perfil adicional**: Los clientes no requieren perfiles específicos

### 3. Gestión de Permisos
- Los permisos se asignan automáticamente según el rol
- Los roles se gestionan desde el módulo de roles y permisos
- Cada usuario hereda los permisos de su rol asignado

## API Endpoints

### Usuarios
- `GET /api/admin/users/` - Listar usuarios
- `POST /api/admin/users/` - Crear usuario
- `GET /api/admin/users/{id}/` - Obtener usuario
- `PUT /api/admin/users/{id}/` - Actualizar usuario
- `DELETE /api/admin/users/{id}/` - Eliminar usuario

### Conductores
- `GET /api/conductores/conductores/` - Listar conductores
- `POST /api/conductores/conductores/` - Crear conductor
- `PATCH /api/conductores/conductores/{id}/` - Actualizar conductor

### Personal
- `GET /api/personal/personal/` - Listar personal
- `POST /api/personal/personal/` - Crear empleado
- `PATCH /api/personal/personal/{id}/` - Actualizar empleado

### Roles
- `GET /api/admin/roles/` - Listar roles
- `GET /api/admin/roles/permisos_disponibles/` - Ver permisos disponibles

## Validaciones

### Usuario
- **Username**: Único, obligatorio
- **Email**: Único, formato válido, obligatorio
- **Password**: Mínimo 8 caracteres (para nuevos usuarios)
- **Rol**: Obligatorio, debe existir en el sistema

### Vinculación de Perfiles
- **Conductores**: Solo usuarios administrativos pueden vincularse
- **Personal**: Solo usuarios administrativos pueden vincularse
- **Unicidad**: Un conductor/personal solo puede estar vinculado a un usuario

## Estados y Permisos

### Estados de Usuario
- **Activo**: Usuario puede acceder al sistema
- **Inactivo**: Usuario no puede acceder al sistema

### Tipos de Login
- **Login Administrativo**: Para usuarios con roles administrativos
- **Login Cliente**: Para usuarios con rol cliente

### Permisos por Rol
- **Administrador**: Todos los permisos del sistema
- **Supervisor**: Permisos de monitoreo y gestión básica
- **Operador**: Permisos de operación y asignación
- **Conductor**: Permisos específicos de conductor
- **Cliente**: Permisos básicos de cliente

## Interfaz de Usuario

### Vista en Tarjetas
- Información principal del usuario
- Indicador visual del rol
- Perfil vinculado (si existe)
- Opciones de vinculación (si aplica)
- Botones de acción (editar/eliminar)

### Vista en Tabla
- Lista compacta de todos los usuarios
- Información esencial en columnas
- Filtros y búsqueda
- Acciones rápidas

### Modal de Creación/Edición
- Formulario completo con validaciones
- Campos organizados por secciones
- Indicadores de campos obligatorios
- Botón de mostrar/ocultar contraseña

## Consideraciones de Seguridad

1. **Autenticación**: Todos los endpoints requieren token JWT válido
2. **Autorización**: Solo usuarios con permisos pueden gestionar otros usuarios
3. **Validación**: Validaciones tanto en frontend como backend
4. **Auditoría**: Todas las acciones se registran en bitácora
5. **Contraseñas**: No se muestran contraseñas existentes, solo se permiten cambios

## Uso Recomendado

1. **Primero**: Crear roles y permisos desde el módulo de roles
2. **Segundo**: Crear usuarios con roles apropiados
3. **Tercero**: Crear perfiles específicos (conductores/personal)
4. **Cuarto**: Vincular usuarios con sus perfiles correspondientes
5. **Quinto**: Probar login y permisos

## Troubleshooting

### Error: "Usuario ya existe"
- Verificar que el username y email sean únicos
- Revisar si el usuario está marcado como inactivo

### Error: "Rol no válido"
- Verificar que el rol existe en el sistema
- Ejecutar seeder de roles si es necesario

### Error: "No se puede vincular perfil"
- Verificar que el usuario tenga rol administrativo
- Verificar que el perfil no esté ya vinculado
- Verificar permisos del usuario actual

### Error: "Token inválido"
- Verificar que el token JWT esté presente
- Renovar token si ha expirado
- Verificar que el usuario esté activo
