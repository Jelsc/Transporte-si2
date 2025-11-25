"""
Solver VRP (Vehicle Routing Problem) usando OR-Tools
Implementa VRP con ventanas de tiempo (PDPTW) y restricciones de capacidad
"""

import logging
from typing import List, Dict, Tuple, Optional
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from decimal import Decimal

logger = logging.getLogger(__name__)


class VRPSolver:
    """Solver VRP usando OR-Tools"""
    
    def __init__(self):
        """Inicializar solver VRP"""
        self.manager = None
        self.routing = None
        self.solution = None
    
    def resolver_vrp_basico(
        self,
        matriz_distancias: List[List[float]],
        matriz_tiempos: List[List[float]],
        demandas: List[int],
        capacidades_vehiculos: List[int],
        depot_inicio: int = 0,
        depot_fin: int = None
    ) -> Dict:
        """
        Resolver VRP básico con restricciones de capacidad
        
        Args:
            matriz_distancias: Matriz de distancias entre nodos (puede incluir nodos no visitables para cálculo)
            matriz_tiempos: Matriz de tiempos entre nodos
            demandas: Lista de demandas de cada nodo VISITABLE
            capacidades_vehiculos: Lista de capacidades de cada vehículo
            depot_inicio: Índice del nodo depot de inicio
            depot_fin: Índice del nodo depot de fin (puede estar fuera de nodos visitables)
            
        Returns:
            Dict con la solución del VRP
        """
        # Si no se especifica depot_fin, usar el mismo que depot_inicio
        if depot_fin is None:
            depot_fin = depot_inicio
        
        # IMPORTANTE: num_nodos es el número de nodos VISITABLES (len(demandas))
        # No confundir con el tamaño de la matriz de distancias
        num_nodos = len(demandas)
        num_vehiculos = len(capacidades_vehiculos)
        
        # Validar que hay suficientes nodos para crear una ruta
        if num_nodos < 3:
            raise ValueError(
                f"Se necesitan al menos 3 ubicaciones (depot + 2 entregas) para optimizar rutas. "
                f"Actualmente hay {num_nodos} ubicaciones (incluyendo depot)."
            )
        
        # Para casos triviales (pocas entregas), generar solución simple
        if num_nodos <= 3 and num_vehiculos > 0:
            logger.info(f"Caso trivial detectado: {num_nodos} nodos, {num_vehiculos} vehículos")
            return self._resolver_caso_trivial(
                matriz_distancias, matriz_tiempos, demandas, 
                capacidades_vehiculos, depot_inicio, depot_fin
            )
        
        # Crear listas de starts y ends para cada vehículo
        starts = [depot_inicio] * num_vehiculos
        ends = [depot_fin] * num_vehiculos
        
        logger.info(f"OR-Tools VRP BÁSICO - setup: starts={starts}, ends={ends}, num_nodos={num_nodos}")
        logger.info(f"  - demandas: {demandas}")
        logger.info(f"  - capacidades: {capacidades_vehiculos}")
        
        # Crear manager con starts y ends diferentes
        self.manager = pywrapcp.RoutingIndexManager(
            num_nodos, num_vehiculos, starts, ends
        )
        
        # Crear routing model
        self.routing = pywrapcp.RoutingModel(self.manager)
        
        # Callback para distancias
        def distancia_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return int(matriz_distancias[from_node][to_node])
        
        # Callback para tiempos
        def tiempo_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return int(matriz_tiempos[from_node][to_node])
        
        # Registrar callbacks
        distancia_callback_index = self.routing.RegisterTransitCallback(distancia_callback)
        tiempo_callback_index = self.routing.RegisterTransitCallback(tiempo_callback)
        
        # Configurar costos de arco
        self.routing.SetArcCostEvaluatorOfAllVehicles(distancia_callback_index)
        
        # Agregar dimensión de tiempo
        self.routing.AddDimension(
            tiempo_callback_index,
            3600,  # Tiempo slack de 60 minutos (más flexible)
            36000,  # Tiempo máximo por vehículo (10 horas - más generoso)
            False,  # No empezar acumulando
            'Tiempo'
        )
        
        # Agregar dimensión de capacidad
        def demanda_callback(from_index):
            from_node = self.manager.IndexToNode(from_index)
            return demandas[from_node]
        
        demanda_callback_index = self.routing.RegisterUnaryTransitCallback(demanda_callback)
        
        self.routing.AddDimensionWithVehicleCapacity(
            demanda_callback_index,
            0,  # Sin capacidad slack
            capacidades_vehiculos,  # Capacidades por vehículo
            True,  # Empezar acumulando
            'Capacidad'
        )
        
        # Parámetros de búsqueda
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        
        # Probar múltiples estrategias de primera solución
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.AUTOMATIC
        )
        
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = 30  # 30 segundos de límite
        
        # Configuración adicional para mejorar probabilidad de encontrar solución
        search_parameters.log_search = True
        
        # Permitir que algunos nodos queden sin visitar si no hay solución
        # IMPORTANTE: No marcar depot_inicio ni depot_fin como opcionales
        penalty = 10000  # Penalidad por no visitar un nodo
        for node in range(1, num_nodos):
            # Si el nodo es depot_fin y es diferente de depot_inicio, no hacerlo opcional
            if node == depot_fin and depot_fin != depot_inicio:
                continue
            # Solo marcar entregas como opcionales (nodos que no son depósitos)
            self.routing.AddDisjunction([self.manager.NodeToIndex(node)], penalty)
        
        # Resolver
        self.solution = self.routing.SolveWithParameters(search_parameters)
        
        if not self.solution:
            logger.error(f"OR-Tools no encontró solución. Parámetros:")
            logger.error(f"  - num_nodos: {num_nodos}")
            logger.error(f"  - num_vehiculos: {num_vehiculos}")
            logger.error(f"  - depot_inicio: {depot_inicio}, depot_fin: {depot_fin}")
            logger.error(f"  - demandas: {demandas}")
            logger.error(f"  - capacidades: {capacidades_vehiculos}")
            raise Exception("No se encontró solución para el VRP")
        
        # Procesar solución
        return self._procesar_solucion(
            num_vehiculos, depot_inicio, depot_fin, matriz_distancias, matriz_tiempos
        )
    
    def resolver_vrp_con_ventanas_tiempo(
        self,
        matriz_distancias: List[List[float]],
        matriz_tiempos: List[List[float]],
        demandas: List[int],
        capacidades_vehiculos: List[int],
        ventanas_tiempo: List[Tuple[float, float]],  # (inicio, fin) en minutos
        tiempos_servicio: List[int],  # Tiempo de servicio en cada nodo
        depot_inicio: int = 0,
        depot_fin: int = None
    ) -> Dict:
        """
        Resolver VRP con ventanas de tiempo (PDPTW)
        
        Args:
            matriz_distancias: Matriz de distancias entre nodos
            matriz_tiempos: Matriz de tiempos entre nodos
            demandas: Lista de demandas de cada nodo
            capacidades_vehiculos: Lista de capacidades de cada vehículo
            ventanas_tiempo: Lista de tuplas (inicio, fin) para ventanas de tiempo
            tiempos_servicio: Lista de tiempos de servicio en cada nodo
            depot_inicio: Índice del nodo depot de inicio
            depot_fin: Índice del nodo depot de fin (si es None, usa depot_inicio)
            
        Returns:
            Dict con la solución del VRP con ventanas de tiempo
        """
        # Si no se especifica depot_fin, usar el mismo que depot_inicio
        if depot_fin is None:
            depot_fin = depot_inicio
            
        # IMPORTANTE: num_nodos es el número de nodos VISITABLES (len(demandas))
        num_nodos = len(demandas)
        num_vehiculos = len(capacidades_vehiculos)
        
        # Validar que hay suficientes nodos para crear una ruta
        if num_nodos < 3:
            raise ValueError(
                f"Se necesitan al menos 3 ubicaciones (depot + 2 entregas) para optimizar rutas. "
                f"Actualmente hay {num_nodos} ubicaciones (incluyendo depot)."
            )
        
        # Si hay pocos nodos (3 o menos entregas), usar resolver trivial
        # para evitar problemas con OR-Tools
        if num_nodos <= 3:
            logger.info(f"Usando resolver trivial para {num_nodos} nodos (con ventanas de tiempo)")
            return self._resolver_caso_trivial(
                matriz_distancias, matriz_tiempos, demandas, 
                capacidades_vehiculos, depot_inicio, depot_fin
            )
        
        # Crear listas de starts y ends para cada vehículo
        starts = [depot_inicio] * num_vehiculos
        ends = [depot_fin] * num_vehiculos
        
        # Crear manager con starts y ends diferentes
        self.manager = pywrapcp.RoutingIndexManager(
            num_nodos, num_vehiculos, starts, ends
        )
        
        # Crear routing model
        self.routing = pywrapcp.RoutingModel(self.manager)
        
        # Callbacks
        def distancia_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return int(matriz_distancias[from_node][to_node])
        
        def tiempo_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return int(matriz_tiempos[from_node][to_node]) + tiempos_servicio[from_node]
        
        # Registrar callbacks
        distancia_callback_index = self.routing.RegisterTransitCallback(distancia_callback)
        tiempo_callback_index = self.routing.RegisterTransitCallback(tiempo_callback)
        
        # Configurar costos
        self.routing.SetArcCostEvaluatorOfAllVehicles(distancia_callback_index)
        
        # Dimensión de tiempo con ventanas
        self.routing.AddDimension(
            tiempo_callback_index,
            3600,  # Tiempo slack de 60 minutos (permite cierta flexibilidad)
            36000,  # Tiempo máximo (10 horas)
            False,  # No empezar acumulando
            'Tiempo'
        )
        
        # Configurar ventanas de tiempo
        time_dimension = self.routing.GetDimensionOrDie('Tiempo')
        
        for node_idx in range(num_nodos):
            if node_idx == depot_inicio or node_idx == depot_fin:
                # Depots: ventana amplia
                time_dimension.CumulVar(self.manager.NodeToIndex(node_idx)).SetRange(
                    0, 36000
                )
            else:
                # Otros nodos: ventanas específicas (con algo de flexibilidad)
                inicio, fin = ventanas_tiempo[node_idx]
                # Ampliar ventanas ligeramente para mayor flexibilidad
                inicio_flexible = max(0, int(inicio) - 30)  # 30 min antes
                fin_flexible = min(36000, int(fin) + 30)  # 30 min después
                time_dimension.CumulVar(self.manager.NodeToIndex(node_idx)).SetRange(
                    inicio_flexible, fin_flexible
                )
        
        # Dimensión de capacidad
        def demanda_callback(from_index):
            from_node = self.manager.IndexToNode(from_index)
            return demandas[from_node]
        
        demanda_callback_index = self.routing.RegisterUnaryTransitCallback(demanda_callback)
        
        self.routing.AddDimensionWithVehicleCapacity(
            demanda_callback_index,
            0,
            capacidades_vehiculos,
            True,
            'Capacidad'
        )
        
        # Parámetros de búsqueda
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        
        # Probar múltiples estrategias automáticamente
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.AUTOMATIC
        )
        
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = 60  # 1 minuto para PDPTW
        
        # Configuración adicional para mejorar probabilidad de encontrar solución
        search_parameters.log_search = True
        
        # Permitir que algunos nodos queden sin visitar si no hay solución
        # IMPORTANTE: No marcar depot_inicio ni depot_fin como opcionales
        penalty = 10000  # Penalidad por no visitar un nodo
        for node in range(1, num_nodos):
            # Si el nodo es depot_fin y es diferente de depot_inicio, no hacerlo opcional
            if node == depot_fin and depot_fin != depot_inicio:
                continue
            # Solo marcar entregas como opcionales (nodos que no son depósitos)
            self.routing.AddDisjunction([self.manager.NodeToIndex(node)], penalty)
        
        # Resolver
        self.solution = self.routing.SolveWithParameters(search_parameters)
        
        if not self.solution:
            raise Exception("No se encontró solución para el VRP con ventanas de tiempo")
        
        return self._procesar_solucion(
            num_vehiculos, depot_inicio, depot_fin, matriz_distancias, matriz_tiempos, 
            ventanas_tiempo, tiempos_servicio
        )
    
    def _procesar_solucion(
        self,
        num_vehiculos: int,
        depot_inicio: int,
        depot_fin: int,
        matriz_distancias: List[List[float]],
        matriz_tiempos: List[List[float]],
        ventanas_tiempo: Optional[List[Tuple[float, float]]] = None,
        tiempos_servicio: Optional[List[int]] = None
    ) -> Dict:
        """
        Procesar la solución encontrada por OR-Tools
        
        Args:
            depot_inicio: Índice del nodo de inicio
            depot_fin: Índice del nodo de regreso
            
        Returns:
            Dict con rutas procesadas
        """
        rutas = []
        tiempo_total = 0
        distancia_total = 0
        
        for vehiculo_id in range(num_vehiculos):
            ruta = []
            tiempo_vehiculo = 0
            distancia_vehiculo = 0
            
            index = self.routing.Start(vehiculo_id)
            
            while not self.routing.IsEnd(index):
                node = self.manager.IndexToNode(index)
                ruta.append(node)
                
                # Obtener tiempo de llegada
                time_dimension = self.routing.GetDimensionOrDie('Tiempo')
                tiempo_llegada = self.solution.Value(time_dimension.CumulVar(index))
                
                # Obtener el siguiente índice usando la solución
                siguiente_index = self.solution.Value(self.routing.NextVar(index))
                
                # Calcular distancia al siguiente nodo
                if not self.routing.IsEnd(siguiente_index):
                    siguiente_node = self.manager.IndexToNode(siguiente_index)
                    distancia_vehiculo += matriz_distancias[node][siguiente_node]
                    tiempo_vehiculo += matriz_tiempos[node][siguiente_node]
                
                index = siguiente_index
            
            # Agregar nodo final (depot de regreso)
            ruta.append(depot_fin)
            
            # Convertir a unidades correctas
            # OSRM devuelve distancias en METROS y tiempos en SEGUNDOS
            distancia_km = distancia_vehiculo / 1000.0  # Metros a kilómetros
            tiempo_min = tiempo_vehiculo / 60.0  # Segundos a minutos
            
            rutas.append({
                'vehiculo_id': vehiculo_id,
                'ruta': ruta,
                'distancia_total': distancia_km,
                'tiempo_total': tiempo_min,
                'numero_paradas': len(ruta) - 2  # Excluyendo depot inicio y fin
            })
            
            tiempo_total += tiempo_min
            distancia_total += distancia_km
        
        return {
            'rutas': rutas,
            'distancia_total': distancia_total,
            'tiempo_total': tiempo_total,
            'numero_vehiculos_utilizados': len([r for r in rutas if len(r['ruta']) > 2]),
            'solucion_valida': True,
            'depot_inicio': depot_inicio,
            'depot_fin': depot_fin
        }
    
    def resolver_pdptw(
        self,
        pickup_delivery_pairs: List[Tuple[int, int]],  # (pickup, delivery)
        matriz_distancias: List[List[float]],
        matriz_tiempos: List[List[float]],
        capacidades_vehiculos: List[int],
        depot: int = 0
    ) -> Dict:
        """
        Resolver PDPTW (Pickup and Delivery Problem with Time Windows)
        
        Args:
            pickup_delivery_pairs: Lista de tuplas (pickup_index, delivery_index)
            matriz_distancias: Matriz de distancias
            matriz_tiempos: Matriz de tiempos
            capacidades_vehiculos: Capacidades de vehículos
            depot: Índice del depot
            
        Returns:
            Dict con la solución PDPTW
        """
        num_nodos = len(matriz_distancias)
        num_vehiculos = len(capacidades_vehiculos)
        
        # Crear manager
        self.manager = pywrapcp.RoutingIndexManager(
            num_nodos, num_vehiculos, depot
        )
        
        # Crear routing model
        self.routing = pywrapcp.RoutingModel(self.manager)
        
        # Callbacks
        def distancia_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return int(matriz_distancias[from_node][to_node])
        
        def tiempo_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return int(matriz_tiempos[from_node][to_index])
        
        # Registrar callbacks
        distancia_callback_index = self.routing.RegisterTransitCallback(distancia_callback)
        tiempo_callback_index = self.routing.RegisterTransitCallback(tiempo_callback)
        
        # Configurar costos
        self.routing.SetArcCostEvaluatorOfAllVehicles(distancia_callback_index)
        
        # Dimensión de tiempo
        self.routing.AddDimension(
            tiempo_callback_index,
            0,
            30000,
            False,
            'Tiempo'
        )
        
        # Agregar restricciones pickup-delivery
        for pickup_idx, delivery_idx in pickup_delivery_pairs:
            pickup_index = self.manager.NodeToIndex(pickup_idx)
            delivery_index = self.manager.NodeToIndex(delivery_idx)
            
            # Pickup debe ser antes que delivery
            self.routing.AddPickupAndDelivery(pickup_index, delivery_index)
            
            # Mismo vehículo para pickup y delivery
            self.routing.solver().Add(
                self.routing.VehicleVar(pickup_index) == self.routing.VehicleVar(delivery_index)
            )
        
        # Parámetros de búsqueda
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = 90  # 1.5 minutos para PDPTW
        
        # Resolver
        self.solution = self.routing.SolveWithParameters(search_parameters)
        
        if not self.solution:
            raise Exception("No se encontró solución para el PDPTW")
        
        return self._procesar_solucion(
            num_vehiculos, depot, depot, matriz_distancias, matriz_tiempos
        )
    
    def _resolver_caso_trivial(
        self,
        matriz_distancias: List[List[float]],
        matriz_tiempos: List[List[float]],
        demandas: List[int],
        capacidades_vehiculos: List[int],
        depot_inicio: int = 0,
        depot_fin: int = None
    ) -> Dict:
        """
        Resolver casos triviales con pocos nodos (solución greedy simple)
        
        Para casos con 2-3 nodos, generar una solución simple:
        - Depot Inicio -> Nodo 1 -> Nodo 2 -> ... -> Depot Fin
        """
        # Si no se especifica depot_fin, usar el mismo que depot_inicio
        if depot_fin is None:
            depot_fin = depot_inicio
            
        # IMPORTANTE: num_nodos es el número de nodos VISITABLES (len(demandas))
        num_nodos = len(demandas)
        num_vehiculos = len(capacidades_vehiculos)
        
        logger.info(f"Generando solución trivial para {num_nodos} nodos visitables (depot_inicio={depot_inicio}, depot_fin={depot_fin})")
        
        # Crear una ruta simple: visitar todos los nodos en orden
        rutas = []
        
        # Excluir depósitos de la lista de nodos a visitar
        nodos_a_visitar = [i for i in range(num_nodos) if i != depot_inicio and i != depot_fin]
        
        # Calcular demanda total (excluyendo depots)
        demanda_total = sum(demandas[i] for i in nodos_a_visitar)
        
        # Usar el primer vehículo que tenga capacidad suficiente
        vehiculo_idx = 0
        for i, capacidad in enumerate(capacidades_vehiculos):
            if capacidad >= demanda_total:
                vehiculo_idx = i
                break
        
        # Construir ruta: depot_inicio -> todos los nodos -> depot_fin
        ruta = [depot_inicio] + nodos_a_visitar + [depot_fin]
        
        # Calcular distancia y tiempo total
        distancia_total = 0.0
        tiempo_total = 0.0
        
        for i in range(len(ruta) - 1):
            from_node = ruta[i]
            to_node = ruta[i + 1]
            distancia_total += matriz_distancias[from_node][to_node]
            tiempo_total += matriz_tiempos[from_node][to_node]
        
        # Convertir a unidades correctas
        # OSRM devuelve distancias en METROS y tiempos en SEGUNDOS
        distancia_km = distancia_total / 1000.0  # Metros a kilómetros
        tiempo_min = tiempo_total / 60.0  # Segundos a minutos
        
        # Crear solución en el formato esperado (lista de diccionarios)
        solucion = {
            'rutas': [{
                'vehiculo_id': vehiculo_idx,
                'ruta': ruta,
                'distancia_total': distancia_km,
                'tiempo_total': tiempo_min,
                'numero_paradas': len(ruta) - 2  # Excluir depot inicio y fin
            }],
            'distancia_total': distancia_km,
            'tiempo_total': tiempo_min,
            'numero_vehiculos_utilizados': 1,
            'solucion_valida': True,
            'depot_inicio': depot_inicio,
            'depot_fin': depot_fin
        }
        
        logger.info(f"Solución trivial generada: ruta = {ruta}, distancia = {distancia_km:.2f} km, tiempo = {tiempo_min:.2f} min")
        
        return solucion


# Instancia global del solver
vrp_solver = VRPSolver()
