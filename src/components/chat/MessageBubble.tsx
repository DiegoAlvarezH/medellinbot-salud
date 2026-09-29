'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Phone, Wind } from 'lucide-react';
import { ServiceCard } from '@/components/services/ServiceCard';
import { AqiIndicator } from '@/components/environment/AqiIndicator';
import { aqiCategory } from '@/lib/air-quality';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

export function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-[20px] rounded-bl-md bg-fill px-4 py-3" aria-label="Escribiendo">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-label-tertiary"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export function MessageBubble({ message, streaming }: { message: ChatMessage; streaming?: boolean }) {
  const isUser = message.role === 'user';
  const { cards } = message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}
    >
      {cards?.emergency && !isUser && (
        <a
          href="tel:123"
          className="flex w-full max-w-[560px] items-center gap-3 rounded-card bg-red p-4 text-white"
        >
          <Phone className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-[15px] leading-snug">
            <strong className="font-semibold">¿Es una emergencia? Llama al 123 ahora.</strong>
            <span className="block text-white/85">Línea única de emergencias de Medellín, gratuita las 24 horas.</span>
          </span>
        </a>
      )}

      {(message.content || !streaming) && (
        <div
          className={cn(
            'max-w-[85%] px-4 py-2.5 sm:max-w-[560px]',
            isUser
              ? 'rounded-[20px] rounded-br-md bg-accent text-[15px] leading-[1.45] text-white'
              : 'rounded-[20px] rounded-bl-md bg-fill text-label',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-label" />}
            </div>
          )}
        </div>
      )}

      {!isUser && cards?.air && (
        <Link
          href="/aire"
          className="flex w-full max-w-[560px] items-center gap-3 rounded-card bg-bg-elevated p-4 shadow-card hover:opacity-90"
        >
          <div className="grid size-10 place-items-center rounded-full bg-teal-soft text-teal">
            <Wind className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-label-secondary">Calidad del aire ahora</p>
            <AqiIndicator ica={cards.air.ica} className="text-[15px]" />
            <p className="text-[13px] text-label-secondary">{aqiCategory(cards.air.ica).general}</p>
          </div>
        </Link>
      )}

      {!isUser && cards?.services && cards.services.length > 0 && (
        <div className="no-scrollbar -mx-4 flex w-[calc(100%+2rem)] snap-x gap-3 overflow-x-auto px-4 pb-1">
          {cards.services.map((service) => (
            <ServiceCard key={service.id} service={service} compact className="w-[280px] shrink-0 snap-start" />
          ))}
        </div>
      )}
    </motion.div>
  );
}
