import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/inicio/home.page";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import EmailVerificationPage from "../pages/auth/EmailVerificationPage";
import AdminPage from "../pages/admin/admin.page";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import PermisosCRUD from "../pages/admin/usuarios/roles-permisos/permiso";
import RolForm from "../pages/admin/usuarios/roles-permisos/rol";
import BitacoraPage from "@/pages/admin/bitacora.page";
// Nuevas páginas refactorizadas
import PersonalPage from "../pages/admin/personal/personal.page";
import ConductoresPage from "../pages/admin/conductores/driver.page";
import UsuariosPage from "../pages/admin/usuarios/users.page";
import AccountSettingsPage from "../pages/profile/account-settings.page";


export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />        
        {/* Rutas protegidas de administración */}
        <Route 
          path="/admin/roles-permisos/permisos" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <PermisosCRUD />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/roles-permisos/rol" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <RolForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/bitacora" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <BitacoraPage />
            </ProtectedRoute>
          } 
        />
        {/* auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/email-verification"
          element={<EmailVerificationPage />}
        />

        {/* admin */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route 
          path="/admin/home" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />

        {/* Otras rutas de admin protegidas */}
        <Route 
          path="/admin/flotas" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Flotas (por implementar)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/conductores" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <ConductoresPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/personal" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <PersonalPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/usuarios" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <UsuariosPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/mantenimiento" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Mantenimiento (por implementar)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/rutas" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Rutas (por implementar)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/ventas" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <div>Ventas (por implementar)</div>
            </ProtectedRoute>
          } 
        />

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
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <AccountSettingsPage />
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