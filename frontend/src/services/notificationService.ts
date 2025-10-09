import { messaging, getToken, onMessage } from "../lib/firebase";
import { getApiBaseUrl } from "../lib/api";

export interface NotificationData {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  prioridad: "baja" | "normal" | "alta" | "critica";
  data_extra?: Record<string, any>;
  fecha_creacion: string;
  fecha_lectura: string | null;
  fue_leida?: boolean; // Computed field
}

export interface NotificationPreferences {
  nuevos_viajes: boolean;
  cambios_viaje: boolean;
  recordatorios: boolean;
  promociones: boolean;
  sistema: boolean;
  push_web: boolean;
  no_molestar_desde?: string;
  no_molestar_hasta?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private currentToken: string | null = null;
  private onMessageCallback?: (payload: any) => void;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Inicializar el servicio de notificaciones web
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verificar si el navegador soporta notificaciones
      if (!("Notification" in window)) {
        console.warn("Este navegador no soporta notificaciones");
        return;
      }

      // Verificar si Service Worker está disponible
      if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker no está disponible");
        return;
      }

      // Registrar service worker para Firebase Messaging
      await this.registerServiceWorker();

      // Configurar listeners de mensajes
      this.setupMessageListeners();

      this.isInitialized = true;
      console.log("🔔 NotificationService web inicializado");
    } catch (error) {
      console.error("Error al inicializar NotificationService:", error);
      throw error;
    }
  }

  /**
   * Registrar Service Worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("Service Worker registrado:", registration);
    } catch (error) {
      console.error("Error al registrar Service Worker:", error);
    }
  }

  /**
   * Solicitar permisos de notificación y obtener token FCM
   */
  public async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      // Solicitar permisos
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.warn("Permisos de notificación denegados");
        return null;
      }

      // Obtener token FCM
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "tu-vapid-key",
      });

      if (token) {
        console.log("Token FCM obtenido:", token);
        this.currentToken = token;

        // Registrar token en el backend
        await this.registerTokenWithBackend(token);

        return token;
      } else {
        console.warn("No se pudo obtener el token FCM");
        return null;
      }
    } catch (error) {
      console.error("Error al obtener token FCM:", error);
      return null;
    }
  }

  /**
   * Configurar listeners para mensajes de Firebase
   */
  private setupMessageListeners(): void {
    // Escuchar mensajes cuando la app está en primer plano
    onMessage(messaging, (payload) => {
      console.log("Mensaje FCM recibido:", payload);

      // Mostrar notificación del navegador
      this.showBrowserNotification(payload);

      // Callback personalizado
      if (this.onMessageCallback) {
        this.onMessageCallback(payload);
      }

      // Marcar como entregada en el backend
      this.markNotificationAsDelivered(payload);
    });
  }

  /**
   * Mostrar notificación del navegador
   */
  private async showBrowserNotification(payload: any): Promise<void> {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const title = payload.notification?.title || "Nueva notificación";
    const options: NotificationOptions = {
      body: payload.notification?.body || "",
      icon: "/movifleet.svg", // Tu icono de app
      badge: "/badge-72x72.png", // Badge para la notificación
      tag: payload.data?.tipo || "general", // Tag para agrupar notificaciones
      data: payload.data, // Datos adicionales
      requireInteraction: payload.data?.prioridad === "critica", // Requiere interacción si es crítica
    };

    const notification = new Notification(title, options);

    // Manejar clic en la notificación
    notification.onclick = (event) => {
      event.preventDefault();
      notification.close();

      // Enfocar la ventana
      if (window) {
        window.focus();
      }

      // Navegar según el tipo de notificación
      this.handleNotificationClick(payload);

      // Marcar como leída
      this.markNotificationAsRead(payload);
    };

    // Cerrar automáticamente después de un tiempo (opcional)
    setTimeout(() => {
      notification.close();
    }, 10000); // 10 segundos
  }

  /**
   * Registrar token FCM en el backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const authToken = localStorage.getItem("access_token");
      if (!authToken) {
        console.warn("No hay token de autenticación");
        return;
      }

      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/notificaciones/dispositivos/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token_fcm: token,
            tipo_dispositivo: "web",
            nombre_dispositivo: `${
              navigator.userAgent.includes("Chrome") ? "Chrome" : "Browser"
            } - ${navigator.platform}`,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Token registrado en el backend");
      } else {
        console.error("❌ Error al registrar token:", response.status);
      }
    } catch (error) {
      console.error("❌ Error al registrar token:", error);
    }
  }

  /**
   * Marcar notificación como entregada
   */
  private async markNotificationAsDelivered(payload: any): Promise<void> {
    const notificationId = payload.data?.notificacion_id;
    if (!notificationId) return;

    try {
      const authToken = localStorage.getItem("access_token");
      if (!authToken) return;

      const baseUrl = getApiBaseUrl();
      await fetch(
        `${baseUrl}/api/notificaciones/notificaciones/marcar_multiples/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            notificacion_ids: [parseInt(notificationId)],
            accion: "marcar_entregada",
          }),
        }
      );
    } catch (error) {
      console.error("Error al marcar como entregada:", error);
    }
  }

  /**
   * Marcar notificación como leída
   */
  private async markNotificationAsRead(payload: any): Promise<void> {
    const notificationId = payload.data?.notificacion_id;
    if (!notificationId) return;

    try {
      const authToken = localStorage.getItem("access_token");
      if (!authToken) return;

      const baseUrl = getApiBaseUrl();
      await fetch(
        `${baseUrl}/api/notificaciones/notificaciones/${notificationId}/marcar_leida/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  }

  /**
   * Manejar clic en notificación para navegación
   */
  private handleNotificationClick(payload: any): void {
    const tipo = payload.data?.tipo;
    const viajeId = payload.data?.viaje_id;

    console.log("🧭 Navegando por notificación tipo:", tipo);

    // Aquí implementarías la navegación usando tu router
    switch (tipo) {
      case "nuevo_viaje":
        // Navegar a lista de viajes disponibles
        window.location.href = "/client/viajes-disponibles";
        break;
      case "viaje_cancelado":
        // Navegar a mis reservas o detalles del viaje
        if (viajeId) {
          window.location.href = `/client/viaje/${viajeId}`;
        }
        break;
      case "recordatorio":
        // Navegar a detalles del viaje
        if (viajeId) {
          window.location.href = `/client/viaje/${viajeId}`;
        }
        break;
      default:
        // Navegación por defecto
        window.location.href = "/";
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  public async getNotifications(): Promise<NotificationData[]> {
    try {
      const authToken = localStorage.getItem("access_token");
      console.log("🔔 [NotificationService] Token disponible:", !!authToken);

      if (!authToken) {
        console.warn(
          "🔔 [NotificationService] No hay token de autenticación disponible"
        );
        return [];
      }

      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/notificaciones/notificaciones/`;
      console.log("🔔 [NotificationService] Haciendo request a:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔔 [NotificationService] Response status:", response.status);
      console.log("🔔 [NotificationService] Response ok:", response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn(
            "🔔 [NotificationService] Token de autenticación inválido o expirado"
          );
          localStorage.removeItem("access_token");
        }
        const errorText = await response.text();
        console.error("🔔 [NotificationService] Error response:", errorText);
        throw new Error(
          `Error HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("🔔 [NotificationService] Data recibida:", data);

      const notifications = data.results || data;
      console.log(
        "🔔 [NotificationService] Notificaciones extraídas:",
        notifications
      );

      if (!Array.isArray(notifications)) {
        console.warn(
          "🔔 [NotificationService] La respuesta del servidor no es un array:",
          data
        );
        return [];
      }

      // Computar el campo fue_leida basado en fecha_lectura
      const processedNotifications = notifications.map((notification: any) => ({
        ...notification,
        id: String(notification.id), // Asegurar que el ID sea string
        fue_leida:
          notification.fecha_lectura !== null &&
          notification.fecha_lectura !== undefined,
      }));

      console.log(
        "🔔 [NotificationService] Notificaciones procesadas:",
        processedNotifications
      );
      return processedNotifications;
    } catch (error) {
      console.error(
        "🔔 [NotificationService] Error al obtener notificaciones:",
        error
      );
      return [];
    }
  }

  /**
   * Obtener preferencias de notificación
   */
  public async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const authToken = localStorage.getItem("access_token");
      if (!authToken) throw new Error("No autenticado");

      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/notificaciones/preferencias/`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Error al obtener preferencias");

      return await response.json();
    } catch (error) {
      console.error("Error al obtener preferencias:", error);
      return null;
    }
  }

  /**
   * Actualizar preferencias de notificación
   */
  public async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) throw new Error("No autenticado");

      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/notificaciones/preferencias/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(preferences),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error al actualizar preferencias:", error);
      return false;
    }
  }

  /**
   * Configurar callback para mensajes recibidos
   */
  public onMessage(callback: (payload: any) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Obtener token actual
   */
  public getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Verificar si las notificaciones están habilitadas
   */
  public areNotificationsEnabled(): boolean {
    return Notification.permission === "granted";
  }

  /**
   * Desregistrar token del backend
   */
  public async unregisterToken(): Promise<void> {
    try {
      // Implementar lógica para desregistrar el token del backend
      console.log("🚫 Desregistrando token del backend");
      this.currentToken = null;
    } catch (error) {
      console.error("Error al desregistrar token:", error);
    }
  }
}

// Exportar singleton
export default NotificationService.getInstance();
