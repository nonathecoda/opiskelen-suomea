import { chapters } from "@/content";
import { profile } from "@/content/profile";
import type { VerbTable, VocabItem } from "@/content/types";
import { CARD_BY_ID, shown } from "./cards";
import { isKnown, marked, type Direction, type Mark, type Progress } from "./progress";
import { plain, senses } from "./session";
import { createStore } from "./store";

export type BlitzKind = "words" | "phrases" | "verbs";
export type Meaning = { base: string; note?: string; cue?: string };

export type BlitzItem = {
  /** The target text itself: one card however many chapters list it. */
  key: string;
  /** As shown, with its marker. */
  target: string;
  kind: BlitzKind;
  /** Chapters that list it, earliest first. */
  chapters: number[];
  /** Key vocabulary, or a verb: worth meeting first. */
  core: boolean;
  /** Every distinct meaning the book gives it. */
  meanings: Meaning[];
  /** Key forms with `inList`. */
  forms: { label: string; value: string }[];
  verb?: VerbTable;
  /** Other target text that answers the same question. */
  also: string[];
  /** The cards whose progress this one shares. */
  ids: string[];
};

export type Scope = { kinds: readonly BlitzKind[]; chapters: readonly number[] };

/** The key of a text: closing punctuation does not make another card. */
const keyOf = (text: string) => text.replace(/[.!?…]+$/u, "").trim();

type Entry = { key: string; items: (VocabItem & { chapter: number })[]; chapters: Set<number>; verb?: VerbTable };

function buildItems(): BlitzItem[] {
  const entries = new Map<string, Entry>();
  const entry = (key: string) => {
    let found = entries.get(key);
    if (!found) entries.set(key, (found = { key, items: [], chapters: new Set() }));
    return found;
  };
  for (const chapter of chapters) {
    for (const group of chapter.vocab) {
      for (const item of group.items) {
        const found = entry(keyOf(shown(item)));
        found.items.push({ ...item, chapter: chapter.id });
        found.chapters.add(chapter.id);
      }
    }
    for (const verb of chapter.verbs) {
      const found = entry(keyOf(verb.inf));
      found.verb = verb;
      found.chapters.add(chapter.id);
    }
  }

  const items = [...entries.values()].map((found): BlitzItem => {
    const { items: listed, verb } = found;
    const kind: BlitzKind = verb ? "verbs" : listed[0]?.kind === "phrase" ? "phrases" : "words";
    let meanings: Meaning[];
    if (verb) {
      const cues = [...new Set(listed.map((item) => item.cue).filter((cue): cue is string => !!cue))];
      const notes = [...new Set(listed.map((item) => item.note).filter((note): note is string => !!note))];
      meanings = [{ base: verb.base, cue: cues.join(" · ") || undefined, note: notes.join(" · ") || undefined }];
    } else {
      // Keep each gloss that adds a sense: the fullest first, then back into book order.
      const said = new Set<string>();
      const kept = new Set<VocabItem>();
      for (const item of [...listed].sort((a, b) => senses(b.base).length - senses(a.base).length)) {
        const its = senses(item.base);
        if (its.length && its.every((sense) => said.has(sense))) continue;
        its.forEach((sense) => said.add(sense));
        kept.add(item);
      }
      meanings = listed.filter((item) => kept.has(item)).map((item) => ({ base: item.base, note: item.note, cue: item.cue }));
    }
    const formsSeen = new Set<string>();
    const forms: { label: string; value: string }[] = [];
    for (const item of listed) {
      for (const keyForm of profile.keyForms) {
        const value = item.forms?.[keyForm.id];
        if (!keyForm.inList || !value || value === "-" || formsSeen.has(keyForm.id)) continue;
        formsSeen.add(keyForm.id);
        forms.push({ label: keyForm.label, value });
      }
    }
    const ids = [...listed.map((item) => item.id), ...(verb ? [`${verb.id}-m`] : [])];
    return {
      key: found.key,
      target: listed[0] ? shown(listed[0]) : verb!.inf,
      kind,
      chapters: [...found.chapters].sort((a, b) => a - b),
      core: !!verb || listed.some((item) => item.core),
      meanings,
      forms,
      verb,
      also: [],
      ids,
    };
  });

  // What typing would also accept for these cards, minus the answer spelt another way.
  for (const item of items) {
    const accepted = item.ids.flatMap((id) => CARD_BY_ID.get(id)?.accept ?? []);
    item.also = [...new Set(accepted.filter((text) => plain(keyOf(text)) !== plain(item.key)))];
  }
  // A card asked in the base language owns up to every other card that answers the same question.
  const question = (item: BlitzItem) => item.meanings.map((m) => `${plain(m.base)}|${plain(m.cue ?? "")}`).sort().join("/");
  const byQuestion = new Map<string, BlitzItem[]>();
  const byGloss = new Map<string, BlitzItem[]>();
  for (const item of items) {
    byQuestion.set(question(item), [...(byQuestion.get(question(item)) ?? []), item]);
    for (const meaning of item.meanings) {
      if (meaning.cue) continue;
      const gloss = plain(meaning.base);
      byGloss.set(gloss, [...(byGloss.get(gloss) ?? []), item]);
    }
  }
  for (const item of items) {
    const twins = new Set<BlitzItem>(byQuestion.get(question(item)) ?? []);
    for (const meaning of item.meanings) if (!meaning.cue) for (const other of byGloss.get(plain(meaning.base)) ?? []) twins.add(other);
    twins.delete(item);
    const named = [...twins].map((other) => other.target).filter((text) => plain(keyOf(text)) !== plain(item.key));
    item.also = [...new Set([...item.also, ...named])];
  }
  return items;
}

