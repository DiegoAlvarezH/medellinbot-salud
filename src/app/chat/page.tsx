'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { EmptyState } from '@/components/shared/EmptyState';
import { Message } from '@/types';
import { mockInitialMessages, mockConversations } from '@/lib/mock-data';
import { MessageCircle, History, Sparkles, X, Hospital, Wind, Syringe, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(mockInitialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    let historyPayload: Array<{ role: Message['role']; content: string }> = [];
    setMessages((prev) => {
      const next = [...prev, userMessage];
      historyPayload = next.map((m) => ({ role: m.role, content: m.content }));
      return next;
    });
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: historyPayload,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');

      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant', // Ensure this matches usage in ChatBubble
        content: data.content || "Lo siento, hubo un error al procesar tu solicitud.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
       const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Lo siento, no pude conectar con el servidor. Por favor verifica tu conexión o configuración de API Key.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { icon: Hospital, label: 'Buscar centro de salud', query: 'Buscar centro de salud cercano' },
    { icon: Wind, label: 'Calidad del aire', query: 'Ver calidad del aire' },
    { icon: Syringe, label: 'Vacunación', query: 'Horarios de vacunación' },
    { icon: Bus, label: '¿Cómo llegar?', query: '¿Cómo llegar al hospital?' },
  ];

  const sidebarContent = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-base text-secondary-900 dark:text-white truncate">MedellinBot</h2>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">Asistente de salud</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setShowHistory(false)}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
          Accesos Rapidos
        </h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                handleSendMessage(action.query);
                setShowHistory(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors group text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <action.icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-sm font-medium text-secondary-900 dark:text-white truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
          Historial
        </h3>
        <div className="space-y-2">
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              className="w-full text-left p-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors group"
            >
              <h4 className="font-medium text-sm truncate text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {conv.title}
              </h4>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate mt-1">{conv.lastMessage}</p>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                {conv.timestamp.toLocaleDateString('es-CO')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-secondary-50 dark:bg-secondary-950">
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Responsive */}
      <AnimatePresence>
        {showHistory && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative z-30 w-full sm:w-80 h-full border-r border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 overflow-y-auto custom-scrollbar shadow-xl lg:shadow-none"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Always Visible on Large Screens */}
      <aside className="hidden lg:block w-80 h-full border-r border-secondary-200 dark:border-secondary-800 bg-white/50 dark:bg-secondary-900/50 backdrop-blur-xl overflow-y-auto custom-scrollbar">
        {sidebarContent}
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header - Mobile Only */}
        <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b border-secondary-200 dark:border-secondary-800 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-sm shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs sm:text-sm"
          >
            <History className="w-4 h-4 mr-1 sm:mr-2" />
            Menú
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-secondary-900 dark:text-white">En línea</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar chat-container min-h-0 bg-secondary-50/50 dark:bg-black/20">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex items-center justify-center p-8"
              >
                <EmptyState
                  title="¡Hola! Soy tu asistente de salud"
                  description="Pregúntame sobre servicios de salud, vacunación, calidad del aire o rutas de transporte en Medellín."
                  icon={<MessageCircle className="w-12 h-12 text-primary-500" />}
                />
              </motion.div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Responsive */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 shadow-2xl shrink-0 z-10">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSendMessage} disabled={isTyping} />
          </div>
        </div>
      </div>
    </div>
  );
}

