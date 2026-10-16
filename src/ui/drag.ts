// Pointer-based drag and drop that works the same for bottles, vessels and the lamp.
// A short press without movement counts as a tap. Touch input on scrolling lists
// does not start a drag, so the shelf still scrolls on phones.

import { useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react';

export type DragItem = { kind: 'reagent'; id: string } | { kind: 'vessel'; id: string } | { kind: 'lamp' };

export interface DragState { item: DragItem; x: number; y: number; over: string | null }

let current: DragState | null = null;
const listeners = new Set<() => void>();
let suppressTap = false;

function set(s: DragState | null) {
  current = s;
  document.body.classList.toggle('dragging', !!s);
  for (const fn of listeners) fn();
}

export function useDrag(): DragState | null {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    () => current
  );
}

function targetAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest('[data-drop]')?.getAttribute('data-drop') ?? null;
}

export function dragHandlers(item: DragItem, opts: { onTap: () => void; onDrop: (target: string) => void; touch?: boolean }) {
  return {
    onPointerDown(e: ReactPointerEvent) {
      if (e.button !== 0) return;
      if (e.pointerType === 'touch' && !opts.touch) return;
      const sx = e.clientX;
      const sy = e.clientY;
      let started = false;
      const move = (ev: PointerEvent) => {
        if (!started && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        started = true;
        ev.preventDefault();
        set({ item, x: ev.clientX, y: ev.clientY, over: targetAt(ev.clientX, ev.clientY) });
      };
      const end = (ev: PointerEvent, cancelled: boolean) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancel);
        if (!started) return;
        const over = cancelled ? null : targetAt(ev.clientX, ev.clientY);
        set(null);
        suppressTap = true;
        setTimeout(() => { suppressTap = false; }, 0);
        if (over) opts.onDrop(over);
      };
      const up = (ev: PointerEvent) => end(ev, false);
      const cancel = (ev: PointerEvent) => end(ev, true);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    },
    onClick() {
      if (suppressTap) return;
      opts.onTap();
    },
    onDragStart(e: { preventDefault(): void }) { e.preventDefault(); }
  };
}
