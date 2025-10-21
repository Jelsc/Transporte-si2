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
        depot: int = 0
    ) -> Dict:
        """
        Resolver VRP básico con restricciones de capacidad
        
        Args:
            matriz_distancias: Matriz de distancias entre nodos
            matriz_tiempos: Matriz de tiempos entre nodos
            demandas: Lista de demandas de cada nodo
            capacidades_vehiculos: Lista de capacidades de cada vehículo
            depot: Índice del nodo depot (por defecto 0)
            
        Returns:
            Dict con la solución del VRP
        """
        num_nodos = len(matriz_distancias)
        num_vehiculos = len(capacidades_vehiculos)
        
        if num_nodos < 2:
            raise ValueError("Se necesitan al menos 2 nodos")
        
        # Crear manager
        self.manager = pywrapcp.RoutingIndexManager(
            num_nodos, num_vehiculos, depot
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
            0,  # Sin tiempo slack
            30000,  # Tiempo máximo por vehículo (8.33 horas)
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
        
        # Configurar parámetros de búsqueda
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = 30  # 30 segundos de límite
        
        # Resolver
        self.solution = self.routing.SolveWithParameters(search_parameters)
        
        if not self.solution:
            raise Exception("No se encontró solución para el VRP")
        
        # Procesar solución
        return self._procesar_solucion(
            num_vehiculos, depot, matriz_distancias, matriz_tiempos
        )
    
    def resolver_vrp_con_ventanas_tiempo(
        self,
        matriz_distancias: List[List[float]],
        matriz_tiempos: List[List[float]],
        demandas: List[int],
        capacidades_vehiculos: List[int],
        ventanas_tiempo: List[Tuple[float, float]],  # (inicio, fin) en minutos
        tiempos_servicio: List[int],  # Tiempo de servicio en cada nodo
        depot: int = 0
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
            depot: Índice del nodo depot
            
        Returns:
            Dict con la solución del VRP con ventanas de tiempo
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
            return int(matriz_tiempos[from_node][to_node]) + tiempos_servicio[from_node]
        
        # Registrar callbacks
        distancia_callback_index = self.routing.RegisterTransitCallback(distancia_callback)
        tiempo_callback_index = self.routing.RegisterTransitCallback(tiempo_callback)
        
        # Configurar costos
        self.routing.SetArcCostEvaluatorOfAllVehicles(distancia_callback_index)
        
        # Dimensión de tiempo con ventanas
        self.routing.AddDimension(
            tiempo_callback_index,
            0,  # Sin tiempo slack
            30000,  # Tiempo máximo
            False,  # No empezar acumulando
            'Tiempo'
        )
        
        # Configurar ventanas de tiempo
        time_dimension = self.routing.GetDimensionOrDie('Tiempo')
        
        for node_idx in range(num_nodos):
            if node_idx == depot:
                # Depot: ventana amplia
                time_dimension.CumulVar(self.manager.NodeToIndex(node_idx)).SetRange(
                    0, 30000
                )
            else:
                # Otros nodos: ventanas específicas
                inicio, fin = ventanas_tiempo[node_idx]
                time_dimension.CumulVar(self.manager.NodeToIndex(node_idx)).SetRange(
                    int(inicio), int(fin)
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
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = 60  # 1 minuto para PDPTW
        
        # Resolver
        self.solution = self.routing.SolveWithParameters(search_parameters)
        
        if not self.solution:
            raise Exception("No se encontró solución para el VRP con ventanas de tiempo")
        
        return self._procesar_solucion(
            num_vehiculos, depot, matriz_distancias, matriz_tiempos, 
            ventanas_tiempo, tiempos_servicio
        )
    
    def _procesar_solucion(
        self,
        num_vehiculos: int,
        depot: int,
        matriz_distancias: List[List[float]],
        matriz_tiempos: List[List[float]],
        ventanas_tiempo: Optional[List[Tuple[float, float]]] = None,
        tiempos_servicio: Optional[List[int]] = None
    ) -> Dict:
        """
        Procesar la solución encontrada por OR-Tools
        
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
                
                # Calcular distancia al siguiente nodo
                if not self.routing.IsEnd(self.routing.NextVar(index).Value()):
                    siguiente_index = self.routing.NextVar(index).Value()
                    siguiente_node = self.manager.IndexToNode(siguiente_index)
                    distancia_vehiculo += matriz_distancias[node][siguiente_node]
                    tiempo_vehiculo += matriz_tiempos[node][siguiente_node]
                
                index = self.routing.NextVar(index).Value()
            
            # Agregar nodo final (depot)
            ruta.append(depot)
            
            rutas.append({
                'vehiculo_id': vehiculo_id,
                'ruta': ruta,
                'distancia_total': distancia_vehiculo,
                'tiempo_total': tiempo_vehiculo,
                'numero_paradas': len(ruta) - 2  # Excluyendo depot inicio y fin
            })
            
            tiempo_total += tiempo_vehiculo
            distancia_total += distancia_vehiculo
        
        return {
            'rutas': rutas,
            'distancia_total': distancia_total,
            'tiempo_total': tiempo_total,
            'numero_vehiculos_utilizados': len([r for r in rutas if len(r['ruta']) > 2]),
            'solucion_valida': True
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
            num_vehiculos, depot, matriz_distancias, matriz_tiempos
        )


# Instancia global del solver
vrp_solver = VRPSolver()
