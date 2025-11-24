"""
Vistas para el módulo de analytics y predicciones
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .services import prediction_service
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_predictions(request):
    """
    Obtiene predicciones y estadísticas para el dashboard
    GET /api/analytics/dashboard-predictions/?days=7|30|60
    """
    try:
        # Obtener parámetro de días (7, 30, o 60)
        days_param = request.query_params.get('days', '7')
        try:
            days = int(days_param)
            if days not in [7, 30, 60]:
                days = 7
        except (ValueError, TypeError):
            days = 7
        
        predictions = prediction_service.get_dashboard_predictions(days=days)
        
        if predictions is None:
            return Response(
                {'error': 'No se pudieron generar las predicciones'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'success': True,
            'data': predictions
        })
        
    except Exception as e:
        logger.error(f"Error en dashboard_predictions: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_models(request):
    """
    Entrena los modelos de predicción
    POST /api/analytics/train-models/
    """
    try:
        success = prediction_service.train_all_models()
        
        if success:
            return Response({
                'success': True,
                'message': 'Modelos entrenados exitosamente'
            })
        else:
            return Response(
                {'error': 'No se pudieron entrenar los modelos. Verifique que haya suficientes datos históricos.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error entrenando modelos: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historical_data(request):
    """
    Obtiene datos históricos agrupados por fecha
    GET /api/analytics/historical-data/?days=7|30|60
    """
    try:
        # Obtener parámetro de días (7, 30, o 60)
        days_param = request.query_params.get('days', '7')
        try:
            days = int(days_param)
            if days not in [7, 30, 60]:
                days = 7
        except (ValueError, TypeError):
            days = 7
        
        historical = prediction_service.get_historical_data(days=days)
        
        return Response({
            'success': True,
            'data': historical
        })
        
    except Exception as e:
        logger.error(f"Error en historical_data: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def predict_demand(request):
    """
    Predice demanda para un viaje específico
    GET /api/analytics/predict-demand/?fecha=2024-01-15&hora=14:00&precio=50&origen_id=1&destino_id=2
    """
    try:
        fecha_str = request.query_params.get('fecha')
        hora_str = request.query_params.get('hora')
        precio = request.query_params.get('precio')
        origen_id = request.query_params.get('origen_id')
        destino_id = request.query_params.get('destino_id')
        
        if not all([fecha_str, hora_str, precio, origen_id, destino_id]):
            return Response(
                {'error': 'Faltan parámetros requeridos: fecha, hora, precio, origen_id, destino_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from datetime import datetime
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        hora = datetime.strptime(hora_str, '%H:%M').time()
        
        prediction = prediction_service.predict_demand(
            fecha,
            hora,
            float(precio),
            int(origen_id),
            int(destino_id)
        )
        
        if prediction is None:
            return Response(
                {'error': 'No se pudo generar la predicción'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'success': True,
            'demanda_prevista': prediction
        })
        
    except Exception as e:
        logger.error(f"Error prediciendo demanda: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

