import { describe, expect, it } from "vitest";
import { BOOK_PHOTOS } from "@/lib/bookPages";
import { chapters } from ".";
import { AUXILIARY, pluralParticiple } from "./make";
import { profile } from "./profile";
import type { VocabItem } from "./types";

const items: (VocabItem & { chapter: number })[] = chapters.flatMap((chapter) =>
  chapter.vocab.flatMap((group) => group.items.map((item) => ({ ...item, chapter: chapter.id }))),
);
const verbs = chapters.flatMap((chapter) => chapter.verbs);
const topics = chapters.flatMap((chapter) => chapter.grammar);
const drills = topics.flatMap((topic) => topic.drills);
const ID = /^[a-z0-9-]+$/;

/** Letters and digits only, lowercase: what decides whether two words are "the same". */
const stem = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

describe("content", () => {
  it("has its chapters in order with consecutive ids", () => {
    const wrong = chapters.filter((chapter, index) => chapter.id !== chapters[0].id + index).map((c) => c.id);
    expect(wrong).toEqual([]);
  });

  it("gives every card, group and topic a unique, well-formed id", () => {
    const ids = [
      ...items.map((item) => item.id),
      ...chapters.flatMap((chapter) => chapter.vocab.map((group) => group.id)),
      ...verbs.map((verb) => verb.id),
      ...topics.map((topic) => topic.id),
      ...drills.map((drill) => drill.id),
    ];
    const seen = new Set<string>();
    const wrong = ids.filter((id) => !ID.test(id) || (seen.has(id) ? true : (seen.add(id), false)));
    expect(wrong).toEqual([]);
  });

  it("leaves no target or meaning empty", () => {
    const wrong = [...items, ...verbs.map((verb) => ({ ...verb, target: verb.inf }))]
      .filter((item) => !item.target.trim() || !item.base.trim())
      .map((item) => item.id);
    expect(wrong).toEqual([]);
  });

  it("gives markers only where the profile has them", () => {
    const wrong = items.filter((item) => (profile.marker ? false : item.marker !== undefined)).map((item) => item.id);
    expect(wrong).toEqual([]);
  });

  it("uses only key forms the profile defines for the word's kind", () => {
    const wrong = items
      .filter((item) =>
        Object.keys(item.forms ?? {}).some((form) => !profile.keyForms.find((k) => k.id === form)?.kinds.includes(item.kind)),
      )
      .map((item) => item.id);
    expect(wrong).toEqual([]);
  });

  it("fills every slot of every paradigm of every verb, with the primary one always there", () => {
    const classes = new Set(profile.verbClasses.map((verbClass) => verbClass.id));
    const wrong = verbs
      .filter(
        (verb) =>
          !classes.has(verb.class) ||
          !verb.forms[profile.paradigms[0].id] ||
          Object.entries(verb.forms).some(([paradigm, forms]) => {
            const slots = profile.paradigms.find((p) => p.id === paradigm)?.slots;
            return !slots || forms.length !== slots.length || forms.some((form) => !form.trim());
          }),
      )
      .map((verb) => verb.id);
    expect(wrong).toEqual([]);
  });

  it("gives every verb in the word lists a table", () => {
    const tabled = new Set(verbs.map((verb) => verb.inf));
    const wrong = items.filter((item) => item.kind === "verb" && !tabled.has(item.target)).map((item) => item.id);
    expect(wrong).toEqual([]);
  });

  it("builds every plural participle by its one rule", () => {
    // The participle is stored; the plural follows from it with no exception in the whole vocabulary.
    const wrong = verbs
      .filter((verb) => {
        const singular = verb.forms.perfect[0].slice(AUXILIARY.perfect[0].length + 1);
        const plural = verb.forms.perfect[3].slice(AUXILIARY.perfect[3].length + 1);
        return !/[uy]t$/.test(singular) || plural !== pluralParticiple(singular) || !/eet$/.test(plural);
      })
      .map((verb) => verb.id);
    expect(wrong).toEqual([]);
  });

  it("points the profile only at topics that exist", () => {
    const ids = new Set(topics.map((topic) => topic.id));
    const referred = [
      ...profile.keyForms.map((form) => form.topic),
      ...profile.verbClasses.map((verbClass) => verbClass.topic),
      profile.marker?.topic,
    ].filter((id): id is string => id !== undefined);
    expect(referred.filter((id) => !ids.has(id))).toEqual([]);
  });

  it("keeps every table rectangular and never starts one with a translation", () => {
    const wrong = topics
      .filter((topic) =>
        topic.blocks.some(
          (block) =>
            block.type === "table" &&
            (block.cols.length !== block.head.length ||
              block.rows.some((row) => row.length !== block.cols.length) ||
              block.cols[0] === "gloss"),
        ),
      )
      .map((topic) => topic.id);
    expect(wrong).toEqual([]);
  });

  it("gives every drill one gap and three or four distinct options with the answer once", () => {
    const wrong = drills
      .filter(
        (drill) =>
          drill.prompt.split("___").length !== 2 ||
          drill.options.length < 3 ||
          drill.options.length > 4 ||
          new Set(drill.options).size !== drill.options.length ||
          drill.options.filter((option) => option === drill.answer).length !== 1,
      )
      .map((drill) => drill.id);
    expect(wrong).toEqual([]);
  });

  it("has eight to twenty-five drills per topic", () => {
    const wrong = topics.filter((topic) => topic.drills.length < 8 || topic.drills.length > 25).map((topic) => topic.id);
    expect(wrong).toEqual([]);
  });

  it("never lets a cue give its answer away", () => {
    const wrong = items
      .filter((item) => {
        if (!item.cue) return false;
        const cue = stem(item.cue);
        return [item.target, ...(item.alt ?? [])]
          .flatMap((answer) => answer.split(/\s+/))
          .filter((word) => stem(word).length >= 4)
          .some((word) => cue.includes(stem(word).slice(0, 5)));
      })
      .map((item) => item.id);
    expect(wrong).toEqual([]);
  });

  it("only cites pages that have a photo", () => {
    const photographed = new Set(BOOK_PHOTOS.map((photo) => photo.page));
    const cited = [
      ...chapters.flatMap((chapter) => chapter.vocab.flatMap((group) => group.pages ?? [])),
      ...topics.flatMap((topic) => topic.pages ?? []),
    ];
    expect(cited.filter((page) => !photographed.has(page))).toEqual([]);
  });
});
