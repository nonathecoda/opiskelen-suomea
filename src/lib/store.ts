import { useSyncExternalStore } from "react";

/** A small value kept in localStorage that React components can subscribe to. */
export function createStore<T extends object>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  /** What storage held when it was last read or written here. */
  let stored: string | null = null;
  const listeners = new Set<() => void>();

  /** Takes over what is in storage. False when there is nothing new there. */
  function read(): boolean {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw || raw === stored) return false;
      value = { ...initial, ...JSON.parse(raw) };
      stored = raw;
      return true;
    } catch {
      // Private mode or corrupt data: carry on with what there is.
      return false;
    }
  }

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    read();
    // The app can be open twice: in two tabs, or in the browser beside the installed app. Each
    // save writes the whole value, so a copy that did not follow the other's saves would wipe them.
    const follow = () => {
      if (read()) listeners.forEach((listener) => listener());
    };
    window.addEventListener("storage", (event) => {
      if (event.key === key || event.key === null) follow();
    });
    // A copy asleep in the background is told nothing: it looks again when it comes back.
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) follow();
      });
    }
  }

  function get(): T {
    load();
    return value;
  }

  function set(next: T) {
    value = next;
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(key, raw);
      stored = raw;
    } catch {
      // Storage full or blocked: the session still works, it just is not remembered.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function use(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { get, set, use };
}
