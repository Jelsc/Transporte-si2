import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Client from "./layout/client-layout";
import Admin from "./layout/admin-layout";
import HomePage from "../pages/inicio/home.page";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* otras */}
        <Route path="/client" element={<Client />} />
        <Route path="/admin" element={<Admin />} />

        {/* catch-all */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}
