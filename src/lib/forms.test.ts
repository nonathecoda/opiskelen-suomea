import { describe, expect, it } from "vitest";
import { chapters } from "@/content";
import { formsOf, splitForm } from "./forms";

const items = chapters.flatMap((chapter) => chapter.vocab.flatMap((group) => group.items));
const find = (target: string) => items.find((item) => item.target === target)!;

describe("forms", () => {
  it("shows a noun's genitive and plural partitive", () => {
    const view = formsOf(find("risteys"))!;
    expect(view.kindLabel).toBe("noun");
    expect(view.tables[0].rows.map((row) => row.cells[0])).toEqual(["risteyksen", "risteyksiä"]);
  });
  it("shows an adjective's forms", () => {
    expect(formsOf(find("arvokas"))!.tables[0].rows[0].cells).toEqual(["arvokkaan"]);
  });
  it("shows both plural forms where the book allows both", () => {
    const view = formsOf(find("palvelu"))!;
    expect(view.tables[0].rows[1].cells).toEqual(["palveluja", "palveluita"]);
  });
  it("leaves out a plural a word does not have, and says so", () => {
    const view = formsOf(find("Venäjä"))!;
    expect(view.tables[0].rows).toHaveLength(1);
    expect(view.notes).toContain("Not normally used in the plural.");
  });
  it("shows a verb's minä-form and its four tables", () => {
    const view = formsOf(find("liukua"))!;
    expect(view.tables[0].rows[0].cells).toEqual(["liu'un"]);
    expect(view.verb!.map((one) => one.table.forms[one.paradigm][0])).toEqual([
      "olen liukunut",
      "en ole liukunut",
      "olin liukunut",
      "en ollut liukunut",
    ]);
  });
  it("finds a table for every verb in the word lists", () => {
    const missing = items.filter((item) => item.kind === "verb" && !formsOf(item)?.verb?.length);
    expect(missing.map((item) => item.id)).toEqual([]);
  });
  it("shows nothing for words that never change", () => {
    expect(formsOf(find("uudestaan"))).toBeUndefined();
    expect(formsOf(find("Ei voi olla totta!"))).toBeUndefined();
  });
  it("marks what a form adds to the dictionary form", () => {
    expect(splitForm("risteys", "risteyksen")).toEqual(["ristey", "ksen"]);
    expect(splitForm("talo", "talon")).toEqual(["talo", "n"]);
  });
});
