import { beforeEach, describe, expect, it, vi } from "vitest";

/** A minimal browser: localStorage and the two events the store listens to. */
function fakeWindow() {
  const data = new Map<string, string>();
  const listeners = new Map<string, ((event: { key: string | null }) => void)[]>();
  const win = {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    },
    addEventListener: (type: string, listener: (event: { key: string | null }) => void) =>
      listeners.set(type, [...(listeners.get(type) ?? []), listener]),
    fire: (key: string) => (listeners.get("storage") ?? []).forEach((listener) => listener({ key })),
    data,
  };
  return win;
}

describe("store", () => {
  let win: ReturnType<typeof fakeWindow>;
  beforeEach(() => {
    vi.resetModules();
    win = fakeWindow();
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", { hidden: false, addEventListener: () => {} });
  });

  it("reads a value back later", async () => {
    const { createStore } = await import("./store");
    const store = createStore("t.a", { n: 0 });
    store.set({ n: 3 });
    const again = createStore("t.a", { n: 0 });
    expect(again.get()).toEqual({ n: 3 });
  });

  it("follows what another copy saves", async () => {
    const { createStore } = await import("./store");
    const store = createStore("t.b", { n: 0 });
    expect(store.get()).toEqual({ n: 0 });
    win.data.set("t.b", JSON.stringify({ n: 7 }));
    win.fire("t.b");
    expect(store.get()).toEqual({ n: 7 });
  });

  it("ignores other keys", async () => {
    const { createStore } = await import("./store");
    const store = createStore("t.c", { n: 1 });
    store.get();
    win.data.set("t.c", JSON.stringify({ n: 9 }));
    win.fire("t.other");
    expect(store.get()).toEqual({ n: 1 });
  });

  it("keeps an unsaved answer rather than falling back to disk", async () => {
    const { createStore } = await import("./store");
    const store = createStore("t.d", { n: 0 });
    win.localStorage.setItem = () => {
      throw new Error("full");
    };
    store.set({ n: 5 });
    expect(store.get()).toEqual({ n: 5 });
  });
});
