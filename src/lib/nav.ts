import { useMemo, useSyncExternalStore } from "react";
import type { Exercise } from "./decks";
import { travel, type Travel } from "./motion";

/**
 * The app is one page; which screen shows lives in the query string so the
 * phone's back gesture works and no navigation ever needs the network.
 *
 *   /?t=words          a top-level tab (blitz, chapters, words, verbs, grammar, sources)
 *   /?b=1              a blitz sprint
 *   /?d=nouns          a deck's own screen
 *   /?d=nouns&x=write  an exercise (or the list) on that deck
 */
export type Tab = "blitz" | "chapters" | "words" | "verbs" | "grammar" | "sources";

export type View =
  | { name: "tab"; tab: Tab }
  | { name: "blitz" }
  | { name: "deck"; deck: string }
  | { name: "exercise"; deck: string; exercise: Exercise };

const CHANGED = "omasuomi:view";
const TABS: Tab[] = ["blitz", "chapters", "words", "verbs", "grammar", "sources"];
/** Where the app opens. */
const HOME: Tab = "blitz";
const EXERCISES: Exercise[] = [
  "list",
  "flash",
  "choose",
  "write",
  "conjugate",
  "marker",
  "forms",
  "meaning",
  "base",
  "slot",
  "mix",
  "weak",
];

function parse(search: string): View {
  const params = new URLSearchParams(search);
  const deck = params.get("d");
  const exercise = params.get("x") as Exercise | null;
  const tab = params.get("t") as Tab | null;
  if (deck && exercise && EXERCISES.includes(exercise)) return { name: "exercise", deck, exercise };
  if (deck) return { name: "deck", deck };
  if (params.has("b")) return { name: "blitz" };
  return { name: "tab", tab: tab && TABS.includes(tab) ? tab : HOME };
}

function toUrl(view: View): string {
  if (view.name === "exercise") return `/?d=${view.deck}&x=${view.exercise}`;
  if (view.name === "deck") return `/?d=${view.deck}`;
  if (view.name === "blitz") return "/?b=1";
  return view.tab === HOME ? "/" : `/?t=${view.tab}`;
}

/** How far into the app a screen lies: a tab, a screen opened from a tab, an exercise on a deck. */
function depth(view: View): number {
  return view.name === "tab" ? 0 : view.name === "exercise" ? 2 : 1;
}

/** Which way a step leads, for the motion that goes with it. */
function way(from: View, to: View): Travel {
  const step = depth(to) - depth(from);
  return step > 0 ? "open" : step < 0 ? "close" : "tab";
}

/** The address of the screen that is showing, to tell which way a step through history leads. */
let shown = "";

function announce() {
  shown = window.location.search;
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(listener: () => void) {
  shown = window.location.search;
  const onHistory = (event: PopStateEvent) => {
    const from = shown;
    shown = window.location.search;
    // A swipe back has already slid the old screen away under the finger: it must not move twice.
    if (from === shown || event.hasUAVisualTransition) listener();
    else travel(way(parse(from), parse(shown)), listener);
  };
  window.addEventListener("popstate", onHistory);
  window.addEventListener(CHANGED, listener);
  return () => {
    window.removeEventListener("popstate", onHistory);
    window.removeEventListener(CHANGED, listener);
  };
}

export function useView(): View {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => parse(search), [search]);
}

/** Goes one level deeper; the back gesture returns. */
export function open(view: View) {
  travel("open", () => {
    window.history.pushState({ opened: true }, "", toUrl(view));
    announce();
  });
}

/** Switching tabs is not a step back in history, as in a native app. */
export function switchTab(tab: Tab) {
  const url = toUrl({ name: "tab", tab });
  const change = () => {
    window.history.replaceState(window.history.state, "", url);
    announce();
  };
  // The tab that is already open has nowhere to go.
  if (url === window.location.pathname + window.location.search) change();
  else travel("tab", change);
}

/** Leaves the current screen: back in history when we came from inside the app, otherwise one level up. */
export function close() {
  if (window.history.state?.opened) {
    // The screens move when the step arrives, in `subscribe`.
    window.history.back();
    return;
  }
  const here = parse(window.location.search);
  const up: View = here.name === "exercise" ? { name: "deck", deck: here.deck } : { name: "tab", tab: HOME };
  travel("close", () => {
    window.history.replaceState(null, "", toUrl(up));
    announce();
  });
}
