import { describe, expect, it } from "vitest";
import { check } from "./check";

describe("check", () => {
  it("accepts the exact answer", () => {
    expect(check("päättää", ["päättää"])).toEqual({ kind: "correct", exact: true });
  });
  it("accepts wrong capitals but notes them", () => {
    expect(check("Päättää", ["päättää"])).toEqual({ kind: "correct", exact: false });
  });
  it("has no folds: a dotless vowel is a different word", () => {
    expect(check("paattaa", ["päättää"])).toEqual({ kind: "wrong" });
  });
  it("rejects a single letter where the word has a double one", () => {
    expect(check("tuli", ["tulli"])).toEqual({ kind: "wrong" });
  });
  it("ignores punctuation and spacing", () => {
    expect(check("  Ei voi olla totta ", ["Ei voi olla totta!"])).toEqual({ kind: "correct", exact: true });
    expect(check("liuun", ["liu'un"])).toEqual({ kind: "correct", exact: true });
  });
  it("accepts alternatives", () => {
    expect(check("palveluita", ["palveluja", "palveluita"]).kind).toBe("correct");
  });
  it("rejects empty input", () => {
    expect(check("   ", ["päättää"])).toEqual({ kind: "wrong" });
  });
  it("asks for no marker: the language has none", () => {
    expect(check("talo", ["talo"], "talo")).toEqual({ kind: "correct", exact: true });
  });
});
