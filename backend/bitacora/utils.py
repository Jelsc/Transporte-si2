from .models import Bitacora
from django.utils.timezone import now

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_user_agent(request):
    return request.META.get('HTTP_USER_AGENT', 'Desconocido')

def registrar_bitacora(request=None, usuario=None, accion="", descripcion="", modulo="GENERAL"):
    """
    Crea un registro en la bitácora.
    Puede recibir el request o directamente el usuario.
    """
    if request and usuario is None:
        usuario = getattr(request, 'user', None)

    ip = get_client_ip(request) if request else None
    user_agent = get_user_agent(request) if request else ""

    Bitacora.objects.create(
        usuario=usuario if usuario and usuario.is_authenticated else None,
        accion=accion,
        descripcion=descripcion,
        fecha_hora=now(),
        ip=ip,
        user_agent=user_agent,
        modulo=modulo
    )


# ========================================
# FUNCIONES ESPECÍFICAS PARA REPORTES
# ========================================

def registrar_generacion_reporte(request, reporte_id, titulo, tipo, categoria, tiempo_generacion=None, tamaño_archivo=None):
    """
    Registra la generación de un reporte en la bitácora.
    
    Args:
        request: Request object de Django
        reporte_id: ID del reporte generado
        titulo: Título del reporte
        tipo: Tipo de reporte (pdf, excel, imagen)
        categoria: Categoría del reporte
        tiempo_generacion: Tiempo de generación en segundos (opcional)
        tamaño_archivo: Tamaño del archivo en bytes (opcional)
    """
    descripcion = f"Reporte generado: {titulo} | Tipo: {tipo.upper()} | Categoría: {categoria}"
    
    if tiempo_generacion:
        descripcion += f" | Tiempo: {tiempo_generacion:.2f}s"
    if tamaño_archivo:
        tamaño_mb = tamaño_archivo / (1024 * 1024)
        descripcion += f" | Tamaño: {tamaño_mb:.2f} MB"
    
    descripcion += f" | ID: {reporte_id}"
    
    registrar_bitacora(
        request=request,
        accion="GENERAR_REPORTE",
        descripcion=descripcion,
        modulo="REPORTES"
    )


def registrar_descarga_reporte(request, reporte_id, titulo, tipo):
    """
    Registra la descarga de un reporte en la bitácora.
    """
    descripcion = f"Reporte descargado: {titulo} | Tipo: {tipo.upper()} | ID: {reporte_id}"
    
    registrar_bitacora(
        request=request,
        accion="DESCARGAR_REPORTE",
        descripcion=descripcion,
        modulo="REPORTES"
    )


def registrar_eliminacion_reporte(request, reporte_id, titulo):
    """
    Registra la eliminación de un reporte en la bitácora.
    """
    descripcion = f"Reporte eliminado: {titulo} | ID: {reporte_id}"
    
    registrar_bitacora(
        request=request,
        accion="ELIMINAR_REPORTE",
        descripcion=descripcion,
        modulo="REPORTES"
    )


# ========================================
# FUNCIONES ESPECÍFICAS PARA FACTURACIÓN
# ========================================

def registrar_creacion_pago(request, pago_id, monto, metodo_pago, usuario_pago=None):
    """
    Registra la creación de un pago/factura en la bitácora.
    
    Args:
        request: Request object de Django
        pago_id: ID del pago creado
        monto: Monto del pago
        metodo_pago: Método de pago utilizado
        usuario_pago: Usuario que realizó el pago (opcional, si es diferente al usuario autenticado)
    """
    usuario_info = usuario_pago.username if usuario_pago else "Usuario del sistema"
    descripcion = f"Pago creado | ID: {pago_id} | Monto: ${monto} | Método: {metodo_pago} | Cliente: {usuario_info}"
    
    registrar_bitacora(
        request=request,
        accion="CREAR_PAGO",
        descripcion=descripcion,
        modulo="FACTURACION"
    )


def registrar_pago_completado(request, pago_id, monto, metodo_pago, usuario_pago=None):
    """
    Registra la finalización exitosa de un pago en la bitácora.
    """
    usuario_info = usuario_pago.username if usuario_pago else "Usuario del sistema"
    descripcion = f"Pago completado | ID: {pago_id} | Monto: ${monto} | Método: {metodo_pago} | Cliente: {usuario_info}"
    
    registrar_bitacora(
        request=request,
        accion="PAGO_COMPLETADO",
        descripcion=descripcion,
        modulo="FACTURACION"
    )


def registrar_pago_cancelado(request, pago_id, monto, motivo=None):
    """
    Registra la cancelación de un pago en la bitácora.
    """
    descripcion = f"Pago cancelado | ID: {pago_id} | Monto: ${monto}"
    if motivo:
        descripcion += f" | Motivo: {motivo}"
    
    registrar_bitacora(
        request=request,
        accion="PAGO_CANCELADO",
        descripcion=descripcion,
        modulo="FACTURACION"
    )


def registrar_pago_fallido(request, pago_id, monto, error=None):
    """
    Registra un pago fallido en la bitácora.
    """
    descripcion = f"Pago fallido | ID: {pago_id} | Monto: ${monto}"
    if error:
        descripcion += f" | Error: {str(error)[:200]}"  # Limitar longitud del error
    
    registrar_bitacora(
        request=request,
        accion="PAGO_FALLIDO",
        descripcion=descripcion,
        modulo="FACTURACION"
    )


def registrar_reembolso(request, pago_id, monto, motivo=None):
    """
    Registra un reembolso en la bitácora.
    """
    descripcion = f"Reembolso procesado | Pago ID: {pago_id} | Monto: ${monto}"
    if motivo:
        descripcion += f" | Motivo: {motivo}"
    
    registrar_bitacora(
        request=request,
        accion="REEMBOLSO",
        descripcion=descripcion,
        modulo="FACTURACION"
    )


def registrar_emision_factura(request, factura_id, pago_id, monto):
    """
    Registra la emisión de una factura en la bitácora.
    """
    descripcion = f"Factura emitida | Factura ID: {factura_id} | Pago ID: {pago_id} | Monto: ${monto}"
    
    registrar_bitacora(
        request=request,
        accion="EMITIR_FACTURA",
        descripcion=descripcion,
        modulo="FACTURACION"
    )