import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/inicio/home.page";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import EmailVerificationPage from "../pages/auth/EmailVerificationPage";
import AdminPage from "../pages/admin/admin.page";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import PermisosCRUD from "../pages/admin/Usuarios/roles-permisos/permiso";
import RolForm from "../pages/admin/Usuarios/roles-permisos/rol";
import UsuariosCRUD from "../pages/admin/Usuarios/registro-usuarios-choferes/UsuariosCRUD";
import ChoferesCRUD from "../pages/admin/Usuarios/registro-usuarios-choferes/ChoferesCRUD";
import BitacoraPage from "@/pages/admin/bitacora.page";


export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />        
        {/* Ruta principal para permisos desde el admin */}
        <Route path="/admin/roles-permisos/permisos" element={<PermisosCRUD />} />
        <Route path="/admin/roles-permisos/rol" element={<RolForm />} />
        <Route path="/admin/registro-usuarios-choferes/ChoferesCRUD" element={<ChoferesCRUD />} />
        <Route path="/admin/registro-usuarios-choferes/UsuariosCRUD" element={<UsuariosCRUD />} />
        {/* auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/email-verification"
          element={<EmailVerificationPage />}
        />

        {/* admin */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/bitacora" element={<BitacoraPage />} />
        <Route 
          path="/admin/home" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />

        {/* Agregar otras rutas de admin si las necesitas */}
        <Route path="/admin/flotas" element={<div>Flotas (por implementar)</div>} />
        <Route path="/admin/conductores" element={<div>Conductores (por implementar)</div>} />
        <Route path="/admin/mantenimiento" element={<div>Mantenimiento (por implementar)</div>} />
        <Route path="/admin/rutas" element={<div>Rutas (por implementar)</div>} />
        <Route path="/admin/ventas" element={<div>Ventas (por implementar)</div>} />

        {/* rutas protegidas de usuario */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <div>Perfil de usuario (protegido)</div>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/viajes"
          element={
            <ProtectedRoute>
              <div>Mis viajes (protegido)</div>
            </ProtectedRoute>
          }
        />

        {/* catch-all */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}