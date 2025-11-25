"""
Generador de reportes dinámicos basado en parámetros interpretados
Adaptado para el sistema de transporte: viajes, encomiendas, conductores, vehículos, pagos
"""
from django.db.models import Count, Sum, Avg, Q, F, Min, Max
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta
from typing import Dict, List
from viajes.models import Viaje
from encomiendas.models import Encomienda
from conductores.models import Conductor
from vehiculos.models import Vehiculo
from pagos.models import Pago


class ReporteGenerator:
    """
    Generador de consultas y datos para reportes
    """
    
    def generar_datos(self, parametros: Dict) -> Dict:
        """
        Generar los datos del reporte según los parámetros
        
        Args:
            parametros: Diccionario con tipo, fechas, agrupación, etc.
        
        Returns:
            {
                'datos': [...],
                'columnas': [...],
                'titulo': '...',
                'subtitulo': '...',
                'total_registros': N,
                'parametros': parametros
            }
        """
        tipo = parametros.get('tipo', 'viajes')
        
        if tipo == 'viajes':
            return self._generar_reporte_viajes(parametros)
        elif tipo == 'encomiendas':
            return self._generar_reporte_encomiendas(parametros)
        elif tipo == 'conductores':
            return self._generar_reporte_conductores(parametros)
        elif tipo == 'vehiculos':
            return self._generar_reporte_vehiculos(parametros)
        elif tipo == 'financiero':
            return self._generar_reporte_financiero(parametros)
        else:
            return self._generar_reporte_viajes(parametros)
    
    def _generar_reporte_viajes(self, params: Dict) -> Dict:
        """Generar reporte de viajes"""
        queryset = Viaje.objects.select_related('origen', 'destino', 'vehiculo')
        
        # Aplicar filtro de fechas
        if params.get('fecha_inicio'):
            queryset = queryset.filter(fecha__gte=params['fecha_inicio'].date() if isinstance(params['fecha_inicio'], datetime) else params['fecha_inicio'])
        if params.get('fecha_fin'):
            queryset = queryset.filter(fecha__lte=params['fecha_fin'].date() if isinstance(params['fecha_fin'], datetime) else params['fecha_fin'])
        
        agrupacion = params.get('agrupacion', [])
        
        # Caso 1: Agrupado por fecha
        if 'fecha' in agrupacion or not agrupacion:
            datos = self._agrupar_viajes_por_fecha(queryset, params)
            columnas = ['Fecha', 'Cantidad de Viajes', 'Total Ingresos', 'Ingreso Promedio', 'Asientos Ocupados']
            titulo = 'Reporte de Viajes por Fecha'
        
        # Caso 2: Agrupado por origen
        elif 'origen' in agrupacion:
            datos = self._agrupar_viajes_por_origen(queryset, params)
            columnas = ['Origen', 'Cantidad de Viajes', 'Total Ingresos', 'Ingreso Promedio']
            titulo = 'Reporte de Viajes por Origen'
        
        # Caso 3: Agrupado por destino
        elif 'destino' in agrupacion:
            datos = self._agrupar_viajes_por_destino(queryset, params)
            columnas = ['Destino', 'Cantidad de Viajes', 'Total Ingresos', 'Ingreso Promedio']
            titulo = 'Reporte de Viajes por Destino'
        
        # Caso 4: Agrupado por vehículo
        elif 'vehiculo' in agrupacion:
            datos = self._agrupar_viajes_por_vehiculo(queryset, params)
            columnas = ['Vehículo', 'Placa', 'Cantidad de Viajes', 'Total Ingresos', 'Ingreso Promedio']
            titulo = 'Reporte de Viajes por Vehículo'
        
        # Caso 5: Agrupado por estado
        elif 'estado' in agrupacion:
            datos = self._agrupar_viajes_por_estado(queryset, params)
            columnas = ['Estado', 'Cantidad de Viajes', 'Total Ingresos']
            titulo = 'Reporte de Viajes por Estado'
        
        else:
            # Vista general
            datos = self._vista_general_viajes(queryset, params)
            columnas = ['ID', 'Origen', 'Destino', 'Fecha', 'Hora', 'Precio', 'Estado', 'Asientos Ocupados']
            titulo = 'Reporte General de Viajes'
        
        # Generar subtítulo con rango de fechas
        subtitulo = self._generar_subtitulo(params)
        
        return {
            'datos': datos,
            'columnas': columnas,
            'titulo': titulo,
            'subtitulo': subtitulo,
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _agrupar_viajes_por_fecha(self, queryset, params) -> List[Dict]:
        """Agrupar viajes por fecha"""
        viajes = queryset.annotate(
            fecha_viaje=TruncDate('fecha')
        ).values('fecha_viaje').annotate(
            cantidad_viajes=Count('id'),
            total_ingresos=Sum('precio'),
            ingreso_promedio=Avg('precio'),
            asientos_ocupados=Sum('asientos_ocupados')
        ).order_by('-fecha_viaje')
        
        return [
            {
                'fecha': viaje['fecha_viaje'].strftime('%d/%m/%Y') if viaje['fecha_viaje'] else '-',
                'cantidad_viajes': viaje['cantidad_viajes'],
                'total_ingresos': float(viaje['total_ingresos'] or 0),
                'ingreso_promedio': float(viaje['ingreso_promedio'] or 0),
                'asientos_ocupados': viaje['asientos_ocupados'] or 0
            }
            for viaje in viajes
        ]
    
    def _agrupar_viajes_por_origen(self, queryset, params) -> List[Dict]:
        """Agrupar viajes por origen"""
        viajes = queryset.values(
            'origen__nombre'
        ).annotate(
            cantidad_viajes=Count('id'),
            total_ingresos=Sum('precio'),
            ingreso_promedio=Avg('precio')
        ).order_by('-total_ingresos')
        
        return [
            {
                'origen': viaje['origen__nombre'] or 'Sin origen',
                'cantidad_viajes': viaje['cantidad_viajes'],
                'total_ingresos': float(viaje['total_ingresos'] or 0),
                'ingreso_promedio': float(viaje['ingreso_promedio'] or 0)
            }
            for viaje in viajes
        ]
    
    def _agrupar_viajes_por_destino(self, queryset, params) -> List[Dict]:
        """Agrupar viajes por destino"""
        viajes = queryset.values(
            'destino__nombre'
        ).annotate(
            cantidad_viajes=Count('id'),
            total_ingresos=Sum('precio'),
            ingreso_promedio=Avg('precio')
        ).order_by('-total_ingresos')
        
        return [
            {
                'destino': viaje['destino__nombre'] or 'Sin destino',
                'cantidad_viajes': viaje['cantidad_viajes'],
                'total_ingresos': float(viaje['total_ingresos'] or 0),
                'ingreso_promedio': float(viaje['ingreso_promedio'] or 0)
            }
            for viaje in viajes
        ]
    
    def _agrupar_viajes_por_vehiculo(self, queryset, params) -> List[Dict]:
        """Agrupar viajes por vehículo"""
        viajes = queryset.values(
            'vehiculo__nombre',
            'vehiculo__placa'
        ).annotate(
            cantidad_viajes=Count('id'),
            total_ingresos=Sum('precio'),
            ingreso_promedio=Avg('precio')
        ).order_by('-total_ingresos')
        
        return [
            {
                'vehiculo': viaje['vehiculo__nombre'] or 'Sin vehículo',
                'placa': viaje['vehiculo__placa'] or '-',
                'cantidad_viajes': viaje['cantidad_viajes'],
                'total_ingresos': float(viaje['total_ingresos'] or 0),
                'ingreso_promedio': float(viaje['ingreso_promedio'] or 0)
            }
            for viaje in viajes
        ]
    
    def _agrupar_viajes_por_estado(self, queryset, params) -> List[Dict]:
        """Agrupar viajes por estado"""
        viajes = queryset.values('estado').annotate(
            cantidad_viajes=Count('id'),
            total_ingresos=Sum('precio')
        ).order_by('-cantidad_viajes')
        
        return [
            {
                'estado': viaje['estado'],
                'cantidad_viajes': viaje['cantidad_viajes'],
                'total_ingresos': float(viaje['total_ingresos'] or 0)
            }
            for viaje in viajes
        ]
    
    def _vista_general_viajes(self, queryset, params) -> List[Dict]:
        """Vista general de viajes"""
        viajes = queryset.order_by('-fecha', '-hora')[:100]  # Límite de 100
        
        return [
            {
                'id': viaje.id,
                'origen': viaje.origen.nombre if viaje.origen else '-',
                'destino': viaje.destino.nombre if viaje.destino else '-',
                'fecha': viaje.fecha.strftime('%d/%m/%Y'),
                'hora': viaje.hora.strftime('%H:%M'),
                'precio': float(viaje.precio),
                'estado': viaje.get_estado_display(),
                'asientos_ocupados': viaje.asientos_ocupados
            }
            for viaje in viajes
        ]
    
    def _generar_reporte_encomiendas(self, params: Dict) -> Dict:
        """Generar reporte de encomiendas"""
        queryset = Encomienda.objects.select_related('conductor_asignado', 'pago')
        
        # Aplicar filtro de fechas
        if params.get('fecha_inicio'):
            fecha_inicio = params['fecha_inicio'].date() if isinstance(params['fecha_inicio'], datetime) else params['fecha_inicio']
            queryset = queryset.filter(fecha_creacion__gte=fecha_inicio)
        if params.get('fecha_fin'):
            fecha_fin = params['fecha_fin'].date() if isinstance(params['fecha_fin'], datetime) else params['fecha_fin']
            queryset = queryset.filter(fecha_creacion__lte=fecha_fin)
        
        agrupacion = params.get('agrupacion', [])
        
        if 'fecha' in agrupacion or not agrupacion:
            datos = self._agrupar_encomiendas_por_fecha(queryset, params)
            columnas = ['Fecha', 'Cantidad de Encomiendas', 'Total Ingresos', 'Ingreso Promedio', 'Peso Total']
            titulo = 'Reporte de Encomiendas por Fecha'
        elif 'estado' in agrupacion:
            datos = self._agrupar_encomiendas_por_estado(queryset, params)
            columnas = ['Estado', 'Cantidad de Encomiendas', 'Total Ingresos']
            titulo = 'Reporte de Encomiendas por Estado'
        elif 'ciudad' in agrupacion:
            datos = self._agrupar_encomiendas_por_ciudad(queryset, params)
            columnas = ['Ciudad Destino', 'Cantidad de Encomiendas', 'Total Ingresos', 'Peso Total']
            titulo = 'Reporte de Encomiendas por Ciudad'
        else:
            datos = self._vista_general_encomiendas(queryset, params)
            columnas = ['Código', 'Destinatario', 'Ciudad', 'Peso', 'Precio', 'Estado', 'Fecha Creación']
            titulo = 'Reporte General de Encomiendas'
        
        subtitulo = self._generar_subtitulo(params)
        
        return {
            'datos': datos,
            'columnas': columnas,
            'titulo': titulo,
            'subtitulo': subtitulo,
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _agrupar_encomiendas_por_fecha(self, queryset, params) -> List[Dict]:
        """Agrupar encomiendas por fecha"""
        encomiendas = queryset.annotate(
            fecha_creacion_date=TruncDate('fecha_creacion')
        ).values('fecha_creacion_date').annotate(
            cantidad_encomiendas=Count('id'),
            total_ingresos=Sum('precio'),
            ingreso_promedio=Avg('precio'),
            peso_total=Sum('peso')
        ).order_by('-fecha_creacion_date')
        
        return [
            {
                'fecha': encomienda['fecha_creacion_date'].strftime('%d/%m/%Y') if encomienda['fecha_creacion_date'] else '-',
                'cantidad_encomiendas': encomienda['cantidad_encomiendas'],
                'total_ingresos': float(encomienda['total_ingresos'] or 0),
                'ingreso_promedio': float(encomienda['ingreso_promedio'] or 0),
                'peso_total': float(encomienda['peso_total'] or 0)
            }
            for encomienda in encomiendas
        ]
    
    def _agrupar_encomiendas_por_estado(self, queryset, params) -> List[Dict]:
        """Agrupar encomiendas por estado"""
        encomiendas = queryset.values('estado').annotate(
            cantidad_encomiendas=Count('id'),
            total_ingresos=Sum('precio')
        ).order_by('-cantidad_encomiendas')
        
        return [
            {
                'estado': encomienda['estado'],
                'cantidad_encomiendas': encomienda['cantidad_encomiendas'],
                'total_ingresos': float(encomienda['total_ingresos'] or 0)
            }
            for encomienda in encomiendas
        ]
    
    def _agrupar_encomiendas_por_ciudad(self, queryset, params) -> List[Dict]:
        """Agrupar encomiendas por ciudad destino"""
        encomiendas = queryset.values('destino_ciudad').annotate(
            cantidad_encomiendas=Count('id'),
            total_ingresos=Sum('precio'),
            peso_total=Sum('peso')
        ).order_by('-cantidad_encomiendas')
        
        return [
            {
                'ciudad_destino': encomienda['destino_ciudad'] or 'Sin ciudad',
                'cantidad_encomiendas': encomienda['cantidad_encomiendas'],
                'total_ingresos': float(encomienda['total_ingresos'] or 0),
                'peso_total': float(encomienda['peso_total'] or 0)
            }
            for encomienda in encomiendas
        ]
    
    def _vista_general_encomiendas(self, queryset, params) -> List[Dict]:
        """Vista general de encomiendas"""
        encomiendas = queryset.order_by('-fecha_creacion')[:100]
        
        return [
            {
                'codigo': encomienda.codigo_seguimiento,
                'destinatario': encomienda.destinatario_nombre,
                'ciudad': encomienda.destino_ciudad,
                'peso': float(encomienda.peso),
                'precio': float(encomienda.precio),
                'estado': encomienda.get_estado_display(),
                'fecha_creacion': encomienda.fecha_creacion.strftime('%d/%m/%Y %H:%M')
            }
            for encomienda in encomiendas
        ]
    
    def _generar_reporte_conductores(self, params: Dict) -> Dict:
        """Generar reporte de conductores"""
        queryset = Conductor.objects.all()
        
        datos = [
            {
                'nombre_completo': f"{conductor.nombre} {conductor.apellido}".strip(),
                'nro_licencia': conductor.nro_licencia,
                'tipo_licencia': conductor.get_tipo_licencia_display(),
                'telefono': conductor.telefono,
                'email': conductor.email,
                'estado': conductor.get_estado_display(),
                'experiencia_anios': conductor.experiencia_anios,
                'fecha_venc_licencia': conductor.fecha_venc_licencia.strftime('%d/%m/%Y') if conductor.fecha_venc_licencia else '-'
            }
            for conductor in queryset
        ]
        
        return {
            'datos': datos,
            'columnas': ['Nombre Completo', 'Nro. Licencia', 'Tipo Licencia', 'Teléfono', 'Email', 'Estado', 'Experiencia (años)', 'Vencimiento Licencia'],
            'titulo': 'Reporte de Conductores',
            'subtitulo': self._generar_subtitulo(params),
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _generar_reporte_vehiculos(self, params: Dict) -> Dict:
        """Generar reporte de vehículos"""
        queryset = Vehiculo.objects.select_related('conductor')
        
        datos = [
            {
                'nombre': vehiculo.nombre,
                'placa': vehiculo.placa,
                'marca': vehiculo.marca or '-',
                'modelo': vehiculo.modelo or '-',
                'tipo_vehiculo': vehiculo.tipo_vehiculo,
                'capacidad_pasajeros': vehiculo.capacidad_pasajeros,
                'capacidad_carga': float(vehiculo.capacidad_carga),
                'estado': vehiculo.get_estado_display(),
                'conductor': f"{vehiculo.conductor.nombre} {vehiculo.conductor.apellido}".strip() if vehiculo.conductor else 'Sin conductor',
                'kilometraje': vehiculo.kilometraje
            }
            for vehiculo in queryset
        ]
        
        return {
            'datos': datos,
            'columnas': ['Nombre', 'Placa', 'Marca', 'Modelo', 'Tipo', 'Capacidad Pasajeros', 'Capacidad Carga (kg)', 'Estado', 'Conductor', 'Kilometraje'],
            'titulo': 'Reporte de Vehículos',
            'subtitulo': self._generar_subtitulo(params),
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _generar_reporte_financiero(self, params: Dict) -> Dict:
        """Generar reporte financiero (pagos)"""
        queryset = Pago.objects.select_related('usuario', 'reserva')
        
        # Aplicar filtro de fechas
        if params.get('fecha_inicio'):
            fecha_inicio = params['fecha_inicio'].date() if isinstance(params['fecha_inicio'], datetime) else params['fecha_inicio']
            queryset = queryset.filter(fecha_creacion__gte=fecha_inicio)
        if params.get('fecha_fin'):
            fecha_fin = params['fecha_fin'].date() if isinstance(params['fecha_fin'], datetime) else params['fecha_fin']
            queryset = queryset.filter(fecha_creacion__lte=fecha_fin)
        
        agrupacion = params.get('agrupacion', [])
        
        if 'fecha' in agrupacion or not agrupacion:
            datos = self._agrupar_pagos_por_fecha(queryset, params)
            columnas = ['Fecha', 'Cantidad de Pagos', 'Total Ingresos', 'Ingreso Promedio']
            titulo = 'Reporte Financiero por Fecha'
        elif 'metodo' in agrupacion or 'estado' in agrupacion:
            datos = self._agrupar_pagos_por_metodo(queryset, params)
            columnas = ['Método de Pago', 'Cantidad de Pagos', 'Total Ingresos']
            titulo = 'Reporte Financiero por Método de Pago'
        else:
            datos = self._vista_general_pagos(queryset, params)
            columnas = ['ID', 'Usuario', 'Monto', 'Método', 'Estado', 'Fecha']
            titulo = 'Reporte General Financiero'
        
        subtitulo = self._generar_subtitulo(params)
        
        return {
            'datos': datos,
            'columnas': columnas,
            'titulo': titulo,
            'subtitulo': subtitulo,
            'total_registros': len(datos),
            'parametros': params
        }
    
    def _agrupar_pagos_por_fecha(self, queryset, params) -> List[Dict]:
        """Agrupar pagos por fecha"""
        pagos = queryset.annotate(
            fecha_pago=TruncDate('fecha_creacion')
        ).values('fecha_pago').annotate(
            cantidad_pagos=Count('id'),
            total_ingresos=Sum('monto'),
            ingreso_promedio=Avg('monto')
        ).order_by('-fecha_pago')
        
        return [
            {
                'fecha': pago['fecha_pago'].strftime('%d/%m/%Y') if pago['fecha_pago'] else '-',
                'cantidad_pagos': pago['cantidad_pagos'],
                'total_ingresos': float(pago['total_ingresos'] or 0),
                'ingreso_promedio': float(pago['ingreso_promedio'] or 0)
            }
            for pago in pagos
        ]
    
    def _agrupar_pagos_por_metodo(self, queryset, params) -> List[Dict]:
        """Agrupar pagos por método"""
        pagos = queryset.values('metodo_pago').annotate(
            cantidad_pagos=Count('id'),
            total_ingresos=Sum('monto')
        ).order_by('-total_ingresos')
        
        return [
            {
                'metodo_pago': pago['metodo_pago'],
                'cantidad_pagos': pago['cantidad_pagos'],
                'total_ingresos': float(pago['total_ingresos'] or 0)
            }
            for pago in pagos
        ]
    
    def _vista_general_pagos(self, queryset, params) -> List[Dict]:
        """Vista general de pagos"""
        pagos = queryset.filter(estado='completado').order_by('-fecha_creacion')[:100]
        
        return [
            {
                'id': pago.id,
                'usuario': pago.usuario.username if pago.usuario else '-',
                'monto': float(pago.monto),
                'metodo': pago.get_metodo_pago_display(),
                'estado': pago.get_estado_display(),
                'fecha': pago.fecha_creacion.strftime('%d/%m/%Y %H:%M')
            }
            for pago in pagos
        ]
    
    def _generar_subtitulo(self, params: Dict) -> str:
        """Generar subtítulo con información del reporte"""
        partes = []
        
        if params.get('fecha_inicio') and params.get('fecha_fin'):
            fecha_inicio = params['fecha_inicio']
            fecha_fin = params['fecha_fin']
            if isinstance(fecha_inicio, datetime):
                fecha_inicio = fecha_inicio.date()
            if isinstance(fecha_fin, datetime):
                fecha_fin = fecha_fin.date()
            partes.append(f"Periodo: {fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}")
        elif params.get('fecha_inicio'):
            fecha_inicio = params['fecha_inicio']
            if isinstance(fecha_inicio, datetime):
                fecha_inicio = fecha_inicio.date()
            partes.append(f"Desde: {fecha_inicio.strftime('%d/%m/%Y')}")
        elif params.get('fecha_fin'):
            fecha_fin = params['fecha_fin']
            if isinstance(fecha_fin, datetime):
                fecha_fin = fecha_fin.date()
            partes.append(f"Hasta: {fecha_fin.strftime('%d/%m/%Y')}")
        
        if params.get('agrupacion'):
            agrupacion = ', '.join(params['agrupacion'])
            partes.append(f"Agrupado por: {agrupacion}")
        
        return ' | '.join(partes) if partes else f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}"

