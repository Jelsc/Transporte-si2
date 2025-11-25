"""
Generador de reportes en formato Imagen (gráficos)
"""
from typing import Any, Dict, List
import matplotlib
matplotlib.use('Agg')  # Backend sin GUI
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
import numpy as np
from datetime import datetime

from .base_report import BaseReportGenerator


class ImageReportGenerator(BaseReportGenerator):
    """
    Generador de reportes en formato imagen usando Matplotlib
    """
    
    def __init__(self, titulo: str = "Reporte", categoria: str = "general", parametros: Dict[str, Any] = None):
        super().__init__(titulo, categoria, parametros)
        self.dpi = 300  # Alta resolución
        self.figsize = (12, 8)
    
    @staticmethod
    def generar_reporte(titulo: str, datos: Any, categoria: str) -> str:
        """
        Método estático de conveniencia para generar un reporte como imagen
        
        Args:
            titulo: Título del reporte
            datos: Datos del reporte (lista de diccionarios o dict estructurado)
            categoria: Categoría del reporte
            
        Returns:
            str: Ruta del archivo generado
        """
        generator = ImageReportGenerator(titulo=titulo, categoria=categoria)
        
        # Convertir datos si es una lista simple
        if isinstance(datos, list):
            data_estructurada = generator._convertir_lista_a_estructura(datos, categoria)
        else:
            data_estructurada = datos
        
        return generator.generar(data_estructurada)
    
    def _convertir_lista_a_estructura(self, datos: List[Dict], categoria: str) -> Dict:
        """Convierte una lista de diccionarios en la estructura esperada para gráficos"""
        if not datos:
            return {
                'tipo': 'barras',
                'datos': {
                    'labels': [],
                    'valores': [],
                    'xlabel': categoria.capitalize(),
                    'ylabel': 'Cantidad'
                }
            }
        
        # Intentar extraer datos para gráfico de barras
        # Tomar las primeras dos columnas como labels y valores
        columnas = list(datos[0].keys())
        
        if len(columnas) >= 2:
            labels = [str(row.get(columnas[0], ''))[:20] for row in datos[:10]]  # Primeros 10
            valores_col = columnas[1]
            
            # Intentar convertir a números
            valores = []
            for row in datos[:10]:
                try:
                    val = row.get(valores_col, 0)
                    if isinstance(val, (int, float)):
                        valores.append(val)
                    else:
                        valores.append(1)
                except:
                    valores.append(1)
        else:
            # Si solo hay una columna, contar frecuencias
            labels = []
            valores = []
            frecuencias = {}
            
            for row in datos:
                valor = str(row.get(columnas[0], ''))[:20]
                frecuencias[valor] = frecuencias.get(valor, 0) + 1
            
            # Tomar los top 10
            items = sorted(frecuencias.items(), key=lambda x: x[1], reverse=True)[:10]
            labels = [item[0] for item in items]
            valores = [item[1] for item in items]
        
        return {
            'tipo': 'barras',
            'datos': {
                'labels': labels,
                'valores': valores,
                'xlabel': categoria.capitalize(),
                'ylabel': 'Cantidad'
            }
        }
    
    def generar(self, data: Any) -> str:
        """
        Genera un reporte como imagen (gráfico)
        
        Args:
            data: Diccionario con la estructura del reporte
                {
                    'tipo': 'barras' | 'lineas' | 'pie' | 'dashboard',
                    'datos': {...},
                    'config': {...}
                }
        
        Returns:
            str: Ruta relativa del archivo generado
        """
        filename = self._get_filename('png')
        filepath = self._get_filepath(filename)
        
        tipo_grafico = data.get('tipo', 'barras')
        
        # Crear figura
        fig = plt.figure(figsize=self.figsize, dpi=self.dpi)
        
        # Generar gráfico según el tipo
        if tipo_grafico == 'barras':
            self._generar_grafico_barras(fig, data)
        elif tipo_grafico == 'lineas':
            self._generar_grafico_lineas(fig, data)
        elif tipo_grafico == 'pie':
            self._generar_grafico_pie(fig, data)
        elif tipo_grafico == 'dashboard':
            self._generar_dashboard(fig, data)
        else:
            self._generar_grafico_barras(fig, data)
        
        # Agregar título general y metadata
        fig.suptitle(self.titulo, fontsize=16, fontweight='bold', y=0.98)
        
        # Guardar imagen
        plt.tight_layout()
        plt.savefig(filepath, dpi=self.dpi, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        
        return self._get_relative_path(filepath)
    
    def _generar_grafico_barras(self, fig: Figure, data: Dict):
        """Genera un gráfico de barras"""
        ax = fig.add_subplot(111)
        
        datos = data.get('datos', {})
        labels = datos.get('labels', [])
        valores = datos.get('valores', [])
        
        if not labels or not valores:
            ax.text(0.5, 0.5, 'No hay datos para mostrar', 
                   ha='center', va='center', fontsize=14)
            return
        
        x = np.arange(len(labels))
        bars = ax.bar(x, valores, color='#3B82F6', alpha=0.8, edgecolor='#1E3A8A')
        
        # Personalización
        ax.set_xlabel(datos.get('xlabel', ''), fontsize=12)
        ax.set_ylabel(datos.get('ylabel', ''), fontsize=12)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, rotation=45, ha='right')
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        
        # Agregar valores encima de las barras
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(height)}',
                   ha='center', va='bottom', fontsize=10)
    
    def _generar_grafico_lineas(self, fig: Figure, data: Dict):
        """Genera un gráfico de líneas"""
        ax = fig.add_subplot(111)
        
        datos = data.get('datos', {})
        series = datos.get('series', [])
        
        if not series:
            ax.text(0.5, 0.5, 'No hay datos para mostrar', 
                   ha='center', va='center', fontsize=14)
            return
        
        # Graficar cada serie
        for serie in series:
            x = serie.get('x', [])
            y = serie.get('y', [])
            label = serie.get('label', 'Serie')
            ax.plot(x, y, marker='o', label=label, linewidth=2)
        
        # Personalización
        ax.set_xlabel(datos.get('xlabel', ''), fontsize=12)
        ax.set_ylabel(datos.get('ylabel', ''), fontsize=12)
        ax.legend()
        ax.grid(True, alpha=0.3, linestyle='--')
    
    def _generar_grafico_pie(self, fig: Figure, data: Dict):
        """Genera un gráfico de torta"""
        ax = fig.add_subplot(111)
        
        datos = data.get('datos', {})
        labels = datos.get('labels', [])
        valores = datos.get('valores', [])
        
        if not labels or not valores:
            ax.text(0.5, 0.5, 'No hay datos para mostrar', 
                   ha='center', va='center', fontsize=14)
            return
        
        colors = plt.cm.Set3(np.linspace(0, 1, len(labels)))
        wedges, texts, autotexts = ax.pie(
            valores, 
            labels=labels, 
            autopct='%1.1f%%',
            colors=colors,
            startangle=90,
            textprops={'fontsize': 10}
        )
        
        # Mejorar el texto de porcentajes
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
    
    def _generar_dashboard(self, fig: Figure, data: Dict):
        """Genera un dashboard con múltiples gráficos"""
        datos = data.get('datos', {})
        graficos = datos.get('graficos', [])
        
        if not graficos:
            return
        
        # Determinar layout
        n_graficos = len(graficos)
        if n_graficos <= 2:
            rows, cols = 1, n_graficos
        elif n_graficos <= 4:
            rows, cols = 2, 2
        else:
            rows = (n_graficos + 2) // 3
            cols = 3
        
        # Crear subplots
        for idx, grafico in enumerate(graficos, 1):
            ax = fig.add_subplot(rows, cols, idx)
            
            tipo = grafico.get('tipo', 'barras')
            if tipo == 'barras':
                self._subplot_barras(ax, grafico)
            elif tipo == 'lineas':
                self._subplot_lineas(ax, grafico)
            elif tipo == 'pie':
                self._subplot_pie(ax, grafico)
    
    def _subplot_barras(self, ax, grafico: Dict):
        """Crea un subplot de barras"""
        labels = grafico.get('labels', [])
        valores = grafico.get('valores', [])
        titulo = grafico.get('titulo', '')
        
        if labels and valores:
            ax.bar(range(len(labels)), valores, color='#3B82F6', alpha=0.8)
            ax.set_xticks(range(len(labels)))
            ax.set_xticklabels(labels, rotation=45, ha='right', fontsize=8)
            ax.set_title(titulo, fontsize=10, fontweight='bold')
            ax.grid(axis='y', alpha=0.3)
    
    def _subplot_lineas(self, ax, grafico: Dict):
        """Crea un subplot de líneas"""
        x = grafico.get('x', [])
        y = grafico.get('y', [])
        titulo = grafico.get('titulo', '')
        
        if x and y:
            ax.plot(x, y, marker='o', color='#3B82F6', linewidth=2)
            ax.set_title(titulo, fontsize=10, fontweight='bold')
            ax.grid(True, alpha=0.3)
    
    def _subplot_pie(self, ax, grafico: Dict):
        """Crea un subplot de torta"""
        labels = grafico.get('labels', [])
        valores = grafico.get('valores', [])
        titulo = grafico.get('titulo', '')
        
        if labels and valores:
            ax.pie(valores, labels=labels, autopct='%1.1f%%', startangle=90)
            ax.set_title(titulo, fontsize=10, fontweight='bold')
