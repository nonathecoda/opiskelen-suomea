"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { profile } from "@/content/profile";
import { GAP, type Card } from "@/lib/cards";
import { check, type Verdict } from "@/lib/check";
import { candidatesFor, type Deck, type Drillable, type Exercise } from "@/lib/decks";
import { cheer, miss } from "@/lib/feedback";
import { useGuard } from "@/lib/guard";
import { helpFor } from "@/lib/help";
import { close } from "@/lib/nav";
import { progressStore, record, settingsStore } from "@/lib/progress";
import { ask, pickRound, type Candidate, type Question } from "@/lib/session";
import { Conjugate, type TableResult } from "./Conjugate";
import { HelpSheet } from "./HelpSheet";
import { Mark } from "./Mark";
import {
  Answer,
  Fill,
  GLYPH,
  Gapped,
  Icon,
  Label,
  PrimaryButton,
  QuietButton,
  Target,
  TopBar,
  VerdictBanner,
  heroSize,
} from "./ui";

const TARGET = profile.target.code;
/** How long a right answer stays before the next question comes, with and without a spelling note. */
const RIGHT_MS = 1000;
const SPELLING_MS = 2400;

const keyOf = (candidate: Candidate) => (candidate.verb ? `table:${candidate.verb.id}:${candidate.paradigm}` : candidate.card.id);

type Outcome = "right" | "wrong" | "aided";

/** What happened to the question on screen. */
type Answered = {
  correct: boolean;
  aided: boolean;
  /** Write: the verdict, and what was typed. */
  verdict?: Verdict;
  typed?: string;
  /** Choose: the choice picked. */
  picked?: string;
  /** Table: one result per slot. */
  table?: TableResult;
};

type RoundState = {
  candidates: Candidate[];
  queue: Candidate[];
  question: Question | null;
  cleared: number;
  first: Map<string, Outcome>;
};

function begin(candidates: Candidate[]): RoundState {
  const queue = [...candidates];
  return {
    candidates,
    queue,
    question: queue.length ? ask(queue[0], settingsStore.get().direction) : null,
    cleared: 0,
    first: new Map(),
  };
}

const NOT_ASKED: Exercise[] = ["list", "mix", "weak"];

