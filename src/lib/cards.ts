import { chapters } from "@/content";
import { profile } from "@/content/profile";
import type { VerbTable, VocabItem, WordKind } from "@/content/types";

/** The book's own parts, the cards derived from the same data, and the ways of recognising a verb form. */
export type Section =
  | "words" | "phrases" | "verbs" | "grammar"
  | "marker" | "forms" | "verb-meaning"
  | "recognise-meaning" | "recognise-base" | "recognise-slot";

export const GAP = "___";

/** One thing the learner can be asked. Every exercise works on cards. */
export type Card = {
  id: string;
  chapter: number;
  section: Section;
  kind: "vocab" | "verb" | "drill" | "marker" | "form" | "recognise";
  /** Id of the word, verb or grammar topic it comes from; decks are sets of these. */
  source: string;
  /** A base-language meaning, a sentence with a gap, or (promptTarget) a form to recognise. */
  prompt: string;
  /** The question put to the learner when it is not simply "say it in the target language". */
  ask?: string;
  /** The prompt is target language although it has no gap. */
  promptTarget?: boolean;
  /** The answer is base language (a meaning). */
  answerBase?: boolean;
  /** Show the choices in the order given, not shuffled. */
  fixedOrder?: boolean;
  /** Shown in parentheses with a gap prompt. */
  hint?: string;
  /** Shown small with the question. */
  cue?: string;
  /** Shown small with the answer. */
  note?: string;
  answer: string;
  /** The answer as the book's vocabulary prints it, shown where the answer is only shown, never typed or chosen. */
  head?: string;
  /** Everything that counts as right when typed. */
  accept: string[];
  /** Fixed choices, when the card brings its own. */
  options?: string[];
  /** Short enough to type. */
  writable: boolean;
  /** Can also be asked target → base. */
  reversible: boolean;
  core: boolean;
  /** Cards sharing a pool make plausible wrong choices for each other. */
  pool: string;
  word?: WordKind;
  verbClass?: string;
  marker?: string;
  /** The word without its marker. */
  bare?: string;
};

/** The word as displayed: with its marker in front where the profile says so. */
export function shown(item: VocabItem): string {
  return item.marker && profile.marker?.shown === "before" ? `${item.marker} ${item.target}` : item.target;
}

const withMarker = (text: string, item: VocabItem) =>
  item.marker && profile.marker?.shown === "before" && !text.startsWith(`${item.marker} `) ? `${item.marker} ${text}` : text;

const words = (text: string) => text.trim().split(/\s+/).length;

/** The forms of a paradigm once each, with the first slot that has each. */
export function distinctForms(verb: VerbTable, paradigm: string): { form: string; slot: number }[] {
  const seen = new Map<string, number>();
  (verb.forms[paradigm] ?? []).forEach((form, slot) => {
    if (!seen.has(form)) seen.set(form, slot);
  });
  return [...seen].map(([form, slot]) => ({ form, slot }));
}

/** The slot labels that have this form, joined. */
export function slotsOf(verb: VerbTable, paradigm: string, form: string): string {
  const labels = profile.paradigms.find((p) => p.id === paradigm)?.slots ?? [];
  return (verb.forms[paradigm] ?? [])
    .map((value, slot) => (value === form ? labels[slot] : undefined))
    .filter((label): label is string => !!label)
    .join(", ");
}

