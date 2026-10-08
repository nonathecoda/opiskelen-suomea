/**
 * The little rewards and warnings around an answer: a celebration on screen
 * and, where the phone allows it, something to feel.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Lets the celebration overlay know when to fire. */
export function onCheer(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * iPhones have no vibration API for web pages. Toggling a switch control makes
 * the system play its own light tick (iOS 18 and later); elsewhere this does nothing.
 */
function systemTick() {
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.display = "none";
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.setAttribute("switch", "");
  label.appendChild(toggle);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

function feel(pattern: number | number[], tickInstead: boolean) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
    else if (tickInstead) systemTick();
  } catch {
    // Feedback is a nicety; never let it break an answer.
  }
}

/** A right answer. Call it from the tap or key press itself: phones only vibrate in response to a touch. */
export function cheer() {
  feel(18, true);
  listeners.forEach((listener) => listener());
}

/** A light touch for a quick "knew it": felt, with no celebration to wait for. */
export function tick() {
  feel(12, true);
}

/** A wrong answer: felt, not celebrated. */
export function miss() {
  feel([35, 60, 35], false);
}
