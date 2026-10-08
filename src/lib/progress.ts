import { chapters } from "@/content";
import type { Section } from "./cards";
import { createStore } from "./store";

/** How well one card is known: its box (0 to 4), how often it was asked and missed, and when last. */
export type Mark = { box: number; seen: number; missed: number; at?: number };
export type Progress = Record<string, Mark>;

const MAX_BOX = 4;
const KNOWN_FROM_BOX = 2;

/** `alreadyKnown`: a card known the very first time it is met counts as known at once. */
export function marked(mark: Mark | undefined, correct: boolean, now: number, alreadyKnown = false): Mark {
  const before = mark ?? { box: 0, seen: 0, missed: 0 };
  const box = Math.max(before.box + 1, alreadyKnown && !mark ? KNOWN_FROM_BOX : 0);
  return {
    box: correct ? Math.min(box, MAX_BOX) : 0,
    seen: before.seen + 1,
    missed: before.missed + (correct ? 0 : 1),
    at: now,
  };
}

export const isKnown = (mark?: Mark) => mark !== undefined && mark.box >= KNOWN_FROM_BOX;
/** Missed at some point and not yet known twice running. */
export const isWeak = (mark?: Mark) => mark !== undefined && mark.missed > 0 && mark.box < KNOWN_FROM_BOX;

export const progressStore = createStore<Progress>("omasuomi.progress", {});

/** Saves one answer to one card. */
export function record(id: string, correct: boolean) {
  const progress = progressStore.get();
  progressStore.set({ ...progress, [id]: marked(progress[id], correct, Date.now()) });
}

/** Saves several cards at once; a card mapped to `undefined` is forgotten (an answer taken back). */
export function setMarks(marks: Record<string, Mark | undefined>) {
  const next = { ...progressStore.get() };
  for (const [id, mark] of Object.entries(marks)) {
    if (mark) next[id] = mark;
    else delete next[id];
  }
  progressStore.set(next);
}

/** Base language to target language, or back. */
export type Direction = "b2t" | "t2b";

export type Settings = {
  /** Chapters included in decks that span chapters. */
  chapters: number[];
  /** Parts of the book included in chapter decks. */
  sections: Section[];
  direction: Direction;
  coreOnly: boolean;
  weakOnly: boolean;
  /** Exercises ticked, remembered per kind of deck. */
  picked: Record<string, string[]>;
};

export const DEFAULT_SECTIONS: Section[] = ["words", "phrases", "verbs", "grammar"];

export const settingsStore = createStore<Settings>("omasuomi.settings", {
  chapters: chapters.map((chapter) => chapter.id),
  sections: DEFAULT_SECTIONS,
  direction: "b2t",
  coreOnly: false,
  weakOnly: false,
  picked: {},
});
