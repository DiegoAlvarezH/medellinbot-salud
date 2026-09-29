'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChatMessage, Conversation } from '@/types';

const STORAGE_KEY = 'medellinbot:conversations:v2';
const MAX_CONVERSATIONS = 30;

function load(): Conversation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Conversation[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(conversations: Conversation[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
  } catch {
    // Private mode or quota exceeded: history simply is not persisted.
  }
}

function titleFrom(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')?.content ?? 'Nueva conversación';
  return first.length > 48 ? `${first.slice(0, 47)}…` : first;
}

/** Conversation history kept only in this browser (never sent anywhere but /api/chat). */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setConversations(load());
  }, []);

  const upsert = useCallback((id: string, messages: ChatMessage[]) => {
    setConversations((prev) => {
      const conversation: Conversation = { id, title: titleFrom(messages), updatedAt: new Date().toISOString(), messages };
      const next = [conversation, ...prev.filter((c) => c.id !== id)];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      save(next);
      return next;
    });
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const clearAll = useCallback(() => {
    save([]);
    setConversations([]);
    setActiveId(null);
  }, []);

  return { conversations, activeId, setActiveId, upsert, remove, clearAll };
}
