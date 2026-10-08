"use client";

import { useEffect } from "react";
import { deckById, pickedFor, type Deck, type Exercise } from "@/lib/decks";
import { STAGE } from "@/lib/motion";
import { useView } from "@/lib/nav";
import { settingsStore } from "@/lib/progress";
import { BlitzSprint } from "./BlitzSprint";
import { Cheer } from "./Cheer";
import { DeckPage } from "./DeckPage";
import { Home } from "./Home";
import { ListView } from "./ListView";
import { releaseSplash } from "./Splash";
import { Study } from "./Study";

export function App() {
  // By now the screen is drawn from what this phone has saved, so the splash may open on it.
  useEffect(releaseSplash, []);
  return (
    <>
      {/* The screen stands alone in here, so that a change of screen can be told and can move (motion.ts). */}
      <div id={STAGE}>
        <Screen />
      </div>
      <Cheer />
    </>
  );
}

function Screen() {
  const view = useView();
  if (view.name === "tab") return <Home tab={view.tab} />;
  if (view.name === "blitz") return <BlitzSprint />;
  const deck = deckById(view.deck);
  if (!deck) return <Home tab="chapters" />;
  if (view.name === "deck") return <DeckPage deck={deck} />;
  if (view.exercise === "list") return <ListView deck={deck} />;
  if (view.exercise === "weak") return <ListView deck={deck} weakOnly />;
  // A new key per deck and exercise starts a fresh round.
  return <Session key={`${deck.id}:${view.exercise}`} deck={deck} exercise={view.exercise} />;
}

/** "mix" runs whatever is ticked on the deck screen; any other exercise can still be opened on its own. */
function Session({ deck, exercise }: { deck: Deck; exercise: Exercise }) {
  const exercises = exercise === "mix" ? pickedFor(deck, settingsStore.get()) : [exercise];
  return <Study deck={deck} exercises={exercises} />;
}
