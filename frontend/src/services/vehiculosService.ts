
// Servicio real para gestión de vehículos
export interface Vehiculo {
  id: number;
  nombre: string;
  tipo_vehiculo: string;
  placa: string;
  marca: string;
  modelo: string;
  año_fabricacion: number;
  conductor: number | { id: number; nombre: string; apellido: string };
  capacidad_pasajeros: number;
  capacidad_carga: number;
  estado: string;
  kilometraje: number;
  ultimo_mantenimiento?: string;
  proximo_mantenimiento?: string;
}

const API_URL = "http://localhost:8000/api/vehiculos/";

export async function getVehiculos(): Promise<Vehiculo[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener vehículos");
  const data = await res.json();
  return data.results || data;
}

export async function createVehiculo(data: Partial<Vehiculo>): Promise<void> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      conductor_id: data.conductor, // debe ser el id
    }),
  });
  if (!res.ok) throw new Error("Error al crear vehículo");
}

export async function updateVehiculo(id: number, data: Partial<Vehiculo>): Promise<void> {
  const res = await fetch(`${API_URL}${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      conductor_id: data.conductor, // debe ser el id
    }),
  });
  if (!res.ok) throw new Error("Error al actualizar vehículo");
}

export async function deleteVehiculo(id: number): Promise<void> {
  const res = await fetch(`${API_URL}${id}/`, {
    method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar vehículo");
}
