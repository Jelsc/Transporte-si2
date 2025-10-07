
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Plus, Edit2, Trash2, Loader2, X, Search } from "lucide-react";
import AdminLayout from "@/app/layout/admin-layout";
import type { Vehiculo } from "@/services/vehiculosService";
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from "@/services/vehiculosService";
import { conductoresApi } from "@/services/conductoresService";


export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<any>({
    nombre: "",
    tipo_vehiculo: "",
    placa: "",
    marca: "",
    modelo: "",
    año_fabricacion: "",
    capacidad_pasajeros: "",
    capacidad_carga: "",
    estado: "activo",
    conductor: ""
  });
  const [conductores, setConductores] = useState<any[]>([]);
  const estados = ["activo", "mantenimiento", "baja"];
  const tiposVehiculo = ["Bus", "Bus Cama", "Minibús", "Camión", "Van"];

  useEffect(() => {
    fetchVehiculos();
    fetchConductores();
  }, []);

  const fetchVehiculos = async () => {
    const data = await getVehiculos();
    setVehiculos(data);
  };

  const fetchConductores = async () => {
    const res = await conductoresApi.getAvailable();
    if (res.success && res.data) setConductores(res.data);
  };

  const filteredVehiculos = vehiculos.filter(
    v =>
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.tipo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (vehiculo?: Vehiculo) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      setForm({
        nombre: vehiculo.nombre || "",
        tipo_vehiculo: vehiculo.tipo_vehiculo || "",
        placa: vehiculo.placa || "",
        marca: vehiculo.marca || "",
        modelo: vehiculo.modelo || "",
        año_fabricacion: vehiculo.año_fabricacion || "",
        capacidad_pasajeros: vehiculo.capacidad_pasajeros || "",
        capacidad_carga: vehiculo.capacidad_carga || "",
        estado: vehiculo.estado || "activo",
        conductor: typeof vehiculo.conductor === 'object' && vehiculo.conductor !== null ? vehiculo.conductor.id : vehiculo.conductor || ""
      });
    } else {
      setEditingVehiculo(null);
      setForm({
        nombre: "",
        tipo_vehiculo: "",
        placa: "",
        marca: "",
        modelo: "",
        año_fabricacion: "",
        capacidad_pasajeros: "",
        capacidad_carga: "",
        estado: "activo",
        conductor: ""
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.tipo_vehiculo || !form.placa || !form.marca || !form.conductor) {
      alert("Nombre, tipo de vehículo, placa, marca y conductor son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        año_fabricacion: form.año_fabricacion ? parseInt(form.año_fabricacion) : null,
        capacidad_pasajeros: form.capacidad_pasajeros ? parseInt(form.capacidad_pasajeros) : 0,
        capacidad_carga: form.capacidad_carga ? parseFloat(form.capacidad_carga) : 0,
        conductor: form.conductor,
      };
      if (editingVehiculo) {
        await updateVehiculo(editingVehiculo.id, payload);
      } else {
        await createVehiculo(payload);
      }
      await fetchVehiculos();
      setShowModal(false);
    } catch (error) {
      alert("Error al guardar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este vehículo?")) return;
    await deleteVehiculo(id);
    await fetchVehiculos();
  };


  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        <header className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Car className="text-blue-600" size={28} />
                Gestión de Vehículos
              </h1>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{vehiculos.length}</div>
                <div className="text-sm text-gray-500">Total vehículos</div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Buscar vehículos..."
                    className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                    {filteredVehiculos.length} de {vehiculos.length}
                  </span>
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Nuevo Vehículo
                  </Button>
                </div>
              </div>
            </div>
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Nombre</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Tipo</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Placa</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Marca</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Modelo</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Año</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Pasajeros</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Carga (kg)</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                        {/* <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Kilometraje</th> */}
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Conductor</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredVehiculos.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">{v.nombre}</td>
                          <td className="px-6 py-4">{v.tipo_vehiculo}</td>
                          <td className="px-6 py-4">{v.placa}</td>
                          <td className="px-6 py-4">{v.marca}</td>
                          <td className="px-6 py-4">{v.modelo}</td>
                          <td className="px-6 py-4">{v.año_fabricacion}</td>
                          <td className="px-6 py-4">{v.capacidad_pasajeros}</td>
                          <td className="px-6 py-4">{v.capacidad_carga}</td>
                          <td className="px-6 py-4">{v.estado}</td>
                          {/* <td className="px-6 py-4">{v.kilometraje}</td> */}
                          <td className="px-6 py-4">
                            {typeof v.conductor === 'object' && v.conductor !== null
                              ? `${v.conductor.nombre} ${v.conductor.apellido}`
                              : "-"}
                          </td>
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
            {filteredVehiculos.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                <Car size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? "No se encontraron vehículos" : "No hay vehículos registrados"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza creando tu primer vehículo"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Crear Primer Vehículo
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {editingVehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="tipo_vehiculo">Tipo *</Label>
                <select id="tipo_vehiculo" value={form.tipo_vehiculo} onChange={(e) => setForm({ ...form, tipo_vehiculo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Seleccione tipo</option>
                  {tiposVehiculo.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="placa">Placa *</Label>
                <Input id="placa" value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="marca">Marca *</Label>
                <Input id="marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="año_fabricacion">Año de fabricación</Label>
                <Input id="año_fabricacion" type="number" value={form.año_fabricacion} onChange={(e) => setForm({ ...form, año_fabricacion: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="capacidad_pasajeros">Capacidad de pasajeros</Label>
                <Input id="capacidad_pasajeros" type="number" value={form.capacidad_pasajeros} onChange={(e) => setForm({ ...form, capacidad_pasajeros: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="capacidad_carga">Capacidad de carga (kg)</Label>
                <Input id="capacidad_carga" type="number" value={form.capacidad_carga} onChange={(e) => setForm({ ...form, capacidad_carga: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <select id="estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  {estados.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              {/*
              <div>
                <Label htmlFor="kilometraje">Kilometraje</Label>
                <Input id="kilometraje" type="number" value={form.kilometraje} onChange={(e) => setForm({ ...form, kilometraje: e.target.value })} />
              </div>
              */}
              <div>
                <Label htmlFor="conductor">Conductor *</Label>
                <select id="conductor" value={form.conductor} onChange={(e) => setForm({ ...form, conductor: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Seleccione conductor</option>
                  {conductores.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                  ))}
                </select>
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
    </AdminLayout>
  );
}
