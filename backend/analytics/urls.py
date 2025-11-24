"""
URLs para el módulo de analytics
"""
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard-predictions/', views.dashboard_predictions, name='dashboard_predictions'),
    path('historical-data/', views.historical_data, name='historical_data'),
    path('train-models/', views.train_models, name='train_models'),
    path('predict-demand/', views.predict_demand, name='predict_demand'),
]