export function Study({ deck, exercises }: { deck: Deck; exercises: Exercise[] }) {
  const [all] = useState(() => {
    const asked = exercises.filter((exercise): exercise is Drillable => !NOT_ASKED.includes(exercise));
    return candidatesFor(deck, asked, settingsStore.get(), progressStore.get());
  });
  const [state, setState] = useState(() => begin(pickRound(all, progressStore.get())));
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [explained, setExplained] = useState(false);
  const [turned, setTurned] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const { root } = useGuard(state.question?.key);
  const question = state.question;

  const next = useCallback(() => {
    // A miss goes to the back of the queue, to be asked afresh.
    const wasWrong = answered !== null && !answered.correct;
    setState((current) => {
      const queue = current.queue.slice(1);
      if (wasWrong) queue.push(current.queue[0]);
      return {
        ...current,
        queue,
        question: queue.length ? ask(queue[0], settingsStore.get().direction) : null,
      };
    });
    setAnswered(null);
    setExplained(false);
    setTurned(false);
    // Inside the tap: the only moment an iPhone keeps its keyboard up for the next field.
    field.current?.focus({ preventScroll: true });
  }, [answered]);

  const settle = useCallback(
    (result: Omit<Answered, "aided">) => {
      if (!question || answered) return;
      const aided = explained;
      const key = keyOf(question.candidate);
      if (!state.first.has(key)) {
        // Only the first try of each thing is saved; an answer after the explanation counts as not known.
        if (result.table && question.verb) {
          result.table.slots.forEach((slot) => record(slot.card.id, slot.verdict.kind === "correct" && !aided));
        } else {
          record(question.card.id, result.correct && !aided);
        }
      }
      setState((current) => {
        const first = new Map(current.first);
        if (!first.has(key)) first.set(key, aided ? "aided" : result.correct ? "right" : "wrong");
        return { ...current, first, cleared: current.cleared + (result.correct ? 1 : 0) };
      });
      if (result.correct && !aided) cheer();
      if (!result.correct) miss();
      setAnswered({ ...result, aided });
    },
    [question, answered, explained, state.first],
  );

  // A right answer moves on by itself; nothing moves while the help is open, and the wait starts over when it closes.
  const spelling = answered?.verdict?.kind === "correct" && !answered.verdict.exact;
  useEffect(() => {
    if (!answered?.correct || helpOpen) return;
    const timer = setTimeout(next, spelling ? SPELLING_MS : RIGHT_MS);
    return () => clearTimeout(timer);
  }, [answered, helpOpen, spelling, next]);

  if (!all.length) {
    return (
      <div ref={root} className="app-shell">
        <TopBar onClose={close} quiet />
        <main className="scroll-y flex-1 px-5 pt-10 text-center">
          <h1 className="font-serif text-[32px] font-semibold">Nothing to practise</h1>
          <p className="mt-2 text-[16px] text-muted">This selection has nothing for this exercise.</p>
        </main>
        <div className="pad-bottom px-5">
          <PrimaryButton onClick={close}>Back</PrimaryButton>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <Summary
        state={state}
        root={root}
        retry={(missed) => {
          setState(begin(missed));
          setAnswered(null);
        }}
        again={() => {
          setState(begin(pickRound(all, progressStore.get())));
          setAnswered(null);
        }}
      />
    );
  }

  const total = state.candidates.length;
  const help = helpFor(question.mode === "table" && question.verb ? question.card : question.card);
  const canStillCount = !answered;

  return (
    <div ref={root} className="app-shell">
      <TopBar onClose={close} quiet>
        <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <Fill value={state.cleared / total} className="bg-accent" />
        </span>
        <span className="w-14 text-right text-[15px] tabular-nums text-muted">
          {state.cleared}/{total}
        </span>
        {help && (
          <button
            type="button"
            aria-label="Help"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => setHelpOpen(true)}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full border border-edge text-[18px] font-semibold active:bg-line"
          >
            ?
          </button>
        )}
      </TopBar>

      {question.mode === "table" && question.verb && question.paradigm ? (
        <Conjugate
          key={question.key}
          verb={question.verb}
          paradigm={question.paradigm}
          answered={answered?.table}
          onCheck={(table) => settle({ correct: table.slots.every((slot) => slot.verdict.kind === "correct"), table })}
          onContinue={next}
          footer={(content) => <Footer>{content}</Footer>}
        />
      ) : (
        <main className="scroll-y flex-1 px-5 pb-6">
            <div key={question.key} className="onward pt-2">
              <Prompt question={question} answered={answered} />
              {question.mode === "choose" && <Choices question={question} answered={answered} onPick={(choice) => settle({ correct: choice === question.solution, picked: choice })} />}
              {question.mode === "flash" && <FlashCard question={question} shown={turned || !!answered} onTurn={() => setTurned(true)} />}
            </div>
            {question.mode === "write" && (
              <Write question={question} answered={answered} field={field} onCheck={(typed) => settle(writeResult(question, typed))} onContinue={next} />
            )}
            {answered && question.mode !== "write" && <Verdict question={question} answered={answered} />}
        </main>
      )}

      {question.mode === "flash" && (
        <FlashFooter turned={turned} answered={answered} onTurn={() => setTurned(true)} onGrade={(knew) => settle({ correct: knew })} onContinue={next} />
      )}
      {question.mode === "choose" && answered && !answered.correct && (
        <Footer>
          <PrimaryButton onClick={next}>Continue</PrimaryButton>
        </Footer>
      )}
      {question.mode === "write" && (
        <Footer>
          {answered ? (
            !answered.correct && <PrimaryButton onClick={next}>Continue</PrimaryButton>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <QuietButton onClick={() => settle({ correct: false, typed: "", verdict: { kind: "wrong" } })}>Don&apos;t know</QuietButton>
              <PrimaryButton onClick={() => settle(writeResult(question, field.current?.value ?? ""))}>Check</PrimaryButton>
            </div>
          )}
        </Footer>
      )}

      {helpOpen && help && (
        <HelpSheet
          help={help}
          counts={canStillCount}
          onExplain={() => {
            if (!answered) setExplained(true);
          }}
          onClose={() => setHelpOpen(false)}
        />
      )}
    </div>
  );
}

