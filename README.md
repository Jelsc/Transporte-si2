# transporte-si2

Monorepo para **PostgreSQL + Django REST (backend)**, **React + Vite (frontend)** y **Flutter (mobile)**.
En DEV usamos Docker para **db + backend + frontend**. Flutter se corre fuera de Docker (emulador/dispositivo).

## 📁 Estructura

```
transporte-si2/
├─ backend/         # Django + DRF
├─ frontend/        # React + Vite + TS + Tailwind
├─ mobile/          # Flutter (fuera de Docker en dev)
├─ .env.example     # vars del backend/compose (copia a .env)
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
cp .env.example .env
cp frontend/.env.example frontend/.env

# Windows PowerShell
copy .env.example .env
copy frontend\.env.example frontend\.env
```

### 2) Levantar servicios

```bash
docker compose up -d --build
```
nota: el super usuario ya esta creado las credenciales estan en el .env.example para el backend

### 2) Ejecucion

```bash
#para iniciar los contenedores

docker compose up -d

#para generar migracion para una app especifica

docker compose exec backend python manage.py makemigrations users
docker-compose exec backend python manage.py makemigrations account

#para generar migraciones para todas las apps

docker compose exec backend python manage.py makemigrations

#para aplicar migraciones a Postgres

docker compose exec backend python manage.py migrate

#para parar detener los contenedores

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

## 📦 Roadmap (VRP / ETA)

* **VRP**: integrar `ortools` para ruteo (tareas offline con Celery + Redis).
* **ETA**: baseline con `scikit-learn` / `xgboost` usando features de tráfico/histórico.
"# transporte_si2" 
