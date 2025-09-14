import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/inicio/home.page";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import EmailVerificationPage from "../pages/auth/EmailVerificationPage";
import AdminPage from "../pages/admin/admin.page";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import FlotasPage from "@/pages/admin/flotas.page";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

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
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
              path="/admin/flotas" 
             element={
              <ProtectedRoute requireAdmin={true}>
                <FlotasPage />
              </ProtectedRoute>
          } 
             />

          {/* rutas protegidas de usuario */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                {/* Aquí irá tu componente de perfil de usuario */}
                <div>Perfil de usuario (protegido)</div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/viajes"
            element={
              <ProtectedRoute>
                {/* Aquí irá tu componente de viajes */}
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
