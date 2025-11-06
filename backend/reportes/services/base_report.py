"""
Clase base para generación de reportes
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional
import os
from django.conf import settings


class BaseReportGenerator(ABC):
    """
    Clase base abstracta para todos los generadores de reportes
    """
    
    def __init__(self, titulo: str, categoria: str, parametros: Optional[Dict[str, Any]] = None):
        self.titulo = titulo
        self.categoria = categoria
        self.parametros = parametros or {}
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    @abstractmethod
    def generar(self, data: Any) -> str:
        """
        Método abstracto que debe ser implementado por cada generador
        
        Args:
            data: Datos a incluir en el reporte
            
        Returns:
            str: Ruta del archivo generado
        """
        pass
    
    def _get_filename(self, extension: str) -> str:
        """
        Genera un nombre de archivo único
        
        Args:
            extension: Extensión del archivo (pdf, xlsx, png, etc.)
            
        Returns:
            str: Nombre del archivo
        """
        # Sanitizar el título para usar como nombre de archivo
        safe_titulo = "".join(c for c in self.titulo if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_titulo = safe_titulo.replace(' ', '_')
        return f"{safe_titulo}_{self.timestamp}.{extension}"
    
    def _get_filepath(self, filename: str) -> str:
        """
        Obtiene la ruta completa del archivo
        
        Args:
            filename: Nombre del archivo
            
        Returns:
            str: Ruta completa del archivo
        """
        # Crear directorio si no existe
        year = datetime.now().strftime("%Y")
        month = datetime.now().strftime("%m")
        directory = os.path.join(settings.MEDIA_ROOT, 'reportes', year, month)
        os.makedirs(directory, exist_ok=True)
        
        return os.path.join(directory, filename)
    
    def _get_relative_path(self, filepath: str) -> str:
        """
        Obtiene la ruta relativa desde MEDIA_ROOT
        
        Args:
            filepath: Ruta completa del archivo
            
        Returns:
            str: Ruta relativa
        """
        return os.path.relpath(filepath, settings.MEDIA_ROOT)
    
    def _format_fecha(self, fecha) -> str:
        """Formatea una fecha para mostrar en reportes"""
        if isinstance(fecha, str):
            return fecha
        return fecha.strftime("%d/%m/%Y") if fecha else "N/A"
    
    def _format_datetime(self, fecha) -> str:
        """Formatea una fecha y hora para mostrar en reportes"""
        if isinstance(fecha, str):
            return fecha
        return fecha.strftime("%d/%m/%Y %H:%M") if fecha else "N/A"
