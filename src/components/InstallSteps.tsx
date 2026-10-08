import type { ReactNode } from "react";
import type { Browser, Phone } from "@/lib/install";

/**
 * The steps for adding the app to the home screen, worded as each browser's own menu spells
 * them in English, with the browser's icon drawn as a small round key. The one place to change
 * when a browser renames its menu.
 */

/** A control of the browser's, drawn inline. */
function Key({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="mx-0.5 inline-grid h-7 w-7 translate-y-[0.2em] place-items-center rounded-full border border-edge bg-surface align-baseline"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

const SHARE = (
  <Key label="Share">
    <path d="M12 3v12M8 7l4-4 4 4M6 11v9h12v-9" />
  </Key>
);
const DOTS = (
  <Key label="More">
    <path d="M6 12h.01M12 12h.01M18 12h.01" />
  </Key>
);
const MENU = (
  <Key label="Menu">
    <path d="M12 6h.01M12 12h.01M12 18h.01" />
  </Key>
);
const LINES = (
  <Key label="Menu">
    <path d="M5 7h14M5 12h14M5 17h14" />
  </Key>
);

const b = (text: string) => <b className="font-semibold">{text}</b>;

export function stepsFor(phone: Phone, browser: Browser, app: string): ReactNode[] {
  const ios = phone.device === "ios";
  if (browser === "in-app") return [<>Tap {DOTS} or {MENU} in the corner</>, <>Choose {b("Open in browser")}</>, <>Add {app} from there</>];
  if (ios) {
    if (browser === "safari" && phone.ios26) {
      return [
        <>Tap {DOTS} beside the address field, then {b("Share")} (or {SHARE} directly)</>,
        <>Scroll to {b("Add to Home Screen")}; if you first see {DOTS} {b("More")}, tap that</>,
        <>Leave {b("Open as Web App")} on and tap {b("Add")}</>,
      ];
    }
    if (browser === "safari") return [<>Tap the Share button {SHARE}</>, <>Scroll to {b("Add to Home Screen")}</>, <>Tap {b("Add")}</>];
    if (browser === "chrome") {
      return [<>Tap {SHARE} at the right of the address bar</>, <>Scroll to {b("Add to Home Screen")} (iOS 26: through {DOTS} {b("More")})</>, <>Tap {b("Add")}</>];
    }
    if (browser === "firefox") return [<>Tap the Share icon {SHARE} in the address bar</>, <>Scroll to {b("Add to Home Screen")}</>, <>Tap {b("Add")}</>];
    if (browser === "edge") {
      return [<>Tap {DOTS} in the bottom toolbar and choose {b("Share")}</>, <>Scroll to {b("Add to Home Screen")} (iOS 26: through {DOTS} {b("More")})</>, <>Tap {b("Add")}</>];
    }
  } else {
    if (browser === "chrome") return [<>Tap {MENU} beside the address bar</>, <>Choose {b("Add to Home screen")} (or {b("Install app")})</>, <>Choose {b("Install")}</>];
    if (browser === "samsung") return [<>Tap the menu {LINES}</>, <>Choose {b("Add to")}</>, <>Choose {b("Home screen")}</>];
    if (browser === "firefox") return [<>Tap the menu {MENU}</>, <>Open {b("More")} and choose {b("Add app to Home screen")}</>, <>Tap {b("Add")}</>];
    if (browser === "edge") return [<>Tap {DOTS} at the bottom of the screen</>, <>Choose {b("Add to phone")}</>, <>Choose {b("Install")}</>];
  }
  return [
    <>Open the browser&apos;s menu{ios ? <> (iPhone: choose {b("Share")})</> : null}</>,
    <>Find {b("Add to Home Screen")} or {b("Install")}</>,
    <>Confirm</>,
  ];
}

export const BROWSER_NAMES: Record<Browser, string> = {
  safari: "Safari",
  chrome: "Chrome",
  samsung: "Samsung Internet",
  firefox: "Firefox",
  edge: "Edge",
  other: "another browser",
  "in-app": "a page inside another app",
};