function writeResult(question: Question, typed: string): Omit<Answered, "aided"> {
  const verdict = check(typed, question.card.accept, question.card.bare);
  return { correct: verdict.kind === "correct", verdict, typed };
}

function Footer({ children }: { children: ReactNode }) {
  return <footer className="pad-bottom grid gap-2 px-5 pt-3">{children}</footer>;
}

/** What to do, and the question. */
function Prompt({ question, answered }: { question: Question; answered: Answered | null }) {
  const { card } = question;
  const gap = question.prompt.includes(GAP);
  const targetPrompt = question.reversed || card.promptTarget;
  const label = card.ask ?? (gap ? "Fill in" : question.reversed ? `In ${profile.base.name}` : `In ${profile.target.name}`);
  const filled = answered && gap ? question.solution : undefined;
  return (
    <div className="mb-5">
      <Label as="p" className="mb-2 text-muted">
        {label}
      </Label>
      {gap ? (
        <p className="text-[26px] leading-snug">
          <Gapped text={question.prompt} fill={filled} />
        </p>
      ) : targetPrompt ? (
        <Target text={question.prompt} fit className={`${heroSize(question.prompt)} block font-medium leading-tight`} />
      ) : (
        <p className="text-[26px] leading-snug">{question.prompt}</p>
      )}
      {(card.hint || card.cue) && (
        <p className="mt-2 text-[15px] text-muted">
          {card.hint && (
            <>
              (<span lang={TARGET} className="font-serif text-[17px]">{card.hint}</span>){" "}
            </>
          )}
          {card.cue}
        </p>
      )}
    </div>
  );
}

/** Whether the solution of a question is target language. */
const targetAnswer = (question: Question) => !question.reversed && !question.card.answerBase;

