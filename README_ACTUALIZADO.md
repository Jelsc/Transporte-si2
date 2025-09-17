# Sistema de Transporte SI2

Sistema de información completo para una empresa de transporte, desarrollado con Django DRF + React + shadcn/ui.

## 🚀 Características Principales

- **Gestión de Personal**: CRUD completo para personal de la empresa
- **Gestión de Conductores**: CRUD completo para conductores con validaciones de licencia
- **Gestión de Usuarios**: CRUD completo con autocompletado desde personal/conductor
- **Autenticación Dual**: Login administrativo y registro público de clientes
- **Panel Administrativo**: Interfaz moderna con shadcn/ui
- **Validaciones Robustas**: Validaciones de unicidad y reglas de negocio
- **Autocompletado Inteligente**: Vinculación automática de datos entre entidades

## 🏗️ Arquitectura

### Backend
- **Django 4.2** + **Django REST Framework**
- **PostgreSQL** como base de datos principal
- **Redis** para cache y sesiones
- **django-allauth** para autenticación
- **JWT** para autenticación API

### Frontend
- **React 18** + **TypeScript**
- **Vite** como bundler
- **shadcn/ui** para componentes
- **React Hook Form** + **Zod** para formularios
- **TanStack Query** para manejo de estado

### Infraestructura
- **Docker** + **Docker Compose**
- **MailHog** para desarrollo de email
- **Makefile** para automatización

## 📋 Requisitos Previos

- Docker y Docker Compose
- Git
- Make (opcional, para usar comandos del Makefile)

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd transporte-si2
```

### 2. Configuración Inicial

```bash
# Copiar archivo de variables de entorno
cp env.example .env

# Editar variables según necesidad (opcional)
nano .env
```

### 3. Levantar el Sistema

```bash
# Opción 1: Usando Makefile (recomendado)
make setup

# Opción 2: Comandos manuales
docker-compose build
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py seed user rol --force
```

### 4. Crear Superusuario (Opcional)

```bash
make createsuperuser
# o
docker-compose exec backend python manage.py createsuperuser
```

## 🌐 URLs del Sistema

Una vez levantado el sistema, puedes acceder a:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/docs/
- **MailHog**: http://localhost:8025

## 📚 Comandos Útiles

### Usando Makefile

```bash
# Ayuda
make help

# Desarrollo
make dev              # Levantar en modo desarrollo
make logs             # Ver logs de todos los servicios
make logs-backend     # Ver logs solo del backend
make logs-frontend    # Ver logs solo del frontend

# Base de datos
make migrate          # Ejecutar migraciones
make makemigrations   # Crear nuevas migraciones
make seed             # Ejecutar seeders

# Testing
make test             # Ejecutar tests
make test-coverage    # Tests con cobertura

# Limpieza
make clean            # Limpiar todo
make clean-volumes    # Limpiar solo volúmenes
make clean-images     # Limpiar solo imágenes

# Estado
make status           # Ver estado de servicios
make urls             # Mostrar URLs importantes
```

### Comandos Docker Directos

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ejecutar comandos en el backend
docker-compose exec backend python manage.py <comando>

# Acceder al shell del backend
docker-compose exec backend bash

# Acceder al shell del frontend
docker-compose exec frontend sh

# Acceder a la base de datos
docker-compose exec db psql -U postgres -d transporte
```

## 🔐 Autenticación

### Login Administrativo
- **URL**: http://localhost:5173/admin/login
- **Acceso**: Solo usuarios con `is_admin_portal=True`
- **Roles**: Administrador, Supervisor, Operador

### Registro Público
- **URL**: http://localhost:5173/auth/register
- **Acceso**: Público
- **Rol**: Siempre crea usuarios con rol 'Cliente'
- **Verificación**: Requiere verificación de email

## 📊 Módulos Implementados

### 1. Gestión de Personal
- **Campos obligatorios**: nombre, apellido, fecha_nacimiento, telefono, email, ci
- **Validaciones**: email único, ci único
- **Funcionalidades**: CRUD completo, búsqueda, filtros

