# Sistema de Transporte SI2 - Backend (Guía para Desarrolladores)

Esta guía contiene información relevante para desarrolladores que trabajen en el backend del Sistema de Transporte SI2.

## Estructura del Backend

```
backend/
  ├── core/                # Configuración principal del proyecto
  │   ├── settings.py      # Configuración de Django
  │   ├── urls.py          # URLs principales
  │   └── management/      # Comandos personalizados
  │       └── commands/    
  │           └── seed.py  # Comando para ejecutar seeders
  │
  ├── users/               # App para gestión de usuarios y roles
  │   ├── models.py        # Modelos CustomUser y Rol
  │   ├── views.py         # Vistas de API para usuarios
  │   ├── serializers.py   # Serializers para API
  │   └── urls.py          # URLs de la API de usuarios
  │
  ├── services/            # App para servicios de ML/IA
  │   ├── ml_services.py   # Implementación de servicios
  │   ├── views.py         # Vistas de API para servicios
  │   └── urls.py          # URLs de la API de servicios
  │
  ├── seeders/             # Sistema de carga inicial de datos
  │   ├── base_seeder.py   # Clase base para seeders
  │   ├── user_seeder.py   # Seeder de usuarios
  │   ├── rol_seeder.py    # Seeder de roles
  │   └── ...              # Otros seeders
  │
  ├── manage.py            # Script de gestión de Django
  └── requirements.txt     # Dependencias del proyecto
```

## Sistema de Seeders

Los seeders permiten cargar datos iniciales de manera organizada y modular. 

### Cómo Funcionan los Seeders

1. **BaseSeeder**: Todos los seeders heredan de esta clase que proporciona métodos comunes:
   - `seed()`: Método que ejecuta el seeder si `should_run()` devuelve True
   - `run()`: Implementa la lógica de creación de datos (a implementar en cada subclase)
   - `should_run()`: Determina si el seeder debe ejecutarse (personalizable)

2. **Ejecución mediante comando de gestión**:
   ```bash
   # Ejecutar todos los seeders
   python manage.py seed
   
   # Ejecutar seeders específicos (sin el sufijo "_seeder")
   python manage.py seed user rol
   
   # Forzar la ejecución aunque should_run() devuelva False
   python manage.py seed --force
   ```

3. **Ejecución en Docker**: Los seeders se ejecutan automáticamente al iniciar el contenedor.

### Creación de un Nuevo Seeder

```python
from .base_seeder import BaseSeeder
from mi_app.models import MiModelo

class MiModeloSeeder(BaseSeeder):
    @classmethod
    def run(cls):
        # Lógica para crear datos
        MiModelo.objects.create(
            nombre="Ejemplo",
            descripcion="Descripción de ejemplo"
        )
    
    @classmethod
    def should_run(cls):
        # Ejecutar solo si no hay datos en la tabla
        return not MiModelo.objects.exists()
```

## API RESTful

El backend expone una API RESTful con los siguientes endpoints principales:

### Autenticación

- `POST /api/admin/login/` - Login administrativo
- `POST /api/admin/register/` - Registro de usuarios administrativos
- `POST /api/auth/login/` - Login para clientes
- `POST /api/auth/registration/` - Registro de clientes

### Gestión de Usuarios y Roles

- `GET, POST /api/admin/roles/` - Listar y crear roles
- `GET, PUT, DELETE /api/admin/roles/{id}/` - Gestionar un rol específico
- `GET, POST /api/admin/users/` - Listar y crear usuarios
- `GET, PUT, DELETE /api/admin/users/{id}/` - Gestionar un usuario específico

### Servicios de Inteligencia Artificial

- `POST /api/ml/eta/` - Calcular tiempo estimado de llegada
- `POST /api/ml/vrp/` - Optimizar rutas de vehículos
- `GET /api/ml/traffic/` - Obtener información de tráfico

## Sistema de Roles y Permisos

El sistema utiliza un modelo flexible basado en roles con permisos almacenados en JSON:

```python
# users/models.py
class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    permisos = models.JSONField(default=list)
    
    def tiene_permiso(self, permiso):
        return permiso in self.permisos

class CustomUser(AbstractUser):
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True)
    
    def tiene_permiso(self, permiso):
        if self.is_superuser:
            return True
        return self.rol and self.rol.tiene_permiso(permiso)
```

Para proteger vistas:

```python
@requiere_permiso('ver_usuarios')
def vista_protegida(request):
    # Esta vista requiere el permiso 'ver_usuarios'
    pass
```

Los permisos están organizados por categorías en `users/constants.py` y se asignan a través del panel de administración.
