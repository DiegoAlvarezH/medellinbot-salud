'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Horizontal row of chips that scrolls with touch, trackpad, mouse wheel and drag,
 * with edge fades and arrow buttons whenever there is more content to either side.
 */
export function ChipScroller({ children, className, ariaLabel }: { children: React.ReactNode; className?: string; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    // A vertical mouse wheel scrolls the row sideways (non-passive so the page does not scroll too).
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener('wheel', onWheel);
    };
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        onScroll={update}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || !ref.current) return;
          drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const state = drag.current;
          if (!state || !ref.current) return;
          const dx = e.clientX - state.x;
          if (Math.abs(dx) > 4) state.moved = true;
          ref.current.scrollLeft = state.left - dx;
        }}
        onPointerUp={() => {
          // Let the click through only if the pointer barely moved.
          setTimeout(() => (drag.current = null), 0);
        }}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="no-scrollbar flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain scroll-smooth px-4 select-none"
      >
        {children}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-bg to-transparent transition-opacity',
          edges.start ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bg to-transparent transition-opacity',
          edges.end ? 'opacity-100' : 'opacity-0',
        )}
      />
      {edges.start && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="absolute top-1/2 left-1 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated text-label shadow-card hover:bg-fill-strong"
          aria-label="Ver filtros anteriores"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {edges.end && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="absolute top-1/2 right-1 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated text-label shadow-card hover:bg-fill-strong"
          aria-label="Ver más filtros"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
