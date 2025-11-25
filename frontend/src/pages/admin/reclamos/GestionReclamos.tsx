// pages/admin/reclamos/GestionReclamos.tsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/layout/admin-layout';
import { useReclamos, useCategorias, useGestionReclamo } from '../../../hooks/useReclamos';
import type { ReclamoType, ReclamoAdjuntoType } from '../../../types/reclamos';
import { X, Download, FileText, Image as ImageIcon, Maximize2, ExternalLink } from 'lucide-react';

export const GestionReclamos: React.FC = () => {
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState<ReclamoType | null>(null);
  const [comentarioInput, setComentarioInput] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ReclamoAdjuntoType | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  
  const [filtros, setFiltros] = useState({
    estado: '',
    categoria: '',
    search: ''
  });

  // ✅ Usar los hooks mejorados
  const { reclamos, loading, error, refetch } = useReclamos(filtros);
  const { categorias } = useCategorias();
  const { 
    cambiarEstado, 
    asignarAgente, 
    agregarComentario,
    loading: gestionLoading 
  } = useGestionReclamo();

  // Cargar reclamo detalle usando el hook existente
  const cargarReclamoDetalle = async (id: number) => {
    try {
      // En una implementación real, usarías useReclamo hook
      // Por ahora simulamos la carga desde la lista existente
      const reclamo = reclamos.find(r => r.id === id);
      if (reclamo) {
        setReclamoSeleccionado(reclamo);
      }
    } catch (error) {
      console.error('Error al cargar reclamo:', error);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!reclamoSeleccionado) return;

    try {
      console.log(`🔄 Cambiando estado del reclamo ${reclamoSeleccionado.id} a ${nuevoEstado}`);
      await cambiarEstado(reclamoSeleccionado.id, nuevoEstado);
      
      // Recargar datos
      await refetch();
      
      // Actualizar reclamo seleccionado
      const reclamoActualizado = reclamos.find(r => r.id === reclamoSeleccionado.id);
      if (reclamoActualizado) {
        setReclamoSeleccionado(reclamoActualizado);
      }
      
      console.log(`✅ Estado cambiado exitosamente a ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
    }
  };

  const handleAsignarAgente = async (agenteId: string) => {
    if (!reclamoSeleccionado || !agenteId) return;

    try {
      console.log(`🔄 Asignando agente ${agenteId} al reclamo ${reclamoSeleccionado.id}`);
      await asignarAgente(reclamoSeleccionado.id, parseInt(agenteId));
      
      // Recargar datos
      await refetch();
      
      // Actualizar reclamo seleccionado
      const reclamoActualizado = reclamos.find(r => r.id === reclamoSeleccionado.id);
      if (reclamoActualizado) {
        setReclamoSeleccionado(reclamoActualizado);
      }
      
      console.log(`✅ Agente ${agenteId} asignado exitosamente`);
    } catch (error) {
      console.error('❌ Error al asignar agente:', error);
    }
  };

  const handleAgregarComentario = async () => {
    if (!reclamoSeleccionado || !comentarioInput.trim()) return;

    try {
      console.log(`🔄 Agregando comentario al reclamo ${reclamoSeleccionado.id}`);
      await agregarComentario(reclamoSeleccionado.id, comentarioInput.trim());
      
      // Recargar datos
      await refetch();
      
      // Actualizar reclamo seleccionado
      const reclamoActualizado = reclamos.find(r => r.id === reclamoSeleccionado.id);
      if (reclamoActualizado) {
        setReclamoSeleccionado(reclamoActualizado);
      }
      
      // Limpiar input
      setComentarioInput('');
      
      console.log(`✅ Comentario agregado exitosamente`);
    } catch (error) {
      console.error('❌ Error al agregar comentario:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgregarComentario();
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFechaCompleta = (fecha: string) => {
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

  const getPrioridadColor = (prioridad: string) => {
    const colores = {
      baja: 'text-green-600 bg-green-50 border-green-200',
      media: 'text-blue-600 bg-blue-50 border-blue-200',
      alta: 'text-orange-600 bg-orange-50 border-orange-200',
      urgente: 'text-red-600 bg-red-50 border-red-200'
    };
    return colores[prioridad as keyof typeof colores] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // ✅ Debug: mostrar lo que llega
  console.log('Reclamos recibidos:', reclamos);
  console.log('Loading:', loading);
  console.log('Error:', error);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* ✅ Mostrar errores si existen */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error: {error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel Lateral - Lista de Reclamos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h1 className="text-2xl font-bold text-gray-900 text-center lg:text-left">
                  Centro de Resolución
                </h1>
                
                {/* Barra de búsqueda */}
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar reclamos..."
                      value={filtros.search}
                      onChange={(e) => setFiltros({...filtros, search: e.target.value})}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={filtros.estado}
                      onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Todos los estados</option>
                      <option value="abierto">Abierto</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="cerrado">Cerrado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={filtros.categoria}
                      onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Todas las categorías</option>
                      {Array.isArray(categorias) && categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id.toString()}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Reclamos */}
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2 text-sm">Cargando reclamos...</p>
                  </div>
                ) : !Array.isArray(reclamos) ? (
                  <div className="p-4 text-center text-red-500 text-sm">
                    Error: Los datos no son un array
                  </div>
                ) : reclamos.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No se encontraron reclamos</p>
                  </div>
                ) : (
                  reclamos.map((reclamo) => (
                    <div
                      key={reclamo.id}
                      onClick={() => cargarReclamoDetalle(reclamo.id)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                        reclamoSeleccionado?.id === reclamo.id 
                          ? 'bg-blue-50 border-blue-200 transform scale-[1.02]' 
                          : 'hover:bg-gray-50 hover:transform hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-blue-600 text-sm">
                          #{reclamo.numero_reclamo}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(reclamo.estado)}`}>
                          {reclamo.estado.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-1">
                        {formatFecha(reclamo.fecha_creacion)}
                      </div>
                      
                      <div className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                        {reclamo.usuario_nombre}
                      </div>
                      
                      <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {reclamo.titulo}
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border text-center ${getPrioridadColor(reclamo.prioridad)}`}>
                        {reclamo.prioridad.toUpperCase()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Panel Principal - Detalle del Reclamo */}
          <div className="lg:col-span-3">
            {reclamoSeleccionado ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header del Reclamo */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Reclamo #{reclamoSeleccionado.numero_reclamo}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Creado el {formatFechaCompleta(reclamoSeleccionado.fecha_creacion)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getEstadoColor(reclamoSeleccionado.estado)}`}>
                        {reclamoSeleccionado.estado.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getPrioridadColor(reclamoSeleccionado.prioridad)}`}>
                        PRIORIDAD {reclamoSeleccionado.prioridad.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Información del Cliente */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">Información del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nombre del Cliente</p>
                          <p className="text-lg font-semibold text-gray-900">{reclamoSeleccionado.usuario_nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">ID de Usuario</p>
                          <p className="text-gray-900">{reclamoSeleccionado.usuario}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Categoría</p>
                          <p className="text-gray-900">{reclamoSeleccionado.categoria_nombre}</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {reclamoSeleccionado.numero_guia && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Número de Guía</p>
                              <p className="text-gray-900">{reclamoSeleccionado.numero_guia}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-700">Servicio</p>
                            <p className="text-gray-900">{reclamoSeleccionado.servicio_relacionado || 'No especificado'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descripción del Incidente */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">Descripción del Incidente</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        "{reclamoSeleccionado.descripcion}"
                      </p>
                    </div>
                  </div>

                  {/* Archivos Adjuntos - MEJORADO */}
                  {reclamoSeleccionado.adjuntos && reclamoSeleccionado.adjuntos.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          Documentos Adjuntos ({reclamoSeleccionado.adjuntos.length})
                        </h3>
                        <span className="text-sm text-gray-500">
                          Haz clic en una imagen para ampliarla
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {reclamoSeleccionado.adjuntos.map((adjunto) => (
                          <div 
                            key={adjunto.id} 
                            className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all bg-white group relative"
                          >
                            {adjunto.tipo_archivo === 'imagen' ? (
                              <div className="relative">
                                <img 
                                  src={adjunto.url_archivo} 
                                  alt={adjunto.nombre_archivo}
                                  className="w-full h-32 object-cover rounded-lg mb-3 cursor-pointer"
                                  onClick={() => {
                                    setArchivoSeleccionado(adjunto);
                                    setMostrarVisor(true);
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    setArchivoSeleccionado(adjunto);
                                    setMostrarVisor(true);
                                  }}
                                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Ampliar imagen"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex flex-col items-center justify-center mb-3 border-2 border-red-200">
                                <FileText className="w-12 h-12 text-red-600 mb-2" />
                                <span className="text-red-700 font-bold text-xs">PDF</span>
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <p className="text-xs text-gray-600 font-medium truncate" title={adjunto.nombre_archivo}>
                                {adjunto.nombre_archivo}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                <span>{new Date(adjunto.fecha_subida).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}</span>
                              </div>
                              
                              <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <a 
                                  href={adjunto.url_archivo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex-1 inline-flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 rounded px-2 py-1.5 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Abrir
                                </a>
                                <a 
                                  href={adjunto.url_archivo} 
                                  download={adjunto.nombre_archivo}
                                  className="inline-flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium bg-gray-50 hover:bg-gray-100 rounded px-2 py-1.5 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no hay adjuntos */}
                  {(!reclamoSeleccionado.adjuntos || reclamoSeleccionado.adjuntos.length === 0) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No hay documentos adjuntos</p>
                        <p className="text-sm text-gray-500 mt-1">El usuario no ha enviado archivos con este reclamo</p>
                      </div>
                    </div>
                  )}

                  {/* Acciones de Gestión */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">Acciones de Gestión</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Actualizar Estado
                        </label>
                        <select
                          value={reclamoSeleccionado.estado}
                          onChange={(e) => handleCambiarEstado(e.target.value)}
                          disabled={gestionLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="abierto">🟡 Abierto</option>
                          <option value="en_proceso">🔵 En Proceso</option>
                          <option value="cerrado">🟢 Cerrado</option>
                          <option value="cancelado">🔴 Cancelado</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Asignar Responsable
                        </label>
                        <select
                          onChange={(e) => handleAsignarAgente(e.target.value)}
                          disabled={gestionLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">👤 Seleccionar agente...</option>
                          <option value="1">👨‍💼 Equipo de Service Center</option>
                          <option value="2">🔧 Soporte Técnico</option>
                          <option value="3">💬 Atención al Cliente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Agregar Comentario */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">Agregar Comentario</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <textarea
                          value={comentarioInput}
                          onChange={(e) => setComentarioInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Escriba un comentario sobre el estado del reclamo..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <button
                          onClick={handleAgregarComentario}
                          disabled={gestionLoading || !comentarioInput.trim()}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                          {gestionLoading ? 'Enviando...' : 'Enviar'}
                        </button>
                        <button
                          onClick={() => setComentarioInput('')}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-colors"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Historial del Reclamo */}
                  {reclamoSeleccionado.detalles && reclamoSeleccionado.detalles.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                        Historial del Reclamo ({reclamoSeleccionado.detalles.length})
                      </h3>
                      <div className="space-y-4">
                        {reclamoSeleccionado.detalles.map((detalle) => (
                          <div key={detalle.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-gray-700 leading-relaxed">{detalle.mensaje}</p>
                              <div className="flex items-center mt-2 text-sm text-gray-500">
                                <span className="font-medium">{detalle.autor_nombre}</span>
                                <span className="mx-2">•</span>
                                <span>{formatFechaCompleta(detalle.fecha)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Seleccione un Reclamo
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  Elija un reclamo de la lista lateral para ver los detalles completos y realizar acciones de gestión.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Modal Visor de Imágenes */}
      {mostrarVisor && archivoSeleccionado && archivoSeleccionado.tipo_archivo === 'imagen' && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setMostrarVisor(false)}
        >
          <button
            onClick={() => setMostrarVisor(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Cerrar visor"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img 
              src={archivoSeleccionado.url_archivo} 
              alt={archivoSeleccionado.nombre_archivo}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
            <p className="text-sm font-medium">{archivoSeleccionado.nombre_archivo}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-300">
              <a 
                href={archivoSeleccionado.url_archivo} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Abrir en nueva pestaña
              </a>
              <span>•</span>
              <a 
                href={archivoSeleccionado.url_archivo} 
                download={archivoSeleccionado.nombre_archivo}
                className="flex items-center gap-1 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3 h-3" />
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visor de PDF */}
      {mostrarVisor && archivoSeleccionado && archivoSeleccionado.tipo_archivo !== 'imagen' && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setMostrarVisor(false)}
        >
          <button
            onClick={() => setMostrarVisor(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Cerrar visor"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center bg-white rounded-lg overflow-hidden">
            <div className="w-full h-full">
              <iframe
                src={archivoSeleccionado.url_archivo}
                className="w-full h-full border-0"
                title={archivoSeleccionado.nombre_archivo}
              />
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">{archivoSeleccionado.nombre_archivo}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-300">
                <a 
                  href={archivoSeleccionado.url_archivo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir en nueva pestaña
                </a>
                <span>•</span>
                <a 
                  href={archivoSeleccionado.url_archivo} 
                  download={archivoSeleccionado.nombre_archivo}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3 h-3" />
                  Descargar
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};