"""
Utilidades para el Sistema de Notificaciones - Transporte SI2
============================================================

Funciones auxiliares para facilitar el uso del sistema de notificaciones,
siguiendo el mismo patrón que la bitácora.
"""

from django.utils.timezone import now


def registrar_notificacion(
    request=None,
    usuario_destino=None,
    usuario_origen=None,
    accion="",
    descripcion="",
    modulo="GENERAL",
    tipo_codigo="info",
    data_extra=None,
    prioridad="normal",
    enviar_push=True,
):
    """
    Crea una notificación y opcionalmente la envía por push.
    Funciona similar a registrar_bitacora pero para notificaciones.

    Args:
        request: Request HTTP (opcional)
        usuario_destino: Usuario que recibirá la notificación
        usuario_origen: Usuario que origina la acción (si no se especifica, usa request.user)
        accion: Acción realizada (ej: "Crear", "Actualizar", "Eliminar")
        descripcion: Descripción detallada de la acción
        modulo: Módulo del sistema (ej: "PERSONAL", "PAGOS", "VIAJES")
        tipo_codigo: Código del tipo de notificación
        data_extra: Diccionario con datos adicionales
        prioridad: Prioridad de la notificación ("baja", "normal", "alta", "critica")
        enviar_push: Si enviar notificación push (default: True)

    Returns:
        Notificacion: Instancia de la notificación creada
    """

    # Importar modelos dentro de la función para evitar problemas de configuración
    from django.contrib.auth import get_user_model
    from .models import Notificacion, TipoNotificacion
    from .services import NotificationService

    User = get_user_model()

    # Si no se especifica usuario_origen, usar del request
    if request and usuario_origen is None:
        usuario_origen = getattr(request, "user", None)

    # Validar que haya un usuario destino
    if not usuario_destino:
        raise ValueError("usuario_destino es requerido")

    # Obtener o crear tipo de notificación
    tipo_notificacion, created = TipoNotificacion.objects.get_or_create(
        codigo=tipo_codigo,
        defaults={
            "nombre": accion or tipo_codigo,
            "descripcion": f"Notificación de {accion or tipo_codigo}",
            "icono": _get_icon_for_action(accion),
            "color": _get_color_for_priority(prioridad),
        },
    )

    # Crear notificación en BD
    notificacion = Notificacion.objects.create(
        usuario=usuario_destino,
        titulo=f"{accion} - {modulo}" if accion else f"Notificación - {modulo}",
        mensaje=descripcion,
        tipo=tipo_notificacion,
        prioridad=prioridad,
        data_extra=data_extra or {},
        fecha_creacion=now(),
        usuario_origen=usuario_origen,
        modulo=modulo,
    )

    # Enviar push notification si está habilitado
    if enviar_push:
        try:
            NotificationService.enviar_notificacion(
                usuario_id=usuario_destino.id,
                titulo=notificacion.titulo,
                mensaje=notificacion.mensaje,
                tipo_codigo=tipo_codigo,
                data_extra={
                    **(data_extra or {}),
                    "notificacion_id": notificacion.id,
                    "modulo": modulo,
                    "accion": accion,
                    "usuario_origen": usuario_origen.username
                    if usuario_origen
                    else "Sistema",
                },
                prioridad=prioridad,
            )
        except Exception as e:
            # Log el error pero no fallar la operación
            print(f"Error enviando push notification: {e}")

    return notificacion


