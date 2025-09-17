import { useState, useEffect, useCallback } from "react";
import { usersService, type User } from "@/services/api";
import { toast } from "sonner";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [ordering, setOrdering] = useState("");

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize,
        search,
        ordering,
        ...filters,
      };
      const response = await usersService.getUsers();
      if (response.success && response.data) {
        // Verificar si response.data es un array o un objeto con paginación
        if (Array.isArray(response.data)) {
          setUsuarios(response.data);
          setTotalCount(response.data.length);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          setUsuarios(response.data.results);
          setTotalCount(response.data.count || response.data.results.length);
        } else {
          setUsuarios([]);
          setTotalCount(0);
        }
      } else {
        setError(response.error || "Error al cargar usuarios");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, ordering, filters]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const createUsuario = async (usuarioData: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersService.createUser(usuarioData as any);
      if (response.success && response.data) {
        fetchUsuarios(); // Refrescar la lista
        return response.data;
      } else {
        setError(response.error || "Error al crear usuario");
        throw new Error(response.error || "Error al crear usuario");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUsuario = async (id: number, usuarioData: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersService.updateUser(id, usuarioData as any);
      if (response.success && response.data) {
        fetchUsuarios(); // Refrescar la lista
        return response.data;
      } else {
        setError(response.error || "Error al actualizar usuario");
        throw new Error(response.error || "Error al actualizar usuario");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUsuario = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersService.deleteUser(id);
      if (response.success) {
        fetchUsuarios(); // Refrescar la lista
      } else {
        setError(response.error || "Error al eliminar usuario");
        throw new Error(response.error || "Error al eliminar usuario");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleUsuarioStatus = async (id: number, es_activo: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersService.toggleUserStatus(id, es_activo);
      if (response.success) {
        fetchUsuarios(); // Refrescar la lista
      } else {
        setError(response.error || "Error al cambiar estado del usuario");
        throw new Error(response.error || "Error al cambiar estado del usuario");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    usuarios,
    loading,
    error,
    totalCount,
    page,
    pageSize,
    search,
    filters,
    ordering,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
    setOrdering,
    fetchUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    toggleUsuarioStatus,
  };
}

// Hook para obtener personal disponible para autocompletado
export function usePersonalDisponible() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersService.getPersonalDisponible();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || "Error al cargar personal disponible");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Hook para obtener conductores disponibles para autocompletado
export function useConductoresDisponibles() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersService.getConductoresDisponibles();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || "Error al cargar conductores disponibles");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}