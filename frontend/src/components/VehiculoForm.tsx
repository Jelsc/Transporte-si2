import React, { useState } from 'react';
import type { FormEvent } from 'react';
import type{ Vehiculo } from "@/services/vehiculo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Props {
  initialData?: Vehiculo| undefined 
  onSubmit: (data: Vehiculo) => void
  onCancel: () => void
}

export default function VehiculoForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<Vehiculo>(
    initialData ?? {
      placa: "",
      modelo: "",
      anio: new Date().getFullYear(),
      capacidad_pasajeros: 0,
      capacidad_carga: 0,
      vin: "",
      seguro_vigente: true,
      estado: "Disponible"
    }
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target

  let val: string | number | boolean = value

  if (type === "checkbox" && e.target instanceof HTMLInputElement) {
    val = e.target.checked // ✅ ahora TypeScript sabe que existe
  } else if (["anio", "capacidad_pasajeros", "capacidad_carga"].includes(name)) {
    val = Number(value)
  }

  setForm(prev => ({
    ...prev,
    [name]: val,
  } as Vehiculo))
}

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Placa</Label>
        <Input name="placa" value={form.placa} onChange={handleChange} required />
      </div>
      <div>
        <Label>Modelo</Label>
        <Input name="modelo" value={form.modelo} onChange={handleChange} required />
      </div>
      <div>
        <Label>Año</Label>
        <Input type="number" name="anio" value={form.anio} onChange={handleChange} required />
      </div>
      <div>
        <Label>Capacidad pasajeros</Label>
        <Input type="number" name="capacidad_pasajeros" value={form.capacidad_pasajeros} onChange={handleChange} required />
      </div>
      <div>
        <Label>Capacidad carga (t)</Label>
        <Input type="number" step="0.1" name="capacidad_carga" value={form.capacidad_carga} onChange={handleChange} required />
      </div>
      <div>
        <Label>VIN</Label>
        <Input name="vin" value={form.vin} onChange={handleChange} required />
      </div>
      <div>
        <Label>Estado</Label>
        <select name="estado" value={form.estado} onChange={handleChange} className="border rounded p-1 w-full">
          <option>Disponible</option>
          <option>En mantenimiento</option>
          <option>Fuera de servicio</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="seguro_vigente" checked={form.seguro_vigente} onChange={handleChange} />
        <Label>Seguro vigente</Label>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialData ? "Actualizar" : "Guardar"}</Button>
      </div>
    </form>
  )
}
