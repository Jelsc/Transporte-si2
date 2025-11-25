# transporte-si2

Monorepo para **PostgreSQL + Django REST (backend)**, **React + Vite (frontend)** y **Flutter (mobile)**.
En DEV usamos Docker para **db + backend + frontend**. Flutter se corre fuera de Docker (emulador/dispositivo).

> 🔍 **¡NUEVO!** Sistema de [Detección Automática de IP](./AUTODETECT-IP.md) para despliegues en AWS EC2 y otros entornos cloud. Consulta [AUTODETECT-IP.md](./AUTODETECT-IP.md) para más información.

## 📁 Estructura

```
transporte-si2/
├─ backend/         # Django + DRF
│  ├─ .env.example  # Variables de entorno para el backend (copia a .env)
├─ frontend/        # React + Vite + TS + Tailwind
│  ├─ .env.example  # Variables de entorno para el frontend (copia a .env)
├─ mobile/          # Flutter (fuera de Docker en dev)
├─ docker-compose.yml
└─ README.md
```

---

## 🚀 Pasos rápidos (con Docker)

### 0) Requisitos

- Docker Desktop (o Docker Engine + Compose)
- Git
- (Opcional) Node 18+ si vas a tocar el frontend sin Docker
- (Opcional) Python 3.11+ si vas a correr backend sin Docker
- flutter

### 1) Clonar y configurar variables

```bash
git clone <URL-DEL-REPO>

# Linux/Mac
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Windows PowerShell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

### 2) Levantar servicios

```bash
docker-compose up -d --build
```

Nota: El superusuario y otros datos iniciales se crean automáticamente durante el arranque del contenedor usando el sistema de seeders. Las credenciales están definidas en el archivo `.env` (variables `DJANGO_SUPERUSER_*`).

### 3) Ejecución
# para iniciar los contenedores
```bash
docker-compose up -d
```

# MIGRACIONES (importante seguir este orden):
# 1. Primero generar archivos de migración (detecta cambios en modelos)
#    Para todas las apps:
```bash
docker-compose exec backend python manage.py makemigrations
```
#    O para apps específicas:
docker-compose exec backend python manage.py makemigrations users
docker-compose exec backend python manage.py makemigrations account

# 2. Luego aplicar migraciones a la base de datos
```bash
docker-compose exec backend python manage.py migrate
```

# SEEDERS:
# Para ejecutar todos los seeders automáticamente:
```bash
docker-compose exec backend python manage.py seed
```

# Para ejecutar seeders específicos (por nombre, sin el sufijo "_seeder"):
docker-compose exec backend python manage.py seed user rol

# Para ejecutar un nuevo seeder que acabas de crear (ejemplo: vehiculo_seeder.py):
docker-compose exec backend python manage.py seed vehiculo

# Para forzar la ejecución aunque should_run() devuelva False:
docker compose exec backend python manage.py seed --force
docker compose exec backend python manage.py seed vehiculo --force

# Para parar detener los contenedores
```bash
docker compose stop
```

### 3) Comandos útiles

```bash
# logs en vivo
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f frontend

```

### 4) URLs

- Backend (Django): [http://localhost:8000](http://localhost:8000)
- Admin Django: [http://localhost:8000/admin](http://localhost:8000/admin)
- Frontend (Vite): [http://localhost:5173](http://localhost:5173)
- MailHog: [http://localhost:8025](http://localhost:8025/)

## 🧑‍💻 Desarrollo local (sin Docker) — opcional

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# Linux/Mac
# source .venv/bin/activate

pip install -r requirements.txt

# crea y ajusta backend/.env o usa el .env de la raíz (ya configurado)
# para local, POSTGRES_HOST=127.0.0.1

python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
# asegúrate de tener frontend/.env con VITE_API_URL
npm run dev -- --host
```

---

## 🧰 Cheatsheet Docker

```bash
# levantar / reconstruir
docker compose up -d --build

# detener
docker compose down

# detener y borrar volúmenes (borra datos de Postgres)
docker compose down -v

# ejecutar comandos dentro del backend
docker compose exec backend python manage.py migrate
docker compose exec backend bash
```

---

## 🩹 Troubleshooting

- **Puertos ocupados**: cambia el lado izquierdo del mapeo en `docker-compose.yml`
  (ej: `"8001:8000"`, `"5174:5173"`, `"15432:5432"`).
- **Backend no conecta a DB en Docker**: confirma que en `compose` se fuerza `POSTGRES_HOST: db`.
- **CORS** en dev: ya está abierto (`CORS_ALLOW_ALL_ORIGINS=True`). En prod **cerrarlo** y usar `CORS_ALLOWED_ORIGINS`.
- **Vite no ve la API**: revisa `frontend/.env` → `VITE_API_URL=http://localhost:8000`.

---

## 📦 Roadmap y Características Implementadas

### ✅ Implementado

* **VRP (Vehicle Routing Problem)**: ✅ Optimización de rutas con OR-Tools integrado con Celery + Redis
  - Múltiples vehículos con capacidades
  - Ventanas de tiempo para entregas
  - Depósitos de salida y regreso independientes
  - Matriz de distancias/tiempos con OSRM
  
* **ETA con Baseline**: ✅ Sistema completo de seguimiento de tiempos estimados
  - **ETA Baseline**: Calculado durante optimización inicial
  - **ETA Real-time**: Actualizado según posición GPS y condiciones actuales
  - **Estadísticas de Demora**: Análisis de cumplimiento de tiempos
  - **Estados Visuales**: on_time, delayed, early, critical
  - **API Endpoints**: Consulta y actualización de ETAs
  - **Componente React**: Panel interactivo con auto-refresh
  - Ver [docs/ETA_SYSTEM.md](./docs/ETA_SYSTEM.md) para más detalles

### 🚧 En Desarrollo

* **ML para Predicción de ETAs**: Entrenar modelos con histórico de demoras
* **Integración Tráfico Real**: APIs de Google/OSRM con datos de tráfico
* **Notificaciones Push**: Alertas automáticas de cambios en ETA

### 📋 Por Implementar

* **Re-optimización Dinámica**: Ajustar rutas ante demoras críticas
* **Dashboard Analítico**: Visualización de métricas históricas
* **Predicción ML Avanzada**: XGBoost/LightGBM para ETAs más precisos

"# transporte_si2" 