import { describe, expect, it } from "vitest";
import { isKnown, isWeak, marked } from "./progress";

describe("progress", () => {
  it("calls a card weak when it was missed and not yet known twice running", () => {
    const missed = marked(undefined, false, 1);
    expect(isWeak(missed)).toBe(true);
    const once = marked(missed, true, 2);
    expect(isWeak(once)).toBe(true);
    const twice = marked(once, true, 3);
    expect(isWeak(twice)).toBe(false);
    expect(isKnown(twice)).toBe(true);
  });
  it("does not call weak a card right the only time it was asked", () => {
    expect(isWeak(marked(undefined, true, 1))).toBe(false);
  });
  it("does not call weak a card never asked", () => {
    expect(isWeak(undefined)).toBe(false);
  });
  it("counts a card known at first sight as known", () => {
    expect(isKnown(marked(undefined, true, 1, true))).toBe(true);
    expect(isKnown(marked(undefined, true, 1))).toBe(false);
  });
});
