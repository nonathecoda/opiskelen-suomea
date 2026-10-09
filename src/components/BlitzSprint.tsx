"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { profile } from "@/content/profile";
import {
  answer,
  blitzStore,
  countsOf,
  itemsIn,
  lineUp,
  marksAfter,
  noteFresh,
  startSprint,
  statusOf,
  type BlitzItem,
  type BlitzSettings,
  type Sprint,
} from "@/lib/blitz";
import { cheer, tick } from "@/lib/feedback";
import { SETTLE_MS, useGuard } from "@/lib/guard";
import { close } from "@/lib/nav";
import { progressStore, setMarks, type Mark as Marks } from "@/lib/progress";
import { Coverage, GoalLine, directionLabel, useGoal } from "./Blitz";
import { Mark } from "./Mark";
import { Fill, Icon, Label, ParadigmTable, PrimaryButton, QuietButton, Target, TopBar, heroSize } from "./ui";

const TICK_MS = 250;

type Step = { sprint: Sprint; marks: Record<string, Marks | undefined>; fresh: boolean };

function newSprint(settings: BlitzSettings): Sprint {
  return startSprint(lineUp(itemsIn(settings), progressStore.get(), Date.now()));
}

function clockText(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function BlitzSprint() {
  // The settings are read once, when the sprint begins.
  const [settings] = useState(() => blitzStore.get());
  const [run, setRun] = useState(0);
  return <Run key={run} settings={settings} again={() => setRun((count) => count + 1)} />;
}

function Run({ settings, again }: { settings: BlitzSettings; again: () => void }) {
  const total = settings.minutes * 60_000;
  const [sprint, setSprint] = useState(() => newSprint(settings));
  const [history, setHistory] = useState<Step[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [way, setWay] = useState<"next" | "back">("next");
  const current = sprint.current;
  const done = current === null;
  const shownAt = useRef(0);
  const revealedAt = useRef(0);
  const { root } = useGuard(current);

  useEffect(() => {
    shownAt.current = performance.now();
  }, [current]);

  // The clock counts only time the page is seen: nothing while it is hidden, and at most four ticks after a gap.
  useEffect(() => {
    if (done) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const step = Math.min(now - last, TICK_MS * 4);
      last = now;
      if (!document.hidden) setElapsed((time) => time + step);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [done]);

  const reveal = useCallback(() => {
    if (revealed || performance.now() - shownAt.current < SETTLE_MS) return;
    revealedAt.current = performance.now();
    setRevealed(true);
  }, [revealed]);

  const letters = current ? current.item.target.length : 0;
  const delay = settings.reveal ? settings.reveal * 1000 + Math.min(letters, 50) * 40 : 0;

  // The answer shows by itself after a while, unless it is left to a tap.
  useEffect(() => {
    if (!current || revealed || !delay) return;
    const timer = setTimeout(() => {
      revealedAt.current = performance.now();
      setRevealed(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [current, revealed, delay]);

  const grade = useCallback(
    (knew: boolean) => {
      if (!current || !revealed || performance.now() - revealedAt.current < SETTLE_MS) return;
      const progress = progressStore.get();
      let marks: Record<string, Marks | undefined> = {};
      let fresh = false;
      if (current.first) {
        // Saved at once, so leaving early loses nothing.
        fresh = statusOf(current.item, progress) === "new";
        marks = Object.fromEntries(current.item.ids.map((id) => [id, progress[id]]));
        setMarks(marksAfter(current.item, progress, knew, Date.now()));
        if (fresh) noteFresh();
      }
      if (knew) tick();
      const next = answer(sprint, knew, { elapsed, total });
      setHistory((steps) => [...steps, { sprint, marks, fresh }]);
      setSprint(next);
      setRevealed(false);
      setWay("next");
      if (!next.current) cheer();
    },
    [current, revealed, sprint, elapsed, total],
  );

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setMarks(last.marks);
    if (last.fresh) noteFresh(-1);
    setHistory((steps) => steps.slice(0, -1));
    setSprint(last.sprint);
    setRevealed(false);
    setWay("back");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (done) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        reveal();
      } else if (event.key === "ArrowRight") grade(true);
      else if (event.key === "ArrowLeft") grade(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, reveal, grade]);

  if (done && sprint.cards === 0 && history.length === 0) {
    return (
      <div ref={root} className="app-shell">
        <TopBar onClose={close} quiet />
        <main className="scroll-y flex-1 px-5 pt-10 text-center">
          <h1 className="headline text-[32px] leading-tight">No cards</h1>
          <p className="mt-2 text-[16px] text-muted">Pick content and at least one chapter on the Blitz tab.</p>
        </main>
        <div className="pad-bottom px-5">
          <PrimaryButton onClick={close}>Back</PrimaryButton>
        </div>
      </div>
    );
  }

  if (done) return <Summary sprint={sprint} elapsed={elapsed} settings={settings} again={again} root={root} />;

  const left = Math.max(0, total - elapsed);
  const why = whyText(sprint, current!, elapsed >= total);
  return (
    <div ref={root} className="app-shell">
      <TopBar onClose={close} quiet>
        <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <Fill value={left / total} className="bg-muted [--bar-ease:linear]" />
        </span>
        <span role="timer" className="w-12 text-right text-[15px] tabular-nums text-muted">
          {clockText(left)}
        </span>
        <button
          type="button"
          onClick={undo}
          aria-label="Undo"
          disabled={!history.length}
          className={`press grid h-11 w-11 place-items-center rounded-full active:bg-line ${history.length ? "text-muted" : "text-line"}`}
        >
          <Icon>
            <path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2" />
          </Icon>
        </button>
      </TopBar>
      <main className="scroll-y flex flex-1 flex-col px-5">
        <div
          key={`${current!.item.key}-${sprint.cards}`}
          role="button"
          tabIndex={0}
          onClick={reveal}
          data-way={way === "back" ? "back" : undefined}
          className="onward flex min-h-[58%] w-full flex-1 flex-col rounded-3xl border border-edge bg-surface px-5 py-6 text-left"
        >
          <Asked item={current!.item} settings={settings} />
          {revealed && (
            <div className="settle mt-5 border-t border-line pt-4">
              <Revealed item={current!.item} settings={settings} />
            </div>
          )}
        </div>
      </main>
      <footer className="pad-bottom grid gap-2 px-5 pt-3">
        <p className="text-center text-[15px] text-muted">{why}</p>
        {!revealed ? (
          <button
            type="button"
            onClick={reveal}
            className="press relative h-14 w-full overflow-hidden rounded-2xl border border-edge bg-surface text-[17px] font-semibold"
          >
            {delay > 0 && (
              <span
                key={`${current!.item.key}-${sprint.cards}`}
                aria-hidden="true"
                className="fill absolute inset-0 bg-line"
                style={{ animationDuration: `${delay}ms` } as CSSProperties}
              />
            )}
            <span className="relative">Show answer</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <QuietButton onClick={() => grade(false)}>Didn&apos;t know</QuietButton>
            <PrimaryButton tone="accent" onClick={() => grade(true)}>
              Knew it
            </PrimaryButton>
          </div>
        )}
      </footer>
    </div>
  );
}

function whyText(sprint: Sprint, turn: NonNullable<Sprint["current"]>, timeUp: boolean): string {
  const verb = turn.item.verb ? " · verb" : "";
  if (timeUp && !sprint.waiting.length && turn.why !== "closing") return "Time is up: this is the last card.";
  const reason =
    turn.why === "new"
      ? "New"
      : turn.why === "again"
        ? "Missed last time"
        : turn.why === "retry"
          ? "Again"
          : turn.why === "closing"
            ? `Final round · ${sprint.waiting.length ? `${sprint.waiting.length + 1} left` : "last one"}`
            : "Review";
  return reason + verb;
}

/** The side that is asked. */
function Asked({ item, settings }: { item: BlitzItem; settings: BlitzSettings }) {
  if (settings.direction === "t2b") {
    return <Target text={item.target} fit className={`${heroSize(item.target)} font-medium leading-tight`} />;
  }
  const long = item.meanings.some((meaning) => meaning.base.length > 30);
  return (
    <ul className="grid gap-2">
      {item.meanings.map((meaning, index) => (
        <li key={index}>
          <span className={`block leading-snug ${long ? "text-[22px]" : "text-[26px]"}`}>{meaning.base}</span>
          {meaning.cue && <span className="block text-[15px] text-muted">{meaning.cue}</span>}
        </li>
      ))}
    </ul>
  );
}

/** The other side, with the forms, alternatives and notes, and a verb's table. */
function Revealed({ item, settings }: { item: BlitzItem; settings: BlitzSettings }) {
  const notes = [...new Set(item.meanings.map((meaning) => meaning.note).filter((note): note is string => !!note))];
  return (
    <div className="grid gap-3">
      {settings.direction === "t2b" ? (
        <ul className="grid gap-1">
          {item.meanings.map((meaning, index) => (
            <li key={index} className="text-[22px] leading-snug">
              {meaning.base}
              {meaning.cue && <span className="block text-[15px] text-muted">{meaning.cue}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <Target text={item.target} fit className={`${heroSize(item.target)} font-medium leading-tight`} />
      )}
      {item.forms.length > 0 && (
        <p className="text-[16px] text-muted">
          {item.forms.map((form, index) => (
            <span key={form.label}>
              {index > 0 && " · "}
              {form.label}: <Target text={form.value} className="text-[19px] text-ink" />
            </span>
          ))}
        </p>
      )}
      {item.also.length > 0 && (
        <p className="text-[16px] text-muted">
          Also: <span lang={profile.target.code} className="font-display text-[19px] text-ink">{item.also.join(", ")}</span>
        </p>
      )}
      {notes.map((note) => (
        <p key={note} className="text-[15px] text-muted">
          {note}
        </p>
      ))}
      {item.verb && (
        <div className="mt-1">
          <ParadigmTable verb={item.verb} paradigm={profile.paradigms[0].id} title={profile.paradigms[0].label} />
          {item.verb.note && <p className="mt-2 text-[15px] text-muted">{item.verb.note}</p>}
        </div>
      )}
    </div>
  );
}

function Summary({
  sprint,
  elapsed,
  settings,
  again,
  root,
}: {
  sprint: Sprint;
  elapsed: number;
  settings: BlitzSettings;
  again: () => void;
  root: (element: HTMLElement | null) => (() => void) | undefined;
}) {
  const progress = progressStore.use();
  const { goal } = useGoal();
  const met = goal?.is === "met" || goal?.is === "seen";
  const cards = sprint.knew + sprint.missed.length;
  const counts = countsOf(itemsIn(settings), progress);
  const rows = [
    ["New cards", sprint.fresh],
    ["Knew at once", sprint.knew],
    ["Left to learn", sprint.missed.length],
  ] as const;
  return (
    <div ref={root} className="app-shell">
      <TopBar onClose={close} quiet />
      <main className="summary scroll-y flex-1 px-5 pb-6">
        <div style={{ "--i": 0 } as CSSProperties} className="flex items-center gap-4">
          <p className="flex-1 font-display text-[56px] font-semibold leading-none tabular-nums">
            {cards} <span className="text-[26px]">{cards === 1 ? "card" : "cards"}</span>
          </p>
          <Mark height={64} eyes={met ? "closed" : "open"} />
        </div>
        <p style={{ "--i": 1 } as CSSProperties} className="mt-2 text-[16px] text-muted">
          {sprint.cards} answers in {clockText(elapsed)} · {directionLabel(settings.direction)}
        </p>
        <ul style={{ "--i": 2 } as CSSProperties} className="mt-5 grid gap-1">
          {rows.map(([label, count]) => (
            <li key={label} className="flex min-h-11 items-center border-b border-line text-[16px]">
              <span className="flex-1">{label}</span>
              <span className="tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
        {goal && (
          <div style={{ "--i": 3 } as CSSProperties} className="mt-5">
            <GoalLine goal={goal} />
          </div>
        )}
        <div style={{ "--i": 4 } as CSSProperties} className="mt-6">
          <Label ruled className="mb-3">
            Whole selection
          </Label>
          <Coverage known={counts.known} learning={counts.learning} fresh={counts.new} />
        </div>
        {sprint.missed.length > 0 && (
          <div style={{ "--i": 5 } as CSSProperties} className="mt-6">
            <Label ruled className="mb-2">
              These come back in the next blitz
            </Label>
            <ul className="grid gap-1">
              {sprint.missed.map((item) => (
                <li key={item.key} className="flex flex-wrap items-baseline gap-x-3 border-b border-line py-1.5">
                  <Target text={item.target} className="text-[19px] font-medium" />
                  <span className="text-[16px] text-muted">{item.meanings.map((meaning) => meaning.base).join("; ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <footer className="pad-bottom grid grid-cols-2 gap-2 px-5 pt-3">
        {met ? (
          <>
            <QuietButton onClick={again}>One more blitz</QuietButton>
            <PrimaryButton tone="accent" onClick={close}>
              Done
            </PrimaryButton>
          </>
        ) : (
          <>
            <QuietButton onClick={close}>Done</QuietButton>
            <PrimaryButton tone="accent" onClick={again}>
              One more
            </PrimaryButton>
          </>
        )}
      </footer>
    </div>
  );
}

