import { chapters } from "@/content";
import { profile } from "@/content/profile";
import type { Chapter, GrammarTopic, VerbTable, VocabGroup, VocabItem, WordKind } from "@/content/types";
import { CARDS, type Card, type Section } from "./cards";
import { isKnown, isWeak, type Progress, type Settings } from "./progress";
import type { Candidate, Mode } from "./session";

export type Deck = {
  id: string;
  title: string;
  subtitle?: string;
  /** The title is target language (a chapter's name). */
  targetTitle?: boolean;
  kind: "mixed" | "words" | "verbs" | "grammar";
  /** How the learner can narrow it on its screen. */
  filter: "chapters" | "sections" | "none";
  /** Ids of the words, verbs and topics in it. */
  sources: ReadonlySet<string>;
  /** The chapter it belongs to, for a deck of one chapter, group or topic. */
  chapter?: number;
};

export type Exercise =
  | "list" | "flash" | "choose" | "write" | "conjugate"
  | "marker" | "forms"
  | "meaning" | "base" | "slot"
  | "mix"
  | "weak";

/** The exercises that ask questions, as opposed to the list and the mix of ticked ones. */
export type Drillable = Exclude<Exercise, "list" | "mix" | "weak">;

const allItems = (chapter: Chapter) => chapter.vocab.flatMap((group) => group.items);
const ids = (things: { id: string }[]) => new Set(things.map((thing) => thing.id));
const label = (chapter: Chapter) => chapter.label;

const WORD_CLASSES: { id: string; kind: WordKind; title: string; subtitle: string }[] = [
  { id: "nouns", kind: "noun", title: "Nouns", subtitle: "Things, people and places, with their genitive" },
  { id: "adjectives", kind: "adj", title: "Adjectives", subtitle: "Words that describe, with their genitive" },
  { id: "small-words", kind: "other", title: "Small words", subtitle: "Adverbs and words that do not change" },
  { id: "numbers", kind: "number", title: "Numbers", subtitle: "Counting and amounts" },
  { id: "phrases", kind: "phrase", title: "Phrases and expressions", subtitle: "Fixed expressions, sentences and spoken language" },
];

function buildDecks(): Deck[] {
  const first = chapters[0];
  const last = chapters[chapters.length - 1];
  const everyItem = chapters.flatMap(allItems);
  const everyVerb = chapters.flatMap((chapter) => chapter.verbs);
  const everyTopic = chapters.flatMap((chapter) => chapter.grammar);
  const decks: Deck[] = [
    {
      id: "all",
      title: "All chapters",
      subtitle: first === last ? label(first) : `${label(first)} – ${label(last)}`,
      kind: "mixed",
      filter: "sections",
      sources: new Set([...ids(everyItem), ...ids(everyVerb), ...ids(everyTopic)]),
    },
    ...chapters.map(
      (chapter): Deck => ({
        id: `c${chapter.id}`,
        title: chapter.title,
        subtitle: chapter.topics,
        targetTitle: true,
        kind: "mixed",
        filter: "sections",
        chapter: chapter.id,
        sources: new Set([...ids(allItems(chapter)), ...ids(chapter.verbs), ...ids(chapter.grammar)]),
      }),
    ),
    { id: "words", title: "All words", subtitle: "Every word and phrase of the book", kind: "words", filter: "chapters", sources: ids(everyItem) },
    ...WORD_CLASSES.flatMap(({ id, kind, title, subtitle }): Deck[] => {
      const items = everyItem.filter((item) => item.kind === kind);
      return items.length ? [{ id, title, subtitle, kind: "words", filter: "chapters", sources: ids(items) }] : [];
    }),
    ...chapters.flatMap((chapter) =>
      chapter.vocab
        .filter((group) => !group.general)
        .map(
          (group): Deck => ({
            id: `g-${group.id}`,
            title: group.title,
            subtitle: label(chapter),
            kind: "words",
            filter: "none",
            chapter: chapter.id,
            sources: ids(group.items),
          }),
        ),
    ),
    { id: "verbs", title: "All verbs", subtitle: "Every verb with its tables", kind: "verbs", filter: "chapters", sources: ids(everyVerb) },
    ...profile.verbClasses.flatMap((verbClass): Deck[] => {
      const verbs = everyVerb.filter((verb) => verb.class === verbClass.id);
      return verbs.length
        ? [{ id: `verbs-${verbClass.id}`, title: verbClass.title, subtitle: verbClass.examples, kind: "verbs", filter: "chapters", sources: ids(verbs) }]
        : [];
    }),
    { id: "grammar", title: "All grammar", subtitle: "Every rule, with drills", kind: "grammar", filter: "chapters", sources: ids(everyTopic) },
    ...chapters.flatMap((chapter) =>
      chapter.grammar.map(
        (topic): Deck => ({
          id: `t-${topic.id}`,
          title: topic.title,
          subtitle: label(chapter),
          kind: "grammar",
          filter: "none",
          chapter: chapter.id,
          sources: new Set([topic.id]),
        }),
      ),
    ),
  ];
  return decks;
}

