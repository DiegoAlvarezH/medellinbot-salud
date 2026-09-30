'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Mic, Square } from 'lucide-react';
import { useDictation } from '@/hooks/use-speech';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
}

export interface ComposerHandle {
  focus: () => void;
}

const MAX_LENGTH = 2000;

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer({ onSend, onStop, busy }, ref) {
  const [text, setText] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  // Text typed before dictation started, so the transcript is appended instead of replacing it.
  const beforeDictation = useRef('');
  const onDictated = useCallback((spoken: string) => {
    const prefix = beforeDictation.current;
    setText(prefix ? `${prefix} ${spoken}` : spoken);
  }, []);
  const dictation = useDictation(onDictated);

  useImperativeHandle(ref, () => ({ focus: () => textarea.current?.focus() }), []);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    if (dictation.listening) dictation.stop();
    onSend(value);
    setText('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="safe-bottom relative px-3 pt-2 sm:px-6">
      {/* Fade so messages dissolve under the composer instead of being cut. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-bg to-transparent" />
      <div className="mx-auto w-full max-w-[760px]">
        <div className="glow-ring rounded-[28px]">
          <div
            className={cn(
              'glow-surface relative flex items-end gap-2 rounded-[28px] p-1.5 pl-4',
              'shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
            )}
          >
            <label htmlFor="chat-input" className="sr-only">
              Escribe tu pregunta
            </label>
            <textarea
              id="chat-input"
              ref={textarea}
              rows={1}
              value={text}
              maxLength={MAX_LENGTH}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Pregunta sobre salud en Medellín…"
              enterKeyHint="send"
              className="max-h-[168px] min-h-10 flex-1 resize-none bg-transparent py-[9px] text-[16px] leading-[22px] text-label outline-none placeholder:text-label-tertiary"
            />
            {dictation.supported && !busy && (
              <button
                type="button"
                onClick={() => {
                  if (dictation.listening) {
                    dictation.stop();
                  } else {
                    beforeDictation.current = text.trim();
                    dictation.start();
                  }
                }}
                aria-pressed={dictation.listening}
                className={cn(
                  'relative grid size-10 shrink-0 place-items-center rounded-full transition-colors',
                  dictation.listening ? 'bg-red text-white' : 'text-label-secondary hover:bg-fill hover:text-label',
                )}
                aria-label={dictation.listening ? 'Detener dictado' : 'Dictar por voz'}
                title={dictation.listening ? 'Detener dictado' : 'Dictar por voz'}
              >
                {dictation.listening && <span className="absolute inset-0 animate-ping rounded-full bg-red opacity-40" aria-hidden="true" />}
                <Mic className="relative size-[18px]" aria-hidden="true" />
              </button>
            )}
            {busy ? (
              <button
                type="button"
                onClick={onStop}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-label text-bg transition-transform active:scale-95"
                aria-label="Detener respuesta"
              >
                <Square className="size-3.5 fill-current" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-white transition-[opacity,transform] active:scale-95 disabled:opacity-30"
                aria-label="Enviar"
              >
                <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        {(dictation.listening || dictation.error) && (
          <p className={cn('mt-2 text-center text-[12px]', dictation.error ? 'text-orange' : 'text-red')} role="status">
            {dictation.error ?? 'Escuchando… habla con naturalidad y toca el micrófono para terminar.'}
          </p>
        )}
        <p className="mt-2 text-center text-[11px] text-label-tertiary">
          Información general, no es un diagnóstico. En emergencias llama al{' '}
          <a href="tel:123" className="font-semibold text-red">
            123
          </a>
          .
        </p>
      </div>
    </div>
  );
});
