import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationService } from "@/services/notificationService";

/**
 * Hook que inicializa el servicio de notificaciones para usuarios autenticados
 */
function useNotificationInitializer() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    let isInitialized = false;
    let initializationTimeout: number;

    const initializeNotifications = async () => {
      if (isAuthenticated && user && !isInitialized) {
        try {
          console.log(
            "🔔 Inicializando servicio de notificaciones para usuario:",
            user?.username
          );

          // Esperar un poco para asegurar que el DOM esté listo
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Inicializar el servicio solo si Firebase está disponible
          if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            await NotificationService.initialize();

            // Configurar callback para notificaciones en tiempo real
            NotificationService.onMessage((payload) => {
              console.log(
                "🔔 Nueva notificación recibida globalmente:",
                payload
              );
              // Aquí podrías agregar lógica adicional como mostrar un toast
            });

            // Solicitar permisos para notificaciones web si no están concedidos
            if (!NotificationService.areNotificationsEnabled()) {
              console.log("🔔 Solicitando permisos de notificación...");
              const token =
                await NotificationService.requestPermissionAndGetToken();
              if (token) {
                console.log("✅ Permisos concedidos y token obtenido");
              } else {
                console.log("❌ Permisos de notificación denegados");
              }
            } else {
              console.log("✅ Permisos de notificación ya concedidos");
            }
          } else {
            console.warn(
              "🔔 Service Workers no están disponibles en este navegador"
            );
          }

          isInitialized = true;
        } catch (error) {
          console.error(
            "❌ Error al inicializar servicio de notificaciones:",
            error
          );
        }
      }
    };

    if (isAuthenticated && user) {
      // Retrasar la inicialización para evitar problemas en el primer render
      initializationTimeout = setTimeout(initializeNotifications, 500);
    }

    // Cleanup cuando el usuario se desautentica
    return () => {
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }

      if (!isAuthenticated && isInitialized) {
        console.log(
          "🔔 Usuario desautenticado, limpiando servicio de notificaciones"
        );
        try {
          NotificationService.unregisterToken();
        } catch (error) {
          console.error("Error al limpiar servicio de notificaciones:", error);
        }
        isInitialized = false;
      }
    };
  }, [isAuthenticated, user]);
}

/**
 * Componente que se puede usar en el layout principal para inicializar notificaciones
 */
function NotificationInitializer() {
  useNotificationInitializer();
  return null; // Este componente no renderiza nada
}

// Exports por defecto para evitar problemas con Fast Refresh
export default useNotificationInitializer;
export { NotificationInitializer };
