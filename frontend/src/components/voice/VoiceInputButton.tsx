import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Definiciones de tipos para Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInputButton({
  onTranscript,
  disabled = false,
  className = "",
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Verificar si el navegador soporta Web Speech API
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionConstructor() as SpeechRecognition;
      
      // Configurar reconocimiento de voz
      recognition.continuous = false; // Detener después de una pausa
      recognition.interimResults = false; // Solo resultados finales
      recognition.lang = "es-ES"; // Español

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Escuchando... Habla ahora");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => {
            const firstAlternative = result[0];
            return firstAlternative ? firstAlternative.transcript : "";
          })
          .filter((text) => text.length > 0)
          .join(" ");
        
        if (transcript) {
          onTranscript(transcript);
          setIsListening(false);
          toast.success("Texto reconocido");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Error en reconocimiento de voz:", event.error);
        setIsListening(false);
        
        let errorMessage = "Error al reconocer el audio";
        switch (event.error) {
          case "no-speech":
            errorMessage = "No se detectó habla. Intenta de nuevo.";
            break;
          case "audio-capture":
            errorMessage = "No se pudo acceder al micrófono. Verifica los permisos.";
            break;
          case "not-allowed":
            errorMessage = "Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.";
            break;
          case "network":
            errorMessage = "Error de red. Verifica tu conexión.";
            break;
        }
        
        toast.error(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignorar errores al detener durante cleanup
        }
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSupported) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.");
      return;
    }

    if (isListening) {
      // Detener reconocimiento
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Iniciar reconocimiento
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (error) {
        console.error("Error al iniciar reconocimiento:", error);
        toast.error("Error al iniciar el reconocimiento de voz");
      }
    }
  };

  if (!isSupported) {
    return null; // No mostrar el botón si no está soportado
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={toggleListening}
      disabled={disabled || !isSupported}
      className={className}
      title={isListening ? "Detener grabación" : "Iniciar dictado por voz"}
    >
      {isListening ? (
        <div className="relative">
          <MicOff className="h-4 w-4 animate-pulse" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
        </div>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}

// Extender el tipo Window para incluir SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