export const DECKS: Deck[] = buildDecks();
const BY_ID = new Map(DECKS.map((deck) => [deck.id, deck]));

export function deckById(id: string): Deck | undefined {
  return BY_ID.get(id);
}

/** Decks of one tab, by id prefix or id. */
export const wordClassDecks = () => DECKS.filter((deck) => WORD_CLASSES.some((wc) => wc.id === deck.id));
export const themeDecks = () => DECKS.filter((deck) => deck.id.startsWith("g-"));
export const verbClassDecks = () => DECKS.filter((deck) => deck.id.startsWith("verbs-"));
export const chapterDecks = () => DECKS.filter((deck) => /^c\d+$/.test(deck.id));
export const topicDecks = (chapter: number) => DECKS.filter((deck) => deck.id.startsWith("t-") && deck.chapter === chapter);

/** The cards of a deck, before any narrowing. */
const DECK_CARDS = new Map<string, Card[]>();
function cardsOf(deck: Deck): Card[] {
  let cards = DECK_CARDS.get(deck.id);
  if (!cards) {
    cards = CARDS.filter((card) => deck.sources.has(card.source));
    DECK_CARDS.set(deck.id, cards);
  }
  return cards;
}

/** The chapters a deck has cards in. */
export function chaptersOf(deck: Deck): number[] {
  return [...new Set(cardsOf(deck).map((card) => card.chapter))].sort((a, b) => a - b);
}

/** Which sections an exercise draws from, in a deck of this kind. */
export function sectionsFor(deck: Deck, exercise: Drillable): Section[] {
  switch (exercise) {
    case "marker":
      return ["marker"];
    case "forms":
      return ["forms"];
    case "meaning":
      return ["recognise-meaning"];
    case "base":
      return ["recognise-base"];
    case "slot":
      return ["recognise-slot"];
    case "conjugate":
      return ["verbs"];
  }
  if (deck.kind === "words") return ["words", "phrases"];
  if (deck.kind === "grammar") return ["grammar"];
  if (deck.kind === "verbs") return exercise === "flash" ? ["verb-meaning"] : ["verbs"];
  return ["words", "phrases", "verbs", "grammar"];
}

/** How an exercise asks. */
export function modeOf(exercise: Drillable): Mode | "table" {
  if (exercise === "conjugate") return "table";
  if (exercise === "forms" || exercise === "base") return "write";
  if (exercise === "marker" || exercise === "meaning" || exercise === "slot") return "choose";
  return exercise;
}

function passes(deck: Deck, card: Card, settings: Settings): boolean {
  if (deck.filter === "chapters") return settings.chapters.includes(card.chapter);
  if (deck.filter === "sections") return settings.sections.includes(card.section);
  return true;
}

/** Every card an exercise would ask in this deck, narrowed as the settings say. */
export function cardsFor(deck: Deck, exercise: Drillable, settings: Settings, progress: Progress): Card[] {
  const sections = sectionsFor(deck, exercise);
  const typed = modeOf(exercise) === "write";
  return cardsOf(deck).filter(
    (card) =>
      sections.includes(card.section) &&
      passes(deck, card, settings) &&
      (!settings.coreOnly || card.core) &&
      (!settings.weakOnly || isWeak(progress[card.id])) &&
      (!typed || card.writable),
  );
}

export type ExerciseGroup = { title: string; exercises: Drillable[] };

/** The exercises a deck offers, in groups, in order. */
export function exercisesFor(deck: Deck): ExerciseGroup[] {
  if (deck.kind === "verbs") {
    return [
      { title: "Conjugate", exercises: ["conjugate", "choose", "write"] },
      { title: "Recognise the form", exercises: ["meaning", "base", "slot"] },
      { title: "Vocabulary", exercises: ["flash"] },
    ];
  }
  const practise: Drillable[] = ["flash", "choose", "write"];
  if (deck.kind === "words") {
    const cards = cardsOf(deck);
    if (profile.marker && cards.some((card) => card.section === "marker")) practise.push("marker");
    if (cards.some((card) => card.section === "forms")) practise.push("forms");
  }
  return [{ title: "Practise", exercises: practise }];
}

export const offered = (deck: Deck): Drillable[] => exercisesFor(deck).flatMap((group) => group.exercises);

const DEFAULT_PICK: Record<Deck["kind"], Drillable[]> = {
  verbs: ["conjugate"],
  words: ["choose"],
  mixed: ["choose"],
  grammar: ["choose"],
};

/** The exercises ticked on this deck: remembered per kind of deck. */
export function pickedFor(deck: Deck, settings: Settings): Drillable[] {
  const picked = (settings.picked[deck.kind] ?? DEFAULT_PICK[deck.kind]) as Drillable[];
  return offered(deck).filter((exercise) => picked.includes(exercise));
}

