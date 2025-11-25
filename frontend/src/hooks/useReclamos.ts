// hooks/useReclamos.ts
import { useState, useEffect, useCallback } from 'react';
import { reclamosService } from '../services/reclamosService';
import type { 
  ReclamoType, 
  ReclamoCategoriaType 
} from '../types/reclamos';
import type { ReclamoFilters } from '../services/reclamosService';

// Función helper para manejar diferentes estructuras de respuesta
const procesarRespuesta = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];

  if (data?.results && Array.isArray(data.results))
    return data.results as T[];

  if (data && typeof data === "object") {
    const arrays = Object.values(data).filter(Array.isArray) as T[][];
    return arrays[0] ?? [];
  }

  return [];
};

// Función helper para extraer mensajes de error
const extraerMensajeError = (err: any): string => {
  const errorData = err.response?.data;
  
  if (!errorData) {
    return err.message || 'Error desconocido';
  }

  // Intentar diferentes formatos de respuesta de error
  return errorData.detail || 
         errorData.message || 
         errorData.error || 
         (typeof errorData === 'string' ? errorData : 'Error en la operación');
};

// Hook para obtener lista de reclamos con filtros
export const useReclamos = (filters?: ReclamoFilters) => {
  const [reclamos, setReclamos] = useState<ReclamoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarReclamos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 useReclamos: Cargando reclamos...', filters);
      
      const response = await reclamosService.getReclamos(filters);
      
      // Procesar la respuesta correctamente
      const reclamosData = procesarRespuesta<ReclamoType>(response.data);
      setReclamos(reclamosData);
      
      console.log(`✅ useReclamos - ${reclamosData.length} reclamos cargados`);
    } catch (err: any) {
      console.error('❌ useReclamos - Error cargando reclamos:', err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      setReclamos([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    cargarReclamos();
  }, [cargarReclamos]);

  return { 
    reclamos, 
    loading, 
    error, 
    refetch: cargarReclamos
  };
};

// Hook para obtener un reclamo específico
export const useReclamo = (id: number) => {
  const [reclamo, setReclamo] = useState<ReclamoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarReclamo = useCallback(async () => {
    if (!id) {
      setReclamo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 useReclamo: Cargando reclamo ID: ${id}...`);
      
      const response = await reclamosService.getReclamo(id);
      setReclamo(response.data);
      
      console.log(`✅ useReclamo - Reclamo ${id} cargado exitosamente`);
    } catch (err: any) {
      console.error(`❌ useReclamo - Error cargando reclamo ${id}:`, err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarReclamo();
  }, [cargarReclamo]);

  return { 
    reclamo, 
    loading, 
    error, 
    refetch: cargarReclamo
  };
};

// Hook para obtener categorías de reclamos
export const useCategorias = () => {
  const [categorias, setCategorias] = useState<ReclamoCategoriaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarCategorias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 useCategorias: Cargando categorías...');
      
      const response = await reclamosService.getCategorias();
      
      const categoriasData = procesarRespuesta<ReclamoCategoriaType>(response.data);
      setCategorias(categoriasData);
      
      console.log(`✅ useCategorias - ${categoriasData.length} categorías cargadas`);
    } catch (err: any) {
      console.error('❌ useCategorias - Error cargando categorías:', err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  return { 
    categorias, 
    loading, 
    error, 
    refetch: cargarCategorias 
  };
};

// Hook para crear reclamos - MEJORADO
export const useCrearReclamo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const crearReclamo = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log('🔄 useCrearReclamo: Creando reclamo...', data);
      
      const response = await reclamosService.createReclamo(data);
      
      console.log('✅ useCrearReclamo - Reclamo creado exitosamente:', response.data);
      setSuccess(true);
      
      return response.data;
    } catch (err: any) {
      console.error('❌ useCrearReclamo - Error al crear reclamo:', err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      
      // Log detallado para debugging
      if (err.response) {
        console.error('📋 Detalles del error:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearReclamoConArchivos = useCallback(async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log('🔄 useCrearReclamo: Creando reclamo con archivos...');
      
      // Debug: mostrar todos los datos del FormData
      console.log('📤 Datos del FormData:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`   ${key}:`, {
            nombre: value.name,
            tipo: value.type,
            tamaño: `${(value.size / 1024).toFixed(2)} KB`
          });
        } else {
          console.log(`   ${key}:`, value);
        }
      }
      
      const response = await reclamosService.createReclamoWithFiles(formData);
      
      console.log('✅ useCrearReclamo - Reclamo con archivos creado exitosamente:', response.data);
      setSuccess(true);
      
      return response.data;
    } catch (err: any) {
      console.error('❌ useCrearReclamo - Error al crear reclamo con archivos:', err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      
      // Log detallado del error
      console.error('📋 Error response completo:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      
      // Log específico para errores comunes
      if (err.response?.status === 400) {
        console.error('🚫 Error de validación (400):', err.response.data);
      } else if (err.response?.status === 413) {
        console.error('📁 Error: Archivos demasiado grandes (413)');
      } else if (err.response?.status === 415) {
        console.error('📄 Error: Tipo de archivo no soportado (415)');
      } else if (err.response?.status === 500) {
        console.error('💥 Error interno del servidor (500)');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para resetear el estado
  const resetEstado = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    success,
    crearReclamo,
    crearReclamoConArchivos,
    clearError: () => setError(null),
    resetEstado
  };
};

// Hook para gestión de reclamos (actualizar, cambiar estado, etc.)
export const useGestionReclamo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const actualizarReclamo = useCallback(async (id: number, data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log(`🔄 useGestionReclamo: Actualizando reclamo ${id}...`, data);
      
      const response = await reclamosService.updateReclamo(id, data);
      
      console.log(`✅ useGestionReclamo - Reclamo ${id} actualizado exitosamente`);
      setSuccess(true);
      
      return response.data;
    } catch (err: any) {
      console.error(`❌ useGestionReclamo - Error actualizando reclamo ${id}:`, err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cambiarEstado = useCallback(async (id: number, estado: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log(`🔄 useGestionReclamo: Cambiando estado del reclamo ${id} a ${estado}...`);
      
      const response = await reclamosService.cambiarEstado(id, estado);
      
      console.log(`✅ useGestionReclamo - Estado del reclamo ${id} cambiado a ${estado}`);
      setSuccess(true);
      
      return response.data;
    } catch (err: any) {
      console.error(`❌ useGestionReclamo - Error cambiando estado del reclamo ${id}:`, err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const asignarAgente = useCallback(async (id: number, agenteId: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log(`🔄 useGestionReclamo: Asignando agente ${agenteId} al reclamo ${id}...`);
      
      const response = await reclamosService.asignarAgente(id, agenteId);
      
      console.log(`✅ useGestionReclamo - Agente ${agenteId} asignado al reclamo ${id}`);
      setSuccess(true);
      
      return response.data;
    } catch (err: any) {
      console.error(`❌ useGestionReclamo - Error asignando agente al reclamo ${id}:`, err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const agregarComentario = useCallback(async (id: number, mensaje: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log(`🔄 useGestionReclamo: Agregando comentario al reclamo ${id}...`);
      
      const response = await reclamosService.agregarComentario(id, mensaje);
      
      console.log(`✅ useGestionReclamo - Comentario agregado al reclamo ${id}`);
      setSuccess(true);
      
      return response.data;
    } catch (err: any) {
      console.error(`❌ useGestionReclamo - Error agregando comentario al reclamo ${id}:`, err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const subirArchivos = useCallback(async (reclamoId: number, formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log(`🔄 useGestionReclamo: Subiendo archivos al reclamo ${reclamoId}...`);
      
      // Debug: mostrar información de archivos
      console.log('📤 Archivos a subir:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`   ${key}:`, {
            nombre: value.name,
            tipo: value.type,
            tamaño: `${(value.size / 1024).toFixed(2)} KB`
          });
        }
      }
      
      const response = await reclamosService.subirAdjuntos(reclamoId, formData);
      
      console.log(`✅ useGestionReclamo - Archivos subidos exitosamente al reclamo ${reclamoId}`);
      setSuccess(true);
      
      return response.data;
    } catch (err: any) {
      console.error(`❌ useGestionReclamo - Error subiendo archivos al reclamo ${reclamoId}:`, err);
      
      const errorMsg = extraerMensajeError(err);
      setError(errorMsg);
      
      // Log específico para errores de archivos
      if (err.response?.status === 413) {
        console.error('📁 Error: Archivos demasiado grandes (413)');
      } else if (err.response?.status === 415) {
        console.error('📄 Error: Tipo de archivo no soportado (415)');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para resetear el estado
  const resetEstado = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    success,
    actualizarReclamo,
    cambiarEstado,
    asignarAgente,
    agregarComentario,
    subirArchivos,
    clearError: () => setError(null),
    resetEstado
  };
};