def registrar_notificacion_masiva(
    request=None,
    usuarios_destino=None,
    usuario_origen=None,
    accion="",
    descripcion="",
    modulo="GENERAL",
    tipo_codigo="info",
    data_extra=None,
    prioridad="normal",
    enviar_push=True,
):
    """
    Crea notificaciones para múltiples usuarios.

    Args:
        usuarios_destino: Lista de usuarios que recibirán la notificación
        ... (resto de parámetros igual que registrar_notificacion)

    Returns:
        List[Notificacion]: Lista de notificaciones creadas
    """
    notificaciones = []

    for usuario in usuarios_destino:
        notificacion = registrar_notificacion(
            request=request,
            usuario_destino=usuario,
            usuario_origen=usuario_origen,
            accion=accion,
            descripcion=descripcion,
            modulo=modulo,
            tipo_codigo=tipo_codigo,
            data_extra=data_extra,
            prioridad=prioridad,
            enviar_push=enviar_push,
        )
        notificaciones.append(notificacion)

    return notificaciones


def _get_icon_for_action(accion):
    """Retorna un icono apropiado para la acción"""
    iconos = {
        "Crear": "➕",
        "Actualizar": "✏️",
        "Eliminar": "🗑️",
        "Login": "🔐",
        "Logout": "🚪",
        "Pago": "💳",
        "Viaje": "🚌",
        "Confirmar": "✅",
        "Cancelar": "❌",
        "Aprobar": "👍",
        "Rechazar": "👎",
        "Sistema": "⚙️",
        "Error": "⚠️",
        "Info": "ℹ️",
        "Éxito": "🎉",
    }
    return iconos.get(accion, "🔔")


def _get_color_for_priority(prioridad):
    """Retorna un color apropiado para la prioridad"""
    colores = {
        "baja": "#6c757d",  # Gris
        "normal": "#007bff",  # Azul
        "alta": "#fd7e14",  # Naranja
        "critica": "#dc3545",  # Rojo
    }
    return colores.get(prioridad, "#007bff")


def enviar_notificacion_bienvenida(usuario_destino, es_primera_vez=True):
    """
    Envía una notificación de bienvenida cuando un usuario se registra.

    Args:
        usuario_destino: Usuario que acaba de registrarse
        es_primera_vez: Si es la primera vez que se loguea (default: True)

    Returns:
        Notificacion: Instancia de la notificación creada
    """
    if es_primera_vez:
        accion = "¡Bienvenido!"
        descripcion = f"¡Bienvenido a MoviFleet, {usuario_destino.first_name or usuario_destino.username}! Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a reservar viajes y disfrutar de nuestros servicios."
        prioridad = "alta"
        data_extra = {
            "tipo": "bienvenida",
            "fecha_registro": usuario_destino.date_joined.strftime("%Y-%m-%d"),
            "es_nuevo_usuario": True,
        }
    else:
        accion = "¡Hola de nuevo!"
        descripcion = f"¡Hola {usuario_destino.first_name or usuario_destino.username}! Gracias por usar MoviFleet. ¿Listo para tu próximo viaje?"
        prioridad = "normal"
        data_extra = {"tipo": "saludo", "es_nuevo_usuario": False}

    return registrar_notificacion(
        usuario_destino=usuario_destino,
        accion=accion,
        descripcion=descripcion,
        modulo="SISTEMA",
        tipo_codigo="bienvenida" if es_primera_vez else "saludo",
        data_extra=data_extra,
        prioridad=prioridad,
        enviar_push=True,
    )


def verificar_y_enviar_bienvenida(usuario_destino):
    """
    Verifica si es la primera vez que el usuario se loguea y envía notificación apropiada.

    Args:
        usuario_destino: Usuario que se acaba de loguear

    Returns:
        Notificacion: Instancia de la notificación creada o None
    """
    # Importar dentro de la función para evitar problemas de configuración
    from .models import Notificacion

    # Verificar si ya existe una notificación de bienvenida para este usuario
    notificaciones_bienvenida = Notificacion.objects.filter(
        usuario=usuario_destino, tipo__codigo__in=["bienvenida", "saludo"]
    ).exists()

    # Si no tiene notificaciones de bienvenida, es nuevo usuario
    es_primera_vez = not notificaciones_bienvenida

    return enviar_notificacion_bienvenida(usuario_destino, es_primera_vez)
