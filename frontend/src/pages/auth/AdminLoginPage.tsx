import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AdminLoginFormData {
  username: string;
  password: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AdminLoginFormData>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Aquí deberías conectar con tu backend para validar admin
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (formData.username === 'admin' && formData.password === 'admin123') {
      navigate('/admin/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
    setLoading(false);
  };

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Acceso administrador</h2>
          <Button variant="outline" type="button" onClick={goBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="admin"
              disabled={loading}
              required
              className="px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
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
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full py-3 px-4 font-medium bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? (
              <span>Ingresando...</span>
            ) : (
              <><LogIn className="mr-2" /> Ingresar</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
