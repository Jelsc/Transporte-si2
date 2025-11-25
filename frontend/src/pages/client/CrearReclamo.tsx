// pages/client/CrearReclamo.tsx - VERSIÓN CON CATEGORÍAS TEMPORALES
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrearReclamo, useCategorias, useReclamos } from '../../hooks/useReclamos';
import type { ReclamoType } from '../../types/reclamos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const CrearReclamo: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'crear' | 'mis-reclamos'>('crear');
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    numero_guia: '',
    servicio_relacionado: ''
  });
  const [archivos, setArchivos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState<ReclamoType | null>(null);

  // ✅ Usar los hooks
  const { 
    categorias, 
    loading: loadingCategorias, 
    error: errorCategorias,
    refetch: refetchCategorias 
  } = useCategorias();

  const { 
    crearReclamoConArchivos, 
    loading, 
    error, 
    clearError 
  } = useCrearReclamo();

  // Hook para obtener mis reclamos
  const { 
    reclamos, 
    loading: loadingReclamos, 
    error: errorReclamos,
    refetch: refetchReclamos 
  } = useReclamos();

  // ✅ Categorías temporales mientras se soluciona el backend
  const categoriasTemporales = [
    { id: 1, nombre: "Retraso en el servicio" },
    { id: 2, nombre: "Paquete dañado" },
    { id: 3, nombre: "Paquete extraviado" },
    { id: 4, nombre: "Problemas de facturación" },
    { id: 5, nombre: "Mala atención al cliente" },
    { id: 6, nombre: "Error en la entrega" },
    { id: 7, nombre: "Problemas con el conductor" },
    { id: 8, nombre: "Falta de información" },
    { id: 9, nombre: "Problemas con el seguimiento" },
    { id: 10, nombre: "Otros" }
  ];

  // Usar categorías del backend si existen, sino usar las temporales
  const categoriasDisponibles = Array.isArray(categorias) && categorias.length > 0 
    ? categorias 
    : categoriasTemporales;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 Enviando formulario...');
    
    // Validar campos obligatorios
    if (!formData.descripcion.trim() || !formData.categoria || !formData.servicio_relacionado) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Generar título automáticamente desde la descripción
      const titulo = formData.descripcion.substring(0, 97) + (formData.descripcion.length > 100 ? '...' : '');
      formDataToSend.append('titulo', titulo);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('servicio_relacionado', formData.servicio_relacionado);
      
      if (formData.numero_guia) {
        formDataToSend.append('numero_guia', formData.numero_guia);
      }

      // Agregar archivos
      archivos.forEach(archivo => {
        formDataToSend.append('adjuntos', archivo);
      });

      console.log('📦 Enviando datos al servidor...', formDataToSend);
      
      // Mostrar todos los datos que se envían
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`📤 ${key}:`, value);
      }

      await crearReclamoConArchivos(formDataToSend);

      // Éxito - limpiar formulario
      setMensajeExito('¡Reclamo creado exitosamente! Será redirigido en 3 segundos...');
      setFormData({
        titulo: '',
        descripcion: '',
        categoria: '',
        numero_guia: '',
        servicio_relacionado: ''
      });
      setArchivos([]);
      setPreviews([]);
      
      // Recargar mis reclamos y cambiar a la pestaña de mis reclamos
      await refetchReclamos();
      
      // Redirigir después de 3 segundos o cambiar a mis reclamos
      setTimeout(() => {
        setMensajeExito('');
        setActiveTab('mis-reclamos');
      }, 2000);
    } catch (error) {
      console.error('❌ Error al crear reclamo:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      procesarArchivos(nuevosArchivos);
    }
  };

  const procesarArchivos = (files: File[]) => {
    const archivosValidos: File[] = [];
    const nuevasPreviews: string[] = [];

    files.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const tiposPermitidos = ['jpg', 'jpeg', 'png', 'pdf'];
      
      if (extension && tiposPermitidos.includes(extension)) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`El archivo ${file.name} excede el tamaño máximo de 5MB`);
          return;
        }

        archivosValidos.push(file);
        
        if (extension !== 'pdf') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews(prev => [...prev, '']);
        }
      } else {
        alert(`El archivo ${file.name} no es válido. Solo se permiten JPG, PNG y PDF.`);
      }
    });

    setArchivos(prev => [...prev, ...archivosValidos]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivos(Array.from(e.dataTransfer.files));
    }
  };

  const eliminarArchivo = (index: number) => {
    const nuevosArchivos = archivos.filter((_, i) => i !== index);
    const nuevasPreviews = previews.filter((_, i) => i !== index);
    setArchivos(nuevosArchivos);
    setPreviews(nuevasPreviews);
  };

  // Limpiar error cuando el usuario interactúa con el formulario
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Cargar reclamos cuando se cambia a la pestaña de mis reclamos
  useEffect(() => {
    if (activeTab === 'mis-reclamos') {
      refetchReclamos();
    }
  }, [activeTab, refetchReclamos]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    const colores = {
      abierto: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      en_proceso: 'bg-blue-100 text-blue-800 border-blue-200',
      cerrado: 'bg-green-100 text-green-800 border-green-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return <AlertCircle className="w-4 h-4" />;
      case 'en_proceso':
        return <Clock className="w-4 h-4" />;
      case 'cerrado':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelado':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Centro de Reclamos
          </h1>
          <p className="text-lg text-gray-600">
            Crea un nuevo reclamo o consulta el estado de tus reclamos existentes
          </p>
        </div>

        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{mensajeExito}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs para Crear Reclamo y Mis Reclamos */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'crear' | 'mis-reclamos')} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="crear" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Reclamo
            </TabsTrigger>
            <TabsTrigger value="mis-reclamos" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mis Reclamos ({reclamos.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Crear Reclamo */}
          <TabsContent value="crear" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              {/* Servicio relacionado */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relacionado con *
                </label>
                <select
                  value={formData.servicio_relacionado}
                  onChange={(e) => setFormData({...formData, servicio_relacionado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione un servicio...</option>
                  <option value="viaje">Viaje</option>
                  <option value="encomienda">Encomienda</option>
                  <option value="paqueteria">Paquetería</option>
                </select>
              </div>

              {/* Tipo de reclamo - CON CATEGORÍAS TEMPORALES */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Reclamo *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione el motivo del reclamo...</option>
                  {categoriasDisponibles.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
                {!Array.isArray(categorias) || categorias.length === 0 ? (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Usando categorías temporales. Contacte al administrador para configurar las categorías en el sistema.
                  </p>
                ) : null}
              </div>

              {/* Número de guía */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nro. de Boleto o Guía de Encomienda
                </label>
                <input
                  type="text"
                  placeholder="Ej: BOL-123456 (Opcional, ayuda a agilizar)"
                  value={formData.numero_guia}
                  onChange={(e) => setFormData({...formData, numero_guia: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción detallada del incidente *
                </label>
                <textarea
                  rows={6}
                  placeholder="Por favor, describa qué sucedió, fecha, hora y cualquier detalle relevante..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  required
                  maxLength={1000}
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.descripcion.length}/1000 caracteres
                </p>
              </div>

              {/* Archivos adjuntos - MEJORADO */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidencia y Adjuntos (Opcional)
                </label>
                
                {/* Área de drop */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                  } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`block ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-gray-400 mb-3">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium text-lg mb-1">
                      Haga clic para cargar o arrastre archivos aquí
                    </p>
                    <p className="text-gray-500 text-sm">
                      Soporta Imágenes (JPG, PNG) y PDF hasta 5MB.
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      📎 Puede adjuntar fotos del paquete, boletos, comprobantes, etc.
                    </p>
                  </label>
                </div>

                {/* Previews de archivos */}
                {archivos.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Archivos seleccionados ({archivos.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {archivos.map((archivo, index) => (
                        <div key={index} className="relative border border-gray-200 rounded-lg p-3 bg-white">
                          {archivo.type.startsWith('image/') && previews[index] ? (
                            <div className="flex flex-col items-center">
                              <img 
                                src={previews[index]} 
                                alt="Preview" 
                                className="w-20 h-20 object-cover rounded mb-2"
                              />
                              <span className="text-xs text-gray-600 text-center break-words">
                                {archivo.name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-20 h-20 bg-red-50 rounded flex items-center justify-center mb-2">
                                <span className="text-red-600 font-bold text-lg">PDF</span>
                              </div>
                              <span className="text-xs text-gray-600 text-center break-words">
                                {archivo.name}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => eliminarArchivo(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Información de ayuda */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Información importante</h4>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                      <li>Los campos marcados con * son obligatorios</li>
                      <li>Incluya todos los detalles posibles para una mejor atención</li>
                      <li>Puede adjuntar fotos, documentos o comprobantes</li>
                      <li>Recibirá un número de seguimiento para consultar el estado</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.categoria || !formData.descripcion || !formData.servicio_relacionado}
                  className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Reclamo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
          </TabsContent>

          {/* Tab: Mis Reclamos */}
          <TabsContent value="mis-reclamos" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {loadingReclamos ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando tus reclamos...</p>
                  </div>
                ) : errorReclamos ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800">{errorReclamos}</p>
                  </div>
                ) : !Array.isArray(reclamos) || reclamos.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No tienes reclamos registrados
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Crea tu primer reclamo usando el formulario de creación
                    </p>
                    <button
                      onClick={() => setActiveTab('crear')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Reclamo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Mis Reclamos ({reclamos.length})
                      </h2>
                      <button
                        onClick={() => refetchReclamos()}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Actualizar
                      </button>
                    </div>

                    {/* Lista de reclamos */}
                    <div className="space-y-4">
                      {reclamos.map((reclamo) => (
                        <div
                          key={reclamo.id}
                          className={`border rounded-lg p-5 transition-all cursor-pointer ${
                            reclamoSeleccionado?.id === reclamo.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                          onClick={() => setReclamoSeleccionado(
                            reclamoSeleccionado?.id === reclamo.id ? null : reclamo
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-blue-600">
                                  #{reclamo.numero_reclamo}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getEstadoColor(reclamo.estado)}`}>
                                  {getEstadoIcon(reclamo.estado)}
                                  {reclamo.estado.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                  reclamo.prioridad === 'urgente' ? 'bg-red-50 text-red-700 border-red-200' :
                                  reclamo.prioridad === 'alta' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  reclamo.prioridad === 'media' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                  {reclamo.prioridad.toUpperCase()}
                                </span>
                              </div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {reclamo.titulo}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {reclamo.descripcion}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>Categoría: {reclamo.categoria_nombre}</span>
                            <span>•</span>
                            <span>Creado: {formatFecha(reclamo.fecha_creacion)}</span>
                            {reclamo.numero_guia && (
                              <>
                                <span>•</span>
                                <span>Guía: {reclamo.numero_guia}</span>
                              </>
                            )}
                            {reclamo.agente_nombre && (
                              <>
                                <span>•</span>
                                <span>Agente: {reclamo.agente_nombre}</span>
                              </>
                            )}
                          </div>

                          {/* Detalles expandidos */}
                          {reclamoSeleccionado?.id === reclamo.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                              {/* Descripción completa */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Descripción completa</h4>
                                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                                  {reclamo.descripcion}
                                </p>
                              </div>

                              {/* Historial de comentarios */}
                              {reclamo.detalles && reclamo.detalles.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">
                                    Historial ({reclamo.detalles.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {reclamo.detalles.map((detalle) => (
                                      <div key={detalle.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="font-medium text-gray-900">
                                            {detalle.autor_nombre}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {formatFecha(detalle.fecha)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                          {detalle.mensaje}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Archivos adjuntos */}
                              {reclamo.adjuntos && reclamo.adjuntos.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">
                                    Archivos adjuntos ({reclamo.adjuntos.length})
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {reclamo.adjuntos.map((adjunto) => (
                                      <a
                                        key={adjunto.id}
                                        href={adjunto.url_archivo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 transition-colors"
                                      >
                                        {adjunto.tipo_archivo === 'imagen' ? (
                                          <img
                                            src={adjunto.url_archivo}
                                            alt={adjunto.nombre_archivo}
                                            className="w-16 h-16 object-cover rounded mx-auto mb-2"
                                          />
                                        ) : (
                                          <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center mx-auto mb-2">
                                            <span className="text-red-600 font-bold text-sm">PDF</span>
                                          </div>
                                        )}
                                        <p className="text-xs text-gray-600 truncate">
                                          {adjunto.nombre_archivo}
                                        </p>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};