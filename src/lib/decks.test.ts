import { describe, expect, it } from "vitest";
import { chapters } from "@/content";
import { CARDS } from "./cards";
import {
  DECKS,
  candidatesFor,
  contentOf,
  countFor,
  deckById,
  emptiedBy,
  exercisesFor,
  offered,
  pickedFor,
  togglePick,
} from "./decks";
import { DEFAULT_SECTIONS, marked, type Settings } from "./progress";

const settings: Settings = {
  chapters: chapters.map((chapter) => chapter.id),
  sections: DEFAULT_SECTIONS,
  direction: "b2t",
  coreOnly: false,
  weakOnly: false,
  picked: {},
};

describe("decks", () => {
  it("has unique ids that resolve", () => {
    expect(new Set(DECKS.map((deck) => deck.id)).size).toBe(DECKS.length);
    expect(DECKS.every((deck) => deckById(deck.id) === deck)).toBe(true);
  });

  it("offers something in every exercise it lists", () => {
    const empty = DECKS.flatMap((deck) =>
      offered(deck)
        .filter((exercise) => countFor(deck, exercise, settings, {}) === 0)
        .map((exercise) => `${deck.id}:${exercise}`),
    );
    expect(empty).toEqual([]);
  });

  it("can list every deck but a single topic", () => {
    const unlisted = DECKS.filter((deck) => !deck.id.startsWith("t-") && contentOf(deck).length === 0).map((deck) => deck.id);
    expect(unlisted).toEqual([]);
  });

  it("narrows by chapter", () => {
    const words = deckById("words")!;
    const one = candidatesFor(words, ["choose"], { ...settings, chapters: [2] }, {});
    expect(one.length).toBeGreaterThan(0);
    expect(one.every((candidate) => candidate.card.chapter === 2)).toBe(true);
  });

  it("never asks a card twice when exercises are mixed", () => {
    const deck = deckById("c1")!;
    const candidates = candidatesFor(deck, ["flash", "choose", "write"], settings, {});
    const ids = candidates.map((candidate) => candidate.card.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(candidates.some((candidate) => candidate.modes.length > 1)).toBe(true);
  });

  it("puts whole tables beside single forms", () => {
    const deck = deckById("verbs")!;
    const candidates = candidatesFor(deck, ["conjugate", "write"], settings, {});
    expect(candidates.some((candidate) => candidate.modes.includes("table"))).toBe(true);
    expect(candidates.some((candidate) => candidate.modes.includes("write"))).toBe(true);
  });

  it("asks verb meanings on cards and forms elsewhere", () => {
    const deck = deckById("verbs")!;
    const flash = candidatesFor(deck, ["flash"], settings, {});
    expect(flash.every((candidate) => candidate.card.section === "verb-meaning")).toBe(true);
    const choose = candidatesFor(deck, ["choose"], settings, {});
    expect(choose.every((candidate) => candidate.card.section === "verbs")).toBe(true);
  });

  it("counts what a round would ask", () => {
    const deck = deckById("t-c1-plural-partitive")!;
    const topic = chapters[0].grammar.find((one) => one.id === "c1-plural-partitive")!;
    expect(countFor(deck, "choose", settings, {})).toBe(topic.drills.length);
    expect(countFor(deck, "write", settings, {})).toBe(topic.drills.filter((drill) => !drill.chooseOnly).length);
  });

  it("keeps another deck's ticks through a toggle", () => {
    const words = deckById("words")!;
    const theme = deckById("g-c2-spoken")!;
    const withForms = { ...settings, picked: togglePick(words, "forms", settings) };
    expect(pickedFor(words, withForms)).toContain("forms");
    const afterTheme = { ...withForms, picked: togglePick(theme, "write", withForms) };
    expect(offered(theme)).not.toContain("forms");
    expect(pickedFor(words, afterTheme)).toContain("forms");
  });

  it("starts toggling from the defaults", () => {
    const verbs = deckById("verbs")!;
    expect(pickedFor(verbs, settings)).toEqual(["conjugate"]);
    const next = { ...settings, picked: togglePick(verbs, "slot", settings) };
    expect(pickedFor(verbs, next)).toEqual(["conjugate", "slot"]);
    const words = deckById("words")!;
    expect(pickedFor(words, settings)).toEqual(["choose"]);
  });

  it("names the narrowing that emptied a deck", () => {
    const words = deckById("words")!;
    expect(emptiedBy(words, ["choose"], { ...settings, chapters: [] }, {})).toBe("chapters");
    expect(emptiedBy(words, ["choose"], { ...settings, weakOnly: true }, {})).toBe("weak");
    const card = CARDS.find((one) => one.section === "words")!;
    const progress = { [card.id]: marked(undefined, false, 1) };
    expect(emptiedBy(words, ["choose"], { ...settings, weakOnly: true }, progress)).toBeUndefined();
  });

  it("groups the verbs deck's exercises as the screen shows them", () => {
    expect(exercisesFor(deckById("verbs")!).map((group) => group.title)).toEqual(["Conjugate", "Recognise the form", "Vocabulary"]);
  });
});
