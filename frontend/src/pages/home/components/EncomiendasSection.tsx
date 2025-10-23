import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, MapPin, Clock, CheckCircle, Truck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EncomiendasSection() {
  const navigate = useNavigate();
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');

  const handleSeguimiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoSeguimiento.trim()) {
      navigate(`/encomiendas?seguimiento=${codigoSeguimiento}`);
    }
  };

  const beneficios = [
    {
      icon: Truck,
      title: "Cobertura Nacional",
      description: "Llegamos a todas las ciudades principales de Bolivia"
    },
    {
      icon: Clock,
      title: "Entrega Rápida",
      description: "Tiempos de entrega optimizados según la ruta"
    },
    {
      icon: CheckCircle,
      title: "Seguimiento en Tiempo Real",
      description: "Monitorea tu encomienda en cada etapa del viaje"
    },
    {
      icon: Package,
      title: "Embalaje Seguro",
      description: "Garantizamos la integridad de tus paquetes"
    }
  ];

  return (
    <section id="encomiendas" className="py-20 bg-gray-50 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Servicio de Encomiendas
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Envía y recibe paquetes de forma segura y confiable por todo Bolivia
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Seguimiento */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    Seguimiento de Encomiendas
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Rastrea tu paquete en tiempo real
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleSeguimiento} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Código de Seguimiento
                  </label>
                  <Input
                    placeholder="Ej: ENC20240001"
                    value={codigoSeguimiento}
                    onChange={(e) => setCodigoSeguimiento(e.target.value)}
                    className="w-full text-lg py-3"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
                  disabled={!codigoSeguimiento.trim()}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Rastrear Encomienda
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  ¿No tienes un código? Registra tu primera encomienda
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Nuevo Envío */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    Nuevo Envío
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Registra tu encomienda en pocos pasos
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <span className="text-gray-700">Completa el formulario</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <span className="text-gray-700">Recibe tu código de seguimiento</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <span className="text-gray-700">Realiza el pago</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/encomiendas')}
                className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg"
              >
                <Package className="w-5 h-5 mr-2" />
                Registrar Encomienda
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Precios desde <span className="font-semibold text-green-600">20 BOB</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Beneficios */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {beneficios.map((beneficio, index) => {
            const Icon = beneficio.icon;
            return (
              <Card key={index} className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h5 className="font-semibold text-gray-900 mb-2">{beneficio.title}</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {beneficio.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Listo para enviar tu primer paquete?
            </h4>
            <p className="text-gray-600 mb-6">
              Únete a miles de clientes que confían en nuestro servicio de encomiendas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/encomiendas')}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
              >
                Comenzar Ahora
              </Button>
              <Button 
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
              >
                Ver Tarifas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}