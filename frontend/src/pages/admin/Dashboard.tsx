// ...eliminado uso de iconos...
import React, { useEffect, useState, useRef } from "react";
import { useEffect as useEffectAnim } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { usuariosApi } from "../../services/usuariosService";
import { vehiculosApi } from "../../services/vehiculosService";
import { conductoresApi } from "../../services/conductoresService";
import { viajesApi } from "../../services/viajesService";
import { encomiendaService } from "../../services/encomiendaService";
import AdminLayout from "@/app/layout/admin-layout";

const Dashboard: React.FC = () => {
  const [usuarios, setUsuarios] = useState(0);
  const [vehiculos, setVehiculos] = useState(0);
  const [conductores, setConductores] = useState(0);
  const [viajes, setViajes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usuariosApi.list().then((res) => {
        const count = Array.isArray(res?.data?.results)
          ? res.data.results.length
          : Array.isArray(res?.data)
          ? res.data.length
          : 0;
        setUsuarios(count);
      }),
      vehiculosApi.list().then((res) => {
        const count = Array.isArray(res?.data?.results)
          ? res.data.results.length
          : Array.isArray(res?.data)
          ? res.data.length
          : 0;
        setVehiculos(count);
      }),
      conductoresApi.list().then((res) => {
        const count = Array.isArray(res?.data?.results)
          ? res.data.results.length
          : Array.isArray(res?.data)
          ? res.data.length
          : 0;
        setConductores(count);
      }),
      viajesApi
        .list()
        .then((res) => {
          const count = Array.isArray(res?.data?.results)
            ? res.data.results.length
            : Array.isArray(res?.data)
            ? res.data.length
            : 0;
          setViajes(count);
        })
        .catch(() => setViajes(0)),
    ]).finally(() => setLoading(false));
  }, []);

  // Animación de conteo para los números
  function useCountUp(target: number) {
    const [count, setCount] = useState(0);
    useEffectAnim(() => {
      let start = 0;
      const end = target;
      if (start === end) return;
      let increment = end > start ? 1 : -1;
      let stepTime = Math.abs(Math.floor(1000 / (end || 1)));
      const timer = setInterval(
        () => {
          start += increment;
          setCount(start);
          if (start === end) clearInterval(timer);
        },
        stepTime > 50 ? 50 : stepTime
      );
      return () => clearInterval(timer);
    }, [target]);
    return count;
  }

  // Hooks para cada métrica (siempre se llaman en el mismo orden)
  const animatedVehiculos = useCountUp(vehiculos);
  const animatedConductores = useCountUp(conductores);
  const animatedViajes = useCountUp(viajes);
  const animatedUsuarios = useCountUp(usuarios);

  const navigate = useNavigate();
  const cards = [
    {
      label: "Buses",
      value: animatedVehiculos,
      raw: vehiculos,
      color: "bg-blue-100 text-blue-700",
      tooltip: "Cantidad total de buses registrados en el sistema.",
      link: "/admin/vehiculos",
    },
    {
      label: "Conductores",
      value: animatedConductores,
      raw: conductores,
      color: "bg-green-100 text-green-700",
      tooltip: "Conductores activos registrados.",
      link: "/admin/conductores",
    },
    {
      label: "Viajes",
      value: animatedViajes,
      raw: viajes,
      color: "bg-purple-100 text-purple-700",
      tooltip: "Viajes realizados o programados.",
      link: "/admin/viajes",
    },
    {
      label: "Usuarios",
      value: animatedUsuarios,
      raw: usuarios,
      color: "bg-pink-100 text-pink-700",
      tooltip: "Usuarios registrados en la plataforma.",
      link: "/admin/usuarios",
    },
  ];

  return (
    <AdminLayout>
      <h1 className="text-5xl font-bold mb-2">Dashboard</h1>
      <p className="mb-8">
        Bienvenido al panel general del sistema de transporte. Aquí puedes ver
        estadísticas, accesos rápidos y resumen de módulos.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="p-6 flex flex-col items-center rounded-2xl shadow-lg bg-gray-100 animate-pulse min-w-[180px] h-[120px]"
              >
                <div className="h-8 w-16 bg-gray-300 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-300 rounded" />
              </div>
            ))
          : cards.map((card) => {
              const numberColor =
                card.raw === 0 ? "text-red-500 animate-pulse" : "";
              return (
                <div
                  key={card.label}
                  className={`relative group p-6 flex flex-col items-center rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer ${card.color}`}
                  style={{ minWidth: 180 }}
                  onClick={() => navigate(card.link)}
                  title={`Ir a ${card.label}`}
                >
                  <span
                    className={`text-3xl font-bold mb-2 transition-all duration-200 ${numberColor}`}
                  >
                    {card.value}
                  </span>
                  <span className="font-semibold text-lg">{card.label}</span>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    {card.tooltip}
                  </span>
                </div>
              );
            })}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
