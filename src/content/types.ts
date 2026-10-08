export type WordKind = "noun" | "verb" | "adj" | "other" | "phrase" | "number";

/** One word, fixed phrase or short sentence with its meaning. */
export type VocabItem = {
  /** Unique across the app and stable. Lowercase a–z, 0–9 and "-": "c1-<ascii slug>". Progress is saved under it. */
  id: string;
  /** Target language as the learner should produce it: the dictionary form the book lists. A marker is not part of it. */
  target: string;
  /** Meaning in the base language, short. Several senses separated by commas. */
  base: string;
  kind: WordKind;
  /** Only where the profile defines a marker for this kind: this word's value. */
  marker?: string;
  /** Key forms by id: { plural: "…" }. "-" means the word has no such form. */
  forms?: Record<string, string>;
  /** The book marks it as key vocabulary. */
  core?: boolean;
  /** Other target-language answers that are also right when typed. */
  alt?: string[];
  /** A clarification in the base language that is safe beside the question in either direction: it never contains or hints at the target word. */
  cue?: string;
  /** A usage note shown only with the answer. It may quote the target language. */
  note?: string;
};

export type VocabGroup = {
  id: string;                    // "c1-vocab", "c1-numbers"
  title: string;                 // base-language heading
  section: "words" | "phrases";  // word lists and numbers, or conversational phrases
  /** The chapter's main running word list, not a themed one: reached through the chapter, not listed under Themes. */
  general?: boolean;
  pages?: number[];              // where it is printed
  items: VocabItem[];
};

export type VerbTable = {
  id: string;                    // "v-<ascii slug>"
  inf: string;                   // dictionary form
  base: string;                  // meaning
  class: string;                 // a VerbClass id
  /** Per paradigm id: one form per slot. The form only, without the slot's pronoun. */
  forms: Record<string, string[]>;
  note?: string;                 // what is special about it, base language; may quote forms
  hints?: string[];              // replaces the class hints for a verb that follows no pattern
};

/** What a table column holds, which decides where a narrow phone may break its lines. */
export type TableColumn =
  | "target"   // target-language forms: every cell stays whole on one line
  | "text"     // broken between words only: sentences, lists of words, notes that quote the target language
  | "base"     // base language: may also be hyphenated
  | "gloss";   // a translation of the column before it; on a narrow phone it goes under that column

export type GrammarBlock =
  | { type: "text"; text: string }
  | { type: "table"; head: string[]; cols: TableColumn[]; rows: string[][] }
  | { type: "examples"; items: { target: string; base: string }[] };

/** A fill-the-gap exercise. Works as multiple choice and as typing. */
export type Drill = {
  id: string;                    // "<topic id>-01"
  prompt: string;                // a sentence containing exactly one "___"
  answer: string;
  options: string[];             // 3 or 4, containing `answer` exactly once
  hint?: string;                 // shown in parentheses after the prompt, typically the dictionary form
  base?: string;                 // translation of the completed sentence
  alt?: string[];                // other answers right when typed
  chooseOnly?: boolean;          // too long to type: multiple choice only
};

export type GrammarTopic = {
  id: string;                    // "c1-<ascii slug>"
  title: string;                 // base language
  hints?: string[];              // one to three nudges, mildest first
  blocks: GrammarBlock[];
  pages?: number[];
  drills: Drill[];
};

export type Chapter = {
  id: number;                    // 0, 1, 2 … in book order; 0 for an unnumbered introduction
  label: string;                 // what the book calls it, as printed: its word for "chapter" and the number
  title: string;                 // the chapter's own title as printed
  topics: string;                // base-language one-liner of its themes
  structures: string;            // base-language one-liner of its grammar
  vocab: VocabGroup[];
  verbs: VerbTable[];
  grammar: GrammarTopic[];
};