function Choices({ question, answered, onPick }: { question: Question; answered: Answered | null; onPick: (choice: string) => void }) {
  const target = targetAnswer(question);
  return (
    <ul className="grid gap-2.5">
      {question.choices.map((choice) => {
        const right = choice === question.solution;
        const picked = answered?.picked === choice;
        const state = !answered ? "open" : right ? "right" : picked ? "wrong" : "aside";
        return (
          <li key={choice}>
            <button
              type="button"
              disabled={!!answered}
              onClick={() => onPick(choice)}
              className={`press flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left ${
                state === "open"
                  ? "border-2 border-edge bg-surface active:bg-line"
                  : state === "right"
                    ? "pop border-2 border-good bg-good text-accent-ink"
                    : state === "wrong"
                      ? "shake border-2 border-bad bg-bad text-accent-ink"
                      : "border-2 border-transparent text-muted"
              }`}
            >
              <span className="min-w-0 flex-1">
                {target ? (
                  <Target text={choice} fit className="text-[24px] font-medium leading-snug" />
                ) : (
                  <span className="text-[20px] leading-snug">{choice}</span>
                )}
              </span>
              {state === "right" && <Icon size={22}>{GLYPH.check}</Icon>}
              {state === "wrong" && <Icon size={22}>{GLYPH.close}</Icon>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The answer to a choose or cards question, under it. */
function Verdict({ question, answered }: { question: Question; answered: Answered }) {
  if (question.mode === "flash") return null;
  const title = answered.correct ? (answered.aided ? "Correct, with the explanation" : "Correct!") : "Wrong";
  return (
    <div className="mt-5">
      <VerdictBanner correct={answered.correct} title={title}>
        {!answered.correct && (
          <>
            <p className="text-[15px] text-muted">Right answer</p>
            <Answer>
              <SolutionText question={question} />
            </Answer>
          </>
        )}
        {question.card.note && question.card.kind !== "drill" && <p className="mt-1 text-[15px] text-muted">{question.card.note}</p>}
      </VerdictBanner>
    </div>
  );
}

function SolutionText({ question }: { question: Question }) {
  return targetAnswer(question) ? <Target text={question.solution} mark draw /> : <span className="hl hl-write">{question.solution}</span>;
}

function FlashCard({ question, shown, onTurn }: { question: Question; shown: boolean; onTurn: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTurn}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onTurn()}
      className="flex min-h-[58dvh] flex-col justify-end rounded-3xl border-2 border-edge bg-surface p-5"
    >
      {shown ? (
        <div className="settle">
          {targetAnswer(question) ? (
            <Target text={question.card.head ?? question.solution} fit className={`${heroSize(question.card.head ?? question.solution)} block font-medium leading-tight`} />
          ) : (
            <p className="text-[26px] leading-snug">{question.solution}</p>
          )}
          {question.card.note && <p className="mt-2 text-[15px] text-muted">{question.card.note}</p>}
        </div>
      ) : (
        <p className="text-center text-[15px] text-muted">Tap to turn</p>
      )}
    </div>
  );
}

function FlashFooter({
  turned,
  answered,
  onTurn,
  onGrade,
  onContinue,
}: {
  turned: boolean;
  answered: Answered | null;
  onTurn: () => void;
  onGrade: (knew: boolean) => void;
  onContinue: () => void;
}) {
  if (answered) {
    return answered.correct ? null : (
      <Footer>
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
      </Footer>
    );
  }
  return (
    <Footer>
      {turned ? (
        <div className="grid grid-cols-2 gap-2">
          <QuietButton onClick={() => onGrade(false)}>Didn&apos;t know</QuietButton>
          <PrimaryButton tone="accent" onClick={() => onGrade(true)}>
            Knew it
          </PrimaryButton>
        </div>
      ) : (
        <QuietButton onClick={onTurn}>Show answer</QuietButton>
      )}
    </Footer>
  );
}

/** Keys for the letters a base-language keyboard lacks. They type at the caret and leave the focus in the field. */
export function SpecialKeys({ target }: { target: () => HTMLInputElement | null }) {
  if (!profile.specialKeys.length) return null;
  return (
    <div className="flex gap-2">
      {profile.specialKeys.map((key) => (
        <button
          key={key}
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            const input = target();
            if (!input) return;
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? start;
            input.setRangeText(key, start, end, "end");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus({ preventScroll: true });
          }}
          className="press h-11 min-w-11 rounded-xl border border-edge bg-surface px-3 font-serif text-[20px] active:bg-line"
          lang={TARGET}
        >
          {key}
        </button>
      ))}
    </div>
  );
}

function Write({
  question,
  answered,
  field,
  onCheck,
  onContinue,
}: {
  question: Question;
  answered: Answered | null;
  field: React.RefObject<HTMLInputElement | null>;
  onCheck: (typed: string) => void;
  onContinue: () => void;
}) {
  const [value, setValue] = useState("");
  // A new question empties the field, which itself stays.
  const [shownKey, setShownKey] = useState(question.key);
  if (shownKey !== question.key) {
    setShownKey(question.key);
    setValue("");
  }
  const verdict = answered?.verdict;
  const tone = !verdict ? "border-edge focus:border-ink" : verdict.kind === "correct" ? "border-good text-good" : "border-bad text-bad";
  return (
    <div className="mt-5 grid gap-3">
      <input
        ref={field}
        lang={TARGET}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          if (answered) onContinue();
          else onCheck(value);
        }}
        readOnly={!!answered}
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint={answered ? "next" : "done"}
        aria-label="Your answer"
        className={`h-16 w-full rounded-2xl border-2 bg-surface px-4 font-serif text-[26px] outline-none ${tone}`}
      />
      <SpecialKeys target={() => field.current} />
      {verdict?.kind === "correct" && (
        <div className="rise" role="status">
          <p className="text-[17px] font-semibold text-good">{answered?.aided ? "Correct, with the explanation" : "Correct!"}</p>
          {!verdict.exact && (
            <p className="mt-1 text-[16px]">
              Mind the spelling: <Target text={question.solution} mark draw className="text-[22px]" />
            </p>
          )}
        </div>
      )}
      {answered && verdict?.kind !== "correct" && (
        <div className="verdict grid gap-2 rounded-2xl border-2 border-bad bg-surface px-4 py-3" role="status">
          <p className="text-[17px] font-semibold text-bad">Wrong</p>
          {answered.typed ? (
            <div>
              <p className="text-[15px] text-muted">You wrote:</p>
              <Answer>
                <Target text={answered.typed} />
              </Answer>
            </div>
          ) : null}
          <div>
            <p className="text-[15px] text-muted">Right answer</p>
            <Answer>
              <Target text={question.solution} mark draw />
            </Answer>
          </div>
          {question.card.note && question.card.kind !== "drill" && <p className="text-[15px] text-muted">{question.card.note}</p>}
        </div>
      )}
    </div>
  );
}

function Summary({
  state,
  root,
  retry,
  again,
}: {
  state: RoundState;
  root: (element: HTMLElement | null) => (() => void) | undefined;
  retry: (missed: Candidate[]) => void;
  again: () => void;
}) {
  const total = state.candidates.length;
  const right = [...state.first.values()].filter((outcome) => outcome === "right").length;
  const missed = state.candidates.filter((candidate) => state.first.get(keyOf(candidate)) !== "right");
  const clean = missed.length === 0;
  return (
    <div ref={root} className="app-shell">
      <TopBar onClose={close} quiet />
      <main className="summary scroll-y flex-1 px-5 pb-6">
        <h1 style={{ "--i": 0 } as CSSProperties} className="font-serif text-[32px] font-semibold">
          Round done
        </h1>
        <div style={{ "--i": 1 } as CSSProperties} className="mt-3 flex items-center gap-4">
          <p className="font-serif text-[56px] font-semibold leading-none tabular-nums">
            {right}/{total}
          </p>
          <Mark height={64} eyes={clean ? "closed" : "open"} />
        </div>
        <p style={{ "--i": 2 } as CSSProperties} className="mt-2 text-[16px] text-muted">
          {clean ? "All correct on the first try." : "correct on the first try"}
        </p>
        {missed.length > 0 && (
          <div style={{ "--i": 3 } as CSSProperties} className="mt-6">
            <Label ruled className="mb-2">
              Worth going over
            </Label>
            <ul>
              {missed.map((candidate) => (
                <MissRow key={keyOf(candidate)} candidate={candidate} />
              ))}
            </ul>
          </div>
        )}
      </main>
      <footer className="pad-bottom grid grid-cols-2 gap-2 px-5 pt-3">
        <QuietButton onClick={close}>Done</QuietButton>
        {missed.length ? (
          <PrimaryButton tone="accent" onClick={() => retry(missed)}>
            Retry mistakes ({missed.length})
          </PrimaryButton>
        ) : (
          <PrimaryButton tone="accent" onClick={again}>
            New round
          </PrimaryButton>
        )}
      </footer>
    </div>
  );
}

function MissRow({ candidate }: { candidate: Candidate }) {
  const card: Card = candidate.card;
  if (candidate.verb) {
    return (
      <li className="border-b border-line py-2">
        <Target text={candidate.verb.inf} className="text-[19px] font-medium" />{" "}
        <span className="text-[16px] text-muted">
          {profile.paradigms.find((paradigm) => paradigm.id === candidate.paradigm)?.label}
        </span>
      </li>
    );
  }
  const promptIsTarget = card.promptTarget || card.prompt.includes(GAP);
  return (
    <li className="border-b border-line py-2">
      {promptIsTarget ? (
        <Gapped text={card.prompt} fill={card.prompt.includes(GAP) ? card.answer : undefined} still className="text-[19px]" />
      ) : (
        <Target text={card.answer} className="text-[19px] font-medium" />
      )}
      <span className="block text-[15px] text-muted">{card.answerBase ? card.answer : card.prompt.includes(GAP) ? card.cue : card.prompt}</span>
    </li>
  );
}
