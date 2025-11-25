"""
QueryBuilder: Servicio para construir consultas dinámicas de Django ORM.
Genera queries complejas con agrupaciones y agregaciones.
Adaptado para el sistema de transporte: viajes, encomiendas, conductores, vehículos, pagos
"""

from django.db.models import Sum, Count, Avg, Q, F, Min, Max
from django.db.models.functions import TruncDate, TruncMonth
from typing import Dict, Any, List
from viajes.models import Viaje
from encomiendas.models import Encomienda
from conductores.models import Conductor
from vehiculos.models import Vehiculo
from pagos.models import Pago


class QueryBuilder:
    """
    Servicio para construir consultas dinámicas de Django ORM.
    Evita SQL crudo y aprovecha el ORM para seguridad y mantenibilidad.
    """

    def construir_query_viajes(
        self, parametros: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Construye query para reporte de viajes.

        Args:
            parametros: Dict con 'periodo', 'agrupacion', 'filtros'

        Returns:
            List[Dict]: Lista de resultados con agregaciones
        """
        periodo = parametros.get("periodo", {})
        agrupacion = parametros.get("agrupacion", "fecha")
        filtros = parametros.get("filtros", {})

        # Query base: viajes en el período
        query = Viaje.objects.select_related('origen', 'destino', 'vehiculo')

        # Filtrar por período
        if periodo.get("inicio") and periodo.get("fin"):
            query = query.filter(fecha__range=[periodo["inicio"], periodo["fin"]])

        # Agrupar según parámetro
        if agrupacion == "origen":
            resultados = (
                query.values('origen__nombre')
                .annotate(
                    cantidad_viajes=Count('id'),
                    total_ingresos=Sum('precio'),
                    ingreso_promedio=Avg('precio')
                )
                .order_by('-total_ingresos')
            )
            
            resultados_list = [
                {
                    "origen": item['origen__nombre'] or 'Sin origen',
                    "cantidad_viajes": item['cantidad_viajes'],
                    "total_ingresos": float(item['total_ingresos'] or 0),
                    "ingreso_promedio": float(item['ingreso_promedio'] or 0)
                }
                for item in resultados
            ]

        elif agrupacion == "destino":
            resultados = (
                query.values('destino__nombre')
                .annotate(
                    cantidad_viajes=Count('id'),
                    total_ingresos=Sum('precio'),
                    ingreso_promedio=Avg('precio')
                )
                .order_by('-total_ingresos')
            )
            
            resultados_list = [
                {
                    "destino": item['destino__nombre'] or 'Sin destino',
                    "cantidad_viajes": item['cantidad_viajes'],
                    "total_ingresos": float(item['total_ingresos'] or 0),
                    "ingreso_promedio": float(item['ingreso_promedio'] or 0)
                }
                for item in resultados
            ]

        elif agrupacion == "vehiculo":
            resultados = (
                query.values('vehiculo__nombre', 'vehiculo__placa')
                .annotate(
                    cantidad_viajes=Count('id'),
                    total_ingresos=Sum('precio'),
                    ingreso_promedio=Avg('precio')
                )
                .order_by('-total_ingresos')
            )
            
            resultados_list = [
                {
                    "vehiculo": item['vehiculo__nombre'] or 'Sin vehículo',
                    "placa": item['vehiculo__placa'] or '-',
                    "cantidad_viajes": item['cantidad_viajes'],
                    "total_ingresos": float(item['total_ingresos'] or 0),
                    "ingreso_promedio": float(item['ingreso_promedio'] or 0)
                }
                for item in resultados
            ]

        elif agrupacion == "fecha" or not agrupacion:
            # Agrupar por fecha
            resultados = (
                query.annotate(fecha_viaje=TruncDate('fecha'))
                .values('fecha_viaje')
                .annotate(
                    cantidad_viajes=Count('id'),
                    total_ingresos=Sum('precio'),
                    ingreso_promedio=Avg('precio'),
                    asientos_ocupados=Sum('asientos_ocupados')
                )
                .order_by('-fecha_viaje')
            )

            resultados_list = [
                {
                    "fecha": item['fecha_viaje'].strftime('%d/%m/%Y') if item['fecha_viaje'] else '-',
                    "cantidad_viajes": item['cantidad_viajes'],
                    "total_ingresos": float(item['total_ingresos'] or 0),
                    "ingreso_promedio": float(item['ingreso_promedio'] or 0),
                    "asientos_ocupados": item['asientos_ocupados'] or 0
                }
                for item in resultados
            ]

        else:
            # Sin agrupación: totales generales
            totales = query.aggregate(
                total_ingresos=Sum('precio'),
                cantidad_viajes=Count('id'),
                ingreso_promedio=Avg('precio'),
            )

            resultados_list = [
                {
                    "total_ingresos": float(totales["total_ingresos"] or 0),
                    "cantidad_viajes": totales["cantidad_viajes"] or 0,
                    "ingreso_promedio": float(totales["ingreso_promedio"] or 0),
                }
            ]

        # Aplicar límite si existe
        if "limit" in filtros:
            resultados_list = resultados_list[: filtros["limit"]]

        return resultados_list

    def construir_query_encomiendas(
        self, parametros: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Construye query para reporte de encomiendas.

        Args:
            parametros: Dict con 'periodo', 'agrupacion', 'filtros'

        Returns:
            List[Dict]: Lista de resultados con agregaciones
        """
        periodo = parametros.get("periodo", {})
        agrupacion = parametros.get("agrupacion", "fecha")
        filtros = parametros.get("filtros", {})

        # Query base: encomiendas en el período
        query = Encomienda.objects.select_related('conductor_asignado', 'pago')

        # Filtrar por período
        if periodo.get("inicio") and periodo.get("fin"):
            query = query.filter(fecha_creacion__range=[periodo["inicio"], periodo["fin"]])

        # Agrupar según parámetro
        if agrupacion == "ciudad":
            resultados = (
                query.values('destino_ciudad')
                .annotate(
                    cantidad_encomiendas=Count('id'),
                    total_ingresos=Sum('precio'),
                    peso_total=Sum('peso')
                )
                .order_by('-cantidad_encomiendas')
            )
            
            resultados_list = [
                {
                    "ciudad_destino": item['destino_ciudad'] or 'Sin ciudad',
                    "cantidad_encomiendas": item['cantidad_encomiendas'],
                    "total_ingresos": float(item['total_ingresos'] or 0),
                    "peso_total": float(item['peso_total'] or 0)
                }
                for item in resultados
            ]

        elif agrupacion == "estado":
            resultados = (
                query.values('estado')
                .annotate(
                    cantidad_encomiendas=Count('id'),
                    total_ingresos=Sum('precio')
                )
                .order_by('-cantidad_encomiendas')
            )
            
            resultados_list = [
                {
                    "estado": item['estado'],
                    "cantidad_encomiendas": item['cantidad_encomiendas'],
                    "total_ingresos": float(item['total_ingresos'] or 0)
                }
                for item in resultados
            ]

        elif agrupacion == "fecha" or not agrupacion:
            # Agrupar por fecha
            resultados = (
                query.annotate(fecha_creacion_date=TruncDate('fecha_creacion'))
                .values('fecha_creacion_date')
                .annotate(
                    cantidad_encomiendas=Count('id'),
                    total_ingresos=Sum('precio'),
                    ingreso_promedio=Avg('precio'),
                    peso_total=Sum('peso')
                )
                .order_by('-fecha_creacion_date')
            )

            resultados_list = [
                {
                    "fecha": item['fecha_creacion_date'].strftime('%d/%m/%Y') if item['fecha_creacion_date'] else '-',
                    "cantidad_encomiendas": item['cantidad_encomiendas'],
                    "total_ingresos": float(item['total_ingresos'] or 0),
                    "ingreso_promedio": float(item['ingreso_promedio'] or 0),
                    "peso_total": float(item['peso_total'] or 0)
                }
                for item in resultados
            ]

        else:
            # Sin agrupación: totales generales
            totales = query.aggregate(
                total_ingresos=Sum('precio'),
                cantidad_encomiendas=Count('id'),
                ingreso_promedio=Avg('precio'),
            )

            resultados_list = [
                {
                    "total_ingresos": float(totales["total_ingresos"] or 0),
                    "cantidad_encomiendas": totales["cantidad_encomiendas"] or 0,
                    "ingreso_promedio": float(totales["ingreso_promedio"] or 0),
                }
            ]

        # Aplicar límite si existe
        if "limit" in filtros:
            resultados_list = resultados_list[: filtros["limit"]]

        return resultados_list

    def construir_query_pagos(
        self, parametros: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Construye query para reporte de pagos (financiero).

        Args:
            parametros: Dict con 'periodo', 'agrupacion', 'filtros'

        Returns:
            List[Dict]: Lista de resultados con agregaciones
        """
        periodo = parametros.get("periodo", {})
        agrupacion = parametros.get("agrupacion", "fecha")
        filtros = parametros.get("filtros", {})

        # Query base: pagos completados en el período
        query = Pago.objects.filter(estado='completado').select_related('usuario', 'reserva')

        # Filtrar por período
        if periodo.get("inicio") and periodo.get("fin"):
            query = query.filter(fecha_creacion__range=[periodo["inicio"], periodo["fin"]])

        # Agrupar según parámetro
        if agrupacion == "metodo" or agrupacion == "estado":
            resultados = (
                query.values('metodo_pago')
                .annotate(
                    cantidad_pagos=Count('id'),
                    total_ingresos=Sum('monto')
                )
                .order_by('-total_ingresos')
            )
            
            resultados_list = [
                {
                    "metodo_pago": item['metodo_pago'],
                    "cantidad_pagos": item['cantidad_pagos'],
                    "total_ingresos": float(item['total_ingresos'] or 0)
                }
                for item in resultados
            ]

        elif agrupacion == "fecha" or not agrupacion:
            # Agrupar por fecha
            resultados = (
                query.annotate(fecha_pago=TruncDate('fecha_creacion'))
                .values('fecha_pago')
                .annotate(
                    cantidad_pagos=Count('id'),
                    total_ingresos=Sum('monto'),
                    ingreso_promedio=Avg('monto')
                )
                .order_by('-fecha_pago')
            )

            resultados_list = [
                {
                    "fecha": item['fecha_pago'].strftime('%d/%m/%Y') if item['fecha_pago'] else '-',
                    "cantidad_pagos": item['cantidad_pagos'],
                    "total_ingresos": float(item['total_ingresos'] or 0),
                    "ingreso_promedio": float(item['ingreso_promedio'] or 0)
                }
                for item in resultados
            ]

        else:
            # Sin agrupación: totales generales
            totales = query.aggregate(
                total_ingresos=Sum('monto'),
                cantidad_pagos=Count('id'),
                ingreso_promedio=Avg('monto'),
            )

            resultados_list = [
                {
                    "total_ingresos": float(totales["total_ingresos"] or 0),
                    "cantidad_pagos": totales["cantidad_pagos"] or 0,
                    "ingreso_promedio": float(totales["ingreso_promedio"] or 0),
                }
            ]

        # Aplicar límite si existe
        if "limit" in filtros:
            resultados_list = resultados_list[: filtros["limit"]]

        return resultados_list

