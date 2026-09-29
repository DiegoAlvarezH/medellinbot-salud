'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Baby, Brain, Hospital, MessageSquarePlus, PanelLeft, Pill, Syringe, Trash2, Wind, X } from 'lucide-react';
import { Composer, type ComposerHandle } from '@/components/chat/Composer';
import { MessageBubble, TypingDots } from '@/components/chat/MessageBubble';
import { LocationPill } from '@/components/location/LocationPill';
import { useLocation } from '@/components/location/LocationProvider';
import { Aurora } from '@/components/ui/aurora';
import { useConversations } from '@/hooks/use-conversations';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatStreamEvent, Conversation } from '@/types';

const SUGGESTIONS = [
  { icon: Hospital, tint: 'bg-red-soft text-red', title: 'Urgencias cerca', prompt: '¿Cuáles son los hospitales con urgencias más cercanos?' },
  { icon: Wind, tint: 'bg-teal-soft text-teal', title: 'Aire hoy', prompt: '¿Cómo está la calidad del aire hoy? ¿Puedo salir a correr?' },
  { icon: Syringe, tint: 'bg-purple-soft text-purple', title: 'Vacunas', prompt: '¿Qué vacunas le tocan a un bebé de 6 meses?' },
  { icon: Pill, tint: 'bg-green-soft text-green', title: 'Farmacias', prompt: 'Necesito una farmacia abierta ahora cerca de mí' },
  { icon: Brain, tint: 'bg-orange-soft text-orange', title: 'Salud mental', prompt: 'Me siento muy ansioso, ¿a qué línea de apoyo puedo llamar?' },
  { icon: Baby, tint: 'bg-accent-soft text-accent', title: 'Pediatría', prompt: 'Necesito un pediatra cerca' },
];

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

function groupByDay(conversations: Conversation[]) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const groups: Array<{ label: string; items: Conversation[] }> = [];
  for (const conversation of conversations) {
    const day = new Date(conversation.updatedAt).toDateString();
    const label = day === today ? 'Hoy' : day === yesterday ? 'Ayer' : dayFormatter.format(new Date(conversation.updatedAt));
    const group = groups.find((g) => g.label === label);
    if (group) group.items.push(conversation);
    else groups.push({ label, items: [conversation] });
  }
  return groups;
}

