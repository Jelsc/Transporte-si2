import axios from "axios";
import type { Vehiculo } from "./vehiculosService";

const API_URL = "http://localhost:8000/api";

export interface Viaje {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  vehiculo: Vehiculo;   // aquí tenemos los datos completos del vehículo
  precio: number;
}

export interface ViajeForm {
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  vehiculo_id: string;   // enviamos el ID del vehículo
  precio: string;
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Token ${localStorage.getItem("token") || ""}`,
  },
});

export const getViajes = async (): Promise<Viaje[]> => {
  const response = await axiosInstance.get("/viajes/");
  return response.data.results || response.data;
};

export const createViaje = async (viaje: {
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  vehiculo_id: number;  // usamos vehiculo_id
  precio: number;
}) => {
  const response = await axiosInstance.post("/viajes/", viaje);
  return response.data;
};

export const updateViaje = async (id: number, form: ViajeForm) => {
  const payload = {
    origen: form.origen,
    destino: form.destino,
    fecha: form.fecha,
    hora: form.hora,
    vehiculo_id: Number(form.vehiculo_id),  // ✅ enviamos el ID
    precio: Number(form.precio),
  };
  return axiosInstance.put(`/viajes/${id}/`, payload);
};

export const deleteViaje = async (id: number) => {
  return axiosInstance.delete(`/viajes/${id}/`);
};
