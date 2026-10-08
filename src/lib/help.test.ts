import { describe, expect, it } from "vitest";
import { CARDS } from "./cards";
import { helpFor, pageLabel } from "./help";

describe("help", () => {
  it("does not name the verb on a recognise card", () => {
    const cards = CARDS.filter((card) => card.section === "recognise-meaning" || card.section === "recognise-base");
    expect(cards.length).toBeGreaterThan(0);
    const named = cards.filter((card) => {
      const help = helpFor(card)!;
      const inf = card.section === "recognise-base" ? card.answer : help.verb!.inf;
      return [help.title, ...help.hints].some((text) => text.includes(inf));
    });
    expect(named.map((card) => card.id)).toEqual([]);
  });
  it("names the verb on a slot card", () => {
    const card = CARDS.find((one) => one.section === "verbs")!;
    expect(helpFor(card)!.title).toContain(card.hint!);
  });
  it("gives a drill its topic and nothing to a plain word", () => {
    const drill = CARDS.find((card) => card.kind === "drill")!;
    expect(helpFor(drill)!.topic!.id).toBe(drill.source);
    const word = CARDS.find((card) => card.kind === "vocab" && card.section === "words")!;
    expect(helpFor(word)).toBeUndefined();
  });
  it("says pages as a page, a run or a list", () => {
    expect(pageLabel([51])).toBe("p. 51");
    expect(pageLabel([16, 17, 18])).toBe("pp. 16–18");
    expect(pageLabel([67, 69])).toBe("pp. 67 and 69");
  });
});
