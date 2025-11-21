"""
Utilidades de formateo para reportes
"""
from datetime import datetime, date
from typing import Union, Optional


def format_currency(amount: Union[int, float], currency: str = 'Bs') -> str:
    """
    Formatea un monto como moneda
    
    Args:
        amount: Monto a formatear
        currency: Símbolo de moneda (default: 'Bs' para bolivianos)
    
    Returns:
        str: Monto formateado (ej: "Bs 1,234.56")
    """
    if amount is None:
        return f"{currency} 0.00"
    
    try:
        return f"{currency} {amount:,.2f}"
    except (ValueError, TypeError):
        return f"{currency} 0.00"


def format_date(fecha: Union[datetime, date, str, None], formato: str = "%d/%m/%Y") -> str:
    """
    Formatea una fecha
    
    Args:
        fecha: Fecha a formatear
        formato: Formato de salida (default: "dd/mm/yyyy")
    
    Returns:
        str: Fecha formateada
    """
    if fecha is None:
        return "N/A"
    
    if isinstance(fecha, str):
        try:
            # Intentar parsear string ISO
            fecha = datetime.fromisoformat(fecha.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return fecha
    
    if isinstance(fecha, (datetime, date)):
        return fecha.strftime(formato)
    
    return str(fecha)


def format_datetime(fecha: Union[datetime, str, None], formato: str = "%d/%m/%Y %H:%M") -> str:
    """
    Formatea una fecha y hora
    
    Args:
        fecha: Fecha/hora a formatear
        formato: Formato de salida (default: "dd/mm/yyyy hh:mm")
    
    Returns:
        str: Fecha y hora formateada
    """
    if fecha is None:
        return "N/A"
    
    if isinstance(fecha, str):
        try:
            fecha = datetime.fromisoformat(fecha.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return fecha
    
    if isinstance(fecha, datetime):
        return fecha.strftime(formato)
    
    return str(fecha)


def format_percentage(value: Union[int, float, None], decimals: int = 1) -> str:
    """
    Formatea un valor como porcentaje
    
    Args:
        value: Valor a formatear (0-100 o 0-1)
        decimals: Número de decimales
    
    Returns:
        str: Valor formateado (ej: "75.5%")
    """
    if value is None:
        return "0%"
    
    try:
        # Si el valor está entre 0 y 1, convertir a porcentaje
        if 0 <= value <= 1:
            value *= 100
        
        return f"{value:.{decimals}f}%"
    except (ValueError, TypeError):
        return "0%"


def format_number(value: Union[int, float, None], decimals: int = 0) -> str:
    """
    Formatea un número con separadores de miles
    
    Args:
        value: Número a formatear
        decimals: Número de decimales
    
    Returns:
        str: Número formateado (ej: "1,234.56")
    """
    if value is None:
        return "0"
    
    try:
        if decimals > 0:
            return f"{value:,.{decimals}f}"
        else:
            return f"{int(value):,}"
    except (ValueError, TypeError):
        return "0"


def format_duration(seconds: Union[int, float, None]) -> str:
    """
    Formatea una duración en segundos a formato legible
    
    Args:
        seconds: Duración en segundos
    
    Returns:
        str: Duración formateada (ej: "2h 30m", "45m", "30s")
    """
    if seconds is None or seconds < 0:
        return "0s"
    
    try:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        
        parts = []
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0:
            parts.append(f"{minutes}m")
        if secs > 0 and hours == 0:  # Solo mostrar segundos si no hay horas
            parts.append(f"{secs}s")
        
        return " ".join(parts) if parts else "0s"
    except (ValueError, TypeError):
        return "0s"


def truncate_text(text: Optional[str], max_length: int = 50, suffix: str = "...") -> str:
    """
    Trunca un texto a una longitud máxima
    
    Args:
        text: Texto a truncar
        max_length: Longitud máxima
        suffix: Sufijo a agregar si se trunca
    
    Returns:
        str: Texto truncado
    """
    if not text:
        return ""
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix
