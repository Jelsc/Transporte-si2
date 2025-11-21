"""
Generador de reportes en formato PDF
"""
from typing import Any, Dict, List
from reportlab.lib.pagesizes import letter, A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.platypus import Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import os

from .base_report import BaseReportGenerator


class PDFReportGenerator(BaseReportGenerator):
    """
    Generador de reportes en formato PDF usando ReportLab
    """
    
    def __init__(self, titulo: str = "Reporte", categoria: str = "general", parametros: Dict[str, Any] = None):
        super().__init__(titulo, categoria, parametros)
        # Usar orientación horizontal si es reporte de vehículos o tiene muchas columnas
        if categoria in ['vehiculos', 'conductores', 'financiero']:
            self.pagesize = landscape(A4)
        else:
            self.pagesize = A4
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    @staticmethod
    def generar_reporte(titulo: str, datos: Any, categoria: str) -> str:
        """
        Método estático de conveniencia para generar un reporte PDF
        
        Args:
            titulo: Título del reporte
            datos: Datos del reporte (lista de diccionarios o dict estructurado)
            categoria: Categoría del reporte
            
        Returns:
            str: Ruta del archivo generado
        """
        generator = PDFReportGenerator(titulo=titulo, categoria=categoria)
        
        # Convertir datos si es una lista simple
        if isinstance(datos, list):
            data_estructurada = generator._convertir_lista_a_estructura(datos, categoria)
        else:
            data_estructurada = datos
        
        return generator.generar(data_estructurada)
    
    def _convertir_lista_a_estructura(self, datos: List[Dict], categoria: str) -> Dict:
        """Convierte una lista de diccionarios en la estructura esperada para PDF"""
        if not datos:
            return {
                'encabezado': {},
                'secciones': [],
                'tablas': [],
                'pie': {}
            }
        
        # Obtener las columnas de los datos
        columnas = list(datos[0].keys())
        
        # Crear encabezados de tabla legibles
        headers = [self._formatear_columna(col) for col in columnas]
        
        # Crear filas de datos
        filas = [[str(row.get(col, '')) for col in columnas] for row in datos]
        
        # Construir estructura
        return {
            'encabezado': {},
            'secciones': [],
            'tablas': [{
                'titulo': f'Datos de {categoria.capitalize()}',
                'data': [headers] + filas
            }],
            'pie': {}
        }
    
    def _formatear_columna(self, nombre: str) -> str:
        """Convierte nombres de columna en títulos legibles"""
        # Mapeo de nombres comunes a versiones cortas
        nombres_cortos = {
            'capacidad_pasajeros': 'Cap. Pasaj.',
            'capacidad_carga': 'Cap. Carga',
            'tipo_vehiculo': 'Tipo Veh.',
            'año_fabricacion': 'Año',
            'codigo_seguimiento': 'Código',
            'destinatario_nombre': 'Destinatario',
            'destino_ciudad': 'Destino',
            'fecha_creacion': 'Fecha',
            'origen__nombre': 'Origen',
            'destino__nombre': 'Destino',
            'asientos_disponibles': 'Asientos Disp.',
            'nro_licencia': 'Licencia',
            'tipo_licencia': 'Tipo Lic.',
            'experiencia_anios': 'Exp. (años)',
            'usuario__username': 'Usuario',
            'metodo_pago': 'Método Pago',
        }
        
        # Si hay un nombre corto definido, usarlo
        if nombre in nombres_cortos:
            return nombres_cortos[nombre]
        
        # Reemplazar guiones bajos con espacios y capitalizar
        nombre_formateado = ' '.join(word.capitalize() for word in nombre.replace('_', ' ').split())
        
        # Si es muy largo, acortar
        if len(nombre_formateado) > 15:
            # Intentar abreviar palabras comunes
            nombre_formateado = nombre_formateado.replace('Numero', 'Nro.')
            nombre_formateado = nombre_formateado.replace('Cantidad', 'Cant.')
            nombre_formateado = nombre_formateado.replace('Disponible', 'Disp.')
            nombre_formateado = nombre_formateado.replace('Telefono', 'Tel.')
        
        return nombre_formateado
    
    def _setup_custom_styles(self):
        """Configura estilos personalizados para el PDF"""
        # Título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtítulo
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        
        # Información
        self.styles.add(ParagraphStyle(
            name='CustomInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#6b7280'),
            alignment=TA_RIGHT
        ))
    
    def generar(self, data: Any) -> str:
        """
        Genera un reporte PDF
        
        Args:
            data: Diccionario con la estructura del reporte
                {
                    'encabezado': {...},
                    'secciones': [...],
                    'tablas': [...],
                    'pie': {...}
                }
        
        Returns:
            str: Ruta relativa del archivo generado
        """
        filename = self._get_filename('pdf')
        filepath = self._get_filepath(filename)
        
        # Crear documento PDF
        doc = SimpleDocTemplate(
            filepath,
            pagesize=self.pagesize,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=36,
        )
        
        # Contenedor de elementos
        story = []
        
        # Agregar encabezado
        if 'encabezado' in data:
            story.extend(self._crear_encabezado(data['encabezado']))
        
        # Agregar secciones
        if 'secciones' in data:
            for seccion in data['secciones']:
                story.extend(self._crear_seccion(seccion))
        
        # Agregar tablas
        if 'tablas' in data:
            for tabla_data in data['tablas']:
                story.extend(self._crear_tabla(tabla_data))
        
        # Agregar pie de página
        if 'pie' in data:
            story.extend(self._crear_pie(data['pie']))
        
        # Construir el PDF
        doc.build(story)
        
        return self._get_relative_path(filepath)
    
    def _crear_encabezado(self, encabezado: Dict) -> List:
        """Crea el encabezado del reporte"""
        elementos = []
        
        # Título principal
        elementos.append(Paragraph(self.titulo, self.styles['CustomTitle']))
        elementos.append(Spacer(1, 12))
        
        # Información adicional
        fecha_actual = datetime.now().strftime("%d/%m/%Y %H:%M")
        elementos.append(Paragraph(f"<b>Fecha de generación:</b> {fecha_actual}", self.styles['CustomInfo']))
        
        if encabezado.get('fecha_inicio') or encabezado.get('fecha_fin'):
            fecha_inicio = self._format_fecha(encabezado.get('fecha_inicio', ''))
            fecha_fin = self._format_fecha(encabezado.get('fecha_fin', ''))
            elementos.append(Paragraph(
                f"<b>Período:</b> {fecha_inicio} - {fecha_fin}",
                self.styles['CustomInfo']
            ))
        
        elementos.append(Spacer(1, 20))
        
        return elementos
    
    def _crear_seccion(self, seccion: Dict) -> List:
        """Crea una sección del reporte"""
        elementos = []
        
        # Título de la sección
        if seccion.get('titulo'):
            elementos.append(Paragraph(seccion['titulo'], self.styles['CustomSubtitle']))
            elementos.append(Spacer(1, 12))
        
        # Contenido de la sección
        if seccion.get('contenido'):
            elementos.append(Paragraph(seccion['contenido'], self.styles['Normal']))
            elementos.append(Spacer(1, 12))
        
        return elementos
    
    def _crear_tabla(self, tabla_data: Dict) -> List:
        """Crea una tabla en el reporte"""
        elementos = []
        
        # Título de la tabla
        if tabla_data.get('titulo'):
            elementos.append(Paragraph(tabla_data['titulo'], self.styles['CustomSubtitle']))
            elementos.append(Spacer(1, 12))
        
        # Datos de la tabla
        data = tabla_data.get('data', [])
        if not data:
            return elementos
        
        # Calcular ancho disponible (descontando márgenes)
        page_width = self.pagesize[0]
        margins = 144  # 72 left + 72 right
        available_width = page_width - margins
        
        # Calcular número de columnas
        num_cols = len(data[0])
        
        # Calcular anchos de columna basados en contenido
        col_widths = self._calcular_anchos_columnas(data, available_width)
        
        # Crear tabla con anchos específicos
        tabla = Table(data, colWidths=col_widths, repeatRows=1)
        
        # Estilo de la tabla
        style = TableStyle([
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Cuerpo
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ])
        
        tabla.setStyle(style)
        elementos.append(tabla)
        elementos.append(Spacer(1, 20))
        
        return elementos
    
    def _calcular_anchos_columnas(self, data: List[List], available_width: float) -> List[float]:
        """Calcula los anchos óptimos para cada columna basándose en el contenido"""
        if not data:
            return []
        
        num_cols = len(data[0])
        
        # Calcular longitud máxima de cada columna
        max_lengths = []
        for col_idx in range(num_cols):
            max_len = 0
            for row in data:
                if col_idx < len(row):
                    cell_value = str(row[col_idx])
                    max_len = max(max_len, len(cell_value))
            max_lengths.append(max_len)
        
        # Calcular anchos proporcionales
        total_chars = sum(max_lengths)
        if total_chars == 0:
            # Si no hay datos, distribuir equitativamente
            col_width = available_width / num_cols
            return [col_width] * num_cols
        
        # Asignar anchos proporcionales pero con mínimos y máximos
        col_widths = []
        min_width = 40  # Ancho mínimo en puntos
        max_width = available_width * 0.3  # Ninguna columna más del 30% del ancho
        
        for max_len in max_lengths:
            # Calcular proporción
            proportion = max_len / total_chars
            width = available_width * proportion
            
            # Aplicar límites
            width = max(min_width, min(width, max_width))
            col_widths.append(width)
        
        # Ajustar si la suma excede el ancho disponible
        total_width = sum(col_widths)
        if total_width > available_width:
            factor = available_width / total_width
            col_widths = [w * factor for w in col_widths]
        
        return col_widths
    
    def _crear_pie(self, pie: Dict) -> List:
        """Crea el pie del reporte"""
        elementos = []
        
        elementos.append(Spacer(1, 30))
        elementos.append(Paragraph(
            f"<i>Reporte generado por Sistema de Transporte - {datetime.now().year}</i>",
            self.styles['CustomInfo']
        ))
        
        return elementos
