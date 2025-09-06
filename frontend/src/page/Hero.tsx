// src/pages/home/Hero.tsx
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="text-center py-20 px-6">
      <motion.h2
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-5xl font-bold text-foreground mb-6"
      >
        Tu Viaje y Envío, Más Fácil con <span className="">TransMovil</span>
      </motion.h2>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Compra pasajes, reserva tus viajes, envía encomiendas y gestiona rutas de manera rápida y segura.
      </p>
      <Button>Comenzar Ahora</Button>
    </section>
  );
}
