/**
 * How one screen gives way to the next.
 *
 * The change itself is never put off. nav.ts alters the address and React swaps the screen
 * inside the tap, exactly as before, so a field that takes the focus takes it inside the tap:
 * the only moment an iPhone will raise its keyboard. That rules out the browser's own view
 * transitions, which hand the page over a frame later. The motion is laid around the change
 * instead. A still of the old screen stays on top for a moment and clears away; under it the
 * new screen is already there, already taking taps, and settles into place. The styles are in
 * the Motion section of globals.css.
 *
 * What is laid over a screen goes the same way (`depart`): a sheet or the install guide is gone
 * the instant it is closed, the focus back where it was, and a still of it leaves in its place.
 */

/** Deeper into the app, back out of it, or sideways to another tab. */
export type Travel = "open" | "close" | "tab";

/** The element App.tsx draws the screen in. */
export const STAGE = "stage";

/** What an element out of view is left as: these can be given a size. Text in a line cannot. */
const BOXES = new Set(["block", "flex", "grid", "list-item", "flow-root"]);

type Scroll = [copy: Element, top: number, left: number];

let ghost: HTMLElement | undefined;
let resting: ReturnType<typeof setTimeout> | undefined;
let settleMs: number | undefined;

/** A time from the styles, in milliseconds. The build may have rewritten "260ms" as ".26s". */
export function ms(element: Element, property: string): number {
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  return parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) || 0;
}

/** The learner has asked the phone for less motion. */
function calm(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Makes the change, and lets the screens move as the kind of step asks. */
export function travel(kind: Travel, change: () => void) {
  const stage = document.getElementById(STAGE);
  const screen = stage?.firstElementChild;
  if (!stage || !screen) {
    change();
    return;
  }
  // A little longer than anything here moves: by then the still is clear and the new screen is in place.
  settleMs ??= (ms(stage, "--dur-enter") || 260) + 100;
  rest(stage);
  // With motion turned down nothing travels: the styles give the new screen a short fade.
  if (!calm()) {
    try {
      leave(screen, kind);
    } catch {
      // The still is a nicety: without it the screen changes as it always did.
    }
  }
  stage.dataset.nav = kind;
  resting = setTimeout(rest, settleMs, stage);
  change();
}

/** Clears up after a step, whether it has finished or the next one has begun. */
function rest(stage: HTMLElement) {
  clearTimeout(resting);
  ghost?.remove();
  ghost = undefined;
  delete stage.dataset.nav;
}

/** Leaves a still of the screen on top of whatever comes next. It takes no taps and no focus. */
function leave(screen: Element, kind: Travel) {
  const scrolls: Scroll[] = [];
  const still = picture(screen, scrolls);
  ghost = document.createElement("div");
  ghost.className = "ghost";
  ghost.dataset.nav = kind;
  ghost.inert = true;
  ghost.setAttribute("aria-hidden", "true");
  ghost.append(still);
  document.body.append(ghost);
  for (const [copy, top, left] of scrolls) copy.scrollTo(left, top);
}

/**
 * A copy of a screen as it looks now. Whatever is scrolled out of view is left as an empty box
 * of its own size, so a list of a thousand words costs no more to copy than the dozen in sight.
 */
function picture(source: Element, scrolls: Scroll[]): Element {
  const copy = source.cloneNode(false) as Element;
  // A video would start loading all over again.
  if (copy instanceof HTMLIFrameElement) copy.removeAttribute("src");
  if (source.scrollTop || source.scrollLeft) scrolls.push([copy, source.scrollTop, source.scrollLeft]);
  for (const child of source.childNodes) {
    if (child instanceof Element) copy.append(unseen(child) ?? picture(child, scrolls));
    else if (child instanceof Text) copy.append(child.cloneNode());
  }
  return copy;
}

/** An empty box for an element that lies wholly above or below the screen; nothing for one in sight. */
function unseen(element: Element): Element | undefined {
  if (!(element instanceof HTMLElement)) return;
  const box = element.getBoundingClientRect();
  if (box.bottom > 0 && box.top < window.innerHeight) return;
  if (!box.height || !BOXES.has(getComputedStyle(element).display)) return;
  const blank = element.cloneNode(false) as HTMLElement;
  blank.style.cssText += `;box-sizing:border-box;flex:none;width:${box.width}px;height:${box.height}px`;
  return blank;
}

/** How something laid over a screen leaves: a sheet falls back to the foot of it, a screen goes as on a step back. */
export type Exit = "sheet" | "screen";

/**
 * For something laid over a screen that is being taken away this instant: call it while the
 * element is still in the page (as its ref is let go). A still of it stays where it was and
 * leaves in its own time, as the styles say. Nothing waits for that: the still takes no taps
 * and no focus.
 */
export function depart(element: HTMLElement, exit: Exit) {
  const stage = document.getElementById(STAGE);
  // A change of screen leaves a still of everything, this included: once is enough.
  if (!stage || stage.dataset.nav || calm()) return;
  try {
    const scrolls: Scroll[] = [];
    const still = picture(element, scrolls);
    const leaving = document.createElement("div");
    if (exit === "sheet") {
      leaving.className = "sheet-ghost";
      // Closed while it was still rising, it falls from where it had got to.
      const panel = element.firstElementChild;
      if (panel) leaving.style.setProperty("--at", `${new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42}px`);
      leaving.style.setProperty("--veil", getComputedStyle(element, "::before").opacity);
    } else {
      leaving.className = "ghost";
      leaving.dataset.nav = "close" satisfies Travel;
    }
    leaving.inert = true;
    leaving.setAttribute("aria-hidden", "true");
    leaving.append(still);
    document.body.append(leaving);
    for (const [copy, top, left] of scrolls) copy.scrollTo(left, top);
    // React rehearses the letting go once when a component first appears (strict mode): then it is still here.
    queueMicrotask(() => element.isConnected && leaving.remove());
    setTimeout(() => leaving.remove(), (ms(stage, "--dur-enter") || 260) + 100);
  } catch {
    // The still is a nicety: without it the thing closes as it always did.
  }
}

/**
 * Something that has changed places (the marker of the current tab) is shown going there:
 * it starts where it was, `from` pixels from the left of the screen, and comes to rest where it now is.
 */
export function glide(element: HTMLElement, from: number) {
  const by = from - element.getBoundingClientRect().left;
  if (!by || calm() || !element.animate) return;
  element.animate([{ transform: `translateX(${by}px)` }, { transform: "none" }], {
    duration: ms(element, "--dur-fast") || 140,
    easing: getComputedStyle(element).getPropertyValue("--ease-out").trim() || "ease-out",
  });
}
