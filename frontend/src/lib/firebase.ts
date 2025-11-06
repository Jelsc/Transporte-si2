// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "tu-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tu-proyecto.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tu-proyecto-id",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tu-proyecto.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Función para verificar si el entorno soporta Firebase Messaging
const isMessagingSupported = (): boolean => {
  // Firebase Messaging requiere HTTPS o localhost
  const isSecureContext =
    window.isSecureContext ||
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost";

  // Verificar que exista Service Worker API
  const hasServiceWorker = "serviceWorker" in navigator;

  // Verificar que no estemos en un contexto no soportado
  const isSupported = hasServiceWorker && isSecureContext;

  if (!isSupported) {
    console.warn(
      "🔔 Firebase Messaging no disponible:",
      !isSecureContext ? "Se requiere HTTPS" : "Service Workers no disponibles"
    );
  }

  return isSupported;
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging solo si está soportado
let messaging: Messaging | null = null;

try {
  if (isMessagingSupported()) {
    messaging = getMessaging(app);
    console.log("✅ Firebase Messaging inicializado correctamente");
  } else {
    console.log(
      "⚠️ Firebase Messaging deshabilitado (usar HTTPS para habilitar)"
    );
  }
} catch (error) {
  console.warn("⚠️ Firebase Messaging no se pudo inicializar:", error);
  messaging = null;
}

// Wrapper seguro para getToken
const safeGetToken = async (
  ...args: Parameters<typeof getToken>
): Promise<string | null> => {
  if (!messaging) {
    console.warn(
      "🔔 Firebase Messaging no disponible - notificaciones deshabilitadas"
    );
    return null;
  }
  try {
    return await getToken(...args);
  } catch (error) {
    console.warn("⚠️ Error al obtener token de Firebase:", error);
    return null;
  }
};

// Wrapper seguro para onMessage
const safeOnMessage = (callback: (payload: any) => void): (() => void) => {
  if (!messaging) {
    console.warn(
      "🔔 Firebase Messaging no disponible - notificaciones deshabilitadas"
    );
    return () => {}; // Retornar función vacía de cleanup
  }
  try {
    return onMessage(messaging, callback);
  } catch (error) {
    console.warn("⚠️ Error al configurar listener de mensajes:", error);
    return () => {};
  }
};

export { messaging, safeGetToken as getToken, safeOnMessage as onMessage };
export default app;
