"use client";

import { useSyncExternalStore } from "react";
import { chapters } from "@/content";
import { profile } from "@/content/profile";
import {
  MINUTES,
  REVEALS,
  blitzStore,
  countsOf,
  dayKey,
  daysUntil,
  freshToday,
  goalFor,
  itemsIn,
  type BlitzKind,
  type Goal,
} from "@/lib/blitz";
import { open } from "@/lib/nav";
import { progressStore, type Direction } from "@/lib/progress";
import { InstallRow } from "./InstallGuide";
import { TabTitle } from "./Home";
import { Chip, Fill, Label, Segmented } from "./ui";

const KINDS: { kind: BlitzKind; label: string }[] = [
  { kind: "words", label: "Words" },
  { kind: "phrases", label: "Phrases" },
  { kind: "verbs", label: "Verbs" },
];

export const directionLabel = (direction: Direction) =>
  direction === "t2b" ? `${profile.target.name} → ${profile.base.name}` : `${profile.base.name} → ${profile.target.name}`;

/** Today, which the server cannot know: absent until the page is in the browser. */
export function useToday(): string | undefined {
  return useSyncExternalStore(
    (listener) => {
      const timer = setInterval(listener, 60_000);
      return () => clearInterval(timer);
    },
    () => dayKey(new Date()),
    () => undefined,
  );
}

