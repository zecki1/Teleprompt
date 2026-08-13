"use client";

import { useEffect, useRef } from "react";

/**
 * Executa um callback periodicamente (polling).
 * Substitui o onSnapshot do Firestore: a cada `intervalMs` a função é re-executada.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  deps: unknown[] = [],
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      void cbRef.current();
    }, intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}
