import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Client from "./layout/client-layout";
import HomePage from "../pages/inicio/home.page";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import EmailVerificationPage from "../pages/auth/EmailVerificationPage";
import AdminPage from "../pages/admin/admin.page";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import { AuthProvider } from "@/context/AuthContext";

export default function AppRouter() {
  return (
    <AuthProvider>
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
          <Route path="/admin/dashboard" element={<AdminPage />} />

          {/* client */}
          <Route path="/client" element={<Client />} />

          {/* catch-all */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
