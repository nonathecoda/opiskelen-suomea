/**
 * Enlarging a photo inside its own frame, as a phone's photo app does. The screen itself is
 * never enlarged (globals.css): two fingers on a photo make the photo bigger and nothing else.
 *
 * A size is how many times the frame's width the photo is: 1 fits it exactly.
 */

/** Enough to read the small print of a book page on a phone. */
export const MAX_ZOOM = 4;

/** What a single tap enlarges a photo to. */
export const TAP_ZOOM = 2.2;

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, 1), MAX_ZOOM);
}

/**
 * The point of a photo that is under the fingers: how far into the photo it lies, measured at
 * size 1. `scroll` is how far the frame has been scrolled, `at` where in the frame the fingers are.
 */
export function heldAt(scroll: number, at: number, zoom: number): number {
  return (scroll + at) / zoom;
}

/** How far the frame must be scrolled for that point to lie under the fingers at another size. */
export function scrollFor(held: number, at: number, zoom: number): number {
  return held * zoom - at;
}
