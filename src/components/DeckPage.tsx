"use client";

import { chapters } from "@/content";
import { profile } from "@/content/profile";
import { videos } from "@/content/videos";
import type { Section } from "@/lib/cards";
import { CARDS } from "@/lib/cards";
import {
  candidatesFor,
  chaptersOf,
  countFor,
  emptiedBy,
  exercisesFor,
  pickedFor,
  statsOf,
  togglePick,
  topicOf,
  weakSources,
  type Deck,
  type Drillable,
} from "@/lib/decks";
import { ROUND_SIZE } from "@/lib/session";
import { useGuard } from "@/lib/guard";
import { pageLabel } from "@/lib/help";
import { close, open } from "@/lib/nav";
import { progressStore, settingsStore, type Direction } from "@/lib/progress";
import { GrammarBlocks } from "./GrammarBlocks";
import { VideoCard } from "./VideoCard";
import { Chip, GLYPH, Icon, Label, Meter, PrimaryButton, Segmented, TopBar } from "./ui";

/** Each exercise's name and what it does, with the verbs-deck wording in second place. */
const NAMES: Record<Drillable, { name: string; hint: string; verbs?: string }> = {
  conjugate: { name: "Conjugate", hint: "the whole table at once" },
  flash: { name: "Cards", hint: "flip and check", verbs: "base form and meaning" },
  choose: { name: "Choose", hint: "the right option", verbs: "the right form" },
  write: { name: "Write", hint: `in ${profile.target.name}`, verbs: "one form at a time" },
  marker: { name: profile.marker?.label ?? "Marker", hint: "pick the right one" },
  forms: { name: "Forms", hint: "write the form asked for" },
  meaning: { name: "Meaning", hint: "what the form means" },
  base: { name: "Base form", hint: "write the base form" },
  slot: { name: "Person", hint: "whose form it is" },
};

const SECTIONS: { section: Section; label: string }[] = [
  { section: "words", label: "Words" },
  { section: "phrases", label: "Phrases" },
  { section: "verbs", label: "Verbs" },
  { section: "grammar", label: "Grammar" },
];

const anyCore = CARDS.some((card) => card.core && (card.section === "words" || card.section === "phrases"));

