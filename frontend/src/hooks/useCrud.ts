import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseCrudOptions<T> {
  fetchFn: () => Promise<{ success: boolean; data?: T; error?: string }>;
  createFn?: (data: any) => Promise<{ success: boolean; data?: T; error?: string }>;
  updateFn?: (id: number, data: any) => Promise<{ success: boolean; data?: T; error?: string }>;
  deleteFn?: (id: number) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface UseCrudReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: any) => Promise<boolean>;
  update: (id: number, data: any) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

export function useCrud<T>({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  onSuccess,
  onError,
}: UseCrudOptions<T>): UseCrudReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback((message: string) => {
    if (onSuccess) {
      onSuccess(message);
    } else {
      toast.success(message);
    }
  }, [onSuccess]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    } else {
      toast.error(errorMessage);
    }
  }, [onError]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchFn();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        handleError(response.error || 'Error al cargar los datos');
      }
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, handleError]);

  const create = useCallback(async (newData: any): Promise<boolean> => {
    if (!createFn) {
      handleError('Función de creación no disponible');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createFn(newData);
      if (response.success) {
        handleSuccess('Registro creado exitosamente');
        await refetch(); // Recargar datos
        return true;
      } else {
        handleError(response.error || 'Error al crear el registro');
        return false;
      }
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Error de conexión');
      return false;
    } finally {
      setLoading(false);
    }
  }, [createFn, handleError, handleSuccess, refetch]);

  const update = useCallback(async (id: number, updateData: any): Promise<boolean> => {
    if (!updateFn) {
      handleError('Función de actualización no disponible');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await updateFn(id, updateData);
      if (response.success) {
        handleSuccess('Registro actualizado exitosamente');
        await refetch(); // Recargar datos
        return true;
      } else {
        handleError(response.error || 'Error al actualizar el registro');
        return false;
      }
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Error de conexión');
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateFn, handleError, handleSuccess, refetch]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    if (!deleteFn) {
      handleError('Función de eliminación no disponible');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await deleteFn(id);
      if (response.success) {
        handleSuccess('Registro eliminado exitosamente');
        await refetch(); // Recargar datos
        return true;
      } else {
        handleError(response.error || 'Error al eliminar el registro');
        return false;
      }
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Error de conexión');
      return false;
    } finally {
      setLoading(false);
    }
  }, [deleteFn, handleError, handleSuccess, refetch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
  };
}