export function ChatView() {
  const { conversations, activeId, setActiveId, upsert, remove, clearAll } = useConversations();
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const searchParams = useSearchParams();
  const initialQuery = useRef(searchParams.get('q'));

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Follow the stream only while the reader is at the bottom; never yank them back up.
  useEffect(() => {
    if (atBottom) scrollToBottom(busy ? 'auto' : 'smooth');
  }, [messages, atBottom, busy, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const send = useCallback(
    async (text: string) => {
      if (busy) return;
      const conversationId = activeId ?? newId();
      if (!activeId) setActiveId(conversationId);

      const userMessage: ChatMessage = { id: newId(), role: 'user', content: text, createdAt: new Date().toISOString() };
      const history = [...messages, userMessage];
      let assistant: ChatMessage = { id: newId(), role: 'assistant', content: '', createdAt: new Date().toISOString() };

      setMessages([...history, assistant]);
      setBusy(true);
      setStreamingId(assistant.id);
      setAtBottom(true);

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
            location: location.position ?? undefined,
          }),
        });
        if (response.status === 429) throw new Error('rate-limit');
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
        const e = error as Error;
        if (e.name !== 'AbortError') {
          apply({
            content:
              e.message === 'rate-limit'
                ? 'Enviaste muchos mensajes seguidos. Espera un minuto e inténtalo de nuevo.'
                : 'No pude conectarme con el servidor. Revisa tu conexión e inténtalo de nuevo.',
          });
        }
      } finally {
        if (!assistant.content) apply({ content: '_Respuesta detenida._' });
        setBusy(false);
        setStreamingId(null);
        abortRef.current = null;
        upsert(conversationId, [...history, assistant]);
      }
    },
    [activeId, busy, location.position, messages, setActiveId, upsert],
  );

  // Deep links such as /chat?q=… start the conversation right away.
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
    setTimeout(() => composerRef.current?.focus(), 50);
  };

  const openConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;
    abortRef.current?.abort();
    setActiveId(id);
    setMessages(conversation.messages);
    setSidebarOpen(false);
    setAtBottom(true);
  };

  const title = conversations.find((c) => c.id === activeId)?.title ?? 'Asistente de salud';
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={startNew}
          className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-bg-elevated px-3 text-[15px] font-medium text-label shadow-card transition-colors hover:bg-fill"
        >
          <MessageSquarePlus className="size-[18px] text-accent" aria-hidden="true" />
          Nueva conversación
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="grid size-10 place-items-center rounded-full hover:bg-fill lg:hidden"
          aria-label="Cerrar historial"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav aria-label="Conversaciones recientes" className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-3">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] leading-relaxed text-label-tertiary">
            Aquí aparecerán tus conversaciones.
            <br />
            Se guardan solo en este dispositivo.
          </p>
        ) : (
          groupByDay(conversations).map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-label-tertiary uppercase">{group.label}</p>
              <ul>
                {group.items.map((conversation) => (
                  <li key={conversation.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => openConversation(conversation.id)}
                      aria-current={conversation.id === activeId ? 'true' : undefined}
                      className={cn(
                        'w-full truncate rounded-xl px-3 py-2 pr-9 text-left text-[14px] transition-colors',
                        conversation.id === activeId ? 'bg-accent-soft font-medium text-accent' : 'text-label hover:bg-fill',
                      )}
                    >
                      {conversation.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(conversation.id)}
                      className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-label-tertiary opacity-100 hover:text-red focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                      aria-label={`Eliminar "${conversation.title}"`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      {conversations.length > 0 && (
        <div className="border-t border-separator p-3">
          <button type="button" onClick={clearAll} className="w-full rounded-xl px-3 py-2 text-left text-[13px] text-red hover:bg-red-soft">
            Borrar todo el historial
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex h-[calc(100dvh-3rem)] overflow-hidden bg-bg">
      <aside className="hidden w-72 shrink-0 border-r border-separator bg-bg-secondary/70 lg:block">{sidebar}</aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-[1101] w-[86%] max-w-80 bg-bg-secondary shadow-float lg:hidden"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="relative flex min-w-0 flex-1 flex-col" aria-label="Conversación">
        <header className="glass z-10 flex h-12 shrink-0 items-center gap-2 border-b border-separator px-2 sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid size-9 place-items-center rounded-full text-label hover:bg-fill lg:hidden"
            aria-label="Abrir historial"
          >
            <PanelLeft className="size-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold tracking-[-0.01em] lg:text-left">{title}</h1>
          <LocationPill className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={startNew}
            className="grid size-9 place-items-center rounded-full text-accent hover:bg-fill"
            aria-label="Nueva conversación"
            title="Nueva conversación"
          >
            <MessageSquarePlus className="size-5" />
          </button>
        </header>

        <div ref={scrollRef} onScroll={onScroll} className="scrollbar-thin relative flex-1 overflow-y-auto overscroll-contain">
          {messages.length === 0 ? (
            <div className="relative flex min-h-full flex-col">
              <Aurora className="opacity-70" />
              <div className="relative mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-4 py-10 sm:px-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <p className="text-[15px] font-medium text-accent">Hola 👋</p>
                  <h2 className="mt-1 text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[44px]">¿En qué te puedo ayudar hoy?</h2>
                  <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-label-secondary sm:text-[17px]">
                    Respondo con datos oficiales de Medellín: red de salud, calidad del aire, clima, vacunación y líneas de ayuda.
                  </p>
                  <LocationPill className="mt-4 sm:hidden" />
                </motion.div>

                <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  {SUGGESTIONS.map(({ icon: Icon, tint, title: label, prompt }, index) => (
                    <motion.button
                      key={label}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index + 0.1 }}
                      onClick={() => send(prompt)}
                      className="glass-card group rounded-[20px] p-3.5 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:p-4"
                    >
                      <span className={cn('grid size-9 place-items-center rounded-xl', tint)}>
                        <Icon className="size-[18px]" aria-hidden="true" />
                      </span>
                      <span className="mt-3 block text-[15px] font-semibold">{label}</span>
                      <span className="mt-0.5 line-clamp-2 hidden text-[13px] text-label-secondary sm:block">{prompt}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 pt-6 pb-10 sm:px-6">
              {messages.map((message) =>
                message.id === streamingId && !message.content && !message.cards ? (
                  <TypingDots key={message.id} />
                ) : (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    streaming={message.id === streamingId}
                    isLast={message.id === lastAssistantId}
                    onFollowUp={send}
                  />
                ),
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {!atBottom && messages.length > 0 && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                setAtBottom(true);
                scrollToBottom();
              }}
              className="glass-card absolute bottom-28 left-1/2 z-10 grid size-10 -translate-x-1/2 place-items-center rounded-full text-label shadow-float"
              aria-label="Ir al último mensaje"
            >
              <ArrowDown className="size-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {location.status === 'denied' && messages.length === 0 && (
          <p className="mx-auto max-w-[760px] px-4 pb-1 text-center text-[12px] text-orange">
            Sin permiso de ubicación: dime tu barrio o comuna para recomendarte lo más cercano.
          </p>
        )}
        <Composer ref={composerRef} onSend={send} onStop={() => abortRef.current?.abort()} busy={busy} />
      </section>
    </div>
  );
}
