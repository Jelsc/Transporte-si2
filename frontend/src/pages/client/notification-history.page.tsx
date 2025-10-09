import React, { useState, useEffect } from "react";
import {
  Bell,
  Filter,
  Search,
  RefreshCw,
  Check,
  CheckCheck,
  Trash2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NotificationService, {
  type NotificationData,
} from "@/services/notificationService";
import { useAuth } from "@/context/AuthContext";

interface NotificationFilters {
  tipo: string;
  prioridad: string;
  leida: string;
  search: string;
}

export default function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationData[]
  >([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({
    tipo: "todos",
    prioridad: "todas",
    leida: "todas",
    search: "",
  });
  const { isAuthenticated } = useAuth();

  // Tipos de notificación disponibles
  const notificationTypes = [
    { value: "todos", label: "Todos los tipos" },
    { value: "nuevo_viaje", label: "Nuevos viajes" },
    { value: "viaje_cancelado", label: "Viajes cancelados" },
    { value: "viaje_modificado", label: "Viajes modificados" },
    { value: "recordatorio", label: "Recordatorios" },
    { value: "promocion", label: "Promociones" },
    { value: "sistema", label: "Sistema" },
  ];

  // Prioridades disponibles
  const priorities = [
    { value: "todas", label: "Todas las prioridades" },
    { value: "critica", label: "Crítica" },
    { value: "alta", label: "Alta" },
    { value: "normal", label: "Normal" },
    { value: "baja", label: "Baja" },
  ];

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [notifications, filters]);

  // Cargar notificaciones del backend
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await NotificationService.getNotifications();

      // Ordenar por fecha de creación (más recientes primero)
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.fecha_creacion).getTime() -
          new Date(a.fecha_creacion).getTime()
      );

      setNotifications(sortedData);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refrescar notificaciones
  const refreshNotifications = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...notifications];

    // Filtrar por tipo
    if (filters.tipo !== "todos") {
      filtered = filtered.filter((n) => n.tipo === filters.tipo);
    }

    // Filtrar por prioridad
    if (filters.prioridad !== "todas") {
      filtered = filtered.filter((n) => n.prioridad === filters.prioridad);
    }

    // Filtrar por estado de lectura
    if (filters.leida !== "todas") {
      const isRead = filters.leida === "leidas";
      filtered = filtered.filter((n) => n.fue_leida === isRead);
    }

    // Filtrar por búsqueda
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.titulo.toLowerCase().includes(searchTerm) ||
          n.mensaje.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredNotifications(filtered);
  };

  // Marcar notificación como leída/no leída
  const toggleNotificationRead = async (
    notificationId: string,
    currentlyRead: boolean
  ) => {
    try {
      const endpoint = currentlyRead ? "marcar_no_leida" : "marcar_leida";
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
        }/api/notificaciones/notificaciones/${notificationId}/${endpoint}/`,
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
            n.id === notificationId ? { ...n, fue_leida: !currentlyRead } : n
          )
        );
      }
    } catch (error) {
      console.error("Error al cambiar estado de lectura:", error);
    }
  };

  // Marcar múltiples como leídas
  const markMultipleAsRead = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
        }/api/notificaciones/notificaciones/marcar_multiples/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            notificacion_ids: selectedNotifications.map((id) => parseInt(id)),
            accion: "marcar_leida",
          }),
        }
      );

      if (response.ok) {
        // Actualizar el estado local
        setNotifications((prev) =>
          prev.map((n) =>
            selectedNotifications.includes(n.id) ? { ...n, fue_leida: true } : n
          )
        );
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error("Error al marcar múltiples como leídas:", error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
        }/api/notificaciones/notificaciones/marcar_todas_leidas/`,
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
          prev.map((n) => ({ ...n, fue_leida: true }))
        );
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  // Seleccionar/deseleccionar notificación
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Seleccionar/deseleccionar todas las notificaciones visibles
  const toggleAllNotifications = () => {
    const visibleIds = filteredNotifications.map((n) => n.id);
    const allSelected = visibleIds.every((id) =>
      selectedNotifications.includes(id)
    );

    if (allSelected) {
      setSelectedNotifications((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedNotifications((prev) => [
        ...new Set([...prev, ...visibleIds]),
      ]);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Hace menos de 1 hora";
    if (diffInHours < 24)
      return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener color de prioridad
  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "critica":
        return "destructive";
      case "alta":
        return "destructive";
      case "normal":
        return "default";
      case "baja":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Obtener estadísticas
  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.fue_leida).length;
    const critical = notifications.filter(
      (n) => n.prioridad === "critica"
    ).length;
    return { total, unread, critical };
  };

  const stats = getStats();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Alert>
          <AlertDescription>
            Debes iniciar sesión para ver tus notificaciones.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificaciones
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona todas tus notificaciones desde aquí
          </p>
        </div>

        <Button onClick={refreshNotifications} disabled={isRefreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin leer</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
              <Circle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticas</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="col-span-full sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar en notificaciones..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tipo */}
            <Select
              value={filters.tipo}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, tipo: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Prioridad */}
            <Select
              value={filters.prioridad}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, prioridad: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado de lectura */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Estado:</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="readState"
                  checked={filters.leida === "todas"}
                  onChange={() =>
                    setFilters((prev) => ({ ...prev, leida: "todas" }))
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">Todas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="readState"
                  checked={filters.leida === "no_leidas"}
                  onChange={() =>
                    setFilters((prev) => ({ ...prev, leida: "no_leidas" }))
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">Sin leer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="readState"
                  checked={filters.leida === "leidas"}
                  onChange={() =>
                    setFilters((prev) => ({ ...prev, leida: "leidas" }))
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">Leídas</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones masivas */}
      {selectedNotifications.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedNotifications.length} notificación
                {selectedNotifications.length > 1 ? "es" : ""} seleccionada
                {selectedNotifications.length > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markMultipleAsRead}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar como leídas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedNotifications([])}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Notificaciones ({filteredNotifications.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {filteredNotifications.length > 0 && (
                <>
                  <Checkbox
                    checked={
                      filteredNotifications.length > 0 &&
                      filteredNotifications.every((n) =>
                        selectedNotifications.includes(n.id)
                      )
                    }
                    onCheckedChange={toggleAllNotifications}
                  />
                  <Button size="sm" variant="outline" onClick={markAllAsRead}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todas como leídas
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                No hay notificaciones que coincidan con los filtros
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.fue_leida ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={() =>
                        toggleNotificationSelection(notification.id)
                      }
                      className="mt-1"
                    />

                    {/* Indicador de no leída */}
                    <div className="mt-2">
                      {!notification.fue_leida && (
                        <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3
                          className={`font-medium ${
                            !notification.fue_leida
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.titulo}
                        </h3>
                        <span className="text-sm text-gray-500 flex-shrink-0">
                          {formatDate(notification.fecha_creacion)}
                        </span>
                      </div>

                      <p
                        className={`text-gray-600 mb-3 ${
                          !notification.fue_leida ? "font-medium" : ""
                        }`}
                      >
                        {notification.mensaje}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getPriorityColor(notification.prioridad)}
                          >
                            {notification.prioridad.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {notification.tipo.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toggleNotificationRead(
                              notification.id,
                              notification.fue_leida ?? false
                            )
                          }
                        >
                          {notification.fue_leida ? (
                            <>
                              <Circle className="h-4 w-4 mr-1" />
                              Marcar como no leída
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Marcar como leída
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
