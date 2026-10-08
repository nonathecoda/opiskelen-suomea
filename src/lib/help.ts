import { chapters } from "@/content";
import { profile } from "@/content/profile";
import type { GrammarTopic, VerbTable } from "@/content/types";
import type { Card } from "./cards";

/** What the help sheet offers beside a question: hints one at a time, then the rule. */
export type Help = {
  title: string;
  hints: string[];
  topic?: GrammarTopic;
  verb?: VerbTable;
  paradigm?: string;
  pages: number[];
};

const TOPICS = new Map(chapters.flatMap((chapter) => chapter.grammar).map((topic) => [topic.id, topic]));
const VERBS = new Map(chapters.flatMap((chapter) => chapter.verbs).map((verb) => [verb.id, verb]));

/** The paradigm a verb card belongs to, from its id: "<verb>-<paradigm>-<n>" or "<verb>-r?-<paradigm>-<n>". */
function paradigmOf(card: Card): string | undefined {
  return profile.paradigms
    .map((paradigm) => paradigm.id)
    .sort((a, b) => b.length - a.length)
    .find((id) => new RegExp(`-${id}-\\d+$`).test(card.id));
}

function verbHelp(card: Card, title: string): Help | undefined {
  const verb = VERBS.get(card.source);
  if (!verb) return undefined;
  const verbClass = profile.verbClasses.find((one) => one.id === verb.class);
  const topic = verbClass?.topic ? TOPICS.get(verbClass.topic) : undefined;
  return {
    title,
    hints: verb.hints ?? verbClass?.hints ?? [],
    topic,
    verb,
    paradigm: paradigmOf(card) ?? profile.paradigms[0]?.id,
    pages: topic?.pages ?? [],
  };
}

/** The help for a card, or nothing for a plain word (it has no rule behind it). */
export function helpFor(card: Card): Help | undefined {
  if (card.kind === "drill") {
    const topic = TOPICS.get(card.source);
    if (!topic) return undefined;
    return { title: topic.title, hints: topic.hints ?? [], topic, pages: topic.pages ?? [] };
  }
  if (card.kind === "form") {
    const form = profile.keyForms.find((one) => card.id.endsWith(`-f-${one.id}`));
    const topic = form?.topic ? TOPICS.get(form.topic) : undefined;
    if (!form || !topic) return undefined;
    return { title: form.label, hints: topic.hints ?? [], topic, pages: topic.pages ?? [] };
  }
  if (card.kind === "marker" && profile.marker) {
    const topic = profile.marker.topic ? TOPICS.get(profile.marker.topic) : undefined;
    return { title: profile.marker.label, hints: profile.marker.hints, topic, pages: topic?.pages ?? [] };
  }
  if (card.section === "verbs" || card.section === "verb-meaning" || card.section === "recognise-slot") {
    const verb = VERBS.get(card.source);
    return verb ? verbHelp(card, `${verb.inf} · ${verb.base}`) : undefined;
  }
  // The usual title would be the answer itself: the form shown stands in for it.
  if (card.section === "recognise-meaning" || card.section === "recognise-base") return verbHelp(card, card.prompt);
  return undefined;
}

/** Pages in the base language: one page, a run, or a list. */
export function pageLabel(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (!sorted.length) return "";
  if (sorted.length === 1) return `p. ${sorted[0]}`;
  const run = sorted.every((page, index) => index === 0 || page === sorted[index - 1] + 1);
  if (run) return `pp. ${sorted[0]}–${sorted[sorted.length - 1]}`;
  return `pp. ${sorted.slice(0, -1).join(", ")} and ${sorted[sorted.length - 1]}`;
}
