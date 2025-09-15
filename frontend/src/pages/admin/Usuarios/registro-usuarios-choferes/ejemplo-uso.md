# Ejemplo de Uso - CRUD de Usuarios

## Integración en el Router

```typescript
// En tu archivo de rutas (router.tsx o similar)
import UsuariosCRUD from './pages/admin/Usuarios/registro-usuarios-choferes/UsuariosCRUD';
import ChoferesCRUD from './pages/admin/Usuarios/registro-usuarios-choferes/ChoferesCRUD';
import PersonalCRUD from './pages/admin/Usuarios/registro-usuarios-choferes/PersonalCRUD';

const routes = [
  {
    path: '/admin/usuarios',
    element: <UsuariosCRUD />,
    meta: { requiresAuth: true, permissions: ['gestionar_usuarios'] }
  },
  {
    path: '/admin/conductores',
    element: <ChoferesCRUD />,
    meta: { requiresAuth: true, permissions: ['gestionar_conductores'] }
  },
  {
    path: '/admin/personal',
    element: <PersonalCRUD />,
    meta: { requiresAuth: true, permissions: ['gestionar_personal'] }
  }
];
```

## Configuración de la API

```typescript
// En tu archivo de configuración de API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Configurar interceptores para manejar tokens
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar renovación de tokens
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, intentar renovar
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/admin/token/refresh/`, {
            refresh: refreshToken
          });
          localStorage.setItem('access_token', response.data.access);
          // Reintentar la petición original
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh token también expirado, redirigir a login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

## Ejemplo de Flujo Completo

### 1. Crear un Conductor

```typescript
// Paso 1: Crear el perfil de conductor
const crearConductor = async (datosConductor) => {
  const response = await fetch('/api/conductores/conductores/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'conductor123',
      email: 'conductor@empresa.com',
      first_name: 'Juan',
      last_name: 'Pérez',
      password: 'password123',
      numero_licencia: 'LIC123456',
      tipo_licencia: 'B',
      fecha_vencimiento_licencia: '2025-12-31',
      experiencia_anos: 5
    })
  });
  
  return response.json();
};
```

### 2. Crear un Usuario Administrativo

```typescript
// Paso 2: Crear usuario administrativo
const crearUsuarioAdmin = async (datosUsuario) => {
  const response = await fetch('/api/admin/users/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin123',
      email: 'admin@empresa.com',
      first_name: 'María',
      last_name: 'González',
      password: 'password123',
      rol: 1, // ID del rol administrador
      telefono: '70123456',
      direccion: 'Calle 123, La Paz'
    })
  });
  
  return response.json();
};
```

### 3. Vincular Usuario con Conductor

```typescript
// Paso 3: Vincular usuario con conductor existente
const vincularConductor = async (usuarioId, conductorId) => {
  const response = await fetch(`/api/conductores/conductores/${conductorId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      usuario: usuarioId
    })
  });
  
  return response.json();
};
```

## Manejo de Estados

```typescript
// Hook personalizado para gestión de usuarios
import { useState, useEffect } from 'react';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.results || data);
      } else {
        throw new Error('Error al cargar usuarios');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async (datosUsuario) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosUsuario)
      });
      
      if (response.ok) {
        await cargarUsuarios(); // Recargar lista
        return await response.json();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear usuario');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  return {
    usuarios,
    loading,
    error,
    cargarUsuarios,
    crearUsuario
  };
};
```

## Validaciones Personalizadas

```typescript
// Validaciones del formulario
const validarFormulario = (form) => {
  const errores = {};

  // Validar username
  if (!form.username) {
    errores.username = 'Username es obligatorio';
  } else if (form.username.length < 3) {
    errores.username = 'Username debe tener al menos 3 caracteres';
  }

  // Validar email
  if (!form.email) {
    errores.email = 'Email es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errores.email = 'Email no tiene formato válido';
  }

  // Validar contraseña para nuevos usuarios
  if (!editingUsuario && !form.password) {
    errores.password = 'Contraseña es obligatoria para nuevos usuarios';
  } else if (form.password && form.password.length < 8) {
    errores.password = 'Contraseña debe tener al menos 8 caracteres';
  }

  // Validar rol
  if (!form.rol_id) {
    errores.rol_id = 'Rol es obligatorio';
  }

  return errores;
};
```

## Manejo de Errores

```typescript
// Componente de manejo de errores
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="error-boundary">
        <h2>Algo salió mal</h2>
        <p>{error?.message}</p>
        <button onClick={() => setHasError(false)}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return children;
};

// Uso en el componente principal
<ErrorBoundary>
  <UsuariosCRUD />
</ErrorBoundary>
```

## Testing

```typescript
// Ejemplo de test unitario
import { render, screen, fireEvent } from '@testing-library/react';
import UsuariosCRUD from './UsuariosCRUD';

describe('UsuariosCRUD', () => {
  test('debe mostrar el formulario al hacer clic en "Nuevo Usuario"', () => {
    render(<UsuariosCRUD />);
    
    const botonNuevo = screen.getByText('Nuevo Usuario');
    fireEvent.click(botonNuevo);
    
    expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Username *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
  });

  test('debe validar campos obligatorios', () => {
    render(<UsuariosCRUD />);
    
    const botonNuevo = screen.getByText('Nuevo Usuario');
    fireEvent.click(botonNuevo);
    
    const botonGuardar = screen.getByText('Crear Usuario');
    fireEvent.click(botonGuardar);
    
    expect(screen.getByText('Username, email y rol son obligatorios')).toBeInTheDocument();
  });
});
```

## Consideraciones de Performance

```typescript
// Optimización con React.memo
const UsuarioCard = React.memo(({ usuario, onEdit, onDelete }) => {
  return (
    <Card>
      {/* Contenido de la tarjeta */}
    </Card>
  );
});

// Lazy loading de componentes
const UsuariosCRUD = React.lazy(() => import('./UsuariosCRUD'));

// Uso con Suspense
<Suspense fallback={<div>Cargando...</div>}>
  <UsuariosCRUD />
</Suspense>
```

## Configuración de Producción

```typescript
// Variables de entorno
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.REACT_APP_DEBUG === 'true'
};

// Configuración de logging
if (config.debug) {
  console.log('Modo debug activado');
}
```
