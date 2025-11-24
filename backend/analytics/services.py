"""
Servicio de predicciones usando Random Forest
Predice demanda de viajes, ocupación de vehículos, ingresos, etc.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, Avg, Q
from viajes.models import Viaje, Reserva
from vehiculos.models import Vehiculo
from users.models import CustomUser
import logging

logger = logging.getLogger(__name__)


class PredictionService:
    """Servicio para generar predicciones usando Random Forest"""
    
    def __init__(self):
        self.demand_model = None
        self.occupancy_model = None
        self.revenue_model = None
        self._trained = False
    
    def prepare_travel_data(self, days_back=90):
        """
        Prepara datos históricos de viajes para entrenamiento
        """
        try:
            fecha_limite = timezone.now().date() - timedelta(days=days_back)
            
            viajes = Viaje.objects.filter(
                fecha__gte=fecha_limite
            ).select_related('origen', 'destino', 'vehiculo')
            
            data = []
            for viaje in viajes:
                # Obtener reservas confirmadas para este viaje
                reservas = Reserva.objects.filter(
                    viaje=viaje,
                    estado__in=['confirmada', 'pagada']
                ).count()
                
                # Calcular características
                data.append({
                    'fecha': viaje.fecha,
                    'dia_semana': viaje.fecha.weekday(),
                    'mes': viaje.fecha.month,
                    'hora': viaje.hora.hour,
                    'precio': float(viaje.precio),
                    'origen_id': viaje.origen_id,
                    'destino_id': viaje.destino_id,
                    'vehiculo_capacidad': viaje.vehiculo.capacidad_pasajeros,
                    'asientos_ocupados': viaje.asientos_ocupados,
                    'asientos_disponibles': viaje.asientos_disponibles,
                    'ocupacion': (viaje.asientos_ocupados / viaje.vehiculo.capacidad_pasajeros * 100) if viaje.vehiculo.capacidad_pasajeros > 0 else 0,
                    'reservas_confirmadas': reservas,
                    'ingresos': float(viaje.precio * viaje.asientos_ocupados),
                })
            
            if not data:
                logger.warning("No hay datos históricos suficientes para entrenar el modelo")
                return None
            
            df = pd.DataFrame(data)
            return df
            
        except Exception as e:
            logger.error(f"Error preparando datos de viajes: {e}")
            return None
    
    def train_demand_model(self, df):
        """
        Entrena modelo para predecir demanda de viajes
        """
        try:
            # Características para predecir demanda
            features = ['dia_semana', 'mes', 'hora', 'precio', 'origen_id', 'destino_id']
            X = df[features].fillna(0)
            y = df['reservas_confirmadas']
            
            # Dividir datos
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Entrenar modelo
            self.demand_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.demand_model.fit(X_train, y_train)
            
            # Evaluar
            y_pred = self.demand_model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"Modelo de demanda entrenado - MAE: {mae:.2f}, R2: {r2:.2f}")
            return True
            
        except Exception as e:
            logger.error(f"Error entrenando modelo de demanda: {e}")
            return False
    
    def train_occupancy_model(self, df):
        """
        Entrena modelo para predecir ocupación de vehículos
        """
        try:
            features = ['dia_semana', 'mes', 'hora', 'precio', 'origen_id', 'destino_id', 'vehiculo_capacidad']
            X = df[features].fillna(0)
            y = df['ocupacion']
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            self.occupancy_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.occupancy_model.fit(X_train, y_train)
            
            y_pred = self.occupancy_model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"Modelo de ocupación entrenado - MAE: {mae:.2f}, R2: {r2:.2f}")
            return True
            
        except Exception as e:
            logger.error(f"Error entrenando modelo de ocupación: {e}")
            return False
    
    def train_revenue_model(self, df):
        """
        Entrena modelo para predecir ingresos
        """
        try:
            features = ['dia_semana', 'mes', 'hora', 'precio', 'origen_id', 'destino_id', 'vehiculo_capacidad']
            X = df[features].fillna(0)
            y = df['ingresos']
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            self.revenue_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.revenue_model.fit(X_train, y_train)
            
            y_pred = self.revenue_model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"Modelo de ingresos entrenado - MAE: {mae:.2f}, R2: {r2:.2f}")
            return True
            
        except Exception as e:
            logger.error(f"Error entrenando modelo de ingresos: {e}")
            return False
    
    def train_all_models(self):
        """
        Entrena todos los modelos
        """
        df = self.prepare_travel_data()
        if df is None or len(df) < 10:
            logger.warning("Datos insuficientes para entrenar modelos")
            return False
        
        success = True
        success &= self.train_demand_model(df)
        success &= self.train_occupancy_model(df)
        success &= self.train_revenue_model(df)
        
        self._trained = success
        return success
    
    def predict_demand(self, fecha, hora, precio, origen_id, destino_id):
        """
        Predice demanda (número de reservas) para un viaje
        """
        if not self._trained or self.demand_model is None:
            if not self.train_all_models():
                return None
        
        try:
            features = np.array([[
                fecha.weekday(),
                fecha.month,
                hora.hour if hasattr(hora, 'hour') else int(hora),
                float(precio),
                origen_id,
                destino_id
            ]])
            
            prediction = self.demand_model.predict(features)[0]
            return max(0, int(prediction))
            
        except Exception as e:
            logger.error(f"Error prediciendo demanda: {e}")
            return None
    
    def predict_occupancy(self, fecha, hora, precio, origen_id, destino_id, capacidad):
        """
        Predice ocupación porcentual de un vehículo
        """
        if not self._trained or self.occupancy_model is None:
            if not self.train_all_models():
                return None
        
        try:
            features = np.array([[
                fecha.weekday(),
                fecha.month,
                hora.hour if hasattr(hora, 'hour') else int(hora),
                float(precio),
                origen_id,
                destino_id,
                capacidad
            ]])
            
            prediction = self.occupancy_model.predict(features)[0]
            return max(0, min(100, prediction))
            
        except Exception as e:
            logger.error(f"Error prediciendo ocupación: {e}")
            return None
    
    def predict_revenue(self, fecha, hora, precio, origen_id, destino_id, capacidad):
        """
        Predice ingresos para un viaje
        """
        if not self._trained or self.revenue_model is None:
            if not self.train_all_models():
                return None
        
        try:
            features = np.array([[
                fecha.weekday(),
                fecha.month,
                hora.hour if hasattr(hora, 'hour') else int(hora),
                float(precio),
                origen_id,
                destino_id,
                capacidad
            ]])
            
            prediction = self.revenue_model.predict(features)[0]
            return max(0, prediction)
            
        except Exception as e:
            logger.error(f"Error prediciendo ingresos: {e}")
            return None
    
    def get_historical_data(self, days=7):
        """
        Obtiene datos históricos agrupados por fecha
        Args:
            days: Número de días hacia atrás (7, 30, o 60)
        """
        try:
            # Validar días
            if days not in [7, 30, 60]:
                days = 7
            
            hoy = timezone.now().date()
            fecha_inicio = hoy - timedelta(days=days)
            
            # Obtener viajes históricos
            viajes = Viaje.objects.filter(
                fecha__gte=fecha_inicio,
                fecha__lt=hoy
            ).select_related('origen', 'destino', 'vehiculo')
            
            # Agrupar por fecha
            datos_por_fecha = {}
            
            for viaje in viajes:
                fecha_str = viaje.fecha.isoformat()
                
                if fecha_str not in datos_por_fecha:
                    datos_por_fecha[fecha_str] = {
                        'fecha': fecha_str,
                        'dia_semana': viaje.fecha.strftime('%A'),
                        'total_viajes': 0,
                        'viajes_completados': 0,
                        'demanda_real': 0,
                        'ocupacion_promedio': 0,
                        'ingresos_reales': 0,
                    }
                
                datos_por_fecha[fecha_str]['total_viajes'] += 1
                
                if viaje.estado == 'completado':
                    datos_por_fecha[fecha_str]['viajes_completados'] += 1
                
                # Demanda real = asientos ocupados
                demanda_real = viaje.asientos_ocupados or 0
                datos_por_fecha[fecha_str]['demanda_real'] += demanda_real
                
                # Ocupación
                if viaje.vehiculo and viaje.vehiculo.capacidad_pasajeros > 0:
                    ocupacion = (viaje.asientos_ocupados / viaje.vehiculo.capacidad_pasajeros) * 100
                    datos_por_fecha[fecha_str]['ocupacion_promedio'] += ocupacion
                
                # Ingresos reales
                ingresos = float(viaje.precio) * (viaje.asientos_ocupados or 0)
                datos_por_fecha[fecha_str]['ingresos_reales'] += ingresos
            
            # Calcular promedios y ordenar por fecha
            datos_historial = []
            for fecha_str in sorted(datos_por_fecha.keys()):
                datos = datos_por_fecha[fecha_str]
                if datos['total_viajes'] > 0:
                    datos['ocupacion_promedio'] = round(datos['ocupacion_promedio'] / datos['total_viajes'], 2)
                datos['ingresos_reales'] = round(datos['ingresos_reales'], 2)
                datos_historial.append(datos)
            
            return datos_historial
            
        except Exception as e:
            logger.error(f"Error obteniendo datos históricos: {e}")
            return []
    
    def get_dashboard_predictions(self, days=7):
        """
        Obtiene predicciones para el dashboard
        Args:
            days: Número de días a predecir (7, 30, o 60)
        """
        try:
            # Validar días
            if days not in [7, 30, 60]:
                days = 7
            
            # Obtener estadísticas actuales
            total_viajes = Viaje.objects.count()
            total_vehiculos = Vehiculo.objects.filter(estado='activo').count()
            total_conductores = CustomUser.objects.filter(conductor_id__isnull=False).count()
            total_usuarios = CustomUser.objects.count()
            
            # Intentar entrenar modelos si no están entrenados y hay suficientes datos
            if not self._trained and total_viajes >= 10:
                logger.info("Modelos no entrenados, intentando entrenar...")
                self.train_all_models()
            
            # Predicciones para los próximos N días
            hoy = timezone.now().date()
            predicciones_semana = []
            
            # Obtener promedios históricos para estimaciones cuando no hay viajes programados
            from django.db.models import Avg, Count
            viajes_historicos = Viaje.objects.filter(
                fecha__lt=hoy,
                fecha__gte=hoy - timedelta(days=60)
            ).select_related('vehiculo')
            
            # Calcular promedios históricos por día de la semana
            promedios_por_dia = {}
            dias_historicos = (hoy - (hoy - timedelta(days=60))).days
            semanas_historicas = max(1, dias_historicos / 7)
            
            for dia_semana in range(7):
                # Django usa 1=Lunes, 2=Martes, etc. Python usa 0=Lunes
                django_weekday = (dia_semana + 1) % 7 + 1
                viajes_dia_semana = viajes_historicos.filter(fecha__week_day=django_weekday)
                
                if viajes_dia_semana.exists():
                    total_ocupacion = 0
                    total_capacidad = 0
                    for viaje in viajes_dia_semana:
                        if viaje.vehiculo and viaje.vehiculo.capacidad_pasajeros > 0:
                            total_ocupacion += viaje.asientos_ocupados or 0
                            total_capacidad += viaje.vehiculo.capacidad_pasajeros
                    
                    promedio_ocupacion_pct = (total_ocupacion / total_capacidad * 100) if total_capacidad > 0 else 0
                    
                    promedios_por_dia[dia_semana] = {
                        'promedio_viajes': viajes_dia_semana.count() / semanas_historicas,
                        'promedio_ocupacion_pct': promedio_ocupacion_pct,
                        'promedio_asientos_ocupados': viajes_dia_semana.aggregate(
                            avg=Avg('asientos_ocupados')
                        )['avg'] or 0,
                    }
            
            # Precio promedio histórico
            precio_promedio = viajes_historicos.aggregate(Avg('precio'))['precio__avg'] or 50.0
            
            for i in range(days):
                fecha = hoy + timedelta(days=i)
                dia_semana = fecha.weekday()
                
                # Obtener viajes programados para este día
                viajes_dia = Viaje.objects.filter(fecha=fecha)
                
                demanda_total = 0
                ocupacion_promedio = 0
                ingresos_previstos = 0
                
                if viajes_dia.exists():
                    # Hay viajes programados, calcular predicciones para cada uno
                    for viaje in viajes_dia:
                        # Si los modelos no están entrenados, usar valores estimados basados en datos históricos
                        if not self._trained:
                            # Estimación simple basada en capacidad y precio
                            demanda = int(viaje.vehiculo.capacidad_pasajeros * 0.7)  # 70% de ocupación estimada
                            ocupacion = 70.0  # Ocupación promedio estimada
                            ingresos = float(viaje.precio * demanda)
                        else:
                            demanda = self.predict_demand(
                                viaje.fecha,
                                viaje.hora,
                                viaje.precio,
                                viaje.origen_id,
                                viaje.destino_id
                            ) or int(viaje.vehiculo.capacidad_pasajeros * 0.7)
                            
                            ocupacion = self.predict_occupancy(
                                viaje.fecha,
                                viaje.hora,
                                viaje.precio,
                                viaje.origen_id,
                                viaje.destino_id,
                                viaje.vehiculo.capacidad_pasajeros
                            ) or 70.0
                            
                            ingresos = self.predict_revenue(
                                viaje.fecha,
                                viaje.hora,
                                viaje.precio,
                                viaje.origen_id,
                                viaje.destino_id,
                                viaje.vehiculo.capacidad_pasajeros
                            ) or float(viaje.precio * demanda)
                        
                        demanda_total += demanda
                        ocupacion_promedio += ocupacion
                        ingresos_previstos += ingresos
                    
                    if viajes_dia.count() > 0:
                        ocupacion_promedio = ocupacion_promedio / viajes_dia.count()
                else:
                    # No hay viajes programados, usar promedios históricos para este día de la semana
                    if dia_semana in promedios_por_dia:
                        promedio = promedios_por_dia[dia_semana]
                        # Estimar basado en promedios históricos
                        # Usar promedio de asientos ocupados por viaje histórico
                        demanda_total = int(promedio['promedio_viajes'] * promedio['promedio_asientos_ocupados'])
                        ocupacion_promedio = promedio['promedio_ocupacion_pct'] if promedio['promedio_ocupacion_pct'] > 0 else 50.0
                        # Estimar ingresos basado en precio promedio histórico
                        ingresos_previstos = float(precio_promedio * demanda_total)
                    else:
                        # Si no hay datos históricos, usar valores por defecto conservadores
                        demanda_total = 0
                        ocupacion_promedio = 0.0
                        ingresos_previstos = 0.0
                
                predicciones_semana.append({
                    'fecha': fecha.isoformat(),
                    'dia_semana': fecha.strftime('%A'),
                    'viajes_programados': viajes_dia.count(),
                    'demanda_prevista': demanda_total,
                    'ocupacion_promedio': round(ocupacion_promedio, 2),
                    'ingresos_previstos': round(ingresos_previstos, 2)
                })
            
            # Predicciones de crecimiento
            viajes_ultimo_mes = Viaje.objects.filter(
                fecha__gte=hoy - timedelta(days=30)
            ).count()
            
            viajes_mes_anterior = Viaje.objects.filter(
                fecha__gte=hoy - timedelta(days=60),
                fecha__lt=hoy - timedelta(days=30)
            ).count()
            
            crecimiento_viajes = 0
            if viajes_mes_anterior > 0:
                crecimiento_viajes = ((viajes_ultimo_mes - viajes_mes_anterior) / viajes_mes_anterior) * 100
            
            return {
                'estadisticas_actuales': {
                    'total_viajes': total_viajes,
                    'total_vehiculos': total_vehiculos,
                    'total_conductores': total_conductores,
                    'total_usuarios': total_usuarios,
                },
                'predicciones_semana': predicciones_semana,
                'tendencias': {
                    'crecimiento_viajes': round(crecimiento_viajes, 2),
                    'viajes_ultimo_mes': viajes_ultimo_mes,
                    'viajes_mes_anterior': viajes_mes_anterior,
                },
                'modelo_entrenado': self._trained
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo predicciones del dashboard: {e}")
            return None


# Instancia global del servicio
prediction_service = PredictionService()

