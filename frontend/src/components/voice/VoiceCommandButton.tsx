// frontend/src/components/voice/VoiceCommandButton.tsx
import { useState } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { voiceCommandService, type VoiceCommandResult } from '@/services/voiceCommandService';
import { cn } from '@/lib/utils';

interface VoiceCommandButtonProps {
  onCommandDetected: (result: VoiceCommandResult) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceCommandButton({ onCommandDetected, disabled, className }: VoiceCommandButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  // Verificar disponibilidad
  const isAvailable = voiceCommandService.isAvailable();

  const handleVoiceCommand = async () => {
    if (!isAvailable) {
      setError('Reconocimiento de voz no disponible en este navegador');
      setStatus('error');
      return;
    }

    try {
      setStatus('listening');
      setIsListening(true);
      setError('');
      setTranscript('');

      // Escuchar comando
      const voiceTranscript = await voiceCommandService.startListening();
      setTranscript(voiceTranscript);
      setIsListening(false);
      
      // Procesar con IA
      setStatus('processing');
      setIsProcessing(true);
      
      const result = await voiceCommandService.processVoiceCommand(voiceTranscript);
      
      setIsProcessing(false);
      setStatus('success');
      
      // Notificar al componente padre
      onCommandDetected(result);
      
      // Reset después de 2 segundos
      setTimeout(() => {
        setStatus('idle');
        setTranscript('');
      }, 2000);

    } catch (err) {
      console.error('Error en comando de voz:', err);
      setIsListening(false);
      setIsProcessing(false);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      setTimeout(() => {
        setStatus('idle');
        setError('');
      }, 3000);
    }
  };

  const handleStop = () => {
    voiceCommandService.stopListening();
    setIsListening(false);
    setIsProcessing(false);
    setStatus('idle');
  };

  if (!isAvailable) {
    return (
      <div className="text-sm text-muted-foreground">
        🎤 Reconocimiento de voz no disponible en este navegador
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          onClick={isListening ? handleStop : handleVoiceCommand}
          disabled={disabled || isProcessing}
          variant={isListening ? "destructive" : "outline"}
          size="lg"
          className={cn(
            "relative overflow-hidden transition-all",
            isListening && "animate-pulse"
          )}
        >
          {isListening ? (
            <>
              <MicOff className="mr-2 h-5 w-5" />
              Detener
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Procesando...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              ¡Comando detectado!
            </>
          ) : status === 'error' ? (
            <>
              <XCircle className="mr-2 h-5 w-5 text-red-500" />
              Error
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              🎤 Comando de Voz
            </>
          )}
        </Button>

        {/* Indicador visual de estado */}
        {status !== 'idle' && (
          <div className="flex items-center gap-2">
            {status === 'listening' && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-600">Escuchando...</span>
              </div>
            )}
            {status === 'processing' && (
              <div className="flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-blue-600">Procesando con IA...</span>
              </div>
            )}
            {status === 'success' && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">¡Listo!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transcripción y estado */}
      {(transcript || error) && (
        <Card className={cn(
          "border-2",
          status === 'success' && "border-green-200 bg-green-50",
          status === 'error' && "border-red-200 bg-red-50",
          status === 'processing' && "border-blue-200 bg-blue-50"
        )}>
          <CardContent className="p-3">
            {error ? (
              <div className="text-sm text-red-600">
                <strong>Error:</strong> {error}
              </div>
            ) : (
              <div className="text-sm">
                <strong className="text-gray-700">Comando:</strong>{' '}
                <span className="text-gray-900">{transcript}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ayuda */}
      {status === 'idle' && (
        <div className="text-xs text-muted-foreground">
          💡 <strong>Ejemplos:</strong> "Generar reporte PDF de vehículos", "Reporte de viajes en Excel del mes", 
          "Crear gráfico de encomiendas"
        </div>
      )}
    </div>
  );
}
