// Tipos para el chatbot
export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ChatRecommendation {
  id?: number;
  recommendation_type: 'ruta' | 'viaje' | 'horario' | 'precio' | 'vehiculo' | 'general';
  data: Record<string, any>;
  confidence_score?: number;
  was_helpful?: boolean | null;
  created_at?: string;
}

export interface ChatConversation {
  id: number;
  session_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  messages?: ChatMessage[];
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  recommendations?: ChatRecommendation[];
  metadata?: Record<string, any>;
}

export interface ChatbotStats {
  total_conversations: number;
  active_conversations: number;
  total_messages: number;
  avg_messages_per_conversation: number;
}
