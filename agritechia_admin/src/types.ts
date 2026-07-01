export type Page = 'landing' | 'login' | 'signup' | 'home' | 'chat' | 'history' | 'support' | 'profile_edit';
export type UserRole = 'visitor' | 'farmer';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'audio';
  duration?: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  icon: string;
  colorClass: string;
}
