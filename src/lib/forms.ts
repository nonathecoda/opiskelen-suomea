import { chapters } from "@/content";
import { profile } from "@/content/profile";
import type { VerbTable, VocabItem } from "@/content/types";

/** What the forms sheet shows for a word of a list. */
export type FormsView = {
  /** One quiet line under the headword: what kind of word it is. */
  kindLabel: string;
  tables: {
    title?: string;
    head?: string[];
    rows: { label: string; hint?: string; cells: string[]; tone?: 1 | 2 | 3 }[];
  }[];
  verb?: { table: VerbTable; paradigm: string }[];
  notes: string[];
};

const VERBS = new Map(chapters.flatMap((chapter) => chapter.verbs).map((verb) => [verb.inf, verb]));

/** A short reminder of what each key form is for. */
const HINTS: Record<string, string> = {
  gen: "whose? the stem of most cases",
  plPart: "some, a lot of: paljon …",
  first: "present tense, I …",
};

const KIND_LABELS: Record<string, string> = { noun: "noun", adj: "adjective" };

/** What the forms sheet shows for a word, or nothing for a word that never changes in the ways taught. */
export function formsOf(item: VocabItem): FormsView | undefined {
  if (item.kind === "verb") {
    const table = VERBS.get(item.target);
    if (!table) return undefined;
    const type = profile.verbClasses.find((one) => one.id === table.class);
    const first = item.forms?.first;
    return {
      kindLabel: `verb${type?.tag ? `, ${type.tag}` : ""}`,
      tables: first ? [{ rows: [{ label: "minä-form", hint: HINTS.first, cells: [first] }] }] : [],
      verb: profile.paradigms.filter((paradigm) => table.forms[paradigm.id]).map((paradigm) => ({ table, paradigm: paradigm.id })),
      notes: table.note ? [table.note] : [],
    };
  }
  const kindLabel = KIND_LABELS[item.kind];
  if (!kindLabel) return undefined;
  const rows = profile.keyForms
    .filter((form) => form.kinds.includes(item.kind))
    .map((form) => ({ form, value: item.forms?.[form.id] }))
    .filter(({ value }) => value && value !== "-")
    .map(({ form, value }) => ({ label: form.label, hint: HINTS[form.id], cells: value!.split(" / ") }));
  if (!rows.length) return undefined;
  const notes: string[] = [];
  if (item.forms?.plPart === "-") notes.push("Not normally used in the plural.");
  if (rows.some((row) => row.cells.length > 1)) notes.push("Both plural forms are correct.");
  return { kindLabel, tables: [{ rows }], notes };
}

/** A form split where it leaves the dictionary form: the part kept and the part to highlight. */
export function splitForm(dictionary: string, form: string): [kept: string, changed: string] {
  let same = 0;
  while (same < dictionary.length && same < form.length && dictionary[same] === form[same]) same++;
  return [form.slice(0, same), form.slice(same)];
}
