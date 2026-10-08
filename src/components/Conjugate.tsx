"use client";

import { useRef, useState, type ReactNode } from "react";
import { profile } from "@/content/profile";
import type { VerbTable } from "@/content/types";
import type { Card } from "@/lib/cards";
import { check, type Verdict } from "@/lib/check";
import { slotCards } from "@/lib/decks";
import { SpecialKeys } from "./Study";
import { PrimaryButton, QuietButton, Target } from "./ui";

const TARGET = profile.target.code;

export type TableResult = { slots: { card: Card; typed: string; verdict: Verdict }[] };

/** A whole paradigm at once: one field per person, checked together. */
export function Conjugate({
  verb,
  paradigm,
  answered,
  onCheck,
  onContinue,
  footer,
}: {
  verb: VerbTable;
  paradigm: string;
  answered?: TableResult;
  onCheck: (result: TableResult) => void;
  onContinue: () => void;
  footer: (content: ReactNode) => ReactNode;
}) {
  const spec = profile.paradigms.find((one) => one.id === paradigm)!;
  const cards = slotCards(verb, paradigm);
  const [values, setValues] = useState<string[]>(() => cards.map(() => ""));
  const fields = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(0);
  const verbClass = profile.verbClasses.find((one) => one.id === verb.class);
  const right = answered?.slots.filter((slot) => slot.verdict.kind === "correct").length ?? 0;

  const checkAll = (typed: string[] = values) =>
    onCheck({ slots: cards.map((card, slot) => ({ card, typed: typed[slot], verdict: check(typed[slot], card.accept) })) });

  return (
    <>
      <main className="scroll-y flex-1 px-5 pb-6 pt-2">
      <div className="mb-4">
        <Target text={verb.inf} fit className="block text-[34px] font-medium leading-tight" />
        <p className="mt-1 text-[16px] text-muted">
          {verbClass?.tag && <span className="mr-2 rounded-full border border-edge px-2 py-0.5 text-[14px]">{verbClass.tag}</span>}
          {verb.base}
        </p>
        <p className="mt-2 text-[15px] font-semibold">{spec.label}</p>
      </div>
      {/* Above the table, so they stay in view over the keyboard. */}
      {!answered && (
        <div className="mb-3">
          <SpecialKeys target={() => fields.current[focused] ?? null} />
        </div>
      )}
      <ul className="grid gap-2">
        {cards.map((card, slot) => {
          const result = answered?.slots[slot];
          const tone = !result
            ? "border-edge focus:border-ink"
            : result.verdict.kind === "correct"
              ? result.verdict.exact
                ? "border-good text-good"
                : "border-good"
              : "border-bad text-bad";
          return (
            <li key={card.id} className="grid gap-1">
              <label className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-[15px] text-muted">{spec.slots[slot]}</span>
                <input
                  ref={(element) => {
                    fields.current[slot] = element;
                  }}
                  lang={TARGET}
                  value={values[slot]}
                  readOnly={!!answered}
                  autoFocus={slot === 0}
                  onFocus={() => setFocused(slot)}
                  onChange={(event) => setValues((current) => current.map((value, index) => (index === slot ? event.target.value : value)))}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (answered) onContinue();
                    else if (slot < cards.length - 1) fields.current[slot + 1]?.focus();
                    else checkAll();
                  }}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint={slot < cards.length - 1 ? "next" : "done"}
                  aria-label={spec.slots[slot]}
                  className={`h-11 min-w-0 flex-1 rounded-xl border-2 bg-surface px-3 font-serif text-[19px] outline-none ${tone}`}
                />
              </label>
              {result && !(result.verdict.kind === "correct" && result.verdict.exact) && (
                <p className="settle pl-15 text-[16px]">
                  <Target text={card.answer} mark className="text-[19px]" />
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {answered && (
        <p role="status" className={`verdict mt-4 text-[20px] font-bold ${right === cards.length ? "text-good" : "text-bad"}`}>
          {right === cards.length ? "All correct!" : `${right}/${cards.length} correct`}
        </p>
      )}
      </main>
      {footer(
        answered ? (
          right === cards.length ? null : <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <QuietButton onClick={() => checkAll(cards.map(() => ""))}>Don&apos;t know</QuietButton>
            <PrimaryButton onClick={() => checkAll()}>Check</PrimaryButton>
          </div>
        ),
      )}
    </>
  );
}
