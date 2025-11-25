"""
ParserService: Servicio de análisis de lenguaje natural en español.
Extrae parámetros de reportes desde comandos de voz o texto.
Adaptado para el sistema de transporte: viajes, encomiendas, conductores, vehículos, pagos
"""
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dateutil import parser as date_parser


def detectar_multiples_reportes(prompt: str) -> List[str]:
    """
    Detecta si el prompt solicita múltiples reportes y los separa.
    
    Palabras clave:
    - "Y también", "Y además", "también quiero", "además quiero"
    - "2 reportes", "dos reportes", "3 reportes"
    - Separación con "Y" entre comandos distintos
    """
    prompt_lower = prompt.lower()
    
    # Buscar separadores explícitos (alta confianza)
    separadores_explicitos = [
        r'\s+y\s+también\s+',
        r'\s+y\s+además\s+',
        r'\s+también\s+quiero\s+',
        r'\s+además\s+quiero\s+',
        r'\s+y\s+otro\s+',
        r'\s+y\s+segundo\s+',
        r'\s+y\s+tercero\s+',
        r'[:;]\s+',  # Dos puntos o punto y coma
    ]
    
    for separador in separadores_explicitos:
        if re.search(separador, prompt_lower):
            # Dividir por el separador
            partes = re.split(separador, prompt, flags=re.IGNORECASE)
            # Limpiar y retornar
            return [parte.strip() for parte in partes if parte.strip()]
    
    # IMPORTANTE: Verificar primero si es un rango de meses (NO separar)
    # "octubre y noviembre" = 1 reporte con rango de fechas
    meses_validos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    patron_rango_meses = r'(\w+)\s+y\s+(\w+)'
    match_meses = re.search(patron_rango_meses, prompt_lower)
    if match_meses:
        palabra1 = match_meses.group(1)
        palabra2 = match_meses.group(2)
        # Si ambas palabras son meses, NO separar (es un rango de fechas)
        if palabra1 in meses_validos and palabra2 in meses_validos:
            return [prompt]
    
    # Si no detectó múltiples reportes, retornar el prompt original
    return [prompt]


