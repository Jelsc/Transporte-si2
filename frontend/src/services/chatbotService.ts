import { api } from '@/lib/api';
import type { 
  ChatRequest, 
  ChatResponse, 
  ChatConversation,
  ChatRecommendation,
  ChatbotStats
} from '@/types/chatbot';

/**
 * Servicio para interactuar con el chatbot de recomendaciones
 */
class ChatbotService {
  private baseURL = '/api/chatbot';

  /**
   * Envía un mensaje al chatbot
   */
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>(`${this.baseURL}/chat/`, data);
    return response.data;
  }

  /**
   * Obtiene el historial de conversaciones
   */
  async getHistory(): Promise<ChatConversation[]> {
    const response = await api.get<ChatConversation[]>(`${this.baseURL}/history/`);
    return response.data;
  }

  /**
   * Obtiene una conversación específica
   */
  async getConversation(sessionId: string): Promise<ChatConversation> {
    const response = await api.get<ChatConversation>(`${this.baseURL}/${sessionId}/conversation/`);
    return response.data;
  }

  /**
   * Finaliza una conversación
   */
  async endConversation(sessionId: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `${this.baseURL}/${sessionId}/end_conversation/`
    );
    return response.data;
  }

  /**
   * Envía feedback sobre una recomendación
   */
  async sendFeedback(
    recommendationId: number, 
    wasHelpful: boolean
  ): Promise<{ message: string; recommendation_id: number }> {
    const response = await api.post(
      `${this.baseURL}/${recommendationId}/feedback/`,
      { was_helpful: wasHelpful }
    );
    return response.data;
  }

  /**
   * Obtiene estadísticas del chatbot
   */
  async getStats(): Promise<ChatbotStats> {
    const response = await api.get<ChatbotStats>(`${this.baseURL}/stats/`);
    return response.data;
  }

  /**
   * Borra el historial de conversaciones
   */
  async clearHistory(): Promise<{ message: string; deleted_count: number }> {
    const response = await api.delete<{ message: string; deleted_count: number }>(
      `${this.baseURL}/clear_history/`
    );
    return response.data;
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
