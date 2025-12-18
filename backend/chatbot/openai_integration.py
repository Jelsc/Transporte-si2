"""
Ejemplo de integración con OpenAI para el chatbot.
Este archivo es opcional y solo se usa si decides integrar IA externa.

Para usar:
1. pip install openai
2. Configurar OPENAI_API_KEY en .env
3. Importar y usar en services.py
"""

import os
from typing import Dict, List, Any
import json

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI no está instalado. Ejecuta: pip install openai")


class OpenAIChatbotIntegration:
    """
    Integración opcional con OpenAI para análisis de intención
    y generación de respuestas más inteligentes.
    """
    
    def __init__(self):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI no está instalado")
        
        # Intentar usar Groq primero, luego OpenAI
        self.api_key = os.getenv('GROQ_API_KEY') or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("GROQ_API_KEY o OPENAI_API_KEY no configurada en .env")
        
        # Configurar base_url para Groq si se usa GROQ_API_KEY
        base_url = "https://api.groq.com/openai/v1" if os.getenv('GROQ_API_KEY') else None
        
        # Usar el nuevo cliente de OpenAI 1.0+ (compatible con Groq)
        if base_url:
            self.client = OpenAI(api_key=self.api_key, base_url=base_url)
            self.model = "llama-3.3-70b-versatile"  # Modelo de Groq
            print("✅ Usando Groq para el chatbot")
        else:
            self.client = OpenAI(api_key=self.api_key)
            self.model = "gpt-3.5-turbo"  # Modelo de OpenAI
            print("✅ Usando OpenAI para el chatbot")
    
    def analyze_intent(self, message: str, context: Dict = None) -> Dict[str, Any]:
        """
        Usa GPT para analizar la intención del usuario.
        
        Args:
            message: El mensaje del usuario
            context: Contexto adicional (conversación previa, etc.)
        
        Returns:
            Dict con type, entities, confidence
        """
        system_prompt = """Eres un asistente de análisis de intenciones para un sistema de transporte.
Tu trabajo es analizar mensajes de usuarios y determinar su intención.

Tipos de intención posibles:
- buscar_ruta: Usuario quiere encontrar un viaje
- consultar_horarios: Usuario pregunta por horarios
- consultar_precio: Usuario pregunta por precios
- buscar_vehiculo: Usuario pregunta por vehículos
- ayuda: Usuario necesita ayuda general
- general: Cualquier otra cosa

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después.
Estructura JSON requerida:
{
    "type": "tipo_de_intencion",
    "confidence": 0.9,
    "entities": {
        "ubicaciones": ["ciudad1", "ciudad2"],
        "fecha": "YYYY-MM-DD"
    }
}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            result = response.choices[0].message.content.strip()
            
            # Intentar extraer JSON si viene con texto adicional
            if not result.startswith('{'):
                # Buscar el primer { y el último }
                start = result.find('{')
                end = result.rfind('}') + 1
                if start != -1 and end > start:
                    result = result[start:end]
            
            intent = json.loads(result)
            return intent
            
        except Exception as e:
            print(f"Error en OpenAI: {e}")
            print(f"Respuesta recibida: {result if 'result' in locals() else 'N/A'}")
            # Fallback a detección simple
            return {
                'type': 'general',
                'confidence': 0.5,
                'entities': {}
            }
    
    def generate_response(
        self, 
        intent: Dict, 
        user_message: str,
        available_data: Dict
    ) -> str:
        """
        Genera una respuesta usando GPT basada en la intención y datos disponibles.
        
        Args:
            intent: La intención detectada
            user_message: Mensaje original del usuario
            available_data: Datos disponibles (viajes, horarios, etc.)
        
        Returns:
            Respuesta generada
        """
        system_prompt = f"""Eres un asistente virtual amigable de un sistema de transporte en Bolivia.

Intención detectada: {intent['type']}
Datos disponibles: {json.dumps(available_data, ensure_ascii=False)}

Genera una respuesta natural, amigable y útil en español.
Si hay viajes disponibles, preséntalos de forma clara.
Si no hay información, ofrece alternativas.
Sé breve pero informativo (máximo 200 palabras).
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generando respuesta: {e}")
            return "Lo siento, hubo un error al procesar tu solicitud. ¿Puedes intentar de nuevo?"
    
    def extract_entities(self, message: str) -> Dict[str, List[str]]:
        """
        Extrae entidades del mensaje (ubicaciones, fechas, etc.).
        """
        system_prompt = """Extrae las siguientes entidades del mensaje:
- Ubicaciones/ciudades mencionadas
- Fechas mencionadas
- Precios mencionados
- Cualquier otra información relevante

Responde con un JSON:
{
    "ubicaciones": ["ciudad1", "ciudad2"],
    "fechas": ["fecha1"],
    "otros": []
}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.2,
                max_tokens=150
            )
            
            result = response.choices[0].message.content
            entities = json.loads(result)
            return entities
            
        except Exception as e:
            print(f"Error extrayendo entidades: {e}")
            return {"ubicaciones": [], "fechas": [], "otros": []}


# Ejemplo de uso en services.py:
"""
from .openai_integration import OpenAIChatbotIntegration

class ChatbotService:
    def __init__(self, user):
        self.user = user
        
        # Intentar usar OpenAI si está configurado
        try:
            self.ai = OpenAIChatbotIntegration()
            self.use_ai = True
        except (ImportError, ValueError):
            self.use_ai = False
            print("Usando análisis basado en reglas")
    
    def _analyze_intent(self, message: str) -> Dict[str, Any]:
        if self.use_ai:
            return self.ai.analyze_intent(message)
        else:
            # Tu implementación actual basada en reglas
            return self._analyze_intent_rules(message)
"""


# Ejemplo de testing
if __name__ == "__main__":
    try:
        ai = OpenAIChatbotIntegration()
        
        # Test 1: Analizar intención
        print("=== Test 1: Análisis de Intención ===")
        intent = ai.analyze_intent("Quiero ir de La Paz a Cochabamba mañana")
        print(json.dumps(intent, indent=2, ensure_ascii=False))
        
        # Test 2: Extraer entidades
        print("\n=== Test 2: Extracción de Entidades ===")
        entities = ai.extract_entities("Viajo desde Santa Cruz hasta Sucre el 25 de diciembre")
        print(json.dumps(entities, indent=2, ensure_ascii=False))
        
        # Test 3: Generar respuesta
        print("\n=== Test 3: Generar Respuesta ===")
        response = ai.generate_response(
            intent={'type': 'buscar_ruta', 'confidence': 0.9},
            user_message="Quiero viajar a Cochabamba",
            available_data={
                'viajes': [
                    {'origen': 'La Paz', 'destino': 'Cochabamba', 'precio': 50, 'fecha': '2024-01-15'}
                ]
            }
        )
        print(response)
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nAsegúrate de:")
        print("1. pip install openai")
        print("2. Configurar OPENAI_API_KEY en .env")
