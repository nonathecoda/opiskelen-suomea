import { describe, expect, it } from "vitest";
import { MAX_ZOOM, clampZoom, heldAt, scrollFor } from "./zoom";

describe("zoom", () => {
  it("stays between whole and four times", () => {
    expect(clampZoom(0.3)).toBe(1);
    expect(clampZoom(2)).toBe(2);
    expect(clampZoom(9)).toBe(MAX_ZOOM);
  });
  it("keeps the point under the fingers under them", () => {
    const held = heldAt(120, 80, 2);
    const scroll = scrollFor(held, 80, 3);
    expect(heldAt(scroll, 80, 3)).toBeCloseTo(held);
  });
});
