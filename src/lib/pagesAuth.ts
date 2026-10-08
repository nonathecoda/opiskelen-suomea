import { scryptSync, timingSafeEqual } from "node:crypto";

/** Holds the pass once the password has been given. Only the server can read it. */
export const PAGES_COOKIE = "omasuomi-pages";

/**
 * What the cookie holds instead of the password: a hash that is slow on purpose, so a copied
 * cookie cannot be turned back into the password by trying words quickly.
 */
function passOf(password: string): string {
  return scryptSync(password, "omasuomi-pages", 32).toString("hex");
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** The password the book photos are behind. Unset means nobody gets in. */
function password(): string | undefined {
  return process.env.PAGES_PASSWORD || undefined;
}

export function passwordIsSet(): boolean {
  return password() !== undefined;
}

/** The pass to put in the cookie, when `attempt` is the password. */
export function passFor(attempt: string): string | undefined {
  const real = password();
  if (!real) return undefined;
  const pass = realPass(real);
  return same(passOf(attempt), pass) ? pass : undefined;
}

/** Whether a cookie value is the pass for the current password. Changing the password locks everyone out. */
export function unlocked(cookie: string | undefined): boolean {
  const real = password();
  return Boolean(real && cookie && same(cookie, realPass(real)));
}

let known: { password: string; pass: string } | undefined;

/**
 * The pass for the real password. Every photo asks for it, so it is worked out once.
 * Only the server's own setting is ever compared here, never a guess.
 */
function realPass(real: string): string {
  if (known?.password !== real) known = { password: real, pass: passOf(real) };
  return known.pass;
}

const WINDOW = 10 * 60 * 1000;
const WRONG_GUESSES = 8;
/** When the recent wrong guesses were made, whoever made them. */
let wrong: number[] = [];

/**
 * Take one of the guesses that are left, or learn that guessing is paused: after 8 wrong
 * passwords, for ten minutes, for everyone. A guess counts as wrong from the moment it is
 * taken, before anything is waited for, so guesses sent at the same time cannot all slip
 * past the count. `forgive` it once it has turned out right.
 *
 * Counted per running server, which Vercel reuses between requests but may start more of,
 * so this slows guessing down a great deal without making a short password safe.
 */
export function takeGuess(now = Date.now()): number | undefined {
  wrong = wrong.filter((time) => now - time < WINDOW);
  if (wrong.length >= WRONG_GUESSES) return undefined;
  wrong.push(now);
  return now;
}

export function forgive(guess: number): void {
  const index = wrong.indexOf(guess);
  if (index >= 0) wrong.splice(index, 1);
}