export const BLITZ_ITEMS: BlitzItem[] = buildItems();

/** The items of a selection: of the chosen kinds, listed in any chosen chapter. */
export function itemsIn(scope: Scope): BlitzItem[] {
  return BLITZ_ITEMS.filter(
    (item) => scope.kinds.includes(item.kind) && item.chapters.some((chapter) => scope.chapters.includes(chapter)),
  );
}


/** An item's progress: as weak as its weakest answered card, as recent as its latest answer. */
export function markOf(item: BlitzItem, progress: Progress): Mark | undefined {
  let whole: Mark | undefined;
  for (const id of item.ids) {
    const mark = progress[id];
    if (!mark) continue;
    whole = whole
      ? {
          box: Math.min(whole.box, mark.box),
          seen: Math.max(whole.seen, mark.seen),
          missed: Math.max(whole.missed, mark.missed),
          at: Math.max(whole.at ?? 0, mark.at ?? 0),
        }
      : mark;
  }
  return whole;
}

/**
 * The marks to save when an item is answered. All its cards move together: one with no mark
 * of its own starts from the item's, so a word known from one chapter's list is not set
 * back by its untouched twin in another. Known the first time it is ever met, it is known.
 * Known again before its rest was over, a known card stays as it was: that proves little, and
 * a few sprints run back to back would otherwise put it away until after the exam.
 */
export function marksAfter(item: BlitzItem, progress: Progress, knew: boolean, now: number): Record<string, Mark> {
  const whole = markOf(item, progress);
  if (knew && whole && isKnown(whole) && !rested(whole, now)) {
    return Object.fromEntries(item.ids.map((id) => [id, progress[id] ?? whole]));
  }
  return Object.fromEntries(item.ids.map((id) => [id, marked(progress[id] ?? whole, knew, now, true)]));
}

export type Status = "new" | "learning" | "known";

export function statusOf(item: BlitzItem, progress: Progress): Status {
  const mark = markOf(item, progress);
  if (!mark) return "new";
  return isKnown(mark) ? "known" : "learning";
}

export function countsOf(items: BlitzItem[], progress: Progress): Record<Status, number> {
  const counts = { known: 0, learning: 0, new: 0 };
  for (const item of items) counts[statusOf(item, progress)]++;
  return counts;
}

/** Why a card is in a sprint: never met, missed last time, or known and due for another look. */
export type Why = "new" | "again" | "review";

export type Slot = { item: BlitzItem; why: Why };

const HOUR = 3_600_000;
/** How long a card that was known is left alone, by box: a day, three, six, then past any exam. */
const REST_HOURS = [0, 20, 72, 144, 336];

