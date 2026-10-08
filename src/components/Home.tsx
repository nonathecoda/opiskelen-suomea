"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { chapters } from "@/content";
import { profile } from "@/content/profile";
import { videos } from "@/content/videos";
import {
  chapterDecks,
  deckById,
  statsOf,
  themeDecks,
  topicDecks,
  verbClassDecks,
  wordClassDecks,
  type Deck,
} from "@/lib/decks";
import { useGuard } from "@/lib/guard";
import { pageLabel } from "@/lib/help";
import { glide } from "@/lib/motion";
import { open, switchTab, type Tab } from "@/lib/nav";
import { progressStore } from "@/lib/progress";
import { searchWords } from "@/lib/search";
import { Blitz, BlitzStart } from "./Blitz";
import { BookPagesRow } from "./BookPages";
import { InstallOffer } from "./InstallGuide";
import { WordRow, useForms } from "./ListView";
import { VideoCard } from "./VideoCard";
import { ChapterHead, GLYPH, Icon, Label, Meter } from "./ui";

const TABS: { tab: Tab; label: string; icon: ReactNode }[] = [
  { tab: "blitz", label: "Blitz", icon: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" /> },
  {
    tab: "chapters",
    label: "Chapters",
    icon: <path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5V5.5zM12 6v13.5" />,
  },
  { tab: "words", label: "Words", icon: <path d="M5 7h14M5 12h14M5 17h9" /> },
  { tab: "verbs", label: "Verbs", icon: <path d="M4 5h16v14H4zM4 12h16M12 5v14" /> },
  { tab: "grammar", label: "Grammar", icon: <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" /> },
  { tab: "sources", label: "Sources", icon: <path d="M4 5h16v14H4zM10 9l5 3-5 3z" /> },
];

/** How far each tab was scrolled: a tab opened again is where it was left. */
const scrolled: Partial<Record<Tab, number>> = {};
/** Where the current tab's pill was, so the next one can glide from there. */
let pillFrom: number | undefined;

export function Home({ tab }: { tab: Tab }) {
  const main = useRef<HTMLElement>(null);
  const { root } = useGuard(tab);

  useLayoutEffect(() => {
    if (main.current) main.current.scrollTop = scrolled[tab] ?? 0;
  }, [tab]);

  return (
    <div ref={root} className="app-shell">
      <main
        ref={main}
        onScroll={(event) => (scrolled[tab] = event.currentTarget.scrollTop)}
        className="scroll-y pad-top flex-1 px-5 pb-8"
      >
        {tab === "blitz" && <Blitz />}
        {tab === "chapters" && <ChaptersTab />}
        {tab === "words" && <WordsTab />}
        {tab === "verbs" && <VerbsTab />}
        {tab === "grammar" && <GrammarTab />}
        {tab === "sources" && <SourcesTab />}
      </main>
      {tab === "blitz" && <BlitzStart />}
      <TabBar tab={tab} />
      <InstallOffer />
    </div>
  );
}

function TabBar({ tab }: { tab: Tab }) {
  const pill = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (pill.current && pillFrom !== undefined) glide(pill.current, pillFrom);
    pillFrom = undefined;
  }, [tab]);

  return (
    <nav aria-label="Sections" className="pad-bottom flex border-t border-line bg-surface px-1 pt-1">
      {TABS.map((item) => {
        const current = item.tab === tab;
        return (
          <button
            key={item.tab}
            type="button"
            aria-current={current ? "page" : undefined}
            onClick={() => {
              if (current) return;
              pillFrom = pill.current?.getBoundingClientRect().left;
              switchTab(item.tab);
            }}
            className={`press-dim flex h-14 min-w-0 flex-auto flex-col items-center justify-center gap-0.5 ${current ? "text-ink" : "text-muted"}`}
          >
            <span className="relative grid h-7 w-12 place-items-center">
              {current && <span ref={pill} className="absolute inset-0 rounded-full bg-accent" />}
              <span className={`relative ${current ? "text-accent-ink" : ""}`}>
                <Icon size={22}>{item.icon}</Icon>
              </span>
            </span>
            <span className="whitespace-nowrap text-[14px] font-semibold leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** A tab's title in the serif, and a line about it. */
export function TabTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-5 pt-2">
      <h1 className="font-serif text-[32px] font-semibold leading-tight">{title}</h1>
      {children && <p className="mt-1 text-[16px] text-muted">{children}</p>}
    </header>
  );
}

/** A deck in a list: its mark, its title and line, how much of it is known, and a way in. */
export function DeckRow({ deck, mark, plain = false }: { deck: Deck; mark?: ReactNode; plain?: boolean }) {
  const progress = progressStore.use();
  const { known, total } = statsOf(deck, progress);
  return (
    <li>
      <button
        type="button"
        onClick={() => open({ name: "deck", deck: deck.id })}
        className="press-dim flex min-h-14 w-full items-center gap-3 border-b border-line py-2.5 text-left"
      >
        {mark !== undefined && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-edge font-serif text-[18px] font-semibold">
            {mark}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span
            lang={deck.targetTitle ? profile.target.code : undefined}
            className={`block leading-snug ${deck.targetTitle ? "font-serif text-[20px] font-medium" : "text-[16px] font-medium"}`}
          >
            {deck.title}
          </span>
          {!plain && deck.subtitle && <span className="block text-[15px] leading-snug text-muted">{deck.subtitle}</span>}
        </span>
        <span className="w-16 shrink-0 text-right">
          <span className="block text-[14px] tabular-nums text-muted">
            {known}/{total}
          </span>
          <span className="mt-1 block">
            <Meter known={known} total={total} />
          </span>
        </span>
        <Icon size={20} className="shrink-0 text-muted">
          {GLYPH.forward}
        </Icon>
      </button>
    </li>
  );
}

/** The icon of the deck that mixes everything. */
const MIXED = (
  <Icon size={18}>
    <path d="M4 7h4l8 10h4M4 17h4l8-10h4" />
  </Icon>
);

function ChaptersTab() {
  const progress = progressStore.use();
  const all = deckById("all")!;
  const { known, total } = statsOf(all, progress);
  return (
    <>
      <TabTitle title={profile.app.name}>{profile.tagline}</TabTitle>
      <button
        type="button"
        onClick={() => open({ name: "deck", deck: "all" })}
        className="press mb-7 block w-full rounded-3xl bg-accent px-5 py-4 text-left text-accent-ink"
      >
        <span className="flex items-center gap-3">
          <span className="flex-1">
            <span className="block font-serif text-[26px] font-semibold leading-tight">Revise everything</span>
            <span className="mt-0.5 block text-[16px]">Words, phrases, verbs and grammar mixed</span>
          </span>
          <span aria-hidden="true">{MIXED}</span>
        </span>
        <span className="mt-3 flex items-center gap-3">
          <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-accent-ink/20">
            <span
              className="bar-fill block h-full bg-accent-ink"
              style={{ "--value": total ? known / total : 0 } as CSSProperties}
            />
          </span>
          <span className="text-[14px] font-semibold tabular-nums">
            {known}/{total}
          </span>
        </span>
      </button>
      <Label ruled>Chapter by chapter</Label>
      <ul>
        {chapterDecks().map((deck) => (
          <DeckRow key={deck.id} deck={deck} mark={deck.chapter} />
        ))}
      </ul>
    </>
  );
}

function WordsTab() {
  const [query, setQuery] = useState("");
  const { sheet, show } = useForms();
  const hits = query.trim() ? searchWords(query) : [];
  return (
    <>
      <TabTitle title="Words" />
      <label className="mb-5 flex h-12 items-center gap-2 rounded-full border-2 border-edge bg-surface px-4 focus-within:border-ink">
        <Icon size={20} className="shrink-0 text-muted">
          <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16 16l4 4" />
        </Icon>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search in ${profile.target.name} or ${profile.base.name}`}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </label>
      {query.trim() ? (
        <>
          {hits.length === 0 && <p className="text-[16px] text-muted">No matches.</p>}
          {hits.some((hit) => hit.item.kind === "noun" || hit.item.kind === "adj" || hit.item.kind === "verb") && (
            <p className="mb-2 text-[15px] text-muted">Tap an underlined word to see its forms.</p>
          )}
          <ul>
            {hits.slice(0, 60).map((hit) => (
              <WordRow key={`${hit.chapter}-${hit.item.id}`} item={hit.item} onForms={show} />
            ))}
          </ul>
          {hits.length > 60 && <p className="mt-3 text-[15px] text-muted">Showing the first 60 matches. Narrow the search.</p>}
          {sheet}
        </>
      ) : (
        <>
          <ul className="mb-7">
            <DeckRow deck={deckById("words")!} />
          </ul>
          <Label ruled>Word classes</Label>
          <ul className="mb-7">
            {wordClassDecks().map((deck) => (
              <DeckRow key={deck.id} deck={deck} />
            ))}
          </ul>
          <Label ruled>Themes</Label>
          <ul>
            {themeDecks().map((deck) => (
              <DeckRow key={deck.id} deck={deck} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function VerbsTab() {
  return (
    <>
      <TabTitle title="Verbs">Meaning and conjugation in every person.</TabTitle>
      <ul className="mb-7">
        <DeckRow deck={deckById("verbs")!} />
      </ul>
      <Label ruled>Verb types</Label>
      <ul>
        {verbClassDecks().map((deck) => (
          <DeckRow key={deck.id} deck={deck} />
        ))}
      </ul>
    </>
  );
}

function GrammarTab() {
  return (
    <>
      <TabTitle title="Grammar" />
      <ul className="mb-7">
        <DeckRow deck={deckById("grammar")!} />
      </ul>
      {chapters.map((chapter) => (
        <section key={chapter.id} className="mb-7">
          <ChapterHead label={chapter.label} title={chapter.title} />
          <ul>
            {topicDecks(chapter.id).map((deck) => (
              <DeckRow key={deck.id} deck={deck} plain />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/** What the book's pages hold, in page order: a word list or a rule, and the deck that practises it. */
function pageIndex(chapterId: number) {
  const chapter = chapters.find((one) => one.id === chapterId)!;
  const rows = [
    ...chapter.vocab.map((group) => ({
      pages: group.pages ?? [],
      title: group.title,
      deck: group.general ? `c${chapter.id}` : `g-${group.id}`,
    })),
    ...chapter.grammar.map((topic) => ({ pages: topic.pages ?? [], title: topic.title, deck: `t-${topic.id}` })),
  ];
  return rows.filter((row) => row.pages.length).sort((a, b) => a.pages[0] - b.pages[0]);
}

function SourcesTab() {
  return (
    <>
      <TabTitle title="Sources">
        The pages of the book the content comes from. Tap a page number to go straight to practising.
      </TabTitle>
      <ul className="mb-7">
        <BookPagesRow />
      </ul>
      {chapters.map((chapter) => (
        <section key={chapter.id} className="mb-7">
          <ChapterHead label={chapter.label} title={chapter.title} />
          {videos
            .filter((video) => video.chapter === chapter.id)
            .map((video) => (
              <div key={video.id} className="mt-3">
                <VideoCard video={video} />
              </div>
            ))}
          <ul>
            {pageIndex(chapter.id).map((row) => (
              <li key={`${row.deck}-${row.pages[0]}`}>
                <button
                  type="button"
                  onClick={() => open({ name: "deck", deck: row.deck })}
                  className="press-dim flex min-h-14 w-full items-center gap-3 border-b border-line py-2.5 text-left"
                >
                  <span className="w-20 shrink-0 text-[15px] font-semibold tabular-nums">{pageLabel(row.pages)}</span>
                  <span className="min-w-0 flex-1 text-[16px] leading-snug">{row.title}</span>
                  <Icon size={20} className="shrink-0 text-muted">
                    {GLYPH.forward}
                  </Icon>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
