'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

const suggestions = [
  '🏥 Centro de salud cercano',
  '🌫️ Calidad del aire hoy',
  '💉 Vacunación COVID-19',
  '🚌 Ruta al hospital',
];

export function ChatInput({ onSend, disabled = false, className }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      setShowSuggestions(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={cn('p-4', className)}>
      {/* Suggestions with better animation */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 text-sm bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 text-primary-700 dark:text-primary-300 rounded-full hover:from-primary-100 hover:to-secondary-100 dark:hover:from-primary-900/40 dark:hover:to-secondary-900/40 transition-all hover:scale-105 border border-primary-200 dark:border-primary-800"
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area with enhanced design */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Escribe tu pregunta aquí... (Shift + Enter para nueva línea)"
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl border-2 bg-white dark:bg-gray-800 px-5 py-3 pr-12 text-sm transition-all",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus-visible:outline-none input-focus",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "max-h-32 overflow-y-auto custom-scrollbar",
                "border-gray-200 dark:border-gray-700"
              )}
              style={{
                minHeight: '50px',
              }}
            />
            {/* Character indicator */}
            {message.length > 0 && (
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {message.length}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className={cn(
            "h-[50px] w-[50px] rounded-full flex-shrink-0 shadow-lg",
            "bg-primary-600 hover:bg-primary-700 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all hover:scale-105 active:scale-95"
          )}
        >
          {disabled ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Help text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center"
      >
        Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> para enviar
      </motion.p>
    </div>
  );
}
