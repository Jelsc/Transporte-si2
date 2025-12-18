import { useState, useCallback, useEffect } from 'react';
import { chatbotService } from '@/services/chatbotService';
import type { ChatMessage, ChatResponse, ChatRecommendation } from '@/types/chatbot';
import { toast } from 'sonner';

/**
 * Hook personalizado para manejar el estado y lógica del chatbot
 */
export const useChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar el sessionId y mensajes del localStorage al iniciar
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatbot_session_id');
    const savedMessages = localStorage.getItem('chatbot_messages');
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error('Error al cargar mensajes guardados:', error);
      }
    } else {
      // Mensaje de bienvenida inicial
      setMessages([
        {
          role: 'assistant',
          content: '¡Hola! Soy tu asistente virtual de transporte. ¿En qué puedo ayudarte hoy? Puedo ayudarte a buscar viajes, consultar horarios, precios y más.',
        }
      ]);
    }
  }, []);

  // Guardar mensajes en localStorage cuando cambien
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Guardar sessionId en localStorage cuando cambie
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chatbot_session_id', sessionId);
    }
  }, [sessionId]);

  /**
   * Envía un mensaje al chatbot
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response: ChatResponse = await chatbotService.sendMessage({
        message: content.trim(),
        ...(sessionId && { session_id: sessionId }),
      });

      // Actualizar sessionId si es nuevo
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id);
      }

      // Agregar respuesta del asistente
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        metadata: {
          recommendations: response.recommendations,
          ...response.metadata,
        },
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al comunicarse con el chatbot. Intenta nuevamente.');
      
      // Agregar mensaje de error
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  /**
   * Limpia el historial de mensajes
   */
  const clearMessages = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: '¡Hola! Soy tu asistente virtual de transporte. ¿En qué puedo ayudarte hoy?',
      }
    ]);
    setSessionId(undefined);
    localStorage.removeItem('chatbot_messages');
    localStorage.removeItem('chatbot_session_id');
  }, []);

  /**
   * Finaliza la conversación actual
   */
  const endConversation = useCallback(async () => {
    if (!sessionId) return;

    try {
      await chatbotService.endConversation(sessionId);
      clearMessages();
      toast.success('Conversación finalizada');
    } catch (error) {
      console.error('Error al finalizar conversación:', error);
      toast.error('Error al finalizar conversación');
    }
  }, [sessionId, clearMessages]);

  /**
   * Envía feedback sobre una recomendación
   */
  const sendFeedback = useCallback(async (
    recommendationId: number, 
    wasHelpful: boolean
  ) => {
    try {
      await chatbotService.sendFeedback(recommendationId, wasHelpful);
      toast.success('¡Gracias por tu feedback!');
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      toast.error('Error al enviar feedback');
    }
  }, []);

  /**
   * Alterna la visibilidad del chatbot
   */
  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    messages,
    isLoading,
    isOpen,
    sessionId,
    sendMessage,
    clearMessages,
    endConversation,
    sendFeedback,
    toggleChatbot,
    setIsOpen,
  };
};
