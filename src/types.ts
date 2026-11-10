export type Role = 'user' | 'assistant' | 'system';

export type LanguageMode = 'auto';

export interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
  previewUrl?: string;
  isImage?: boolean;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  language?: string;
  detectedLanguage?: string;
  attachments?: AttachmentItem[];
}

export interface SystemStatus {
  status: 'online' | 'offline' | 'checking';
  name: string;
  model: string;
  hasApiKey: boolean;
  latency?: number;
  security?: {
    encryption: string;
    passwordHashing: string;
    rateLimiting: string;
    promptProtection: string;
    strictCors: string;
    sessionAuth: string;
    multilingualEngine: string;
  };
}

export interface UserSession {
  authenticated: boolean;
  user?: {
    id: string;
    username: string;
    role: 'user' | 'admin';
    createdAt: string;
    lastLoginAt?: string;
  };
  session?: {
    expiresAt: number;
    remainingHours: number;
  };
}

export interface StoredConversationSummary {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityAuditEvent {
  id: string;
  type: string;
  ip: string;
  username?: string;
  details?: string;
  timestamp: string;
}
