import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Calendar, Bell, CreditCard, Users, Smartphone, LogIn, ArrowLeft } from 'lucide-react';
import TransporteIcon from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: 'juan@example.com',
    password: '',
    rememberMe: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí conectarás con tu backend Django
    console.log('Login attempt:', formData);
    // TODO: Implementar lógica de autenticación
  };

  const handleGoogleLogin = () => {
    console.log('Google login');
    // TODO: Implementar login con Google
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <TransporteIcon className="w-7 h-7" />
              <span className="text-lg font-bold text-blue-700">MoviFleet</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                type="button"
                onClick={goBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button asChild variant="default" className="min-w-[110px] bg-blue-600 hover:bg-blue-700">
                <Link to="/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Login Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Inicia sesión</h2>
                <p className="text-gray-600">Accede a tus reservas, métodos de pago y notificaciones.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="juan@example.com"
                    required
                    className="px-4 py-3"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      className="px-4 py-3 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Mínimo 8 caracteres.</p>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <Input
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Recordarme</span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <Button type="submit" className="w-full py-3 px-4 font-medium bg-blue-500 hover:bg-blue-700">
                  <LogIn className="mr-2" /> Ingresar
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">o continúa con</span>
                  </div>
                </div>

                {/* Social Login Buttons */}

                <Button type="button" variant="outline" onClick={handleGoogleLogin} className="w-full py-3 px-4 font-medium">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>


                {/* Sign Up Link */}
                <div className="text-center">
                  <span className="text-sm text-gray-600">¿No tienes cuenta? </span>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                    Crear cuenta
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Benefits */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-blue-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">¿Por qué iniciar sesión?</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Ver y descargar tus pasajes.</span>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Reprograma o cancela viajes.</span>
                </div>
                <div className="flex items-start">
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Recibe alertas de embarque en tiempo real.</span>
                </div>
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Usa métodos de pago guardados.</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <p className="text-sm text-gray-600 mb-4">
                  La mensajería y envío de paquetes está disponible solo en la App Móvil.
                </p>
                <div className="flex items-center justify-center">
                  <Button className="flex items-center justify-center px-4 py-3 h-12 bg-black text-white rounded-lg hover:bg-gray-800">
                    <Smartphone className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="text-xs">Disponible en</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}