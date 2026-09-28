'use client';

import { useMemo, useState } from 'react';
import { Check, Syringe } from 'lucide-react';
import { Segmented } from '@/components/ui/segmented';
import { VACCINATION_STAGES, stagesForAge } from '@/lib/knowledge/vaccination';
import { cn } from '@/lib/utils';

type Unit = 'meses' | 'años' | 'gestante';

/** "Which vaccines apply to me?" — picks the PAI stages for a given age. */
export function AgeFinder() {
  const [unit, setUnit] = useState<Unit>('meses');
  const [amount, setAmount] = useState(6);

  const stages = useMemo(() => {
    if (unit === 'gestante') return VACCINATION_STAGES.filter((s) => s.id === 'gestantes');
    const months = unit === 'meses' ? amount : amount * 12;
    return stagesForAge(months);
  }, [unit, amount]);

  const max = unit === 'meses' ? 23 : 100;

  return (
    <div className="rounded-tile bg-bg-elevated p-6 shadow-card sm:p-8">
      <h2 className="text-[24px] font-semibold tracking-[-0.02em]">¿Qué vacunas le tocan?</h2>
      <p className="mt-1 text-[15px] text-label-secondary">Elige la edad de la persona y te mostramos lo que corresponde según el esquema nacional.</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Segmented
          ariaLabel="Unidad de edad"
          value={unit}
          onChange={(value) => {
            setUnit(value);
            setAmount(value === 'años' ? 30 : 6);
          }}
          options={[
            { value: 'meses', label: 'Bebé (meses)' },
            { value: 'años', label: 'Años' },
            { value: 'gestante', label: 'Gestante' },
          ]}
        />
        {unit !== 'gestante' && (
          <label className="flex flex-1 items-center gap-3">
            <span className="sr-only">Edad</span>
            <input
              type="range"
              min={0}
              max={max}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="w-24 text-right text-[17px] font-semibold tabular-nums">
              {amount} {unit === 'meses' ? (amount === 1 ? 'mes' : 'meses') : amount === 1 ? 'año' : 'años'}
            </span>
          </label>
        )}
      </div>

      <div className="mt-6 space-y-4" aria-live="polite">
        {stages.length === 0 ? (
          <p className="rounded-card bg-bg-secondary p-4 text-[15px] text-label-secondary">
            No hay dosis programadas justo a esta edad. Revisa el carné: si falta alguna dosis anterior, se puede completar en cualquier momento.
          </p>
        ) : (
          stages.map((stage) => (
            <div key={stage.id} className="rounded-card bg-bg-secondary p-4">
              <p className="text-[13px] font-semibold text-accent">{stage.label}</p>
              <ul className="mt-2 space-y-2">
                {stage.doses.map((dose) => (
                  <li key={dose.vaccine} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-green" aria-hidden="true" />
                    <span className="text-[15px]">
                      <strong className="font-semibold">{dose.vaccine}</strong> · {dose.dose}
                      {dose.note && <span className="block text-[13px] text-label-secondary">{dose.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ScheduleTimeline() {
  return (
    <ol className="relative space-y-4 border-l border-separator pl-6">
      {VACCINATION_STAGES.map((stage) => (
        <li key={stage.id} className="relative">
          <span className="absolute top-1 -left-[31px] grid size-[14px] place-items-center rounded-full bg-accent ring-4 ring-bg">
            <Syringe className="size-2 text-white" aria-hidden="true" />
          </span>
          <p className="text-[17px] font-semibold tracking-[-0.01em]">{stage.label}</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {stage.doses.map((dose) => (
              <li key={dose.vaccine} className={cn('rounded-full bg-fill px-2.5 py-1 text-[12px] text-label')}>
                {dose.vaccine} <span className="text-label-tertiary">· {dose.dose}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