export function DeckPage({ deck }: { deck: Deck }) {
  const settings = settingsStore.use();
  const progress = progressStore.use();
  const { root } = useGuard(deck.id);
  const { known, total } = statsOf(deck, progress);
  const topic = topicOf(deck);
  const picked = pickedFor(deck, settings);
  const count = picked.length ? candidatesFor(deck, picked, settings, progress).length : 0;
  const emptied = emptiedBy(deck, picked, settings, progress);
  const weakCount = [...weakSources(progress)].filter((source) => deck.sources.has(source)).length;
  const deckChapters = chaptersOf(deck);
  const set = (patch: Partial<typeof settings>) => settingsStore.set({ ...settings, ...patch });
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((one) => one !== value) : [...list, value]);

  const startLabel = !picked.length ? "Pick an exercise" : count === 0 ? "Nothing to practise" : `Start · ${Math.min(count, ROUND_SIZE)} items`;

  return (
    <div ref={root} className="app-shell">
      <TopBar onClose={close} back />
      <main className="scroll-y flex-1 px-5 pb-8">
        <h1
          lang={deck.targetTitle ? profile.target.code : undefined}
          className="headline text-[32px] leading-tight"
        >
          {deck.title}
        </h1>
        {deck.subtitle && <p className="mt-1 text-[16px] text-muted">{deck.subtitle}</p>}
        <div className="mt-4 flex items-center gap-3">
          <span className="flex-1">
            <Meter known={known} total={total} />
          </span>
          <span className="text-[14px] tabular-nums text-muted">
            known {known}/{total}
          </span>
        </div>

        {topic && (
          <section className="mt-6">
            <GrammarBlocks topic={topic} />
            {topic.pages?.length ? <p className="mt-3 text-[15px] text-muted">In the book: {pageLabel(topic.pages)}</p> : null}
            {videos
              .filter((video) => video.topics.includes(topic.id))
              .map((video) => (
                <div key={video.id} className="mt-4">
                  <VideoCard video={video} />
                </div>
              ))}
          </section>
        )}

        {deck.filter === "chapters" && deckChapters.length > 1 && (
          <section className="mt-6 grid gap-2">
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
              {deckChapters.map((id) => (
                <Chip key={id} on={settings.chapters.includes(id)} onClick={() => set({ chapters: toggle(settings.chapters, id) })}>
                  <span aria-label={chapters.find((chapter) => chapter.id === id)?.label}>{id}</span>
                </Chip>
              ))}
            </div>
          </section>
        )}

        {deck.filter === "sections" && (
          <section className="mt-6 grid gap-2">
            <Label>Parts of the book</Label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map(({ section, label }) => (
                <Chip key={section} on={settings.sections.includes(section)} onClick={() => set({ sections: toggle(settings.sections, section) })}>
                  {label}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {exercisesFor(deck).map((group) => (
          <section key={group.title} className="mt-7">
            <Label ruled>{group.title}</Label>
            <ul>
              {group.exercises.map((exercise) => (
                <TickRow
                  key={exercise}
                  deck={deck}
                  exercise={exercise}
                  ticked={picked.includes(exercise)}
                  count={countFor(deck, exercise, settings, progress)}
                  onToggle={() => set({ picked: togglePick(deck, exercise, settings) })}
                />
              ))}
            </ul>
          </section>
        ))}

        {!topic && (
          <section className="mt-7">
            <Label ruled>Browse</Label>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => open({ name: "exercise", deck: deck.id, exercise: "list" })}
                  className="press-dim flex min-h-14 w-full items-center gap-3 border-b border-line py-2 text-left"
                >
                  <span className="flex-1">
                    <span className="block text-[16px] font-medium">List</span>
                    <span className="block text-[15px] text-muted">browse and cover a column</span>
                  </span>
                  <Icon size={20} className="text-muted">
                    {GLYPH.forward}
                  </Icon>
                </button>
              </li>
            </ul>
          </section>
        )}

        <section className="mt-7 grid gap-3">
          <Label ruled>Narrow</Label>
          <div className="flex flex-wrap gap-2">
            {anyCore && (deck.kind === "words" || deck.kind === "mixed") && (
              <Chip on={settings.coreOnly} onClick={() => set({ coreOnly: !settings.coreOnly })}>
                Key words only
              </Chip>
            )}
            <Chip on={settings.weakOnly} onClick={() => set({ weakOnly: !settings.weakOnly })}>
              Weak only
            </Chip>
          </div>
          {weakCount > 0 && (
            <button
              type="button"
              onClick={() => open({ name: "exercise", deck: deck.id, exercise: "weak" })}
              className="link min-h-11 self-start text-left text-[16px]"
            >
              Show weak ones as a list ({weakCount})
            </button>
          )}
          {deck.kind !== "grammar" && (
            <Segmented
              label="Direction"
              value={settings.direction}
              options={(["b2t", "t2b"] as Direction[]).map((direction) => ({
                value: direction,
                label: direction === "b2t" ? `${profile.base.name} → ${profile.target.name}` : `${profile.target.name} → ${profile.base.name}`,
              }))}
              onChange={(direction) => set({ direction })}
            />
          )}
        </section>
      </main>
      <footer className="pad-bottom grid gap-2 border-t border-line px-5 pt-3">
        {emptied === "weak" && (
          <p className="flex items-center justify-between gap-3 text-[15px] text-muted">
            Nothing to practise: &apos;Weak only&apos; is on.
            <button type="button" onClick={() => set({ weakOnly: false })} className="link min-h-11 text-ink">
              Show all
            </button>
          </p>
        )}
        {emptied === "chapters" && <p className="text-[15px] text-muted">Pick at least one chapter.</p>}
        <PrimaryButton
          tone="accent"
          disabled={!picked.length || count === 0}
          onClick={() => open({ name: "exercise", deck: deck.id, exercise: "mix" })}
        >
          {startLabel}
        </PrimaryButton>
      </footer>
    </div>
  );
}

function TickRow({
  deck,
  exercise,
  ticked,
  count,
  onToggle,
}: {
  deck: Deck;
  exercise: Drillable;
  ticked: boolean;
  count: number;
  onToggle: () => void;
}) {
  const names = NAMES[exercise];
  const empty = count === 0;
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={ticked && !empty}
        disabled={empty}
        onClick={onToggle}
        className="press-dim flex min-h-14 w-full items-center gap-3 border-b border-line py-2 text-left disabled:text-muted"
      >
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${
            empty ? "border-dashed border-edge" : ticked ? "border-accent bg-accent text-accent-ink" : "border-edge"
          }`}
        >
          {ticked && !empty && (
            <Icon size={16} className="tick-draw">
              {GLYPH.check}
            </Icon>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-medium">{names.name}</span>
          <span className="block text-[15px] text-muted">{deck.kind === "verbs" && names.verbs ? names.verbs : names.hint}</span>
        </span>
        <span className="text-[14px] tabular-nums text-muted">{count}</span>
      </button>
    </li>
  );
}
