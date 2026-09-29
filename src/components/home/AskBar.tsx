'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

const EXAMPLES = ['Urgencias pediátricas cerca', '¿Puedo salir a correr hoy?', 'Vacunas para mayores de 60'];

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
    <div className="mx-auto w-full max-w-[640px]">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-full border border-separator bg-bg-elevated p-1.5 pl-5 shadow-float focus-within:ring-4 focus-within:ring-accent-soft"
      >
        <Sparkles className="size-5 shrink-0 text-accent" aria-hidden="true" />
        <label htmlFor="ask" className="sr-only">
          Pregunta al asistente
        </label>
        <input
          id="ask"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Pregunta lo que necesites…"
          className="h-11 min-w-0 flex-1 bg-transparent text-[17px] text-label outline-none placeholder:text-label-tertiary"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white transition-opacity disabled:opacity-30"
          aria-label="Preguntar"
        >
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </button>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => go(example)}
            className="rounded-full bg-fill px-3.5 py-1.5 text-[13px] text-label-secondary transition-colors hover:bg-fill-strong hover:text-label"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
