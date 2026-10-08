import { describe, expect, it } from "vitest";
import { searchWords } from "./search";

const targets = (query: string) => searchWords(query).map((hit) => hit.item.target);

describe("search", () => {
  it("finds a word by its target text", () => {
    expect(targets("risteys")[0]).toBe("risteys");
  });
  it("finds a word by a key form", () => {
    expect(targets("risteyksen")).toContain("risteys");
    expect(targets("palveluita")).toContain("palvelu");
  });
  it("finds a word by its gloss and by one sense of it", () => {
    expect(targets("crossroads, junction")).toContain("risteys");
    expect(targets("junction")).toContain("risteys");
  });
  it("ranks exact before beginning before anywhere", () => {
    const hits = targets("ala");
    expect(hits[0]).toBe("ala");
    expect(hits.indexOf("ala")).toBeLessThan(hits.indexOf("alasti"));
  });
  it("keeps book order among equals", () => {
    const hits = searchWords("tie");
    const orders = hits.filter((hit) => hit.item.target.startsWith("tie")).map((hit) => hit.chapter);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
  it("lists a word once however many chapters have it", () => {
    expect(targets("paikallinen").filter((t) => t === "paikallinen")).toHaveLength(1);
  });
  it("finds nothing for an empty query", () => {
    expect(searchWords("  ")).toEqual([]);
  });
});
