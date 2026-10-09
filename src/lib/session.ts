import type { VerbTable } from "@/content/types";
import { CARDS, type Card } from "./cards";
import type { Direction, Progress } from "./progress";

export type Mode = "flash" | "choose" | "write";

/** Something a round can ask, with every way it may be asked. A table is a whole paradigm of a verb. */
export type Candidate = { card: Card; modes: (Mode | "table")[]; verb?: VerbTable; paradigm?: string };

export const ROUND_SIZE = 15;
const CHOICES = 4;

export type Question = {
  /** Unique per asking. */
  key: string;
  mode: Mode | "table";
  candidate: Candidate;
  card: Card;
  verb?: VerbTable;
  paradigm?: string;
  /** Asked target → base. */
  reversed: boolean;
  prompt: string;
  solution: string;
  choices: string[];
};

/** Letters and digits only, lowercase: two texts that differ only in punctuation or capitals are the same. */
export const plain = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** The senses of a gloss, each made plain. */
export const senses = (gloss: string) =>
  gloss
    .split(/[,;]/)
    .map((sense) => plain(sense.replace(/\(.*?\)/g, "")))
    .filter(Boolean);

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** How familiar a candidate is: the mean box of its cards, 0.5 for one never seen. */
function familiarity(candidate: Candidate, progress: Progress, slotCards: (c: Candidate) => Card[]): number {
  const cards = candidate.modes.includes("table") ? slotCards(candidate) : [candidate.card];
  if (!cards.length) return 0.5;
  return cards.reduce((sum, card) => sum + (progress[card.id]?.box ?? 0.5), 0) / cards.length;
}

const CARD_INDEX = new Map(CARDS.map((card) => [card.id, card]));
const slotCardsOf = (candidate: Candidate): Card[] =>
  candidate.verb && candidate.paradigm
    ? (candidate.verb.forms[candidate.paradigm] ?? [])
        .map((_form, slot) => CARD_INDEX.get(`${candidate.verb!.id}-${candidate.paradigm}-${slot}`))
        .filter((card): card is Card => card !== undefined)
    : [];

/** A round: the least familiar first, with a little chance mixed in so the order is never fixed, then shuffled. */
export function pickRound(candidates: Candidate[], progress: Progress, random: () => number = Math.random): Candidate[] {
  const ranked = candidates
    .map((candidate) => ({ candidate, rank: familiarity(candidate, progress, slotCardsOf) + random() * 0.9 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, ROUND_SIZE)
    .map((entry) => entry.candidate);
  return shuffle(ranked, random);
}

/** The slot cards of a table candidate. */
export const tableCards = slotCardsOf;

/** Cards by pool, in build order, for wrong choices. */
const POOLS = new Map<string, Card[]>();
for (const card of CARDS) POOLS.set(card.pool, [...(POOLS.get(card.pool) ?? []), card]);

/** Whether `other` would also be a right answer to `card`. */
function alsoRight(card: Card, other: Card): boolean {
  const accepted = card.accept.map(plain);
  if (accepted.includes(plain(other.answer))) return true;
  const mine = new Set(senses(card.prompt));
  return senses(other.prompt).some((sense) => mine.has(sense));
}

/** Three wrong choices from the card's own options, or from other cards of its pool. */
function wrongChoices(card: Card, reversed: boolean, random: () => number): string[] {
  const solution = reversed ? card.prompt : card.answer;
  if (card.options) {
    if (card.fixedOrder) return card.options.filter((option) => option !== solution);
    const right = new Set(card.accept.map(plain));
    const mine = new Set(senses(card.answer));
    const wrong = card.options.filter(
      (option) => option !== solution && !right.has(plain(option)) && !(card.answerBase && senses(option).some((sense) => mine.has(sense))),
    );
    return shuffle(wrong, random).slice(0, CHOICES - 1);
  }
  const pool = (POOLS.get(card.pool) ?? []).filter((other) => other.id !== card.id && other.kind === card.kind);
  const near = shuffle(pool.filter((other) => other.chapter === card.chapter), random);
  const far = shuffle(pool.filter((other) => other.chapter !== card.chapter), random);
  const picked: string[] = [plain(solution)];
  const wrong: string[] = [];
  for (const other of [...near, ...far]) {
    if (wrong.length === CHOICES - 1) break;
    const text = reversed ? other.prompt : other.answer;
    if (alsoRight(card, other) || picked.includes(plain(text))) continue;
    picked.push(plain(text));
    wrong.push(text);
  }
  return wrong;
}

/** The choices for a card: its solution and up to three wrong ones, shuffled unless the card keeps its order. */
export function choicesFor(card: Card, reversed: boolean, random: () => number = Math.random): string[] {
  const solution = reversed ? card.prompt : card.answer;
  const wrong = wrongChoices(card, reversed, random);
  if (card.fixedOrder && card.options) return card.options;
  return shuffle([solution, ...wrong], random);
}

let asked = 0;

/** One asking of a candidate: a mode at random, reversed where the direction and the mode allow. */
export function ask(candidate: Candidate, direction: Direction, random: () => number = Math.random): Question {
  const mode = candidate.modes[Math.floor(random() * candidate.modes.length)];
  const card = candidate.card;
  const reversed = card.reversible && direction === "t2b" && (mode === "flash" || mode === "choose");
  return {
    key: `${card.id}#${++asked}`,
    mode,
    candidate,
    card,
    verb: candidate.verb,
    paradigm: candidate.paradigm,
    reversed,
    prompt: reversed ? card.answer : card.prompt,
    solution: reversed ? card.prompt : card.answer,
    choices: mode === "choose" ? choicesFor(card, reversed, random) : [],
  };
}
