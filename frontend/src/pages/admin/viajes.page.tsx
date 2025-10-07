import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, Plus, Edit2, Trash2, Loader2, X, Search } from "lucide-react";
import AdminLayout from "@/app/layout/admin-layout";
import type { Viaje } from "../../services/viajesService";
import { getViajes, createViaje, updateViaje, deleteViaje } from "../../services/viajesService";
import { getVehiculos, type Vehiculo } from "@/services/vehiculosService";

export default function ViajesPage() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingViaje, setEditingViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<any>({
    origen: "",
    destino: "",
    fecha: "",
    hora: "",
    vehiculo_id: "",
    precio: "",
  });

  const ciudades = ["La Paz", "Santa Cruz", "Cochabamba"];

  useEffect(() => {
    fetchViajes();
    fetchVehiculos();
  }, []);

  const fetchViajes = async () => {
    const data = await getViajes();
    setViajes(data);
  };

  const fetchVehiculos = async () => {
    const data = await getVehiculos();
    setVehiculos(data);
  };

  const filteredViajes = viajes.filter(
    v =>
      v.origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehiculo?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (viaje?: Viaje) => {
    if (viaje) {
      setEditingViaje(viaje);
      setForm({
        origen: viaje.origen,
        destino: viaje.destino,
        fecha: viaje.fecha,
        hora: viaje.hora,
        vehiculo_id: viaje.vehiculo?.id || "",
        precio: viaje.precio,
      });
    } else {
      setEditingViaje(null);
      setForm({
        origen: "",
        destino: "",
        fecha: "",
        hora: "",
        vehiculo_id: "",
        precio: "",
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.origen || !form.destino || !form.fecha || !form.hora || !form.vehiculo_id || !form.precio) {
      alert("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        vehiculo_id: Number(form.vehiculo_id),
        precio: Number(form.precio),
      };
      if (editingViaje) {
        await updateViaje(editingViaje.id, payload);
      } else {
        await createViaje(payload);
      }
      await fetchViajes();
      setShowModal(false);
    } catch (error) {
      alert("Error al guardar el viaje");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este viaje?")) return;
    await deleteViaje(id);
    await fetchViajes();
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Bus className="text-blue-600" size={28} />
                Gestión de Viajes
              </h1>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{viajes.length}</div>
                <div className="text-sm text-gray-500">Total viajes</div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Buscador y botón nuevo viaje */}
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Buscar viajes..."
                    className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                    {filteredViajes.length} de {viajes.length}
                  </span>
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Nuevo Viaje
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Origen</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Destino</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Fecha</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Hora</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Vehículo</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Precio (Bs.)</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredViajes.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">{v.origen}</td>
                          <td className="px-6 py-4">{v.destino}</td>
                          <td className="px-6 py-4">{v.fecha}</td>
                          <td className="px-6 py-4">{v.hora}</td>
                          <td className="px-6 py-4">{v.vehiculo ? `${v.vehiculo.nombre} | ${v.vehiculo.placa} | ${v.vehiculo.tipo_vehiculo}` : "-"}</td>
                          <td className="px-6 py-4">{v.precio}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleOpenModal(v)} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <Edit2 size={14} />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(v.id)} className="border-red-200 text-red-700 hover:bg-red-50">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {filteredViajes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                <Bus size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? "No se encontraron viajes" : "No hay viajes registrados"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza creando tu primer viaje"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Crear Primer Viaje
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">{editingViaje ? "Editar Viaje" : "Nuevo Viaje"}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <Label htmlFor="origen">Origen *</Label>
                  <select id="origen" value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Seleccione origen</option>
                    {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="destino">Destino *</Label>
                  <select id="destino" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Seleccione destino</option>
                    {ciudades.filter(c => c !== form.origen).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input id="fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="hora">Hora *</Label>
                  <Input id="hora" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="vehiculo">Vehículo *</Label>
                  <select id="vehiculo" value={form.vehiculo_id} onChange={(e) => setForm({ ...form, vehiculo_id: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Seleccione vehículo</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.nombre} | {v.placa} | {v.tipo_vehiculo}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="precio">Precio (Bs.) *</Label>
                  <Input id="precio" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (<><Loader2 className="animate-spin mr-2" size={16} />Guardando...</>) : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
