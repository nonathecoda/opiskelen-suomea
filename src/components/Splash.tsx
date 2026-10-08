"use client";

import { useEffect, useState } from "react";
import { ms } from "@/lib/motion";
import { MarkEyes, MarkLetter, ON_TILE } from "./Mark";

const ID = "splash";
/** Every keyframe that belongs to the cover going away starts with this (Motion, globals.css). */
const LEAVING = "splash-out";
/** The last of them: after it there is nothing left to see. */
const END = "splash-out-end";

function leaving(splash: HTMLElement): CSSAnimation[] {
  return splash
    .getAnimations({ subtree: true })
    .filter(
      (animation): animation is CSSAnimation =>
        animation instanceof CSSAnimation && animation.animationName.startsWith(LEAVING),
    );
}

let released = false;

/**
 * The app is on screen with the learner's own numbers: the cover need not wait out its own
 * deadline. It still lets the blink finish, then goes at once. Nothing but the clock is touched,
 * so a splash this never reaches goes all the same.
 */
export function releaseSplash() {
  const splash = document.getElementById(ID);
  if (released || !splash?.getAnimations) return;
  released = true;
  const hold = ms(splash, "--splash-hold");
  const leave = ms(splash, "--splash-leave");
  for (const animation of leaving(splash)) {
    const elapsed = Number(animation.currentTime ?? 0);
    animation.currentTime = elapsed + Math.max(0, leave - Math.max(elapsed, hold));
  }
}

/**
 * What the app opens with: the icon's face on paper. It blinks once, and the cover parts along
 * the line of its eyes to show the app. Drawn by the server, so it is the first thing painted and
 * hides the moment in which the page still shows nobody's numbers; timed by the styles alone, so
 * it goes even if no script ever runs. It takes no taps, and screen readers are not told of it.
 */
export function Splash() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const splash = document.getElementById(ID);
    const end = splash?.getAnimations ? leaving(splash).find((animation) => animation.animationName === END) : undefined;
    let mounted = true;
    end?.finished.then(
      () => mounted && setGone(true),
      // Cancelled (the styles changed under it): the cover is hidden by them either way.
      () => {},
    );
    return () => {
      mounted = false;
    };
  }, []);

  if (gone) return null;
  return (
    <div id={ID} className="splash" aria-hidden="true">
      <span className="splash-lid splash-lid-upper" />
      <span className="splash-lid splash-lid-lower" />
      <span className="splash-mark">
        <Face />
      </span>
    </div>
  );
}

/**
 * The face as it is on the home-screen icon (Mark.tsx), in the app's own yellow and ink. The
 * eyes lie on a layer of their own (.splash-eyes), so they can close.
 */
function Face() {
  return (
    <>
      <svg viewBox="0 0 512 512">
        <rect width="512" height="512" rx="112" className="fill-accent" />
        <g transform={ON_TILE} className="fill-accent-ink">
          <MarkLetter />
        </g>
      </svg>
      <svg viewBox="0 0 512 512" className="splash-eyes fill-accent-ink">
        <g transform={ON_TILE}>
          <MarkEyes />
        </g>
      </svg>
    </>
  );
}
