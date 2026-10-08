"use client";

import { useState } from "react";
import { profile } from "@/content/profile";
import type { VocabItem } from "@/content/types";
import { shown } from "@/lib/cards";
import { contentOf, weakSources, type Deck } from "@/lib/decks";
import { formsOf } from "@/lib/forms";
import { useGuard } from "@/lib/guard";
import { pageLabel } from "@/lib/help";
import { close } from "@/lib/nav";
import { progressStore } from "@/lib/progress";
import { FormsSheet } from "./FormsSheet";
import { GrammarBlocks } from "./GrammarBlocks";
import { GLYPH, Icon, Label, ParadigmTable, Segmented, Target, TopBar, Aside } from "./ui";

type Cover = "none" | "target" | "base";

/** The forms sheet for whichever word was tapped. */
export function useForms(hideMeaning = false) {
  const [item, setItem] = useState<VocabItem | null>(null);
  return {
    show: setItem,
    sheet: item ? <FormsSheet item={item} hideMeaning={hideMeaning} onClose={() => setItem(null)} /> : null,
  };
}

const key = (text: string) => text.trim().toLowerCase();

/** One word of a list: the target text and its forms on the left, its meaning on the right. */
export function WordRow({
  item,
  cover = "none",
  onForms,
}: {
  item: VocabItem;
  cover?: Cover;
  onForms: (item: VocabItem) => void;
}) {
  const [peek, setPeek] = useState(false);
  const forms = formsOf(item);
  const listed = profile.keyForms
    .filter((form) => form.inList)
    .map((form) => item.forms?.[form.id])
    .filter((value): value is string => !!value && value !== "-");
  const covered = (side: Cover) => cover === side && !peek;
  return (
    <li
      onClick={() => cover !== "none" && setPeek(!peek)}
      className={`flex gap-4 border-b border-line py-2.5 ${cover !== "none" ? "cursor-pointer" : ""}`}
    >
      <div className="relative min-w-0 flex-1">
        <div className={covered("target") ? "invisible" : peek && cover === "target" ? "cross-in" : ""}>
          {forms ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onForms(item);
              }}
              className="press-dim -my-2 min-h-11 py-2 text-left underline decoration-edge decoration-dotted decoration-2 underline-offset-4"
            >
              <Target text={shown(item)} whole={item.kind !== "phrase"} className={`text-[19px] ${item.core ? "font-bold" : "font-medium"}`} />
            </button>
          ) : (
            <Target text={shown(item)} whole={item.kind !== "phrase" && item.target.split(" ").length < 3} className={`text-[19px] ${item.core ? "font-bold" : "font-medium"}`} />
          )}
          {listed.length > 0 && (
            <span lang={profile.target.code} className="block font-serif text-[16px] text-muted">
              {listed.join(", ")}
            </span>
          )}
        </div>
        {covered("target") && <span aria-hidden="true" className="absolute inset-0 rounded-lg bg-line" />}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className={covered("base") ? "invisible" : peek && cover === "base" ? "cross-in" : ""}>
          <span className="block text-[16px] leading-snug">{item.base}</span>
          {item.note && <span className="block text-[14px] text-muted">{item.note}</span>}
        </div>
        {covered("base") && <span aria-hidden="true" className="absolute inset-0 rounded-lg bg-line" />}
      </div>
    </li>
  );
}

export function ListView({ deck, weakOnly = false }: { deck: Deck; weakOnly?: boolean }) {
  const progress = progressStore.use();
  const [cover, setCover] = useState<Cover>("none");
  const [query, setQuery] = useState("");
  const { root } = useGuard(deck.id);
  const { sheet, show } = useForms(cover === "base");
  const only = weakOnly ? weakSources(progress) : undefined;
  const wanted = key(query);
  const matches = (item: VocabItem) =>
    !wanted || [item.target, item.base, ...Object.values(item.forms ?? {})].some((text) => key(text).includes(wanted));
  const parts = contentOf(deck, only)
    .map((part) => ({
      ...part,
      groups: part.groups.map((group) => ({ ...group, items: group.items.filter(matches) })).filter((group) => group.items.length),
      verbs: part.verbs.filter((verb) => !wanted || key(verb.inf).includes(wanted) || key(verb.base).includes(wanted)),
      topics: part.topics.filter((topic) => !wanted || key(topic.title).includes(wanted)),
    }))
    .filter((part) => part.groups.length || part.verbs.length || part.topics.length);

  return (
    <div ref={root} className="app-shell">
      <TopBar onClose={close}>
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-edge bg-surface px-3 focus-within:border-ink">
          <Icon size={18} className="shrink-0 text-muted">
            <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16 16l4 4" />
          </Icon>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this list"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
          />
        </label>
      </TopBar>
      <main className="scroll-y flex-1 px-5 pb-8">
        <Segmented
          label="Cover a column"
          value={cover}
          options={[
            { value: "none", label: "Show all" },
            { value: "target", label: `Cover ${profile.target.name}` },
            { value: "base", label: `Cover ${profile.base.name}` },
          ]}
          onChange={setCover}
        />
        {weakOnly && <p className="mt-4 text-[16px] text-muted">These had a mistake and have not yet been known twice in a row.</p>}
        {parts.length === 0 && (
          <p className="mt-8 text-center text-[16px] text-muted">
            {wanted ? "No matches." : weakOnly ? "No weak spots. Well done!" : "Nothing in this selection."}
          </p>
        )}
        {parts.map(({ chapter, groups, verbs, topics }) => (
          <section key={chapter.id} className="mt-8">
            <h2 className="font-serif text-[26px] font-semibold leading-tight">
              <span className="text-muted">{chapter.id}</span>{" "}
              <span lang={profile.target.code}>{chapter.title}</span>
            </h2>
            {groups.map(({ group, items }) => (
              <div key={group.id} className="mt-5">
                <Label ruled>
                  {group.title} {group.pages?.length ? <Aside>· {pageLabel(group.pages)}</Aside> : null}
                </Label>
                <ul>
                  {items.map((item) => (
                    <WordRow key={item.id} item={item} cover={cover} onForms={show} />
                  ))}
                </ul>
              </div>
            ))}
            {verbs.length > 0 && (
              <div className="mt-5">
                <Label ruled>Verbs</Label>
                <ul>
                  {verbs.map((verb) => (
                    <li key={verb.id} className="grid gap-2 border-b border-line py-3">
                      <p>
                        <Target text={verb.inf} className="text-[22px] font-medium" />{" "}
                        <span className="text-[16px] text-muted">{verb.base}</span>
                      </p>
                      <ParadigmTable verb={verb} paradigm={profile.paradigms[0].id} />
                      {verb.note && <p className="text-[15px] text-muted">{verb.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {topics.length > 0 && (
              <div className="mt-5">
                <Label ruled>Grammar</Label>
                <ul>
                  {topics.map((topic) => (
                    <li key={topic.id} className="border-b border-line">
                      <details className="group">
                        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2 text-[16px] font-medium">
                          <span className="flex-1">{topic.title}</span>
                          <Icon size={20} className="text-muted transition-transform group-open:rotate-180">
                            {GLYPH.down}
                          </Icon>
                        </summary>
                        <div className="pb-4">
                          <GrammarBlocks topic={topic} />
                          {topic.pages?.length ? <p className="mt-3 text-[15px] text-muted">In the book: {pageLabel(topic.pages)}</p> : null}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </main>
      {sheet}
    </div>
  );
}