function build(): Card[] {
  const cards: Card[] = [];
  for (const chapter of chapters) {
    for (const group of chapter.vocab) {
      for (const item of group.items) {
        const answer = shown(item);
        const core = !!item.core;
        cards.push({
          id: item.id,
          chapter: chapter.id,
          section: group.section,
          kind: "vocab",
          source: item.id,
          prompt: item.base,
          cue: item.cue,
          note: item.note,
          answer,
          head: item.head,
          accept: [answer, ...(item.alt ?? []).map((alt) => withMarker(alt, item))],
          writable: words(item.target) <= 5,
          reversible: true,
          core,
          pool: item.kind,
          word: item.kind,
          marker: item.marker,
          bare: item.marker ? item.target : undefined,
        });
        if (item.marker && profile.marker) {
          cards.push({
            id: `${item.id}-mk`,
            chapter: chapter.id,
            section: "marker",
            kind: "marker",
            source: item.id,
            prompt: `${GAP} ${item.target}`,
            answer: item.marker,
            accept: [item.marker],
            options: profile.marker.values,
            fixedOrder: true,
            cue: item.base,
            note: item.base,
            writable: false,
            reversible: false,
            core,
            pool: "marker",
            word: item.kind,
            marker: item.marker,
            bare: item.target,
          });
        }
        for (const form of profile.keyForms) {
          const value = item.forms?.[form.id];
          if (!form.drilled || !value || value === "-" || !form.kinds.includes(item.kind)) continue;
          cards.push({
            id: `${item.id}-f-${form.id}`,
            chapter: chapter.id,
            section: "forms",
            kind: "form",
            source: item.id,
            prompt: `${answer} → ${GAP}`,
            ask: form.label,
            answer: value,
            // "palveluja / palveluita": the book allows either, so either is right when typed.
            accept: value.split(" / "),
            cue: item.base,
            writable: true,
            reversible: false,
            core,
            pool: `form:${form.id}`,
            word: item.kind,
          });
        }
      }
    }
    for (const verb of chapter.verbs) {
      const common = { chapter: chapter.id, source: verb.id, core: true, verbClass: verb.class, word: "verb" as const };
      cards.push({
        ...common,
        id: `${verb.id}-m`,
        section: "verb-meaning",
        kind: "vocab",
        prompt: verb.base,
        answer: verb.inf,
        accept: [verb.inf],
        writable: true,
        reversible: true,
        pool: "verb",
      });
      for (const paradigm of profile.paradigms) {
        const forms = verb.forms[paradigm.id];
        if (!forms) continue;
        const options = distinctForms(verb, paradigm.id).map((entry) => entry.form);
        forms.forEach((form, slot) => {
          cards.push({
            ...common,
            id: `${verb.id}-${paradigm.id}-${slot}`,
            section: "verbs",
            kind: "verb",
            prompt: `${paradigm.slots[slot]} ${GAP}`,
            hint: verb.inf,
            cue: verb.base,
            answer: form,
            accept: [form],
            options,
            writable: true,
            reversible: false,
            pool: verb.id,
          });
        });
        const slotOptions = distinctForms(verb, paradigm.id).map((entry) => slotsOf(verb, paradigm.id, entry.form));
        for (const { form, slot } of distinctForms(verb, paradigm.id)) {
          const recognise = { ...common, kind: "recognise" as const, prompt: form, promptTarget: true, reversible: false };
          cards.push({
            ...recognise,
            id: `${verb.id}-rm-${paradigm.id}-${slot}`,
            section: "recognise-meaning",
            ask: "What does it mean?",
            answer: verb.base,
            accept: [verb.base],
            answerBase: true,
            writable: false,
            pool: "verb-meaning",
          });
          cards.push({
            ...recognise,
            id: `${verb.id}-ri-${paradigm.id}-${slot}`,
            section: "recognise-base",
            ask: "What is the base form?",
            answer: verb.inf,
            accept: [verb.inf],
            writable: true,
            pool: "verb-base",
          });
          cards.push({
            ...recognise,
            id: `${verb.id}-rs-${paradigm.id}-${slot}`,
            section: "recognise-slot",
            ask: "Whose form is it?",
            answer: slotsOf(verb, paradigm.id, form),
            accept: [slotsOf(verb, paradigm.id, form)],
            answerBase: true,
            options: slotOptions,
            fixedOrder: true,
            hint: verb.inf,
            cue: verb.base,
            writable: false,
            pool: `slot:${verb.id}`,
          });
        }
      }
    }
    for (const topic of chapter.grammar) {
      for (const drill of topic.drills) {
        cards.push({
          id: drill.id,
          chapter: chapter.id,
          section: "grammar",
          kind: "drill",
          source: topic.id,
          prompt: drill.prompt,
          hint: drill.hint,
          cue: drill.base,
          note: drill.base,
          answer: drill.answer,
          accept: [drill.answer, ...(drill.alt ?? [])],
          options: drill.options,
          writable: !drill.chooseOnly,
          reversible: false,
          core: true,
          pool: topic.id,
        });
      }
    }
  }

  // Lookalikes: when nothing on screen tells two words apart, typing either is right.
  const byQuestion = new Map<string, Card[]>();
  for (const card of cards) {
    if (card.kind !== "vocab") continue;
    const key = `${card.prompt}\u0000${card.cue ?? ""}`;
    byQuestion.set(key, [...(byQuestion.get(key) ?? []), card]);
  }
  for (const twins of byQuestion.values()) {
    if (twins.length < 2) continue;
    const all = [...new Set(twins.flatMap((card) => card.accept))];
    for (const card of twins) card.accept = [...new Set([...card.accept, ...all])];
  }

  // Meanings: what any verb form could mean.
  const meanings = [...new Set(chapters.flatMap((chapter) => chapter.verbs.map((verb) => verb.base)))];
  for (const card of cards) if (card.section === "recognise-meaning") card.options = meanings;

  return cards;
}

export const CARDS: Card[] = build();
export const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
