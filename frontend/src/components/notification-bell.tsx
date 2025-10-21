import React, { useState, useEffect } from "react";
import { Bell, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

// Tipo simple para notificaciones
interface SimpleNotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  prioridad: string;
  fecha_creacion: string;
  fecha_lectura: string | null;
  fue_leida?: boolean;
}

// Importación dinámica del servicio para evitar problemas
let NotificationService: any = null;

// Cargar servicio de forma asíncrona
const loadNotificationService = async () => {
  if (!NotificationService) {
    try {
      const module = await import("@/services/notificationService");
      NotificationService = module.default;
    } catch (error) {
      console.error("Error loading notification service:", error);
    }
  }
  return NotificationService;
};

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Cargar notificaciones cuando el componente se monta o cuando el usuario se autentica
  useEffect(() => {
    console.log(
      "🔔 [NotificationBell] useEffect - isAuthenticated:",
      isAuthenticated
    );
    if (isAuthenticated) {
      console.log(
        "🔔 [NotificationBell] Usuario autenticado, cargando notificaciones..."
      );
      loadNotifications();
      initializeNotificationService();
    }
  }, [isAuthenticated]);

  // Inicializar el servicio de notificaciones
  const initializeNotificationService = async () => {
    try {
      const service = await loadNotificationService();
      // Solo inicializar si está disponible
      if (service && typeof service.initialize === "function") {
        await service.initialize();

        // Configurar callback para notificaciones en tiempo real
        if (typeof service.onMessage === "function") {
          service.onMessage((payload: any) => {
            console.log(
              "🔔 Nueva notificación recibida en campanita:",
              payload
            );
            loadNotifications(); // Recargar notificaciones cuando llegue una nueva
          });
        }

        // Solicitar permisos si no están concedidos
        if (
          typeof service.areNotificationsEnabled === "function" &&
          !service.areNotificationsEnabled()
        ) {
          await service.requestPermissionAndGetToken();
        }
      }
    } catch (error) {
      console.error("Error al inicializar servicio de notificaciones:", error);
    }
  };

  // Cargar notificaciones desde el backend
  const loadNotifications = async () => {
    console.log("🔔 [NotificationBell] Cargando notificaciones...");
    console.log("🔔 [NotificationBell] isAuthenticated:", isAuthenticated);

    if (!isAuthenticated) {
      console.log("🔔 [NotificationBell] Usuario no autenticado");
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const service = await loadNotificationService();
      if (!service) {
        console.warn("🔔 [NotificationBell] NotificationService no disponible");
        setIsLoading(false);
        return;
      }

      console.log(
        "🔔 [NotificationBell] Llamando a NotificationService.getNotifications()"
      );
      const allNotifications = await service.getNotifications();
      console.log(
        "🔔 [NotificationBell] Notificaciones recibidas:",
        allNotifications
      );

      if (!Array.isArray(allNotifications)) {
        console.warn(
          "🔔 [NotificationBell] Las notificaciones no son un array:",
          allNotifications
        );
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      console.log(
        "🔔 [NotificationBell] Cantidad de notificaciones:",
        allNotifications.length
      );

      // Ordenar por fecha de creación (más recientes primero)
      const sortedNotifications = allNotifications.sort(
        (a, b) =>
          new Date(b.fecha_creacion).getTime() -
          new Date(a.fecha_creacion).getTime()
      );

      setNotifications(sortedNotifications.slice(0, 5)); // Solo mostrar las últimas 5 en el dropdown

      // Contar no leídas
      const unread = allNotifications.filter(
        (n) => n.fue_leida === false
      ).length;
      setUnreadCount(unread);

      console.log(
        "🔔 [NotificationBell] Notificaciones para mostrar:",
        sortedNotifications.slice(0, 5)
      );
      console.log("🔔 [NotificationBell] No leídas:", unread);
    } catch (error) {
      console.error(
        "🔔 [NotificationBell] Error al cargar notificaciones:",
        error
      );
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
        }/api/notificaciones/notificaciones/${notificationId}/marcar_leida/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        // Actualizar el estado local
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, fue_leida: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  // Navegar a historial completo
  const goToNotificationHistory = () => {
    setIsOpen(false);
    navigate("/client/notificaciones");
  };

  // Formatear fecha relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Ahora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString();
  };

  // Obtener color de prioridad
  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "critica":
        return "text-red-600 bg-red-50";
      case "alta":
        return "text-orange-600 bg-orange-50";
      case "normal":
        return "text-blue-600 bg-blue-50";
      case "baja":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // No mostrar si no está autenticado
  if (!isAuthenticated) {
    console.log(
      "🔔 [NotificationBell] Usuario no autenticado - componente oculto"
    );
    return null;
  }

  console.log("🔔 [NotificationBell] Renderizando componente, isOpen:", isOpen);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative hover:bg-gray-100 ${className}`}
          onClick={() => {
            console.log("🔔 [NotificationBell] Campanita clickeada");
            if (!isOpen) {
              loadNotifications(); // Cargar cuando se abre
            }
            setIsOpen(!isOpen);
          }}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} sin leer
                </Badge>
              )}
              <button
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                onClick={() => {
                  console.log("🔔 [DEBUG] Forzando recarga de notificaciones");
                  loadNotifications();
                }}
              >
                Debug
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && notifications.length === 0 && (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No hay notificaciones</p>
          </div>
        )}

        {/* Notification list */}
        {!isLoading && notifications.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-4 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Indicador de no leída */}
                  <div className="mt-1">
                    {!notification.fue_leida && (
                      <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={`text-sm font-medium truncate ${
                          !notification.fue_leida
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.titulo}
                      </h4>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatRelativeTime(notification.fecha_creacion)}
                      </span>
                    </div>

                    <p
                      className={`text-sm text-gray-600 ${
                        !notification.fue_leida ? "font-medium" : ""
                      }`}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {notification.mensaje}
                    </p>

                    {/* Prioridad */}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                          notification.prioridad || "normal"
                        )}`}
                      >
                        {(notification.prioridad || "normal").toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(notification.tipo || "")
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={goToNotificationHistory}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
