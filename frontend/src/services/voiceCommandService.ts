/**
 * Servicio para procesamiento de voz usando Google AI (Gemini) API
 */

// Configuración de Google API (usar variables de entorno)
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'; // modelo solicitado

// Declaración de tipos para Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

interface VoiceCommandResult {
  tipo: 'pdf' | 'excel' | 'imagen' | null;
  categoria: 'viajes' | 'encomiendas' | 'conductores' | 'vehiculos' | 'financiero' | 'general' | null;
  titulo?: string | undefined;
  fechaInicio?: string | undefined;
  fechaFin?: string | undefined;
  confidence: number;
  rawTranscript: string;
}

class VoiceCommandService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private googleApiKey: string;

  constructor() {
    this.googleApiKey = GOOGLE_API_KEY || '';
    this.initializeSpeechRecognition();
  }

  /**
   * Inicializar reconocimiento de voz del navegador
   */
  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition no está disponible en este navegador');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'es-ES'; // Español
      this.recognition.maxAlternatives = 1;
    }
  }

  /**
   * Verificar si el reconocimiento de voz está disponible
   */
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  /**
   * Iniciar escucha de comando de voz
   */
  async startListening(): Promise<string> {
    if (!this.recognition) {
      throw new Error('Reconocimiento de voz no disponible');
    }

    if (this.isListening) {
      throw new Error('Ya está escuchando');
    }

    return new Promise((resolve, reject) => {
      this.isListening = true;

      this.recognition!.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Transcripción:', transcript);
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition!.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        this.isListening = false;
        reject(new Error(`Error de reconocimiento: ${event.error}`));
      };

      this.recognition!.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition!.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  /**
   * Detener escucha
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Procesar comando de voz usando Google Gemini para interpretar intención
   */
  async processVoiceCommand(transcript: string): Promise<VoiceCommandResult> {
    try {
      // Usar Google AI (Gemini) para interpretar el comando
      const interpretation = await this.interpretWithGoogleAI(transcript);
      
      return {
        ...interpretation,
        rawTranscript: transcript,
      };
    } catch (error) {
      console.error('Error al procesar comando:', error);
      // Fallback: procesamiento local simple
      return this.processLocally(transcript);
    }
  }

  /**
   * Interpretar comando usando Google AI (Gemini) API
   */
  private async interpretWithGoogleAI(transcript: string): Promise<Omit<VoiceCommandResult, 'rawTranscript'>> {
    if (!this.googleApiKey) {
      console.warn('⚠️ API Key de Google no configurada, usando procesamiento local');
      throw new Error('API Key no configurada');
    }

  // Usar endpoint de Gemini pedido por el usuario (gemini-2.0-flash)
  const apiUrl = `${GEMINI_API_URL}?key=${this.googleApiKey}`;

    const prompt = `Eres un asistente para interpretar comandos de voz para generar reportes.

El usuario dijo: "${transcript}"

Extrae la siguiente información del comando:
1. Tipo de reporte: pdf, excel, o imagen
2. Categoría: viajes, encomiendas, conductores, vehiculos, financiero, o general
3. Título del reporte (si lo menciona)
4. Fecha inicio (si la menciona, formato YYYY-MM-DD)
5. Fecha fin (si la menciona, formato YYYY-MM-DD)

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en este formato exacto (sin markdown, sin comentarios):
{
  "tipo": "pdf",
  "categoria": "viajes",
  "titulo": "Reporte mensual",
  "fechaInicio": "2025-10-01",
  "fechaFin": "2025-10-31",
  "confidence": 0.95
}

Si no se menciona algo, usa null. La confidence debe ser entre 0 y 1.`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error de Google AI:', errorData);
        
        // Manejar diferentes tipos de errores
        if (response.status === 429) {
          console.warn('⚠️ Límite de cuota de Google AI excedido, usando procesamiento local');
        } else if (response.status === 403) {
          console.warn('⚠️ API Key inválida o restricciones de acceso, usando procesamiento local');
        }
        
        throw new Error(`Error en API de Google AI: ${response.status}`);
      }

      const data = await response.json();
      // Manejar varias formas de respuesta:
      // - paid gemini: candidates[0].content.parts[0].text
      // - text-bison: candidates[0].output
      // - otros: candidates[0].content.text
      const generatedText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.output ||
        data?.candidates?.[0]?.content?.text ||
        '{}';
      
      console.log('🤖 Respuesta de Google AI:', generatedText);
      
      // Extraer JSON del texto (puede venir con markdown o texto adicional)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : generatedText;
      
      const result = JSON.parse(jsonText);
      
      return {
        tipo: result.tipo || null,
        categoria: result.categoria || null,
        titulo: result.titulo || undefined,
        fechaInicio: result.fechaInicio || undefined,
        fechaFin: result.fechaFin || undefined,
        confidence: result.confidence || 0.5,
      };
    } catch (error) {
      console.error('Error al llamar a Google AI:', error);
      throw error;
    }
  }

  /**
   * Procesamiento local simple como fallback
   */
  private processLocally(transcript: string): VoiceCommandResult {
    const lowerText = transcript.toLowerCase();
    
    // Detectar tipo
    let tipo: VoiceCommandResult['tipo'] = null;
    if (lowerText.includes('pdf')) tipo = 'pdf';
    else if (lowerText.includes('excel')) tipo = 'excel';
    else if (lowerText.includes('imagen') || lowerText.includes('gráfico')) tipo = 'imagen';
    else tipo = 'pdf'; // Default
    
    // Detectar categoría
    let categoria: VoiceCommandResult['categoria'] = null;
    if (lowerText.includes('viaje')) categoria = 'viajes';
    else if (lowerText.includes('encomienda')) categoria = 'encomiendas';
    else if (lowerText.includes('conductor')) categoria = 'conductores';
    else if (lowerText.includes('vehículo') || lowerText.includes('vehiculo')) categoria = 'vehiculos';
    else if (lowerText.includes('financiero') || lowerText.includes('pago')) categoria = 'financiero';
    else if (lowerText.includes('general') || lowerText.includes('dashboard')) categoria = 'general';
    
    // Detectar fechas simples
    let fechaInicio: string | undefined;
    let fechaFin: string | undefined;
    
    const hoy = new Date();
    if (lowerText.includes('este mes') || lowerText.includes('mensual')) {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fechaInicio = primerDia.toISOString().split('T')[0];
      fechaFin = hoy.toISOString().split('T')[0];
    } else if (lowerText.includes('esta semana') || lowerText.includes('semanal')) {
      const primerDia = new Date(hoy);
      primerDia.setDate(hoy.getDate() - hoy.getDay());
      fechaInicio = primerDia.toISOString().split('T')[0];
      fechaFin = hoy.toISOString().split('T')[0];
    } else if (lowerText.includes('hoy') || lowerText.includes('diario')) {
      fechaInicio = hoy.toISOString().split('T')[0];
      fechaFin = hoy.toISOString().split('T')[0];
    }
    
    return {
      tipo,
      categoria,
      titulo: undefined,
      fechaInicio,
      fechaFin,
      confidence: 0.6,
      rawTranscript: transcript,
    };
  }

  /**
   * Convertir resultado a parámetros de reporte
   */
  toReportParams(result: VoiceCommandResult): {
    tipo: string;
    categoria: string;
    titulo?: string | undefined;
    fecha_inicio?: string | undefined;
    fecha_fin?: string | undefined;
  } | null {
    if (!result.tipo || !result.categoria) {
      return null;
    }

    const params: any = {
      tipo: result.tipo,
      categoria: result.categoria,
    };
    
    if (result.titulo) {
      params.titulo = result.titulo;
    }
    
    if (result.fechaInicio) {
      params.fecha_inicio = result.fechaInicio;
    }
    
    if (result.fechaFin) {
      params.fecha_fin = result.fechaFin;
    }

    return params;
  }
}

export const voiceCommandService = new VoiceCommandService();
export type { VoiceCommandResult };
