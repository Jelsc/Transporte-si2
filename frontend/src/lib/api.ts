import axios from "axios";
import toast from "react-hot-toast";

/**
 * Detecta automáticamente la URL base de la API según el entorno.
 * - En desarrollo local: usa localhost:8000
 * - En producción/nube: usa la misma IP/dominio que el frontend con puerto 8000
 */
export function getApiBaseUrl(): string {
  // 1. Si hay variable de entorno explícita, úsala
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    console.info("🔧 [API] Usando URL desde variable de entorno:", envUrl);
    return envUrl;
  }

  // 2. Detección automática basada en window.location
  const { protocol, hostname } = window.location;
  
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Entorno local → localhost:8000
    const localUrl = `${protocol}//localhost:8000`;
    console.info("🏠 [API] Entorno local detectado →", localUrl);
    return localUrl;
  } else {
    // Entorno de producción → misma-ip:8000
    const prodUrl = `${protocol}//${hostname}:8000`;
    console.info("☁️ [API] Entorno de producción detectado →", prodUrl);
    return prodUrl;
  }
}

// Crear la instancia de axios con la URL detectada automáticamente
const apiBaseUrl = getApiBaseUrl();
console.info("🎯 [API] URL final de la API:", apiBaseUrl);

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false, // pon true si usas cookies/CSRF
});

// Interceptor para agregar el token de autenticación a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.detail || err.message || "Error de red";
    
    // Si es error 401, podrías redirigir al login
    if (err?.response?.status === 401) {
      console.warn('⚠️ Error 401: No autenticado');
      // Opcional: redirigir al login
      // window.location.href = '/admin';
    }
    
    toast.error(msg);
    return Promise.reject(err);
  }
);
