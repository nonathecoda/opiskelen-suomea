import { profile } from "@/content/profile";

export type Verdict =
  /** `exact` is false when only capitals or a fold differ. */
  | { kind: "correct"; exact: boolean }
  /** The word is right but its marker is missing. */
  | { kind: "needs-marker" }
  | { kind: "wrong" };

/** What is left of an answer once punctuation and spacing no longer count. */
export function tidy(text: string): string {
  return text
    .normalize("NFC")
    .replace(/['’‘`-]/g, "")
    .replace(/[.,!?;:…"„“”‚()/–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `tidy`, and also blind to capitals and to the spellings the profile folds together. */
export function loose(text: string): string {
  let out = tidy(text).toLowerCase();
  for (const [typed, wanted] of profile.folds) out = out.split(typed.toLowerCase()).join(wanted.toLowerCase());
  return out;
}

/** Judges a typed answer. `bare` is the word without its marker, where the card has one. */
export function check(input: string, accept: string[], bare?: string): Verdict {
  if (!tidy(input)) return { kind: "wrong" };
  const typed = loose(input);
  const hit = accept.find((answer) => loose(answer) === typed);
  if (hit !== undefined) return { kind: "correct", exact: accept.some((answer) => tidy(answer) === tidy(input)) };
  if (profile.marker?.shown === "before" && bare !== undefined && loose(bare) === typed) return { kind: "needs-marker" };
  return { kind: "wrong" };
}
