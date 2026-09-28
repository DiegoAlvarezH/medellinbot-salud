'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, LocateFixed, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
  locationActive: boolean;
  locating: boolean;
  onToggleLocation: () => void;
}

export function Composer({ onSend, onStop, busy, locationActive, locating, onToggleLocation }: ComposerProps) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
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
    <div className="mx-auto w-full max-w-[760px] px-4 pb-4 pt-2">
      <div className="flex items-end gap-2 rounded-[26px] border border-separator bg-bg-elevated p-1.5 pl-2 shadow-card focus-within:ring-4 focus-within:ring-accent-soft">
        <button
          type="button"
          onClick={onToggleLocation}
          aria-pressed={locationActive}
          title={locationActive ? 'Usando tu ubicación para ordenar por cercanía' : 'Usar mi ubicación'}
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full transition-colors',
            locationActive ? 'bg-accent-soft text-accent' : 'text-label-secondary hover:bg-fill',
            locating && 'animate-pulse',
          )}
        >
          <LocateFixed className="size-[18px]" aria-hidden="true" />
          <span className="sr-only">{locationActive ? 'Dejar de usar mi ubicación' : 'Usar mi ubicación'}</span>
        </button>
        <label htmlFor="chat-input" className="sr-only">
          Escribe tu pregunta
        </label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pregunta sobre salud en Medellín…"
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-[7px] text-[16px] leading-[22px] text-label outline-none placeholder:text-label-tertiary"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-label text-bg"
            aria-label="Detener respuesta"
          >
            <Square className="size-3.5 fill-current" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-white transition-opacity disabled:opacity-30"
            aria-label="Enviar"
          >
            <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-label-tertiary">
        Información general, no es un diagnóstico. En emergencias llama al 123.
      </p>
    </div>
  );
}
