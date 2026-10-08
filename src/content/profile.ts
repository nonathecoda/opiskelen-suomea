import type { WordKind } from "./types";

/** A form of a word, beyond the dictionary form, that a learner must know individually. */
export type KeyForm = {
  id: string;
  /** Word classes that have it. */
  kinds: WordKind[];
  /** Base language, as a heading. */
  label: string;
  /** Abbreviation for narrow tables. */
  short: string;
  /** Printed under the word in lists and on blitz cards. */
  inList: boolean;
  /** Gets typing cards (the "forms" exercise). */
  drilled: boolean;
  /** Id of the grammar topic that explains it. */
  topic?: string;
};

export type Paradigm = {
  id: string;
  label: string;
  /** The person labels exactly as the book prints them. */
  slots: string[];
  /** Display order in two columns, row by row: singular left, plural right. */
  order: number[];
};

export type VerbClass = {
  id: string;
  /** Deck title. */
  title: string;
  /** Deck subtitle: verbs of the class, target language. */
  examples: string;
  /** Short label shown beside a verb of this class. */
  tag: string | null;
  /** Two nudges, mildest first, valid for every verb of the class. */
  hints: string[];
  topic?: string;
};

export type Profile = {
  app: { name: string; slug: string };
  base: { code: string; name: string };
  target: { code: string; name: string };
  tagline: string;
  specialKeys: string[];
  folds: [typed: string, wanted: string][];
  marker?: {
    kinds: WordKind[];
    values: string[];
    tone: Record<string, 1 | 2 | 3>;
    shown: "before" | "tag";
    label: string;
    hints: string[];
    topic?: string;
  };
  keyForms: KeyForm[];
  paradigms: Paradigm[];
  verbClasses: VerbClass[];
};

const PERSONS = ["minä", "sinä", "hän", "me", "te", "he"];
const TWO_COLUMNS = [0, 3, 1, 4, 2, 5];

/** The decisions behind each slot are in LANGUAGE.md. */
export const profile: Profile = {
  app: { name: "Omasuomi", slug: "omasuomi" },
  base: { code: "en", name: "English" },
  target: { code: "fi", name: "Finnish" },
  tagline: "Finnish revision · plural cases, the perfect tenses and working life",
  specialKeys: ["ä", "ö"],
  // A dotted and an undotted vowel make different words, as do single and double letters.
  folds: [],
  keyForms: [
    {
      id: "gen",
      kinds: ["noun", "adj"],
      label: "Genitive",
      short: "gen.",
      inList: true,
      drilled: true,
      topic: "c1-noun-types",
    },
    {
      id: "plPart",
      kinds: ["noun", "adj"],
      label: "Plural partitive",
      short: "pl. part.",
      inList: false,
      drilled: true,
      topic: "c1-plural-partitive",
    },
    {
      id: "first",
      kinds: ["verb"],
      label: "minä-form",
      short: "minä",
      inList: true,
      drilled: true,
    },
  ],
  paradigms: [
    { id: "perfect", label: "Perfect", slots: PERSONS, order: TWO_COLUMNS },
    { id: "perfect-neg", label: "Perfect, negative", slots: PERSONS, order: TWO_COLUMNS },
    { id: "pluperfect", label: "Pluperfect", slots: PERSONS, order: TWO_COLUMNS },
    { id: "pluperfect-neg", label: "Pluperfect, negative", slots: PERSONS, order: TWO_COLUMNS },
  ],
  verbClasses: [
    {
      id: "t1",
      title: "Verb type 1",
      examples: "estää, löytää, unohtaa, tutustua",
      tag: "type 1",
      hints: [
        "Type 1: the participle is made from the basic form without its last -a/-ä.",
        "Add -nut/-nyt (me, te, he: -neet) and put olla in front: lukea → olen lukenut.",
      ],
      topic: "c4-perfect",
    },
    {
      id: "t2",
      title: "Verb type 2",
      examples: "lyödä, jäädä",
      tag: "type 2",
      hints: [
        "Type 2: take -da/-dä off the basic form.",
        "Add -nut/-nyt (me, te, he: -neet): syödä → olen syönyt.",
      ],
      topic: "c4-perfect",
    },
    {
      id: "t3",
      title: "Verb type 3",
      examples: "palvella, kiroilla, seurustella, ratkaista",
      tag: "type 3",
      hints: [
        "Type 3: the consonant before the last vowel comes back doubled.",
        "-lla → -llut, -stä → -ssyt (me, te, he: -lleet, -sseet): kuunnella → olen kuunnellut, pestä → olen pessyt.",
      ],
      topic: "c4-perfect",
    },
    {
      id: "t4",
      title: "Verb type 4",
      examples: "huomata, luvata, pudota, tarjota",
      tag: "type 4",
      hints: [
        "Type 4: take -ta/-tä off the basic form.",
        "Add -nnut/-nnyt (me, te, he: -nneet): tavata → olen tavannut.",
      ],
      topic: "c4-perfect",
    },
    {
      id: "t5",
      title: "Verb type 5",
      examples: "ansaita",
      tag: "type 5",
      hints: [
        "Type 5: take -ta/-tä off the basic form.",
        "Add -nnut/-nnyt (me, te, he: -nneet): häiritä → olen häirinnyt.",
      ],
      topic: "c4-perfect",
    },
  ],
};
