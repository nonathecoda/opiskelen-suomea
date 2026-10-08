import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

/** The worker in a sandbox: a cache, a network that answers from a table, and its event handlers. */
function worker(network: Record<string, string | null>) {
  const store = new Map<string, Response>();
  const cache = {
    match: async (key: string | Request) => store.get(typeof key === "string" ? key : new URL(key.url).pathname)?.clone(),
    put: async (key: string | Request, response: Response) => void store.set(typeof key === "string" ? key : new URL(key.url).pathname, response),
    add: async (url: string) => {
      const response = await fakeFetch(url);
      if (!response.ok) throw new Error("failed");
      store.set(url, response);
    },
    addAll: async (urls: string[]) => Promise.all(urls.map((url) => cache.add(url))),
  };
  const fakeFetch = async (input: string | Request) => {
    const path = typeof input === "string" ? input : new URL(input.url).pathname;
    const body = network[path];
    return body === null || body === undefined ? new Response("", { status: 404 }) : new Response(body, { status: 200 });
  };
  const handlers: Record<string, (event: unknown) => void> = {};
  const self = {
    location: { origin: "https://app.test" },
    addEventListener: (type: string, handler: (event: unknown) => void) => (handlers[type] = handler),
    skipWaiting: () => {},
    clients: { claim: () => {} },
  };
  runInNewContext(SOURCE, {
    self,
    caches: { open: async () => cache, match: cache.match, keys: async () => [], delete: async () => true },
    fetch: fakeFetch,
    URL,
    Response,
    Promise,
  });
  const navigate = async () => {
    let answer: Promise<Response> | undefined;
    const waits: Promise<unknown>[] = [];
    handlers.fetch({
      request: { method: "GET", url: "https://app.test/", mode: "navigate" },
      respondWith: (promise: Promise<Response>) => (answer = promise),
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
    });
    const response = await answer!;
    await Promise.all(waits);
    return response.text();
  };
  return { store, navigate, network };
}

const page = (version: string) => `<html><script src="/_next/static/chunks/${version}.js"></script></html>`;

describe("sw", () => {
  it("serves the cached page at once and fetches a new deploy in the background", async () => {
    const sw = worker({ "/": page("a"), "/_next/static/chunks/a.js": "a" });
    expect(await sw.navigate()).toBe(page("a"));
    sw.network["/"] = page("b");
    sw.network["/_next/static/chunks/b.js"] = "b";
    expect(await sw.navigate()).toBe(page("a"));
    expect(await sw.navigate()).toBe(page("b"));
  });

  it("keeps the working page when a file of the new one fails", async () => {
    const sw = worker({ "/": page("a"), "/_next/static/chunks/a.js": "a" });
    await sw.navigate();
    sw.network["/"] = page("b");
    sw.network["/_next/static/chunks/b.js"] = null;
    await sw.navigate();
    expect(await sw.navigate()).toBe(page("a"));
  });

  it("takes the new page once all of it has arrived", async () => {
    const sw = worker({ "/": page("a"), "/_next/static/chunks/a.js": "a" });
    await sw.navigate();
    sw.network["/"] = page("b");
    await sw.navigate();
    sw.network["/_next/static/chunks/b.js"] = "b";
    await sw.navigate();
    expect(await sw.navigate()).toBe(page("b"));
    expect(sw.store.has("/_next/static/chunks/b.js")).toBe(true);
  });
});
