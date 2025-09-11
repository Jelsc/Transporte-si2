import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const useGoogleAuth = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response: any) => {
    try {
      console.log("Google login response:", response);

      // Ya no permitimos tokens de prueba
      if (response.credential === "mock_google_token_for_testing") {
        console.error("No se permite usar tokens de prueba en producción");
        toast.error("Configuración de Google inválida");
        return;
      }

      if (!response.credential) {
        toast.error("No se recibió credencial de Google");
        return;
      }

      // Decodificar el JWT token de Google real
      const token = response.credential;
      
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Google user info:", payload);

        if (!payload.email) {
          toast.error("No se pudo obtener el email de Google");
          return;
        }

        // Usar el contexto de autenticación para manejar el login con Google
        await loginWithGoogle({
          username: payload.email,
          password: "", // No necesitamos password para OAuth
          isGoogleAuth: true,
          googleToken: token,
        });

        // Redirigir al dashboard o página principal
        navigate("/");
      } catch (decodeError) {
        console.error("Error al decodificar token de Google:", decodeError);
        toast.error("Error al procesar la respuesta de Google");
      }
    } catch (error) {
      console.error("Error en Google login:", error);
      toast.error("Error al iniciar sesión con Google");
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Error de Google:", error);
    // En lugar de lanzar un error, podemos mostrar una notificación al usuario
    // y manejar el error de manera más amigable
    toast.error(error?.error || "Error al iniciar sesión con Google");
    return; // No lanzamos un error, solo devolvemos
  };

  return {
    handleGoogleSuccess,
    handleGoogleError,
  };
};