### 2. Gestión de Conductores
- **Campos obligatorios**: personal (relación), nro_licencia, fecha_venc_licencia, experiencia_anios
- **Validaciones**: nro_licencia único, experiencia_anios >= 0
- **Funcionalidades**: CRUD completo, validación de vencimiento de licencia

### 3. Gestión de Usuarios
- **Funcionalidades**: CRUD completo, autocompletado desde personal/conductor
- **Roles**: Administrador, Cliente, Supervisor, Conductor, Operador
- **Control de acceso**: `is_admin_portal` controla acceso al panel administrativo

## 🔧 Configuración Avanzada

### Variables de Entorno

Las principales variables de entorno están en el archivo `.env`:

```bash
# Base de datos
POSTGRES_DB=transporte
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Django
DJANGO_DEBUG=1
DJANGO_SECRET_KEY=your-secret-key

# URLs
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:8000

# Email (desarrollo)
EMAIL_HOST=mailhog
EMAIL_PORT=1025
DEFAULT_FROM_EMAIL=noreply@transporte.local

# Google OAuth (opcional)
GOOGLE_OAUTH2_CLIENT_ID=your-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-client-secret
```

### Personalización de Roles y Permisos

Los roles y permisos se pueden personalizar en:
- `backend/users/constants.py`: Definición de permisos
- `backend/users/seeders/`: Seeders de roles iniciales

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
make test

# Tests con cobertura
make test-coverage

# Tests específicos
docker-compose exec backend python manage.py test users.tests
```

### Casos de Prueba

Ver `CASOS_DE_PRUEBA.md` para casos de prueba detallados.

## 📝 Desarrollo

### Estructura del Proyecto

```
transporte-si2/
├── backend/                 # Django backend
│   ├── users/              # Gestión de usuarios
│   ├── personal/           # Gestión de personal
│   ├── conductores/        # Gestión de conductores
│   ├── bitacora/           # Sistema de auditoría
│   └── core/               # Configuración Django
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/admin/    # Páginas administrativas
│   │   ├── components/     # Componentes reutilizables
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── services/       # Servicios API
│   │   └── types/          # Tipos TypeScript
├── docker-compose.yml      # Configuración Docker
├── Makefile               # Comandos de automatización
└── docs/                  # Documentación
```

### Agregar Nuevas Funcionalidades

1. **Backend**: Crear modelos, serializers, viewsets en la app correspondiente
2. **Frontend**: Crear tipos, servicios, hooks y componentes
3. **Testing**: Agregar casos de prueba
4. **Documentación**: Actualizar documentación

### Convenciones de Código

- **Backend**: PEP 8, docstrings en español
- **Frontend**: ESLint, Prettier, comentarios en español
- **Commits**: Conventional Commits
- **Branches**: feature/nombre-funcionalidad

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a la base de datos**
   ```bash
   make down
   make clean-volumes
   make up
   ```

2. **Error de migraciones**
   ```bash
   make makemigrations
   make migrate
   ```

3. **Error de permisos en Docker**
   ```bash
   sudo chown -R $USER:$USER .
   ```

4. **Frontend no se conecta al backend**
   - Verificar que `VITE_API_URL` esté configurado correctamente
   - Verificar que el backend esté corriendo en el puerto 8000

### Logs y Debugging

```bash
# Ver logs de todos los servicios
make logs

# Ver logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Acceder al shell para debugging
make shell-backend
make shell-frontend
```

## 📈 Monitoreo y Producción

### Para Producción

1. Cambiar `DJANGO_DEBUG=0` en `.env`
2. Configurar variables de email reales
3. Usar base de datos externa
4. Configurar HTTPS
5. Implementar logging y monitoreo

### Backup y Restore

```bash
# Backup de base de datos
make backup-db

# Restore de base de datos
make restore-db FILE=backup_20231201_120000.sql
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Revisar la documentación técnica en `DOCUMENTACION_TECNICA.md`
- Consultar los casos de prueba en `CASOS_DE_PRUEBA.md`

---

**Desarrollado con ❤️ para la gestión eficiente de empresas de transporte**
