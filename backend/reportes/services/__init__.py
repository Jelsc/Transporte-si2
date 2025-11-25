"""
Servicios de lógica de negocio para reportes.
Implementa Service Layer Pattern para separar lógica de views.
"""
from .parser_service import ParserService
from .query_builder import QueryBuilder
from .generador_archivos import GeneradorArchivos

# Mantener compatibilidad con servicios antiguos si aún se usan
try:
    from .pdf_generator import PDFReportGenerator
    from .excel_generator import ExcelReportGenerator
    from .image_generator import ImageReportGenerator
except ImportError:
    # Si no existen, no importar (se eliminarán después)
    PDFReportGenerator = None
    ExcelReportGenerator = None
    ImageReportGenerator = None

__all__ = [
    'ParserService',
    'QueryBuilder',
    'GeneradorArchivos',
]
