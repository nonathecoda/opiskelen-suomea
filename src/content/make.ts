import type { Chapter, GrammarTopic, VerbTable, VocabGroup, VocabItem, WordKind } from "./types";

/**
 * Small builders that keep the chapter files close to the book's own lists. An entry is written
 * once, in the book's order; ids, verb tables and the forms that follow from stored data are made here.
 */

/** The ascii slug of a text: diacritics stripped, anything else turned into "-". */
export function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Extra = Pick<VocabItem, "cue" | "note" | "alt" | "head">;

/** An entry before it has its id. A verb also carries what its table needs. */
export type Entry = Omit<VocabItem, "id"> & { verb?: { type: number; participle: string } };

/** A noun: its genitive as the list prints it (written out in full) and its plural partitive ("-" when it has none). */
export function n(target: string, base: string, gen: string | undefined, plPart: string, extra: Extra = {}): Entry {
  return { target, base, kind: "noun", forms: forms(gen, plPart), head: headOf(target, gen), ...extra };
}

/** An adjective, with the same two forms. */
export function a(target: string, base: string, gen: string | undefined, plPart: string, extra: Extra = {}): Entry {
  return { target, base, kind: "adj", forms: forms(gen, plPart), head: headOf(target, gen), ...extra };
}

/** Nominative, then genitive, as the book's vocabulary lists them. */
const headOf = (target: string, gen: string | undefined) => (gen ? `${target}, ${gen}` : undefined);

function forms(gen: string | undefined, plPart: string): Record<string, string> {
  return gen ? { gen, plPart } : { plPart };
}

/**
 * A verb the list prints with its type and its minä-form. `participle` is the singular past
 * participle (lukenut): the four tables are built from it with the forms of olla.
 */
export function v(target: string, base: string, type: number, first: string, participle: string, extra: Extra = {}): Entry {
  return { target, base, kind: "verb", forms: { first }, head: `${target} (${type}), ${first}`, verb: { type, participle }, ...extra };
}

/** A word that does not change in the ways the app teaches: adverbs, and verbs the list gives without a minä-form (`head` then as printed). */
export function o(target: string, base: string, extra: Extra = {}): Entry {
  return { target, base, kind: "other", ...extra };
}

/** A fixed expression or a sentence. */
export function p(target: string, base: string, extra: Extra = {}): Entry {
  return { target, base, kind: "phrase", ...extra };
}

/** The forms of olla before the participle, per paradigm and person. */
export const AUXILIARY: Record<string, string[]> = {
  perfect: ["olen", "olet", "on", "olemme", "olette", "ovat"],
  "perfect-neg": ["en ole", "et ole", "ei ole", "emme ole", "ette ole", "eivät ole"],
  pluperfect: ["olin", "olit", "oli", "olimme", "olitte", "olivat"],
  "pluperfect-neg": ["en ollut", "et ollut", "ei ollut", "emme olleet", "ette olleet", "eivät olleet"],
};

/** The plural participle: -nut/-nyt, -lut, -sut … become -neet, -leet, -seet. A test proves it over every verb. */
export function pluralParticiple(singular: string): string {
  return singular.replace(/[uy]t$/, "eet");
}

/** Every table of a verb from its participle: me, te and he take the plural one. */
export function tablesFor(participle: string): Record<string, string[]> {
  const plural = pluralParticiple(participle);
  return Object.fromEntries(
    Object.entries(AUXILIARY).map(([paradigm, aux]) => [
      paradigm,
      aux.map((form, person) => `${form} ${person < 3 ? participle : plural}`),
    ]),
  );
}

/** Verbs that already have a table: a verb listed again in a later chapter keeps the one it was given first. */
const tabled = new Set<string>();

type GroupSpec = {
  id: string;
  title: string;
  section: "words" | "phrases";
  general?: boolean;
  pages: number[];
  entries: Entry[];
};

type ChapterSpec = Omit<Chapter, "vocab" | "verbs"> & {
  groups: GroupSpec[];
  /** Notes for verb tables, by infinitive: what is special about the verb. */
  verbNotes?: Record<string, string>;
  grammar: GrammarTopic[];
};

/** Puts a chapter together: ids for every entry, and a table for each verb the chapter introduces. */
export function chapter(spec: ChapterSpec): Chapter {
  const used = new Set<string>();
  const verbs: VerbTable[] = [];
  const vocab: VocabGroup[] = spec.groups.map((group) => ({
    id: `c${spec.id}-${group.id}`,
    title: group.title,
    section: group.section,
    general: group.general,
    pages: group.pages,
    items: group.entries.map(({ verb, ...entry }) => {
      let id = `c${spec.id}-${slug(entry.target)}`;
      for (let count = 2; used.has(id); count++) id = `c${spec.id}-${slug(entry.target)}-${count}`;
      used.add(id);
      if (verb && !tabled.has(entry.target)) {
        tabled.add(entry.target);
        verbs.push({
          id: `v-${slug(entry.target)}`,
          inf: entry.target,
          base: entry.base,
          class: `t${verb.type}`,
          forms: tablesFor(verb.participle),
          note: spec.verbNotes?.[entry.target],
        });
      }
      return { id, ...entry } satisfies VocabItem;
    }),
  }));
  return {
    id: spec.id,
    label: spec.label,
    title: spec.title,
    topics: spec.topics,
    structures: spec.structures,
    vocab,
    verbs,
    grammar: spec.grammar,
  };
}

export type { WordKind };
