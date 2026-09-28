'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Hospital, MessageSquarePlus, PanelLeft, Pill, Syringe, Trash2, Wind, Brain, X } from 'lucide-react';
import { Composer } from '@/components/chat/Composer';
import { MessageBubble, TypingDots } from '@/components/chat/MessageBubble';
import { useConversations } from '@/hooks/use-conversations';
import { useGeolocation } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatStreamEvent } from '@/types';

const SUGGESTIONS = [
  { icon: Hospital, title: 'Urgencias cerca', prompt: '¿Cuáles son los hospitales con urgencias más cercanos?' },
  { icon: Wind, title: 'Aire hoy', prompt: '¿Cómo está la calidad del aire hoy? ¿Puedo salir a correr?' },
  { icon: Syringe, title: 'Vacunas', prompt: '¿Qué vacunas le tocan a un bebé de 6 meses y dónde se aplican?' },
  { icon: Pill, title: 'Farmacias', prompt: 'Necesito una farmacia abierta ahora' },
  { icon: Brain, title: 'Salud mental', prompt: 'Me siento muy ansioso, ¿a qué línea de apoyo puedo llamar?' },
  { icon: Baby, title: 'Síntomas', prompt: 'Mi hijo tiene fiebre alta, ¿voy a urgencias o pido cita?' },
];

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()));

export function ChatView() {
  const { conversations, activeId, setActiveId, upsert, remove, clearAll } = useConversations();
  const geo = useGeolocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const initialQuery = useRef(searchParams.get('q'));

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      if (busy) return;
      const conversationId = activeId ?? newId();
      if (!activeId) setActiveId(conversationId);

      const userMessage: ChatMessage = { id: newId(), role: 'user', content: text, createdAt: new Date().toISOString() };
      const assistantId = newId();
      const history = [...messages, userMessage];
      let assistant: ChatMessage = { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() };

      setMessages([...history, assistant]);
      setBusy(true);
      setStreamingId(assistantId);

      const controller = new AbortController();
      abortRef.current = controller;

      const apply = (patch: Partial<ChatMessage>) => {
        assistant = { ...assistant, ...patch };
        setMessages([...history, assistant]);
      };

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history.slice(-12).map(({ role, content }) => ({ role, content })),
            location: geo.position ?? undefined,
          }),
        });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as ChatStreamEvent;
            if (event.type === 'meta') apply({ cards: event.cards, source: event.source });
            else if (event.type === 'delta') apply({ content: assistant.content + event.text });
            else if (event.type === 'error') apply({ content: assistant.content || event.message });
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          apply({ content: 'No pude conectarme con el servidor. Revisa tu conexión e inténtalo de nuevo.' });
        }
      } finally {
        if (!assistant.content) apply({ content: 'Respuesta detenida.' });
        setBusy(false);
        setStreamingId(null);
        abortRef.current = null;
        upsert(conversationId, [...history, assistant]);
      }
    },
    [activeId, busy, geo.position, messages, setActiveId, upsert],
  );

  // Deep links such as /chat?q=… from the home page start the conversation right away.
  useEffect(() => {
    const q = initialQuery.current;
    if (q) {
      initialQuery.current = null;
      void send(q);
    }
  }, [send]);

  const startNew = () => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const openConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;
    abortRef.current?.abort();
    setActiveId(id);
    setMessages(conversation.messages);
    setSidebarOpen(false);
  };

  const toggleLocation = () => (geo.position ? geo.clear() : geo.locate());

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3">
        <button
          type="button"
          onClick={startNew}
          className="flex h-9 flex-1 items-center gap-2 rounded-xl px-3 text-[15px] font-medium text-label hover:bg-fill"
        >
          <MessageSquarePlus className="size-[18px] text-accent" aria-hidden="true" />
          Nueva conversación
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="grid size-9 place-items-center rounded-full hover:bg-fill lg:hidden"
          aria-label="Cerrar historial"
        >
          <X className="size-5" />
        </button>
      </div>
      <p className="px-6 pt-2 pb-1 text-[12px] font-semibold text-label-tertiary">Recientes</p>
      <ul className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-3">
        {conversations.length === 0 && (
          <li className="px-3 py-2 text-[13px] text-label-tertiary">Tus conversaciones se guardan solo en este dispositivo.</li>
        )}
        {conversations.map((conversation) => (
          <li key={conversation.id} className="group relative">
            <button
              type="button"
              onClick={() => openConversation(conversation.id)}
              className={cn(
                'w-full truncate rounded-xl px-3 py-2 pr-9 text-left text-[14px]',
                conversation.id === activeId ? 'bg-fill font-medium text-label' : 'text-label-secondary hover:bg-fill',
              )}
            >
              {conversation.title}
            </button>
            <button
              type="button"
              onClick={() => remove(conversation.id)}
              className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-label-tertiary opacity-0 group-hover:opacity-100 hover:text-red focus:opacity-100"
              aria-label={`Eliminar "${conversation.title}"`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {conversations.length > 0 && (
        <button type="button" onClick={clearAll} className="m-3 rounded-xl px-3 py-2 text-left text-[13px] text-red hover:bg-red-soft">
          Borrar historial
        </button>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-3rem)] bg-bg">
      <aside className="hidden w-72 shrink-0 border-r border-separator bg-bg-secondary lg:block">{sidebar}</aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-80 bg-bg-secondary pt-12 shadow-float lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="flex min-w-0 flex-1 flex-col" aria-label="Conversación">
        <div className="flex items-center justify-between px-3 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid size-9 place-items-center rounded-full hover:bg-fill"
            aria-label="Abrir historial"
          >
            <PanelLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={startNew}
            className="grid size-9 place-items-center rounded-full hover:bg-fill"
            aria-label="Nueva conversación"
          >
            <MessageSquarePlus className="size-5 text-accent" />
          </button>
        </div>

        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-[760px] flex-col justify-center px-4 py-10">
              <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.025em] sm:text-[44px]">
                ¿En qué te puedo
                <br />
                <span className="text-label-secondary">ayudar hoy?</span>
              </h1>
              <p className="mt-3 max-w-md text-[17px] text-label-secondary">
                Respondo con datos abiertos de Medellín: red de salud, calidad del aire, clima y vacunación.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => send(prompt)}
                    className="rounded-card bg-bg-secondary p-4 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Icon className="size-5 text-accent" aria-hidden="true" />
                    <p className="mt-3 text-[15px] font-semibold">{title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-label-secondary">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 py-6">
              {messages.map((message) =>
                message.id === streamingId && !message.content && !message.cards ? (
                  <TypingDots key={message.id} />
                ) : (
                  <MessageBubble key={message.id} message={message} streaming={message.id === streamingId} />
                ),
              )}
            </div>
          )}
        </div>

        {geo.status === 'denied' && (
          <p className="mx-auto max-w-[760px] px-4 text-center text-[12px] text-orange">
            No tengo permiso para ver tu ubicación. Puedes decirme tu barrio o comuna en el mensaje.
          </p>
        )}
        <Composer
          onSend={send}
          onStop={() => abortRef.current?.abort()}
          busy={busy}
          locationActive={Boolean(geo.position)}
          locating={geo.status === 'locating'}
          onToggleLocation={toggleLocation}
        />
      </section>
    </div>
  );
}
