import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOK_PHOTOS } from "./bookPages";

const load = async () => {
  vi.resetModules();
  return import("./pagesAuth");
};

describe("pagesAuth", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("lets nobody in without a password set", async () => {
    vi.stubEnv("PAGES_PASSWORD", "");
    const auth = await load();
    expect(auth.passwordIsSet()).toBe(false);
    expect(auth.passFor("")).toBeUndefined();
    expect(auth.unlocked("anything")).toBe(false);
  });
  it("gives a pass only for the right password", async () => {
    vi.stubEnv("PAGES_PASSWORD", "long secret phrase");
    const auth = await load();
    expect(auth.passFor("wrong")).toBeUndefined();
    const pass = auth.passFor("long secret phrase")!;
    expect(pass).toBeTruthy();
    expect(pass).not.toContain("secret");
    expect(auth.unlocked(pass)).toBe(true);
  });
  it("locks everyone out when the password changes", async () => {
    vi.stubEnv("PAGES_PASSWORD", "first");
    const auth = await load();
    const pass = auth.passFor("first")!;
    vi.stubEnv("PAGES_PASSWORD", "second");
    expect(auth.unlocked(pass)).toBe(false);
  });
  it("pauses guessing for ten minutes after eight wrong guesses, counting each as taken", async () => {
    const auth = await load();
    const start = 1_000_000;
    for (let i = 0; i < 8; i++) expect(auth.takeGuess(start + i)).toBeDefined();
    expect(auth.takeGuess(start + 10)).toBeUndefined();
    expect(auth.takeGuess(start + 10 * 60 * 1000 + 8)).toBeDefined();
  });
  it("forgives a right guess", async () => {
    const auth = await load();
    for (let i = 0; i < 7; i++) auth.takeGuess(i);
    const right = auth.takeGuess(7)!;
    auth.forgive(right);
    expect(auth.takeGuess(8)).toBeDefined();
  });
  it("lists the photos once each, in book order", () => {
    const ids = BOOK_PHOTOS.map((photo) => photo.id);
    expect(new Set(ids).size).toBe(ids.length);
    const pages = BOOK_PHOTOS.map((photo) => photo.page ?? 0);
    expect(pages).toEqual([...pages].sort((a, b) => a - b));
  });
});
