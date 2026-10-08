import { describe, expect, it } from "vitest";
import { chapters } from "@/content";
import {
  BLITZ_ITEMS,
  COMEBACK,
  answer,
  countsOf,
  daysUntil,
  goalFor,
  itemsIn,
  lineUp,
  markOf,
  marksAfter,
  paceFor,
  startSprint,
  statusOf,
  type BlitzItem,
  type Slot,
  type Sprint,
} from "./blitz";
import type { Progress } from "./progress";

const byTarget = (target: string) => BLITZ_ITEMS.find((item) => item.target === target)!;
const HOUR = 3_600_000;
const ALL = chapters.map((chapter) => chapter.id);

/** A plain line-up of fresh items. */
const fresh = (items: BlitzItem[]): Slot[] => items.map((item) => ({ item, why: "new" }));

describe("blitz items", () => {
  it("makes one card per word and verb", () => {
    const keys = BLITZ_ITEMS.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("makes a word listed in several chapters one card", () => {
    const item = byTarget("paikallinen");
    expect(item.chapters).toEqual([1, 2]);
    expect(item.ids).toEqual(["c1-paikallinen", "c2-paikallinen"]);
  });
  it("keeps distinct meanings and drops repeats", () => {
    expect(byTarget("haitata").meanings).toHaveLength(1);
  });
  it("makes a verb one card with its table", () => {
    const item = byTarget("luvata");
    expect(item.kind).toBe("verbs");
    expect(item.verb?.inf).toBe("luvata");
    expect(item.ids).toContain("v-luvata-m");
    expect(item.chapters).toEqual([2, 3]);
  });
  it("merges end punctuation into one key", () => {
    expect(byTarget("Ei voi olla totta!").key).toBe("Ei voi olla totta");
  });
  it("never lists the word itself among its alternatives", () => {
    const self = BLITZ_ITEMS.filter((item) => item.also.some((text) => text.replace(/[.!?…]+$/u, "") === item.key));
    expect(self.map((item) => item.key)).toEqual([]);
  });
  it("lets twins name each other", () => {
    expect(byTarget("mennä mönkään").also).toContain("mennä pieleen");
    expect(byTarget("mennä pieleen").also).toContain("mennä mönkään");
  });
  it("narrows by kind and chapter", () => {
    const verbs = itemsIn({ kinds: ["verbs"], chapters: [4] });
    expect(verbs.length).toBeGreaterThan(0);
    expect(verbs.every((item) => item.kind === "verbs" && item.chapters.includes(4))).toBe(true);
    expect(itemsIn({ kinds: [], chapters: ALL })).toEqual([]);
  });
});

describe("blitz progress", () => {
  const item = byTarget("paikallinen");

  it("goes new → learning → known", () => {
    let progress: Progress = {};
    expect(statusOf(item, progress)).toBe("new");
    progress = { ...progress, ...marksAfter(item, progress, false, 1) };
    expect(statusOf(item, progress)).toBe("learning");
    progress = { ...progress, ...marksAfter(item, progress, true, 2) };
    progress = { ...progress, ...marksAfter(item, progress, true, 3 + 30 * HOUR) };
    expect(statusOf(item, progress)).toBe("known");
    expect(countsOf([item], progress)).toEqual({ known: 1, learning: 0, new: 0 });
  });
  it("counts a word known at first sight as known", () => {
    expect(statusOf(item, marksAfter(item, {}, true, 1))).toBe("known");
  });
  it("moves all of a word's cards together", () => {
    const marks = marksAfter(item, { [item.ids[0]]: { box: 3, seen: 3, missed: 0, at: 1 } }, false, 2);
    expect(Object.keys(marks)).toEqual(item.ids);
    expect(Object.values(marks).every((mark) => mark.box === 0)).toBe(true);
  });
  it("does not push a known card further before its rest is over", () => {
    const progress: Progress = Object.fromEntries(item.ids.map((id) => [id, { box: 2, seen: 2, missed: 0, at: 0 }]));
    expect(markOf(item, { ...progress, ...marksAfter(item, progress, true, HOUR) })!.box).toBe(2);
    expect(markOf(item, { ...progress, ...marksAfter(item, progress, true, 100 * HOUR) })!.box).toBe(3);
  });
});

describe("blitz line-up", () => {
  it("deals misses, new cards and reviews by weight, and resting cards last", () => {
    const items = BLITZ_ITEMS.slice(0, 40);
    const now = 1000 * HOUR;
    const progress: Progress = {};
    items.slice(0, 5).forEach((item) => item.ids.forEach((id) => (progress[id] = { box: 0, seen: 1, missed: 1, at: now - HOUR })));
    items.slice(5, 10).forEach((item) => item.ids.forEach((id) => (progress[id] = { box: 2, seen: 2, missed: 0, at: now - 500 * HOUR })));
    items.slice(10, 15).forEach((item) => item.ids.forEach((id) => (progress[id] = { box: 2, seen: 2, missed: 0, at: now - HOUR })));
    const slots = lineUp(items, progress, now, () => 0.5);
    const whys = slots.map((slot) => slot.why);
    expect(whys.slice(0, 11)).toEqual(["new", "again", "new", "new", "review", "again", "new", "new", "again", "new", "review"]);
    expect(slots.slice(-5).map((slot) => slot.item)).toEqual(expect.arrayContaining(items.slice(10, 15)));
  });
  it("meets key words and verbs first", () => {
    const slots = lineUp(BLITZ_ITEMS, {}, 0, () => 0.5);
    const firstPlain = slots.findIndex((slot) => !slot.item.core);
    expect(slots.slice(firstPlain).some((slot) => slot.item.core)).toBe(false);
  });
});

describe("blitz sprint", () => {
  const items = BLITZ_ITEMS.slice(0, 12);

  it("brings a miss back once after five cards and again at the end", () => {
    let sprint: Sprint = startSprint(fresh(items));
    const missed = sprint.current!.item;
    sprint = answer(sprint, false);
    const seen: { item: BlitzItem; why: string; first: boolean }[] = [];
    while (sprint.current) {
      seen.push({ ...sprint.current });
      sprint = answer(sprint, sprint.current.item !== missed || sprint.current.why === "closing");
    }
    const returns = seen.map((turn, index) => ({ ...turn, index })).filter((turn) => turn.item === missed);
    expect(returns.map((turn) => turn.why)).toEqual(["retry", "closing"]);
    expect(returns[0].index).toBe(COMEBACK);
    expect(returns.every((turn) => !turn.first)).toBe(true);
    expect(sprint.missed).toEqual([missed]);
  });

  it("never shows a card twice running unless it is the last", () => {
    let sprint: Sprint = startSprint(fresh(items.slice(0, 3)));
    const order: BlitzItem[] = [];
    let guard = 0;
    while (sprint.current && guard++ < 30) {
      order.push(sprint.current.item);
      sprint = answer(sprint, guard > 8);
    }
    const repeats = order.filter((item, index) => index > 0 && order[index - 1] === item);
    expect(repeats.length).toBeLessThanOrEqual(1);
  });

  it("starts the closing round when the time left is what the misses need, and runs past the time", () => {
    let sprint: Sprint = startSprint(fresh(items));
    sprint = answer(sprint, false, { elapsed: 10_000, total: 60_000 });
    expect(sprint.closing).toBe(false);
    sprint = answer(sprint, false, { elapsed: 50_000, total: 60_000 });
    expect(sprint.closing).toBe(true);
    sprint = answer(sprint, false, { elapsed: 70_000, total: 60_000 });
    expect(sprint.current).not.toBeNull();
  });
});

describe("blitz pace", () => {
  it("counts days to the exam", () => {
    expect(daysUntil("2026-10-10", "2026-10-08")).toBe(2);
    expect(daysUntil("2026-10-08", "2026-10-08")).toBe(0);
    expect(daysUntil("2026-10-01", "2026-10-08")).toBe(-7);
  });
  it("paces new cards so all are met by the eve of the exam", () => {
    expect(paceFor(100, 0, 11)).toBe(10);
    expect(paceFor(90, 10, 11)).toBe(10);
    expect(paceFor(5, 0, 0)).toBe(5);
  });
  it("tells each state of the day's goal", () => {
    expect(goalFor(0, 0, 0, 10)).toEqual({ is: "none" });
    expect(goalFor(10, 5, 0, -1)).toEqual({ is: "past" });
    expect(goalFor(10, 0, 3, 10)).toEqual({ is: "seen" });
    expect(goalFor(100, 100, 2, 11)).toEqual({ is: "open", fresh: 2, pace: 11 });
    expect(goalFor(100, 50, 20, 11)).toEqual({ is: "met", fresh: 20 });
  });
});
