'use client';

import Link from 'next/link';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Check, Copy, Phone, Wind } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { ServiceCard } from '@/components/services/ServiceCard';
import { AqiIndicator } from '@/components/environment/AqiIndicator';
import { aqiCategory } from '@/lib/air-quality';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

function AssistantAvatar() {
  return (
    <div className="mt-0.5 hidden shrink-0 sm:block">
      <Logo className="size-8" />
    </div>
  );
}

export function TypingDots() {
  return (
    <div className="flex items-start gap-3">
      <AssistantAvatar />
      <div className="flex h-10 items-center gap-1.5 rounded-[20px] bg-fill px-4" role="status" aria-label="Escribiendo">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-label-tertiary"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
          />
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked (insecure context): nothing to do.
        }
      }}
      className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] text-label-tertiary transition-colors hover:bg-fill hover:text-label"
      aria-label="Copiar respuesta"
    >
      {copied ? <Check className="size-3.5 text-green" /> : <Copy className="size-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  streaming?: boolean;
  /** Only the latest answer shows follow-up chips. */
  isLast?: boolean;
  onFollowUp?: (text: string) => void;
}

export function MessageBubble({ message, streaming, isLast, onFollowUp }: MessageBubbleProps) {
  const { cards } = message;

  if (message.role === 'user') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="flex justify-end">
        <p className="max-w-[85%] rounded-[22px] rounded-br-[6px] bg-accent px-4 py-2.5 text-[15px] leading-[1.45] break-words whitespace-pre-wrap text-white sm:max-w-[75%]">
          {message.content}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex items-start gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 space-y-3">
        {cards?.emergency && (
          <a href="tel:123" className="flex items-center gap-3 rounded-card bg-red p-4 text-white shadow-card">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/20">
              <Phone className="size-5" aria-hidden="true" />
            </span>
            <span className="text-[15px] leading-snug">
              <strong className="font-semibold">¿Es una emergencia? Llama al 123.</strong>
              <span className="block text-[13px] text-white/85">Gratis, las 24 horas.</span>
            </span>
          </a>
        )}

        {message.content && (
          <div className="prose-chat text-label">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) =>
                  href?.startsWith('/') ? (
                    <Link href={href}>{children}</Link>
                  ) : (
                    <a href={href} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse rounded-full bg-accent" />}
          </div>
        )}

        {cards?.air && (
          <Link href="/aire" className="flex items-center gap-3 rounded-card bg-bg-secondary p-4 transition-colors hover:bg-fill">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
              <Wind className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] text-label-secondary">Calidad del aire ahora</span>
              <AqiIndicator ica={cards.air.ica} className="text-[15px]" />
              <span className="block text-[13px] text-label-secondary">{aqiCategory(cards.air.ica).general}</span>
            </span>
          </Link>
        )}

        {cards?.services && cards.services.length > 0 && (
          <div className="no-scrollbar -mr-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pr-4 pb-1 sm:-mr-6 sm:pr-6">
            {cards.services.map((service) => (
              <ServiceCard key={service.id} service={service} compact className="w-[min(290px,78vw)] shrink-0 snap-start" />
            ))}
          </div>
        )}

        {!streaming && message.content && (
          <div className="flex flex-wrap items-center gap-1">
            <CopyButton text={message.content} />
            {message.source === 'fallback' && (
              <span className="rounded-full bg-fill px-2 py-0.5 text-[11px] text-label-tertiary">Modo básico · datos abiertos</span>
            )}
          </div>
        )}

        {isLast && !streaming && cards?.followUps && cards.followUps.length > 0 && onFollowUp && (
          <div className="flex flex-wrap gap-2 pt-1">
            {cards.followUps.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => onFollowUp(text)}
                className={cn(
                  'rounded-full border border-separator px-3.5 py-1.5 text-[13px] text-accent transition-colors',
                  'hover:border-transparent hover:bg-accent-soft',
                )}
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
