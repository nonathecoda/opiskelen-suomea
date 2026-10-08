import { cookies } from "next/headers";
import { PAGES_COOKIE, forgive, passFor, passwordIsSet, takeGuess, unlocked } from "@/lib/pagesAuth";

const YEAR = 60 * 60 * 24 * 365;

/** Whether this browser has already given the password: 200 yes, 401 no, 503 no password is set. */
export async function GET() {
  if (!passwordIsSet()) return new Response(null, { status: 503 });
  const jar = await cookies();
  return new Response(null, { status: unlocked(jar.get(PAGES_COOKIE)?.value) ? 200 : 401 });
}

/** Give the password; a right one is remembered for a year. 429 means too many wrong ones lately. */
export async function POST(request: Request) {
  if (!passwordIsSet()) return new Response(null, { status: 503 });
  // Counted before the request is even read: see takeGuess.
  const guess = takeGuess();
  if (guess === undefined) return new Response(null, { status: 429 });
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const pass = typeof body?.password === "string" ? passFor(body.password) : undefined;
  if (!pass) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return new Response(null, { status: 401 });
  }
  forgive(guess);
  const jar = await cookies();
  jar.set(PAGES_COOKIE, pass, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/pages",
    maxAge: YEAR,
  });
  return new Response(null, { status: 200 });
}
