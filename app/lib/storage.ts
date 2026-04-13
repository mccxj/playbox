import { ChatMessage } from './chat-api';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEYS = {
  API_KEY: 'playbox_api_key',
  SESSIONS: 'playbox_chat_sessions',
} as const;

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

export function saveApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
}

export function getSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function createSession(model: string): ChatSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    model,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSession(id: string): ChatSession | undefined {
  const sessions = getSessions();
  return sessions.find(s => s.id === id);
}

export function saveSession(session: ChatSession): ChatSession {
  const sessions = getSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  const updatedSession = {
    ...session,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    sessions[existingIndex] = updatedSession;
  } else {
    sessions.unshift(updatedSession);
  }

  saveSessions(sessions);
  return updatedSession;
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id);
  saveSessions(sessions);
}

export function updateSessionTitle(session: ChatSession): ChatSession {
  const firstUserMessage = session.messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 50);
    const updatedSession = {
      ...session,
      title: title.length < firstUserMessage.content.length ? title + '...' : title,
    };
    saveSession(updatedSession);
    return updatedSession;
  }
  return session;
}
