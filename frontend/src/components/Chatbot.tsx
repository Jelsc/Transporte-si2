import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatbot } from '@/hooks/useChatbot';
import type { ChatMessage, ChatRecommendation } from '@/types/chatbot';
import { cn } from '@/lib/utils';

interface ChatbotProps {
  className?: string;
}

export const Chatbot = ({ className }: ChatbotProps) => {
  const {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    clearMessages,
    sendFeedback,
    toggleChatbot,
    setIsOpen,
  } = useChatbot();

  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleClearChat = () => {
    if (confirm('¿Estás seguro de que quieres borrar el historial de chat?')) {
      clearMessages();
    }
  };

  const renderRecommendations = (message: ChatMessage) => {
    const recommendations = message.metadata?.recommendations as ChatRecommendation[] | undefined;
    
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id || index}
            recommendation={rec}
            onFeedback={sendFeedback}
          />
        ))}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChatbot}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
          'bg-primary hover:bg-primary/90 transition-all',
          className
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50',
        'flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Asistente Virtual</h3>
            <p className="text-xs opacity-90">Estamos aquí para ayudarte</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleClearChat}
            title="Borrar historial"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={toggleChatbot}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && renderRecommendations(message)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

// Componente para mostrar recomendaciones
interface RecommendationCardProps {
  recommendation: ChatRecommendation;
  onFeedback: (id: number, helpful: boolean) => void;
}

const RecommendationCard = ({ recommendation, onFeedback }: RecommendationCardProps) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    if (recommendation.id && !feedbackGiven) {
      onFeedback(recommendation.id, helpful);
      setFeedbackGiven(true);
    }
  };

  const renderRecommendationContent = () => {
    switch (recommendation.recommendation_type) {
      case 'viaje':
        return (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-medium">
                {recommendation.data.origen} → {recommendation.data.destino}
              </span>
              <Badge variant="secondary" className="text-xs">
                Bs. {recommendation.data.precio}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              <p>📅 {new Date(recommendation.data.fecha).toLocaleDateString('es-BO')}</p>
              <p>🕐 {recommendation.data.hora.slice(0, 5)}</p>
              <p>💺 {recommendation.data.asientos_disponibles} asientos disponibles</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-xs">
            <pre className="whitespace-pre-wrap text-muted-foreground">
              {JSON.stringify(recommendation.data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <Card className="p-3 bg-card border">
      {renderRecommendationContent()}
      
      {/* Feedback buttons */}
      {recommendation.id && !feedbackGiven && (
        <div className="flex gap-2 mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleFeedback(true)}
          >
            <ThumbsUp className="h-3 w-3" />
            Útil
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleFeedback(false)}
          >
            <ThumbsDown className="h-3 w-3" />
            No útil
          </Button>
        </div>
      )}
      
      {feedbackGiven && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          Gracias por tu feedback
        </p>
      )}
    </Card>
  );
};

export default Chatbot;
