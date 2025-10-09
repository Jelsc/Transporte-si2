# 🚀 Sistema de Transporte SI2# transporte-si2

**Sistema integral de gestión de transporte** con arquitectura moderna de 3 capas: Backend Django REST + Frontend React + Mobile Flutter.Monorepo para **PostgreSQL + Django REST (backend)**, **React + Vite (frontend)** y **Flutter (mobile)**.

En DEV usamos Docker para **db + backend + frontend**. Flutter se corre fuera de Docker (emulador/dispositivo).

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](./docker-compose.yml)

[![Django](https://img.shields.io/badge/Django-5.0.7-green)](./backend)> 🔍 **¡NUEVO!** Sistema de [Detección Automática de IP](./AUTODETECT-IP.md) para despliegues en AWS EC2 y otros entornos cloud. Consulta [AUTODETECT-IP.md](./AUTODETECT-IP.md) para más información.

[![React](https://img.shields.io/badge/React-18-blue)](./frontend)

[![Flutter](https://img.shields.io/badge/Flutter-3.0+-orange)](./mobile)## 📁 Estructura

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](./docker-compose.yml)

````

---transporte-si2/

├─ backend/         # Django + DRF

## 🏗️ Arquitectura del Sistema│  ├─ .env.example  # Variables de entorno para el backend (copia a .env)

├─ frontend/        # React + Vite + TS + Tailwind

```│  ├─ .env.example  # Variables de entorno para el frontend (copia a .env)

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐├─ mobile/          # Flutter (fuera de Docker en dev)

│   📱 Mobile     │    │   🌐 Frontend   │    │   🔧 Backend    │├─ docker-compose.yml

│   Flutter       │◄──►│   React + Vite  │◄──►│   Django REST   │└─ README.md

│   (iOS/Android) │    │   TypeScript    │    │   PostgreSQL    │```

└─────────────────┘    └─────────────────┘    └─────────────────┘

         ▲                        ▲                        ▲---

         │                        │                        │

         └────────────────────────┼────────────────────────┘## 🚀 Pasos rápidos (con Docker)

                                  │

                         🔔 Firebase Push Notifications### 0) Requisitos

````

- Docker Desktop (o Docker Engine + Compose)

---- Git

- (Opcional) Node 18+ si vas a tocar el frontend sin Docker

## 📁 Estructura del Proyecto- (Opcional) Python 3.11+ si vas a correr backend sin Docker

- flutter

````

transporte-si2/### 1) Clonar y configurar variables

├── 🔧 backend/                    # Django REST API + Admin

│   ├── 🗃️  core/                  # Configuración principal```bash

│   ├── 👥 users/                  # Sistema de usuariosgit clone <URL-DEL-REPO>

│   ├── 🚛 conductores/            # Gestión de conductores

│   ├── 👔 personal/               # Personal de empresa# Linux/Mac

│   ├── 🚗 vehiculos/              # Gestión de vehículoscp backend/.env.example backend/.env

│   ├── 🛣️  viajes/                # Sistema de viajescp frontend/.env.example frontend/.env

│   ├── 🔔 notificaciones/         # Push notifications

│   ├── 📝 bitacora/               # Auditoría y logs# Windows PowerShell

│   └── 📋 requirements.txtcopy backend\.env.example backend\.env

│copy frontend\.env.example frontend\.env

├── 🌐 frontend/                   # React SPA```

│   ├── 🎨 src/components/         # Componentes reutilizables

│   ├── 📄 src/pages/              # Páginas de la aplicación### 2) Levantar servicios

│   ├── 🔧 src/services/           # API clients

│   ├── 🎭 src/context/            # Estado global```bash

│   └── ⚙️  vite.config.tsdocker compose up -d --build

│```

├── 📱 mobile/                     # Flutter App

│   ├── 📂 lib/                    # Código FlutterNota: El superusuario y otros datos iniciales se crean automáticamente durante el arranque del contenedor usando el sistema de seeders. Las credenciales están definidas en el archivo `.env` (variables `DJANGO_SUPERUSER_*`).

│   ├── 🔧 android/                # Configuración Android

│   ├── 🍎 ios/                    # Configuración iOS### 3) Ejecución

│   └── 📋 pubspec.yaml

│```bash

├── 🐳 docker-compose.yml          # Orquestación local# para iniciar los contenedores

├── 🚀 docker-compose.prod.yml     # Configuración produccióndocker compose up -d

├── 📋 deploy.sh                   # Script deployment Unix

├── 📋 deploy.bat                  # Script deployment Windows# MIGRACIONES (importante seguir este orden):

└── 📚 DOCKER-CLOUD-READY.md      # Guía deployment cloud# 1. Primero generar archivos de migración (detecta cambios en modelos)

```#    Para todas las apps:

docker compose exec backend python manage.py makemigrations

---

#    O para apps específicas:

## 🚀 Inicio Rápidodocker compose exec backend python manage.py makemigrations users

docker compose exec backend python manage.py makemigrations account

### Prerrequisitos

# 2. Luego aplicar migraciones a la base de datos

- **Docker Desktop** 4.0+ (Windows/Mac) o **Docker Engine** + **Docker Compose** (Linux)docker compose exec backend python manage.py migrate

- **Git** 2.30+

- **Flutter** 3.0+ (para desarrollo mobile)# SEEDERS:

# Para ejecutar todos los seeders automáticamente:

### 1️⃣ Configuración Inicialdocker compose exec backend python manage.py seed



```bash# Para ejecutar seeders específicos (por nombre, sin el sufijo "_seeder"):

# Clonar repositoriodocker compose exec backend python manage.py seed user rol

git clone <URL-DEL-REPO>

cd transporte-si2# Para ejecutar un nuevo seeder que acabas de crear (ejemplo: vehiculo_seeder.py):

docker compose exec backend python manage.py seed vehiculo

# Configurar variables de entorno

cp backend/.env.example backend/.env# Para forzar la ejecución aunque should_run() devuelva False:

cp frontend/.env.example frontend/.envdocker compose exec backend python manage.py seed --force

docker compose exec backend python manage.py seed vehiculo --force

# Editar archivos .env con tus credenciales

# - Firebase credentials#para parar detener los contenedores

# - Database settingsdocker compose stop

# - API keys```

````

### 3) Comandos útiles

### 2️⃣ Levantar Servicios con Docker

```````bash

```bash# logs en vivo

# Desarrollo (con hot reload)docker compose logs -f backend

docker compose up -d --builddocker compose logs -f db

docker compose logs -f frontend

# Verificar que todos los servicios estén corriendo

docker compose ps```



# Ver logs en tiempo real### 4) URLs

docker compose logs -f

```- Backend (Django): [http://localhost:8000](http://localhost:8000)

- Admin Django: [http://localhost:8000/admin](http://localhost:8000/admin)

### 3️⃣ Configurar Base de Datos- Frontend (Vite): [http://localhost:5173](http://localhost:5173)

- MailHog: [http://localhost:8025](http://localhost:8025/)

```bash

# Ejecutar migraciones## 🧑‍💻 Desarrollo local (sin Docker) — opcional

docker exec transporte_backend python manage.py migrate

### Backend

# Crear superusuario (admin)

docker exec -it transporte_backend python manage.py createsuperuser```bash

cd backend

# Cargar datos iniciales (opcional)python -m venv .venv

docker exec transporte_backend python manage.py loaddata seeders/initial_data.json# Windows

```.\.venv\Scripts\Activate.ps1

# Linux/Mac

### 4️⃣ Desarrollar Mobile (Flutter)# source .venv/bin/activate



```bashpip install -r requirements.txt

cd mobile

# crea y ajusta backend/.env o usa el .env de la raíz (ya configurado)

# Instalar dependencias# para local, POSTGRES_HOST=127.0.0.1

flutter pub get

python manage.py migrate

# Verificar configuraciónpython manage.py runserver

flutter doctor```



# Correr en emulador/dispositivo### Frontend

flutter run

``````bash

cd frontend

---npm install

# asegúrate de tener frontend/.env con VITE_API_URL

## 🔗 Endpoints de Accesonpm run dev -- --host

```````

| Servicio | URL Local | Descripción |

|----------|-----------|-------------|---

| **🌐 Frontend** | http://localhost:3000 | Interfaz web React |

| **🔧 Backend API** | http://localhost:8000/api/ | REST API |## 🧰 Cheatsheet Docker

| **⚙️ Admin Panel** | http://localhost:8000/admin/ | Panel de administración Django |

| **📊 Database** | localhost:5432 | PostgreSQL (usuario: postgres) |```bash

# levantar / reconstruir

---docker compose up -d --build

## 🔔 Sistema de Notificaciones Push# detener

docker compose down

### Características

# detener y borrar volúmenes (borra datos de Postgres)

- ✅ **Multi-plataforma**: Web (React) + Mobile (Flutter)docker compose down -v

- ✅ **Firebase FCM**: Entrega confiable en tiempo real

- ✅ **Arquitectura enterprise**: SOLID principles + Design patterns# ejecutar comandos dentro del backend

- ✅ **Templates inteligentes**: Notificaciones contextualesdocker compose exec backend python manage.py migrate

- ✅ **Tracking completo**: Entregadas/leídas/interaccionesdocker compose exec backend bash

````

### Tipos de Notificaciones

---

```python

# Pago procesado## 🩹 Troubleshooting

NotificationTrigger.pago_realizado(

    usuario_id=123,- **Puertos ocupados**: cambia el lado izquierdo del mapeo en `docker-compose.yml`

    monto=250.50,  (ej: `"8001:8000"`, `"5174:5173"`, `"15432:5432"`).

    concepto="Viaje La Paz - Santa Cruz",- **Backend no conecta a DB en Docker**: confirma que en `compose` se fuerza `POSTGRES_HOST: db`.

    metodo="Tarjeta Visa",- **CORS** en dev: ya está abierto (`CORS_ALLOW_ALL_ORIGINS=True`). En prod **cerrarlo** y usar `CORS_ALLOWED_ORIGINS`.

    pago_id="PAY-12345"- **Vite no ve la API**: revisa `frontend/.env` → `VITE_API_URL=http://localhost:8000`.

)

---

# Viaje confirmado

NotificationTrigger.viaje_confirmado(## 📦 Roadmap (VRP / ETA)

    usuario_id=123,

    origen="La Paz",- **VRP**: integrar `ortools` para ruteo (tareas offline con Celery + Redis).

    destino="Santa Cruz",- **ETA**: baseline con `scikit-learn` / `xgboost` usando features de tráfico/histórico.

    fecha_salida="2024-10-15 08:30",
    vehiculo="Bus Mercedes Benz",
    asiento="15A",
    viaje_id="VJ-001"
)

# Y más: paquetes entregados, promociones, estados de viaje...
````

### Testing de Notificaciones

```bash
# Enviar notificación de prueba
curl -X POST http://localhost:8000/api/test/notificacion/pago/ \
  -H "Content-Type: application/json" \
  -d '{"usuario_email":"test@example.com","monto":150.00}'

# Enviar todas las notificaciones de prueba
curl "http://localhost:8000/api/test/notificaciones/todas/?email=test@example.com"
```

📖 **Documentación completa**: [NOTIFICACIONES_DOCUMENTACION.md](./backend/NOTIFICACIONES_DOCUMENTACION.md)

---

## 🐳 Deployment

### Desarrollo Local

```bash
docker compose up -d --build
```

### Producción (Docker Swarm/Kubernetes)

```bash
# Usando archivo de producción
docker compose -f docker-compose.prod.yml up -d

# O usando script automatizado
./deploy.sh produccion  # Linux/Mac
deploy.bat produccion   # Windows
```

### Cloud Deployment

Consulta la [guía completa de cloud deployment](./DOCKER-CLOUD-READY.md) para AWS, Azure, GCP.

---

## 🛠️ Desarrollo

### Estructura de Branches

```
main           # Producción estable
develop        # Desarrollo activo
feature/*      # Nuevas características
hotfix/*       # Correcciones urgentes
```

### Scripts Útiles

```bash
# Backend
docker exec transporte_backend python manage.py shell
docker exec transporte_backend python manage.py test
docker exec transporte_backend python manage.py collectstatic

# Frontend
docker exec transporte_frontend npm run build
docker exec transporte_frontend npm run test

# Database
docker exec transporte_db psql -U postgres -d transporte
```

---

## 📚 Documentación Técnica

| Documento                                                                    | Descripción                    |
| ---------------------------------------------------------------------------- | ------------------------------ |
| [NOTIFICACIONES_DOCUMENTACION.md](./backend/NOTIFICACIONES_DOCUMENTACION.md) | Sistema de notificaciones push |
| [DOCKER-CLOUD-READY.md](./DOCKER-CLOUD-READY.md)                             | Deployment en cloud            |

---

## 🔧 Troubleshooting

### Problemas Comunes

**🐳 Docker no inicia**

```bash
# Limpiar containers y volúmenes
docker compose down -v
docker system prune -f
docker compose up -d --build
```

**📱 Flutter no conecta**

```bash
# Verificar IP del backend
flutter run --verbose

# En android/app/src/debug/res/xml/network_security_config.xml
# Agregar IP del backend Docker
```

**🔔 Notificaciones no llegan**

```bash
# Verificar Firebase configuration
docker exec transporte_backend python manage.py shell -c "
from firebase_admin import credentials
print('Firebase OK' if credentials else 'Firebase ERROR')
"
```

---

## 👥 Contribuir

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## ⚡ Estado del Proyecto

- ✅ **Backend**: Django REST API completo
- ✅ **Frontend**: React SPA funcional
- ✅ **Mobile**: Flutter app operativa
- ✅ **Notificaciones**: Sistema push enterprise-grade
- ✅ **Docker**: Orquestación completa
- ✅ **CI/CD**: Scripts de deployment automatizados

---

**🎯 ¡Sistema listo para producción!** 🚀
