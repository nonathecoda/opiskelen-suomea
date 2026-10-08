import { useCallback, useEffect, useRef } from "react";

/** How long after a change of screen a tap is taken to have been aimed at what was there before. */
export const SETTLE_MS = 300;

/**
 * Ignores a tap that lands within 300 ms of a change: it was aimed at the button that was there
 * before. `change` is anything that is new when the screen is: the screen itself, or the question.
 * Returns a ref for the screen's root, and `settled()` for handlers that are not clicks (keys).
 */
export function useGuard(change: unknown) {
  const since = useRef(0);
  useEffect(() => {
    since.current = performance.now();
  }, [change]);

  const settled = useCallback(() => performance.now() - since.current >= SETTLE_MS, []);

  const root = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const stop = (event: Event) => {
        if (!settled()) {
          event.stopPropagation();
          event.preventDefault();
        }
      };
      element.addEventListener("click", stop, true);
      return () => element.removeEventListener("click", stop, true);
    },
    [settled],
  );

  return { root, settled };
}
