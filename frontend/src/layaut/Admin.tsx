import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Sidebar/Header';
import HeaderFiltros from '@/components/Sidebar/HeaderFiltros';
import TablaRuta from '@/components/Sidebar/TablaRutas';
import Paradas from '@/components/Sidebar/Paradas';
import Mapa from '@/components/Sidebar/Mapa';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar/>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
           <Header/>

        {/* Main Content */}
        <main className="p-6">
          {/* Header con filtros */}
          
          <HeaderFiltros/> 
          {/* Layout de dos columnas */}
          <div className="grid grid-cols-12 gap-6">
            {/* Columna izquierda - Tabla de rutas */}
            <TablaRuta/>
            {/* Columna derecha - Mapa y paradas */}
            <div className="col-span-7 space-y-4">
              {/* Mapa */}
              <Mapa/>
              {/* Paradas */}
              <Paradas/>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

};
export default Admin;