'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

const EXAMPLES = ['Urgencias pediátricas cerca', '¿Puedo salir a correr hoy?', 'Vacunas para mayores de 60', 'Farmacia abierta ahora'];

/** Large "ask anything" field that hands the question over to /chat. */
export function AskBar() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const go = (query: string) => {
    const q = query.trim();
    if (q) router.push(`/chat?q=${encodeURIComponent(q)}`);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go(value);
  };

  return (
    <div className="mx-auto w-full max-w-[660px]">
      {/* The glow lives on the wrapper; the opaque form covers it except for the halo. */}
      <div className="glow-ring rounded-full">
        <form onSubmit={onSubmit} className="glow-surface relative flex items-center gap-2 rounded-full p-1.5 pl-5 shadow-float">
          <Sparkles className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <label htmlFor="ask" className="sr-only">
            Pregunta al asistente
          </label>
          <input
            id="ask"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Pregunta lo que necesites…"
            className="h-12 min-w-0 flex-1 bg-transparent text-[17px] text-label outline-none placeholder:text-label-tertiary"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-white transition-[opacity,transform] active:scale-95 disabled:opacity-30"
            aria-label="Preguntar"
          >
            <ArrowUp className="size-5" strokeWidth={2.5} />
          </button>
        </form>
      </div>
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:flex-wrap sm:justify-center">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => go(example)}
            className="glass-card shrink-0 rounded-full px-3.5 py-1.5 text-[13px] text-label-secondary transition-colors hover:text-label"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
