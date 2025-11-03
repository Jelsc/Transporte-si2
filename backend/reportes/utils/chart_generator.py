"""
Generador de gráficos para reportes
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from typing import List, Dict, Any, Optional
import io
import base64


class ChartGenerator:
    """
    Clase para generar gráficos para reportes
    """
    
    @staticmethod
    def crear_grafico_barras(
        labels: List[str],
        valores: List[float],
        titulo: str = "",
        xlabel: str = "",
        ylabel: str = "",
        color: str = '#3B82F6'
    ) -> str:
        """
        Crea un gráfico de barras y lo retorna como base64
        
        Returns:
            str: Imagen en formato base64
        """
        fig, ax = plt.subplots(figsize=(10, 6))
        
        x = np.arange(len(labels))
        bars = ax.bar(x, valores, color=color, alpha=0.8)
        
        ax.set_xlabel(xlabel)
        ax.set_ylabel(ylabel)
        ax.set_title(titulo)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, rotation=45, ha='right')
        ax.grid(axis='y', alpha=0.3)
        
        # Agregar valores encima de las barras
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(height)}',
                   ha='center', va='bottom')
        
        plt.tight_layout()
        
        # Convertir a base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)
        
        return f"data:image/png;base64,{image_base64}"
    
    @staticmethod
    def crear_grafico_lineas(
        series: List[Dict[str, Any]],
        titulo: str = "",
        xlabel: str = "",
        ylabel: str = ""
    ) -> str:
        """
        Crea un gráfico de líneas y lo retorna como base64
        
        Args:
            series: Lista de diccionarios con formato:
                [{'x': [...], 'y': [...], 'label': '...', 'color': '...'}]
        
        Returns:
            str: Imagen en formato base64
        """
        fig, ax = plt.subplots(figsize=(10, 6))
        
        for serie in series:
            x = serie.get('x', [])
            y = serie.get('y', [])
            label = serie.get('label', '')
            color = serie.get('color', '#3B82F6')
            
            ax.plot(x, y, marker='o', label=label, color=color, linewidth=2)
        
        ax.set_xlabel(xlabel)
        ax.set_ylabel(ylabel)
        ax.set_title(titulo)
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Convertir a base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)
        
        return f"data:image/png;base64,{image_base64}"
    
    @staticmethod
    def crear_grafico_pie(
        labels: List[str],
        valores: List[float],
        titulo: str = ""
    ) -> str:
        """
        Crea un gráfico de torta y lo retorna como base64
        
        Returns:
            str: Imagen en formato base64
        """
        fig, ax = plt.subplots(figsize=(8, 8))
        
        colors = plt.cm.Set3(np.linspace(0, 1, len(labels)))
        wedges, texts, autotexts = ax.pie(
            valores,
            labels=labels,
            autopct='%1.1f%%',
            colors=colors,
            startangle=90
        )
        
        ax.set_title(titulo)
        
        # Mejorar el texto
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
        
        plt.tight_layout()
        
        # Convertir a base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)
        
        return f"data:image/png;base64,{image_base64}"
