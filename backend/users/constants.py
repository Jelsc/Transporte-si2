"""
Constantes para la aplicación de usuarios.
Define permisos y otras constantes utilizadas en el sistema.
"""

# Lista de permisos disponibles en el sistema
# Formato: (clave_permiso, descripción_legible)
PERMISOS_SISTEMA = [
    # Permisos administrativos
    ('gestionar_usuarios', 'Gestionar usuarios del sistema'),
    ('gestionar_roles', 'Gestionar roles y permisos'),
    ('ver_dashboard_admin', 'Ver dashboard administrativo'),
    ('gestionar_configuracion', 'Gestionar configuración del sistema'),
    
    # Permisos para vehículos
    ('crear_vehiculo', 'Crear nuevos vehículos'),
    ('editar_vehiculo', 'Editar información de vehículos'),
    ('eliminar_vehiculo', 'Eliminar vehículos'),
    ('asignar_vehiculo', 'Asignar vehículos a conductores'),
    ('ver_vehiculos', 'Ver lista de vehículos'),
    ('gestionar_mantenimiento', 'Gestionar mantenimiento de vehículos'),
    
    # Permisos para rutas
    ('crear_ruta', 'Crear nuevas rutas'),
    ('editar_ruta', 'Editar rutas existentes'),
    ('eliminar_ruta', 'Eliminar rutas'),
    ('ver_rutas', 'Ver lista de rutas'),
    ('asignar_rutas', 'Asignar rutas a vehículos'),
    
    # Permisos para viajes
    ('solicitar_viaje', 'Solicitar nuevo viaje'),
    ('cancelar_viaje', 'Cancelar viaje'),
    ('ver_historial_viajes', 'Ver historial de viajes'),
    ('asignar_viajes', 'Asignar viajes a conductores'),
    ('gestionar_viajes', 'Gestionar viajes del sistema'),
    
    # Permisos para conductores
    ('actualizar_estado', 'Actualizar estado (disponible/ocupado)'),
    ('ver_viajes_asignados', 'Ver viajes asignados'),
    ('iniciar_viaje', 'Iniciar un viaje'),
    ('finalizar_viaje', 'Finalizar un viaje'),
    ('reportar_incidente', 'Reportar incidentes durante viaje'),
    
    # Permisos para clientes
    ('ver_perfil', 'Ver perfil propio'),
    ('editar_perfil', 'Editar perfil propio'),
    ('ver_historial', 'Ver historial de actividad'),
    
    # Permisos para reportes
    ('ver_reportes_basicos', 'Ver reportes básicos'),
    ('ver_reportes_avanzados', 'Ver reportes avanzados'),
    ('exportar_reportes', 'Exportar reportes'),
    ('generar_reportes_personalizados', 'Generar reportes personalizados'),
    
    # Permisos para monitoreo
    ('monitorear_vehiculos', 'Monitorear ubicación de vehículos'),
    ('monitorear_conductores', 'Monitorear estado de conductores'),
    ('monitorear_rutas', 'Monitorear rutas activas'),
    ('ver_estadisticas_tiempo_real', 'Ver estadísticas en tiempo real'),
]

# Agrupar permisos por categoría para facilitar la asignación
GRUPOS_PERMISOS = {
    'administrador': [
        'gestionar_usuarios', 'gestionar_roles', 'ver_dashboard_admin', 
        'gestionar_configuracion', 'ver_reportes_avanzados', 'exportar_reportes',
        'generar_reportes_personalizados'
    ],
    'supervisor': [
        'ver_vehiculos', 'ver_rutas', 'gestionar_viajes', 'monitorear_vehiculos',
        'monitorear_conductores', 'monitorear_rutas', 'ver_estadisticas_tiempo_real',
        'ver_reportes_basicos', 'gestionar_mantenimiento'
    ],
    'conductor': [
        'ver_viajes_asignados', 'actualizar_estado', 'iniciar_viaje', 
        'finalizar_viaje', 'reportar_incidente', 'ver_perfil'
    ],
    'cliente': [
        'solicitar_viaje', 'cancelar_viaje', 'ver_historial_viajes',
        'ver_perfil', 'editar_perfil'
    ],
    'operador': [
        'asignar_viajes', 'monitorear_vehiculos', 'monitorear_conductores',
        'ver_rutas', 'ver_vehiculos', 'ver_reportes_basicos'
    ]
}