/** The ticks after toggling one. Ticks this deck does not offer belong to another deck of its kind and stay. */
export function togglePick(deck: Deck, exercise: Drillable, settings: Settings): Settings["picked"] {
  const current = settings.picked[deck.kind] ?? DEFAULT_PICK[deck.kind];
  const next = current.includes(exercise) ? current.filter((one) => one !== exercise) : [...current, exercise];
  return { ...settings.picked, [deck.kind]: next };
}

/** The verbs of a deck, narrowed by its chapter filter. */
export function verbsOf(deck: Deck, settings?: Settings): { verb: VerbTable; chapter: number }[] {
  return chapters.flatMap((chapter) =>
    chapter.verbs
      .filter((verb) => deck.sources.has(verb.id))
      .filter(() => !settings || deck.filter !== "chapters" || settings.chapters.includes(chapter.id))
      .map((verb) => ({ verb, chapter: chapter.id })),
  );
}

/** The slot cards of one paradigm of a verb. */
export function slotCards(verb: VerbTable, paradigm: string): Card[] {
  return (verb.forms[paradigm] ?? []).map((_form, slot) => CARD_INDEX.get(`${verb.id}-${paradigm}-${slot}`)!).filter(Boolean);
}
const CARD_INDEX = new Map(CARDS.map((card) => [card.id, card]));

/** Everything a session over these exercises could ask. A card wanted twice appears once, with every way of asking it. */
export function candidatesFor(deck: Deck, exercises: Drillable[], settings: Settings, progress: Progress): Candidate[] {
  const byCard = new Map<string, Candidate>();
  const tables: Candidate[] = [];
  for (const exercise of exercises) {
    if (exercise === "conjugate") {
      for (const { verb } of verbsOf(deck, settings)) {
        for (const paradigm of profile.paradigms) {
          const slots = slotCards(verb, paradigm.id);
          if (!slots.length) continue;
          if (settings.weakOnly && !slots.some((card) => isWeak(progress[card.id]))) continue;
          tables.push({ card: slots[0], modes: ["table"], verb, paradigm: paradigm.id });
        }
      }
      continue;
    }
    const mode = modeOf(exercise);
    for (const card of cardsFor(deck, exercise, settings, progress)) {
      const known = byCard.get(card.id);
      if (known) {
        if (!known.modes.includes(mode)) known.modes.push(mode);
      } else {
        byCard.set(card.id, { card, modes: [mode] });
      }
    }
  }
  return [...byCard.values(), ...tables];
}

/** How many things one exercise would ask. */
export function countFor(deck: Deck, exercise: Drillable, settings: Settings, progress: Progress): number {
  return candidatesFor(deck, [exercise], settings, progress).length;
}

/** Known and total over the cards `choose` would ask, without any narrowing. */
export function statsOf(deck: Deck, progress: Progress): { known: number; total: number } {
  const sections = sectionsFor(deck, "choose");
  const cards = cardsOf(deck).filter((card) => sections.includes(card.section));
  return { known: cards.filter((card) => isKnown(progress[card.id])).length, total: cards.length };
}

/** Sources that have a card with a mistake not yet made good. */
export function weakSources(progress: Progress): Set<string> {
  return new Set(CARDS.filter((card) => isWeak(progress[card.id])).map((card) => card.source));
}

/** The grammar topic of a single-topic deck. */
export function topicOf(deck: Deck): GrammarTopic | undefined {
  if (!deck.id.startsWith("t-")) return undefined;
  const id = deck.id.slice(2);
  return chapters.flatMap((chapter) => chapter.grammar).find((topic) => topic.id === id);
}

export type DeckContent = {
  chapter: Chapter;
  groups: { group: VocabGroup; items: VocabItem[] }[];
  verbs: VerbTable[];
  topics: GrammarTopic[];
};

/** The deck as the list shows it: per chapter, its word groups, its verbs and its topics. */
export function contentOf(deck: Deck, only?: Set<string>): DeckContent[] {
  const keep = (id: string) => deck.sources.has(id) && (!only || only.has(id));
  return chapters
    .map((chapter) => ({
      chapter,
      groups: chapter.vocab
        .map((group) => ({ group, items: group.items.filter((item) => keep(item.id)) }))
        .filter((group) => group.items.length > 0),
      verbs: chapter.verbs.filter((verb) => keep(verb.id)),
      topics: chapter.grammar.filter((topic) => keep(topic.id)),
    }))
    .filter((part) => part.groups.length || part.verbs.length || part.topics.length);
}

/**
 * The narrowing that left a deck with nothing to ask, when it is one the learner can lift on
 * the spot: no chapter ticked, or "weak only" with nothing weak.
 */
export function emptiedBy(
  deck: Deck,
  exercises: Drillable[],
  settings: Settings,
  progress: Progress,
): "chapters" | "weak" | undefined {
  if (!exercises.length || candidatesFor(deck, exercises, settings, progress).length) return undefined;
  if (deck.filter === "chapters" && !chaptersOf(deck).some((chapter) => settings.chapters.includes(chapter))) return "chapters";
  if (settings.weakOnly && candidatesFor(deck, exercises, { ...settings, weakOnly: false }, progress).length) return "weak";
  return undefined;
}
