import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TransporteIcon from '@/components/app-logo';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Bell,
  CreditCard,
  Users,
  Smartphone,
} from 'lucide-react';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular API call (aquí conectarás con tu Django backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Registro exitoso:', formData);
      // Redirigir al login después del registro exitoso
      navigate('/login');
      
    } catch (err) {
      console.error('Error en registro:', err);
    } finally {
      setLoading(false);
    }
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                type="button"
                onClick={goBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button asChild className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Register Form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h2>
                <p className="text-gray-600">Únete a nuestra comunidad de viajeros</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Juan"
                      disabled={loading}
                      required
                      className={`px-4 py-3 transition-colors ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Pérez"
                      disabled={loading}
                      required
                      className={`px-4 py-3 transition-colors ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

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
                    disabled={loading}
                    required
                    className={`px-4 py-3 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+591 700-00000"
                    disabled={loading}
                    required
                    className={`px-4 py-3 transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
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
                      disabled={loading}
                      required
                      className={`px-4 py-3 pr-10 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
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
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      className={`px-4 py-3 pr-10 transition-colors ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <label className="flex items-start">
                    <Input
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      disabled={loading}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Acepto los{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500">
                        términos y condiciones
                      </a>{' '}
                      y la{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500">
                        política de privacidad
                      </a>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>
                  )}
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creando cuenta...
                    </div>
                  ) : (
                    'Crear cuenta'
                  )}
                </Button>

                {/* Sign In Link */}
                <div className="text-center">
                  <span className="text-sm text-gray-600">¿Ya tienes cuenta? </span>
                  <Link 
                    to="/login" 
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Benefits */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-blue-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Beneficios de registrarte</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Gestión de pasajes y reprogramaciones.</span>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Guarda pasajeros frecuentes.</span>
                </div>
                <div className="flex items-start">
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Alertas de embarque y cambios.</span>
                </div>
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Pagos guardados y facturas.</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <p className="text-sm text-gray-600 mb-4">
                  La mensajería y envío de paquetes está disponible solo en la App Móvil.
                </p>
                <div className="flex items-center justify-center">
                  <Button className="flex items-center justify-center px-4 py-3 h-12 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
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