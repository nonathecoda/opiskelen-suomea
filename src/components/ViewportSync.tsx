"use client";

import { useEffect } from "react";

const KEYBOARD_MIN_HEIGHT = 120;

/**
 * Keeps the app exactly as tall as the part of the screen that is really visible.
 * On iPhones the on-screen keyboard covers the page instead of resizing it, which
 * would hide whatever sits at the bottom: the button to check an answer.
 */
export function ViewportSync() {
  // Safari announces two fingers with an event of its own, and enlarges the screen unless it is
  // told not to. The styles already say so (touch-action); this is for a Safari that does not listen.
  useEffect(() => {
    const refuse = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", refuse);
    return () => document.removeEventListener("gesturestart", refuse);
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const sync = () => {
      // A pinch-zoomed page also has a smaller visual viewport; leave the layout alone then.
      if (Math.abs(viewport.scale - 1) > 0.01) return;
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`);
      root.classList.toggle("keyboard", window.innerHeight - viewport.height > KEYBOARD_MIN_HEIGHT);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);
  return null;
}
