
export enum NexaState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export type Theme = 'Dark Neon' | 'Jarvis Blue' | 'Quantum Purple' | 'White Minimal';

export interface UserProfile {
  name: string;
  mobile: string;
  role: UserRole;
  theme: Theme;
  chatHistory: ChatMessage[];
  lastLogin: number;
}

export interface ChatMessage {
  text: string;
  sender: 'user' | 'nexa';
  timestamp: number;
}

export interface ActionPayload {
  action: 'OPEN_APP' | 'CALL' | 'ALARM' | 'WHATSAPP' | 'NONE';
  data?: any;
}

export interface AdminConfig {
  animations: boolean;
  hudSpeed: number;
}
