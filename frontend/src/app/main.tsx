import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import AppRouter from "./router";
import { Toaster } from "react-hot-toast";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el elemento 'root' en el HTML.");

createRoot(root).render(
  <StrictMode>
    <AppRouter />
    <Toaster position="top-right" />
  </StrictMode>
);