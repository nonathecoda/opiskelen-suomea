import { describe, expect, it } from "vitest";
import { CARDS } from "./cards";
import { choicesFor, pickRound, plain, senses } from "./session";

/** A fixed sequence of numbers, so a test always sees the same shuffle. */
function seeded(seed: number) {
  let state = seed;
  return () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
}

describe("session", () => {
  const vocab = CARDS.filter((card) => card.kind === "vocab");

  it("never offers a word with the same meaning as a wrong choice", () => {
    const bad: string[] = [];
    for (const [index, card] of vocab.entries()) {
      for (const reversed of [false, true]) {
        const choices = choicesFor(card, reversed, seeded(index + 1));
        const solution = reversed ? card.prompt : card.answer;
        const mine = new Set(senses(card.prompt));
        for (const choice of choices) {
          if (choice === solution) continue;
          const other = vocab.find((one) => (reversed ? one.prompt : one.answer) === choice)!;
          if (card.accept.map(plain).includes(plain(other.answer)) || senses(other.prompt).some((sense) => mine.has(sense))) {
            bad.push(`${card.id} → ${choice}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("gives four choices with the right one among them", () => {
    const wrong = vocab.filter((card, index) => {
      const choices = choicesFor(card, false, seeded(index + 7));
      return choices.length !== 4 || choices.filter((choice) => choice === card.answer).length !== 1;
    });
    expect(wrong.map((card) => card.id)).toEqual([]);
  });

  it("picks at most a round, missed and new things before well-known ones", () => {
    const cards = vocab.slice(0, 40);
    const progress = Object.fromEntries(cards.slice(0, 20).map((card) => [card.id, { box: 4, seen: 4, missed: 0 }]));
    const round = pickRound(cards.map((card) => ({ card, modes: ["choose"] })), progress, seeded(3));
    expect(round).toHaveLength(15);
    expect(round.every((candidate) => !progress[candidate.card.id])).toBe(true);
  });
});
