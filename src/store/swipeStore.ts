import { useSyncExternalStore, useCallback } from 'react';

// ─── Swipe-to-reveal Store ───────────────────────────────────────────
// A tiny external store (outside React state) that tracks which single
// transaction card currently has its Edit/Delete actions revealed.
// Using useSyncExternalStore with a per-card boolean selector means only
// the card that opens and the card that was previously open re-render —
// the rest of the (potentially long) transaction list is left untouched.

let openId: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setOpenTransactionId(id: string | null) {
  if (openId === id) return;
  openId = id;
  emit();
}

export function getOpenTransactionId() {
  return openId;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Returns whether this specific transaction id is the one currently
 * swiped open. The component only re-renders when *its own* boolean
 * flips, not on every open/close event elsewhere in the list.
 */
export function useIsTransactionOpen(id: string): boolean {
  const getSnapshot = useCallback(() => getOpenTransactionId() === id, [id]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
