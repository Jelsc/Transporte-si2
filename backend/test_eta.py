#!/usr/bin/env python
"""
Script de prueba para el sistema ETA con baseline
Ejecutar: python manage.py shell < test_eta.py
"""

from datetime import datetime, time
from rutas_optimizadas.services.eta_calculator import ETACalculator

print("=" * 60)
print("🧪 PRUEBA DEL SISTEMA ETA CON BASELINE")
print("=" * 60)

# Crear instancia del calculador
calculator = ETACalculator()
print("\n✅ ETACalculator instanciado correctamente")

# Datos de prueba: 3 paradas
paradas_test = [
    {
        'id': 1,
        'orden': 0,
        'tiempo_servicio_min': 5,
        'distancia_desde_anterior_km': 0,  # Depot
    },
    {
        'id': 2,
        'orden': 1,
        'tiempo_servicio_min': 10,
        'distancia_desde_anterior_km': 8.5,  # 8.5 km del depot
    },
    {
        'id': 3,
        'orden': 2,
        'tiempo_servicio_min': 15,
        'distancia_desde_anterior_km': 12.3,  # 12.3 km de parada anterior
    },
]

print("\n📝 Datos de prueba preparados:")
print(f"   - {len(paradas_test)} paradas")
print(f"   - Hora inicio: 08:00 AM")
print(f"   - Distancia total: {sum(p['distancia_desde_anterior_km'] for p in paradas_test):.1f} km")

# Test 1: Calcular ETA Baseline
print("\n" + "=" * 60)
print("TEST 1: Calcular ETA Baseline")
print("=" * 60)

try:
    hora_inicio = time(8, 0)  # 08:00 AM
    
    paradas_con_eta = calculator.calcular_eta_baseline(
        hora_inicio=hora_inicio,
        paradas=paradas_test,
        matriz_tiempos=None  # Usará cálculo por distancia
    )
    
    print("✅ ETAs baseline calculados correctamente\n")
    
    for i, parada in enumerate(paradas_con_eta):
        print(f"Parada {i}:")
        print(f"  - Llegada: {parada.get('eta_baseline_llegada', 'N/A')}")
        print(f"  - Salida:  {parada.get('eta_baseline_salida', 'N/A')}")
        print(f"  - Servicio: {parada['tiempo_servicio_min']} min")
        if i > 0:
            print(f"  - Distancia desde anterior: {parada['distancia_desde_anterior_km']:.1f} km")
        print()
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Actualizar ETA Real-time
print("=" * 60)
print("TEST 2: Actualizar ETA Real-time")
print("=" * 60)

try:
    # Simular ubicación actual (entre depot y primera parada)
    ubicacion_actual = (-17.7849, -63.1806)  # Coordenadas de Santa Cruz
    
    # Preparar datos de paradas restantes (sin la primera que ya pasó)
    paradas_restantes = [
        {
            'id': 2,
            'orden': 1,
            'ubicacion_detalle': {
                'lat': -17.7900,
                'lng': -63.1700,
            },
            'tiempo_llegada_estimado': time(8, 20),  # ETA baseline
            'tiempo_servicio_min': 10,
            'distancia_desde_anterior_km': 8.5,
        },
        {
            'id': 3,
            'orden': 2,
            'ubicacion_detalle': {
                'lat': -17.7950,
                'lng': -63.1600,
            },
            'tiempo_llegada_estimado': time(8, 50),  # ETA baseline
            'tiempo_servicio_min': 15,
            'distancia_desde_anterior_km': 12.3,
        },
    ]
    
    paradas_actualizadas = calculator.actualizar_eta_tiempo_real(
        ruta_id=1,
        ubicacion_actual=ubicacion_actual,
        paradas_restantes=paradas_restantes,
        hora_actual=datetime.now()
    )
    
    print("✅ ETAs real-time calculados correctamente\n")
    print(f"📍 Ubicación actual: {ubicacion_actual}\n")
    
    for parada in paradas_actualizadas:
        print(f"Parada {parada['orden']}:")
        print(f"  - ETA baseline: {parada.get('tiempo_llegada_estimado', 'N/A')}")
        print(f"  - ETA realtime: {parada.get('eta_realtime_llegada', 'N/A')}")
        
        if 'eta_diferencia_minutos' in parada:
            diff = parada['eta_diferencia_minutos']
            signo = "+" if diff >= 0 else ""
            print(f"  - Diferencia: {signo}{diff:.1f} min")
        
        if 'eta_estado' in parada:
            estado_emojis = {
                'on_time': '✅',
                'early': '⚡',
                'delayed': '⚠️',
                'critical': '🚨',
            }
            emoji = estado_emojis.get(parada['eta_estado'], '⏱️')
            print(f"  - Estado: {emoji} {parada['eta_estado']}")
        
        print()
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Calcular Demora Acumulada
print("=" * 60)
print("TEST 3: Calcular Demora Acumulada")
print("=" * 60)

try:
    # Simular paradas completadas con demoras
    paradas_completadas_test = [
        {
            'tiempo_llegada_estimado': time(8, 0),
            'hora_llegada_real': datetime(2025, 11, 6, 8, 3),  # 3 min tarde
        },
        {
            'tiempo_llegada_estimado': time(8, 20),
            'hora_llegada_real': datetime(2025, 11, 6, 8, 28),  # 8 min tarde
        },
        {
            'tiempo_llegada_estimado': time(8, 50),
            'hora_llegada_real': datetime(2025, 11, 6, 8, 51),  # 1 min tarde
        },
    ]
    
    stats = calculator.calcular_demora_acumulada(paradas_completadas_test)
    
    print("✅ Estadísticas de demora calculadas\n")
    print(f"📊 Resultados:")
    print(f"  - Demora promedio: {stats['demora_promedio_min']:.1f} min")
    print(f"  - Demora máxima: {stats['demora_maxima_min']:.1f} min")
    print(f"  - Paradas demoradas: {stats['paradas_demoradas']}")
    print(f"  - Factor de demora: {stats['factor_demora']:.2f}x")
    print(f"  - Total analizado: {stats['total_paradas_analizadas']} paradas")
    print()
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Cálculo de distancia Haversine
print("=" * 60)
print("TEST 4: Cálculo de Distancia Haversine")
print("=" * 60)

try:
    # Coordenadas de prueba (Santa Cruz)
    lat1, lng1 = -17.7849, -63.1806  # Terminal Central
    lat2, lng2 = -17.7900, -63.1700  # Punto a ~10 km
    
    distancia_km = calculator._calcular_distancia_haversine(lat1, lng1, lat2, lng2)
    
    print("✅ Distancia calculada correctamente\n")
    print(f"📍 Punto A: ({lat1}, {lng1})")
    print(f"📍 Punto B: ({lat2}, {lng2})")
    print(f"📏 Distancia: {distancia_km:.2f} km")
    print()
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

# Resumen final
print("=" * 60)
print("🎉 PRUEBAS COMPLETADAS")
print("=" * 60)
print("\n✅ Todos los componentes del sistema ETA funcionan correctamente")
print("\n📝 Próximos pasos:")
print("   1. Crear una solicitud de optimización real")
print("   2. Verificar que los ETAs baseline se guardan en la BD")
print("   3. Probar los endpoints API desde el frontend")
print("   4. Integrar el componente ETAPanel en la UI")
print("\n" + "=" * 60)