/** Coverage of the chosen cards: known solid, learning hatched, on the track. */
export function Coverage({ known, learning, fresh }: { known: number; learning: number; fresh: number }) {
  const total = known + learning + fresh;
  return (
    <div>
      <span className="relative block h-3 overflow-hidden rounded-full bg-line">
        <span className="absolute inset-0">
          <Fill value={total ? (known + learning) / total : 0} className="hatch" />
        </span>
        <span className="absolute inset-0">
          <Fill value={total ? known / total : 0} className="bg-accent" />
        </span>
      </span>
      <ul className="mt-3 grid gap-1.5 text-[16px]">
        {[
          { label: "Known", count: known, swatch: "bg-accent" },
          { label: "Learning", count: learning, swatch: "hatch" },
          { label: "Not seen", count: fresh, swatch: "bg-line" },
        ].map((row) => (
          <li key={row.label} className="flex items-center gap-2.5">
            <span className={`h-3.5 w-3.5 rounded-[4px] ${row.swatch}`} />
            <span className="flex-1">{row.label}</span>
            <span className="tabular-nums text-muted">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The day's goal in one line, with a meter where there is one to fill. */
export function GoalLine({ goal }: { goal: Goal }) {
  if (goal.is === "none") return null;
  if (goal.is === "past") return <p className="text-[15px] text-muted">Change the exam date to see today&apos;s goal.</p>;
  if (goal.is === "seen") return <p className="text-[15px] text-muted">Every card has been seen. The rest is review.</p>;
  const met = goal.is === "met";
  return (
    <div>
      <p className="text-[16px]">
        {met ? (
          <>Today&apos;s goal reached · {goal.fresh} new cards today</>
        ) : (
          <>
            Today <span className="tabular-nums">{goal.fresh}/{goal.pace}</span> new cards
          </>
        )}
      </p>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line">
        <Fill value={met ? 1 : goal.fresh / goal.pace} className="bg-accent" />
      </span>
    </div>
  );
}

/** The day's goal for the current selection, or undefined while the date is unknown or unset. */
export function useGoal(): { goal?: Goal; days?: number } {
  const settings = blitzStore.use();
  const progress = progressStore.use();
  const today = useToday();
  if (!today || !settings.exam) return {};
  const items = itemsIn(settings);
  const counts = countsOf(items, progress);
  const days = daysUntil(settings.exam, today);
  return { goal: goalFor(items.length, counts.new, freshToday(settings, today), days), days };
}

function daysText(days: number): string {
  if (days < 0) return "The exam date has passed";
  if (days === 0) return "The exam is today";
  if (days === 1) return "The exam is tomorrow";
  return `${days} days to the exam`;
}

function formatDate(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function Blitz() {
  const settings = blitzStore.use();
  const progress = progressStore.use();
  const items = itemsIn(settings);
  const counts = countsOf(items, progress);
  const { goal, days } = useGoal();
  const set = (patch: Partial<typeof settings>) => blitzStore.set({ ...settings, ...patch });
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((one) => one !== value) : [...list, value]);

  return (
    <>
      <TabTitle title="Blitz">
        Look, guess, check. A miss comes back a moment later and again at the end of the blitz, until you know it.
      </TabTitle>

      <section className="mb-7">
        <Coverage known={counts.known} learning={counts.learning} fresh={counts.new} />
      </section>

      {/* Room is kept for the plan from the first paint, so nothing below it jumps. */}
      <section className="mb-7 min-h-[76px] rounded-2xl border border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="flex-1 text-[16px] font-medium">
            {settings.exam && days !== undefined ? daysText(days) : "Pick your exam date to get a daily pace"}
          </p>
          <label className="relative flex min-h-11 items-center">
            <span className="link text-[16px]">{settings.exam ? formatDate(settings.exam) : "Pick a date"}</span>
            <input
              type="date"
              aria-label="Exam date"
              value={settings.exam}
              onChange={(event) => set({ exam: event.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
        {goal && (
          <div className="mt-2">
            <GoalLine goal={goal} />
          </div>
        )}
      </section>

      <section className="mb-6 grid gap-2">
        <Label>Length</Label>
        <Segmented
          label="Length"
          value={String(settings.minutes)}
          options={MINUTES.map((minutes) => ({ value: String(minutes), label: `${minutes} min`, name: `${minutes} minutes` }))}
          onChange={(value) => set({ minutes: Number(value) })}
        />
      </section>
      <section className="mb-6 grid gap-2">
        <Label>Direction</Label>
        <Segmented
          label="Direction"
          value={settings.direction}
          options={(["t2b", "b2t"] as Direction[]).map((direction) => ({ value: direction, label: directionLabel(direction) }))}
          onChange={(direction) => set({ direction })}
        />
      </section>
      <section className="mb-6 grid gap-2">
        <Label>Answer shows</Label>
        <Segmented
          label="Answer shows"
          value={String(settings.reveal)}
          options={REVEALS.map((seconds) => ({
            value: String(seconds),
            label: seconds ? `${seconds} s` : "on tap",
            name: seconds ? `after ${seconds} seconds` : "on tap",
          }))}
          onChange={(value) => set({ reveal: Number(value) })}
        />
      </section>
      <section className="mb-6 grid gap-2">
        <Label>Content</Label>
        <div className="flex flex-wrap gap-2">
          {KINDS.map(({ kind, label }) => (
            <Chip key={kind} on={settings.kinds.includes(kind)} onClick={() => set({ kinds: toggle(settings.kinds, kind) })}>
              {label}
            </Chip>
          ))}
        </div>
      </section>
      <section className="mb-8 grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Chapters</Label>
          <button
            type="button"
            onClick={() => set({ chapters: settings.chapters.length ? [] : chapters.map((chapter) => chapter.id) })}
            className="link min-h-11 text-[15px]"
          >
            {settings.chapters.length ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {chapters.map((chapter) => (
            <Chip
              key={chapter.id}
              on={settings.chapters.includes(chapter.id)}
              onClick={() => set({ chapters: toggle(settings.chapters, chapter.id) })}
            >
              <span aria-label={chapter.label}>{chapter.id}</span>
            </Chip>
          ))}
        </div>
      </section>
      <InstallRow />
    </>
  );
}

/** Pinned above the tab bar, where the thumb is. */
export function BlitzStart() {
  const settings = blitzStore.use();
  const missing = !settings.kinds.length ? "Pick content" : !settings.chapters.length ? "Pick a chapter" : undefined;
  return (
    <div className="px-5 pb-3 pt-2">
      <button
        type="button"
        disabled={missing !== undefined}
        onClick={() => open({ name: "blitz" })}
        className="press flex h-16 w-full items-center gap-3 rounded-2xl bg-accent px-5 text-left text-accent-ink active:bg-accent-press disabled:bg-surface disabled:text-muted disabled:ring-1 disabled:ring-inset disabled:ring-line"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[24px] font-semibold leading-tight">{missing ?? "Start blitz"}</span>
          {!missing && (
            <span className="block text-[15px] leading-tight">
              {settings.minutes} min · {directionLabel(settings.direction)}
            </span>
          )}
        </span>
        {!missing && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-ink text-accent">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4 13.5h6.5L9.5 22 19 10.5h-6.5L13 2z" />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}

