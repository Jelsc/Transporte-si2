
const Mapa= () => {
  return (
  <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm text-gray-600 mb-3">Mapa de ruta seleccionada</h3>
                <div className="bg-green-100 rounded h-64 relative overflow-hidden">
                  {/* Simulación del mapa */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300">
                    <div className="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-3 h-3 bg-green-600 rounded-full"></div>
                    {/* Líneas de ruta simuladas */}
                    <svg className="absolute inset-0 w-full h-full">
                      <path d="M 20 20 Q 200 100 380 240" stroke="#1f2937" strokeWidth="3" fill="none" strokeDasharray="5,5" />
                    </svg>
                  </div>
                </div>
                <div className="flex space-x-4 mt-3">
                  <button className="px-3 py-1 text-sm bg-gray-100 rounded">Ruta</button>
                  <button className="px-3 py-1 text-sm hover:bg-gray-100 rounded">Paradas</button>
                  <button className="px-3 py-1 text-sm hover:bg-gray-100 rounded">Tráfico</button>
                </div>
              </div>

                );
};

export default Mapa;