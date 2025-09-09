import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const useGoogleAuth = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response: any) => {
    try {
      console.log("Google login response:", response);

      // Verificar si es un token de prueba
      if (response.credential === "mock_google_token_for_testing") {
        // Usar datos de prueba
        const mockPayload = {
          email: "test@example.com",
          given_name: "Usuario",
          family_name: "Prueba",
        };

        console.log("Modo prueba - Usando datos simulados:", mockPayload);

        await loginWithGoogle({
          username: mockPayload.email,
          password: "",
          isGoogleAuth: true,
          googleToken: response.credential,
        });

        navigate("/");
        return;
      }

      // Decodificar el JWT token de Google real
      const token = response.credential;
      const payload = JSON.parse(atob(token.split(".")[1]));

      console.log("Google user info:", payload);

      // Usar el contexto de autenticación para manejar el login con Google
      await loginWithGoogle({
        username: payload.email,
        password: "", // No necesitamos password para OAuth
        isGoogleAuth: true,
        googleToken: token,
      });

      // Redirigir al dashboard o página principal
      navigate("/");
    } catch (error) {
      console.error("Error en Google login:", error);
      throw error;
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Error de Google:", error);
    throw new Error("Error al iniciar sesión con Google");
  };

  return {
    handleGoogleSuccess,
    handleGoogleError,
  };
};
