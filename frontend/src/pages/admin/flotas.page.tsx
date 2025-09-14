import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VehiculoForm from "@/components/VehiculoForm";
import type { Vehiculo } from "@/services/vehiculo";
import { vehiculoService } from "@/services/vehiculo";

export default function FlotasPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vehiculo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = () => {
    vehiculoService
      .getVehiculos()
      .then((res) => {
        if (res.success && res.data) setVehiculos(res.data);
      })
      .catch((err) => console.error("Error al obtener vehículos:", err));
  };

  // Filtrar vehículos por placa o modelo
  const filtered = vehiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase())
  );

  // Crear vehículo y seleccionarlo automáticamente
  const handleCreate = (data: Vehiculo) => {
    vehiculoService
      .createVehiculo(data)
      .then((res) => {
        if (res.success && res.data) {
          // agregar al listado
          const newVehiculos = [...vehiculos, res.data];
          setVehiculos(newVehiculos);
          setSelected(res.data); // seleccionar automáticamente
          setModalOpen(false);
        } else {
          alert("Error al crear vehículo: " + res.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Error de conexión al crear vehículo");
      });
  };

  // Actualizar vehículo
  const handleUpdate = (data: Vehiculo) => {
    if (!data.id) {
      alert("ID del vehículo no existe");
      return;
    }
    vehiculoService
      .updateVehiculo(data.id, data)
      .then((res) => {
        if (res.success && res.data) {
          // actualizar listado
          const updated = vehiculos.map((v) => (v.id === data.id ? res.data! : v));
          setVehiculos(updated);
          setSelected(res.data); // actualizar ficha
          setModalOpen(false);
        } else {
          alert("Error al actualizar vehículo: " + res.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Error de conexión al actualizar vehículo");
      });
  };

  // Eliminar vehículo
  const handleDelete = (id?: number) => {
    if (!id) return;
    if (confirm("¿Seguro que deseas eliminar este vehículo?")) {
      vehiculoService
        .deleteVehiculo(id)
        .then((res) => {
          if (res.success) {
            setVehiculos(vehiculos.filter((v) => v.id !== id));
            setSelected(null);
          } else {
            alert("Error al eliminar vehículo: " + res.message);
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Error de conexión al eliminar vehículo");
        });
    }
  };

  const handleSubmit = (data: Vehiculo) => {
    editMode ? handleUpdate(data) : handleCreate(data);
  };

  return (
    <div className="p-6 grid grid-cols-12 gap-4">
      {/* Lista de vehículos */}
      <div className="col-span-5 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por placa o modelo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            onClick={() => {
              setEditMode(false);
              setSelected(null);
              setModalOpen(true);
            }}
          >
            + Nuevo vehículo
          </Button>
        </div>

        <Card className="p-0">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Placa</th>
                  <th className="p-2">Modelo</th>
                  <th className="p-2">Año</th>
                  <th className="p-2">Cap. pax</th>
                  <th className="p-2">Cap. carga</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className={`hover:bg-gray-100 cursor-pointer ${
                      selected?.id === v.id ? "bg-gray-50" : ""
                    }`}
                    onClick={() => setSelected(v)}
                  >
                    <td className="p-2">{v.placa}</td>
                    <td className="p-2">{v.modelo}</td>
                    <td className="p-2">{v.anio}</td>
                    <td className="p-2">{v.capacidad_pasajeros}</td>
                    <td className="p-2">{v.capacidad_carga} t</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Detalle del vehículo */}
      <div className="col-span-7">
        {selected ? (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-xl font-bold">Ficha del vehículo</h2>
              <div className="grid grid-cols-2 gap-2">
                <p><b>Placa:</b> {selected.placa}</p>
                <p><b>Modelo:</b> {selected.modelo}</p>
                <p><b>Año:</b> {selected.anio}</p>
                <p><b>VIN:</b> {selected.vin}</p>
                <p><b>Seguro:</b> {selected.seguro_vigente ? "Vigente ✅" : "No vigente ❌"}</p>
                <p><b>Estado:</b> {selected.estado}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selected) return;
                    setEditMode(true);
                    setModalOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selected.id)}
                >
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-gray-500">
              Selecciona un vehículo para ver detalles
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
          </DialogHeader>
          <VehiculoForm
            initialData={editMode ? selected ?? undefined : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
