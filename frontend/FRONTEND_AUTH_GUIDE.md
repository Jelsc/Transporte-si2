# Guía de Autenticación - Frontend

## Funcionalidades Implementadas

### ✅ Login/Registro

- Páginas de login y registro funcionales
- Validación de formularios
- Manejo de errores específicos

### ⚠️ Google OAuth (Experimental)

- Botón de Google OAuth integrado
- Modo de prueba para desarrollo
- Requiere configuración adicional

### ✅ Verificación de Email

- Página de verificación de email
- Integración con MailHog para desarrollo

### ✅ Contexto de Autenticación

- Estado global de autenticación
- Funciones de login, registro y logout
- Persistencia de tokens JWT

## Configuración

### Variables de Entorno

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
```

### Google OAuth (Experimental)

1. Configurar `VITE_GOOGLE_CLIENT_ID` en `.env`
2. El botón de Google OAuth se activará automáticamente
3. Sin configuración, se muestra modo de prueba
4. **Nota**: Funcionalidad experimental, puede requerir configuración adicional

## Uso

### Login

```tsx
import { useAuth } from "./context/AuthContext";

const { login, isAuthenticated, user } = useAuth();
```

### Google OAuth

```tsx
import { GoogleLoginButton } from "./components/google-login-button";

<GoogleLoginButton
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
/>;
```

## Estructura de Archivos

```
src/
├── context/
│   ├── AuthContext.tsx      # Contexto de autenticación
│   └── UserContext.tsx      # Contexto de usuario
├── pages/auth/
│   ├── LoginPage.tsx        # Página de login
│   ├── RegisterPage.tsx     # Página de registro
│   └── EmailVerificationPage.tsx
├── components/
│   ├── google-login-button.tsx
│   └── ui/                  # Componentes UI
└── hooks/
    └── use-google-auth.ts   # Hook para Google OAuth
```