/** Whether a card has been left alone for as long as its box asks. */
function rested(mark: Mark, now: number): boolean {
  return now - (mark.at ?? 0) >= REST_HOURS[Math.min(mark.box, REST_HOURS.length - 1)] * HOUR;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * The cards of a sprint in the order they would come up. New cards go by worth: the key
 * words and the verbs of every chapter, then the rest, chapter by chapter. Earlier misses
 * take one slot in three: each was gone over in the sprint that missed it, and a sprint is
 * for getting through the words. Once many have piled up they take every other slot, so
 * that meeting new words never outruns learning them; cards due for review are dealt in
 * more thinly. Cards known recently come last of all.
 */
export function lineUp(items: BlitzItem[], progress: Progress, now: number, random: () => number = Math.random): Slot[] {
  type Seen = { item: BlitzItem; mark: Mark };
  const fresh: BlitzItem[] = [];
  const missed: Seen[] = [];
  const due: Seen[] = [];
  const resting: Seen[] = [];
  for (const item of items) {
    const mark = markOf(item, progress);
    if (!mark) fresh.push(item);
    else if (mark.box === 0) missed.push({ item, mark });
    else if (rested(mark, now)) due.push({ item, mark });
    else resting.push({ item, mark });
  }
  const worth = (item: BlitzItem) => (item.core ? 0 : 100) + item.chapters[0];
  const oldestFirst = (a: Seen, b: Seen) => (a.mark.at ?? 0) - (b.mark.at ?? 0);
  const weakestFirst = (a: Seen, b: Seen) => a.mark.box - b.mark.box || oldestFirst(a, b);

  const sources: { why: Why; items: BlitzItem[]; weight: number }[] = [
    {
      why: "again",
      items: missed.sort(oldestFirst).map((seen) => seen.item),
      weight: missed.length >= 60 ? 6 : 3,
    },
    { why: "new", items: shuffle(fresh, random).sort((a, b) => worth(a) - worth(b)), weight: 6 },
    { why: "review", items: due.sort(weakestFirst).map((seen) => seen.item), weight: due.length >= 30 ? 6 : 2 },
  ];
  // Deal from the sources in proportion to their weights.
  const slots: Slot[] = [];
  const taken = sources.map(() => 0);
  for (;;) {
    let next = -1;
    sources.forEach((source, index) => {
      if (taken[index] >= source.items.length) return;
      if (next < 0 || (taken[index] + 1) / source.weight < (taken[next] + 1) / sources[next].weight) next = index;
    });
    if (next < 0) break;
    slots.push({ item: sources[next].items[taken[next]++], why: sources[next].why });
  }
  return [...slots, ...resting.sort(weakestFirst).map(({ item }): Slot => ({ item, why: "review" }))];
}

/**
 * How many other cards pass before a missed card is shown again. That early return comes
 * once, known or not: after it the card waits for the closing round.
 */
export const COMEBACK = 5;

/** A card missed this sprint and not yet known in the closing round. */
type Waiting = {
  item: BlitzItem;
  /** How many cards had been answered when it was last shown. */
  at: number;
  /** Its early return is still to come. */
  soon: boolean;
};

/** The card on screen. */
export type Turn = {
  item: BlitzItem;
  /** "retry" is a miss's early return, "closing" its turn in the closing round. */
  why: Why | "retry" | "closing";
  /** Its first showing this sprint: the only answer that is saved. */
  first: boolean;
};

export type Sprint = {
  queue: Slot[];
  waiting: Waiting[];
  /** The closing round has begun: nothing new is dealt, and the sprint lasts until every miss has been known. */
  closing: boolean;
  /** Cards answered so far. */
  cards: number;
  current: Turn | null;
  /** Known at first showing. */
  knew: number;
  /** Met for the first time ever. */
  fresh: number;
  /** Missed at first showing, in the order they came. */
  missed: BlitzItem[];
};

/** A sprint's time, in milliseconds. */
export type Clock = { elapsed: number; total: number };

function pick(
  queue: Slot[],
  waiting: Waiting[],
  cards: number,
  closing: boolean,
  last?: BlitzItem,
): Pick<Sprint, "queue" | "waiting" | "closing" | "current"> {
  const back = (entry: Waiting, why: "retry" | "closing") => ({
    queue,
    waiting: waiting.filter((other) => other !== entry),
    closing: why === "closing",
    current: { item: entry.item, why, first: false },
  });
  if (!closing) {
    const due = waiting.find((entry) => entry.soon && cards - entry.at >= COMEBACK);
    if (due) return back(due, "retry");
    if (queue.length > 0) {
      const [{ item, why }, ...rest] = queue;
      return { queue: rest, waiting, closing, current: { item, why, first: true } };
    }
  }
  // The closing round, which nothing new left to deal also begins. The card shown longest ago
  // comes first, so one missed again waits behind all the others, and comes round the sooner
  // the fewer they are. Only the last card left follows itself.
  const others = waiting.filter((entry) => entry.item !== last);
  const entry = (others.length > 0 ? others : waiting).reduce<Waiting | undefined>(
    (a, b) => (a && a.at <= b.at ? a : b),
    undefined,
  );
  return entry ? back(entry, "closing") : { queue, waiting, closing: true, current: null };
}

export function startSprint(slots: Slot[]): Sprint {
  return { ...pick(slots, [], 0, false), cards: 0, knew: 0, fresh: 0, missed: [] };
}

/**
 * The sprint after the card on screen was answered. `current` is null when nothing is left to show.
 * A timed sprint gives its clock. The closing round then begins when the time left is what the
 * waiting cards will take at the pace so far, and runs past the time if they take longer:
 * no sprint ends on a miss that was not known since.
 */
export function answer(sprint: Sprint, knew: boolean, clock?: Clock): Sprint {
  const turn = sprint.current;
  if (!turn) return sprint;
  const cards = sprint.cards + 1;
  // Known at first showing or in the closing round, a card is done. After any other answer it waits.
  const done = knew && (turn.first || turn.why === "closing");
  const waiting = done ? sprint.waiting : [...sprint.waiting, { item: turn.item, at: cards, soon: turn.first }];
  const closing =
    sprint.closing || (clock !== undefined && clock.total - clock.elapsed <= waiting.length * (clock.elapsed / cards));
  return {
    ...pick(sprint.queue, waiting, cards, closing, turn.item),
    cards,
    knew: sprint.knew + (turn.first && knew ? 1 : 0),
    fresh: sprint.fresh + (turn.why === "new" ? 1 : 0),
    missed: turn.first && !knew ? [...sprint.missed, turn.item] : sprint.missed,
  };
}

/** A calendar day in the learner's own time zone: "2026-10-05". */
export function dayKey(date: Date): string {
  const two = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

/** Whole days from `today` to `exam`; negative once the exam is past. */
export function daysUntil(exam: string, today: string): number {
  return Math.round((Date.parse(`${exam}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / (24 * HOUR));
}

/**
 * New cards to meet today so that every card has been met by the eve of the exam,
 * which leaves the last day for going over them. Those already met today count in.
 */
export function paceFor(unseen: number, freshToday: number, daysLeft: number): number {
  return Math.ceil((unseen + freshToday) / Math.max(1, daysLeft - 1));
}

/** Where the day's new cards stand. */
export type Goal =
  /** Nothing is chosen: there is nothing to pace. */
  | { is: "none" }
  /** The exam day has gone. */
  | { is: "past" }
  /** Every chosen card has been met: the rest is review. */
  | { is: "seen" }
  | { is: "open"; fresh: number; pace: number }
  /** The pace is met. It is left out then: new cards met in a wider selection can outnumber it. */
  | { is: "met"; fresh: number };

/** Today's goal for a selection of `chosen` cards, `unseen` of them never met, after `fresh` new cards today. */
export function goalFor(chosen: number, unseen: number, fresh: number, daysLeft: number): Goal {
  if (chosen === 0) return { is: "none" };
  if (daysLeft < 0) return { is: "past" };
  if (unseen === 0) return { is: "seen" };
  const pace = paceFor(unseen, fresh, daysLeft);
  return fresh >= pace ? { is: "met", fresh } : { is: "open", fresh, pace };
}

export type BlitzSettings = {
  /** Length of a sprint. */
  minutes: number;
  direction: Direction;
  /** Seconds until the answer shows by itself; 0 leaves it to a tap. */
  reveal: number;
  kinds: BlitzKind[];
  chapters: number[];
  /** The day of the exam: "YYYY-MM-DD", or "" until the learner picks one. */
  exam: string;
  /** New cards met on `day`, for the day's pace. */
  day: string;
  fresh: number;
};

export const MINUTES = [2, 5, 10];
export const REVEALS = [3, 5, 0];

export const blitzStore = createStore<BlitzSettings>("omasuomi.blitz", {
  minutes: 5,
  direction: "t2b",
  reveal: 3,
  kinds: ["words", "phrases", "verbs"],
  chapters: chapters.map((chapter) => chapter.id),
  // Unset until the learner picks a day on the Blitz tab.
  exam: "",
  day: "",
  fresh: 0,
});

/** New cards met so far today. */
export function freshToday(settings: BlitzSettings, today: string): number {
  return settings.day === today ? settings.fresh : 0;
}

/** Counts one more new card towards today's pace, or with -1 takes one back. */
export function noteFresh(by = 1) {
  const settings = blitzStore.get();
  const today = dayKey(new Date());
  blitzStore.set({ ...settings, day: today, fresh: Math.max(0, freshToday(settings, today) + by) });
}
