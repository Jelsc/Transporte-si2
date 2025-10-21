// types/asiento.ts
export interface Asiento {
  id: number;
  numero: string;
  estado: 'libre' | 'ocupado' | 'reservado';
  viaje: number; // o Viaje si quieres incluir info completa
}