class PromptParser:
    """
    Servicio para parsear comandos en español y extraer parámetros de reportes.
    Soporta fechas relativas, rangos específicos, agrupaciones y formatos.
    Adaptado para el sistema de transporte: viajes, encomiendas, conductores, vehículos, pagos
    """
    
    # Palabras clave para tipo de reporte
    TIPOS_REPORTE = {
        'viajes': ['viaje', 'viajes', 'ruta', 'rutas', 'transporte', 'pasajeros'],
        'encomiendas': ['encomienda', 'encomiendas', 'paquete', 'paquetes', 'envío', 'envíos'],
        'conductores': ['conductor', 'conductores', 'chofer', 'choferes', 'piloto'],
        'vehiculos': ['vehículo', 'vehiculo', 'vehículos', 'vehiculos', 'bus', 'buses', 'flota'],
        'financiero': ['financiero', 'pago', 'pagos', 'ingreso', 'ingresos', 'revenue', 'dinero'],
    }
    
    # Palabras clave para formato
    FORMATOS = {
        'pdf': ['pdf', 'documento', 'imprimible'],
        'excel': ['excel', 'xls', 'xlsx', 'planilla', 'hoja de cálculo', 'spreadsheet'],
        'pantalla': ['pantalla', 'vista', 'ver', 'mostrar', 'pantalla'],
    }
    
    # Palabras clave para agrupación
    AGRUPACIONES = {
        'fecha': ['fecha', 'día', 'dia', 'mes', 'año', 'semana'],
        'origen': ['origen', 'salida', 'desde'],
        'destino': ['destino', 'llegada', 'hacia'],
        'conductor': ['conductor', 'chofer', 'piloto'],
        'vehiculo': ['vehículo', 'vehiculo', 'bus', 'flota'],
        'estado': ['estado', 'status'],
        'ciudad': ['ciudad', 'localidad'],
    }
    
    # Meses en español
    MESES = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
        'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    }
    
    def __init__(self):
        """Inicializa el parser con la fecha actual"""
        self.hoy = datetime.now().date()
    
    def parse(self, prompt: str) -> Dict:
        """
        Parsear el prompt y extraer parámetros
        
        Returns:
            {
                'tipo': 'viajes',
                'formato': 'pdf',
                'fecha_inicio': datetime,
                'fecha_fin': datetime,
                'agrupacion': ['fecha'],
                'filtros': {},
                'campos': [],
                'raw_prompt': prompt
            }
        """
        prompt_lower = prompt.lower()
        
        resultado = {
            'tipo': self._detectar_tipo(prompt_lower),
            'formato': self._detectar_formato(prompt_lower),
            'fecha_inicio': None,
            'fecha_fin': None,
            'agrupacion': self._detectar_agrupacion(prompt_lower),
            'filtros': {},
            'campos': self._detectar_campos(prompt_lower),
            'raw_prompt': prompt
        }
        
        # Detectar fechas
        fecha_inicio, fecha_fin = self._detectar_fechas(prompt_lower)
        resultado['fecha_inicio'] = fecha_inicio
        resultado['fecha_fin'] = fecha_fin
        
        return resultado
    
    def _detectar_tipo(self, prompt: str) -> str:
        """Detectar el tipo de reporte solicitado"""
        for tipo, palabras in self.TIPOS_REPORTE.items():
            for palabra in palabras:
                if palabra in prompt:
                    return tipo
        return 'viajes'  # Por defecto
    
    def _detectar_formato(self, prompt: str) -> str:
        """Detectar el formato de salida"""
        for formato, palabras in self.FORMATOS.items():
            for palabra in palabras:
                if palabra in prompt:
                    return formato
        return 'pantalla'  # Por defecto
    
    def _detectar_agrupacion(self, prompt: str) -> List[str]:
        """Detectar por qué campos agrupar"""
        agrupaciones = []
        
        # Buscar "agrupado por X" o "por X"
        patrones = [
            r'agrupado por ([a-záéíóúñ]+)',
            r'agrupar por ([a-záéíóúñ]+)',
            r'por ([a-záéíóúñ]+)',
        ]
        
        for patron in patrones:
            matches = re.findall(patron, prompt)
            for match in matches:
                for key, palabras in self.AGRUPACIONES.items():
                    if match in palabras:
                        if key not in agrupaciones:
                            agrupaciones.append(key)
        
        return agrupaciones if agrupaciones else ['fecha']  # Por defecto agrupar por fecha
    
    def _detectar_campos(self, prompt: str) -> List[str]:
        """Detectar qué campos mostrar"""
        campos = []
        
        # Campos comunes
        campos_keywords = {
            'origen': ['origen', 'salida', 'desde'],
            'destino': ['destino', 'llegada', 'hacia'],
            'precio': ['precio', 'costo', 'tarifa'],
            'fecha': ['fecha', 'día', 'dia'],
            'estado': ['estado', 'status'],
            'conductor': ['conductor', 'chofer'],
            'vehiculo': ['vehículo', 'vehiculo', 'bus'],
        }
        
        for campo, keywords in campos_keywords.items():
            for keyword in keywords:
                if keyword in prompt:
                    if campo not in campos:
                        campos.append(campo)
        
        return campos
    
    def _detectar_fechas(self, prompt: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Detectar rangos de fechas en el prompt"""
        fecha_inicio = None
        fecha_fin = None
        
        # Patrón 1a: "mes de [mes1] y [mes2]" o "octubre y noviembre" (rango de meses)
        patron_rango_meses = r'(?:mes de |de )?(\w+)\s+y\s+(\w+)'
        match_rango = re.search(patron_rango_meses, prompt)
        if match_rango:
            mes1_str = match_rango.group(1).lower()
            mes2_str = match_rango.group(2).lower()
            
            # Verificar si ambos son meses válidos
            if mes1_str in self.MESES and mes2_str in self.MESES:
                year = datetime.now().year
                mes1_num = self.MESES[mes1_str]
                mes2_num = self.MESES[mes2_str]
                
                # Inicio del primer mes
                fecha_inicio = datetime(year, mes1_num, 1)
                
                # Fin del segundo mes
                if mes2_num == 12:
                    fecha_fin = datetime(year + 1, 1, 1)
                else:
                    fecha_fin = datetime(year, mes2_num + 1, 1)
                
                return fecha_inicio, fecha_fin
        
        # Patrón 1b: "mes de [mes]" (un solo mes)
        for mes_nombre, mes_num in self.MESES.items():
            if f'mes de {mes_nombre}' in prompt or f'de {mes_nombre}' in prompt:
                # Asumir año actual
                year = datetime.now().year
                fecha_inicio = datetime(year, mes_num, 1)
                # Último día del mes
                if mes_num == 12:
                    fecha_fin = datetime(year + 1, 1, 1)
                else:
                    fecha_fin = datetime(year, mes_num + 1, 1)
                return fecha_inicio, fecha_fin
        
        # Patrón 2: "del DD/MM/YYYY al DD/MM/YYYY"
        patron_rango = r'del?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+al?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})'
        match = re.search(patron_rango, prompt)
        if match:
            try:
                fecha_inicio = date_parser.parse(match.group(1), dayfirst=True)
                fecha_fin = date_parser.parse(match.group(2), dayfirst=True)
                return fecha_inicio, fecha_fin
            except:
                pass
        
        # Patrón 3: "periodo del ... al ..."
        patron_periodo = r'periodo del?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+al?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})'
        match = re.search(patron_periodo, prompt)
        if match:
            try:
                fecha_inicio = date_parser.parse(match.group(1), dayfirst=True)
                fecha_fin = date_parser.parse(match.group(2), dayfirst=True)
                return fecha_inicio, fecha_fin
            except:
                pass
        
        # Patrón 4: "últimos N días/meses"
        patron_ultimos = r'últimos?\s+(\d+)\s+(día|dias|mes|meses)'
        match = re.search(patron_ultimos, prompt)
        if match:
            cantidad = int(match.group(1))
            unidad = match.group(2)
            fecha_fin = datetime.now()
            
            if 'dia' in unidad:
                from datetime import timedelta
                fecha_inicio = fecha_fin - timedelta(days=cantidad)
            elif 'mes' in unidad:
                from dateutil.relativedelta import relativedelta
                fecha_inicio = fecha_fin - relativedelta(months=cantidad)
            
            return fecha_inicio, fecha_fin
        
        return None, None


def interpretar_prompt(prompt: str) -> Dict:
    """
    Función helper para interpretar un prompt
    """
    parser = PromptParser()
    return parser.parse(prompt)

