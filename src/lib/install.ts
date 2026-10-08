import { useSyncExternalStore } from "react";
import { createStore } from "./store";

/**
 * Adding the app to the phone's home screen. Every browser hides that behind a menu of
 * its own, so the guide needs to know which browser it is in; an Android browser that
 * supports it also hands over an install dialog to open on request.
 */
export type Device = "ios" | "android";

/** The browsers with steps of their own. "in-app" is a page opened inside another app, such as Instagram. */
export type Browser = "safari" | "chrome" | "samsung" | "firefox" | "edge" | "other" | "in-app";

export type Phone = {
  device: Device;
  browser: Browser;
  /** iOS 26 moved Safari's Share behind three dots and shortened the share sheet's list. */
  ios26: boolean;
};

/** The browsers a device can be running, in the order the guide offers them. The device itself is never in doubt. */
export const BROWSERS: Record<Device, Browser[]> = {
  ios: ["safari", "chrome", "firefox", "edge", "other", "in-app"],
  android: ["chrome", "samsung", "firefox", "edge", "other", "in-app"],
};

/** How apps that show pages in a browser of their own sign their name. */
const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|LinkedInApp|Snapchat|musical_ly|BytedanceWebview|TikTok|Pinterest|MicroMessenger/;

function iosBrowser(userAgent: string): Browser {
  // The Google app shows pages too, but like the apps above it cannot add one to the home screen.
  if (IN_APP.test(userAgent) || /GSA\//.test(userAgent)) return "in-app";
  if (/EdgiOS\//.test(userAgent)) return "edge";
  if (/CriOS\//.test(userAgent)) return "chrome";
  if (/FxiOS\//.test(userAgent)) return "firefox";
  if (/OPT\/|OPiOS|YaBrowser| Brave(?:\s|$)|Ddg\/|DuckDuckGo|VivaiOS|Ecosia/.test(userAgent)) return "other";
  // Every browser on an iPhone signs off as Safari; a page that does not is inside some app.
  return /Safari\//.test(userAgent) ? "safari" : "in-app";
}

function androidBrowser(userAgent: string): Browser {
  // "wv" marks the web view Android lends to apps.
  if (IN_APP.test(userAgent) || /;\s*wv\)/.test(userAgent)) return "in-app";
  if (/SamsungBrowser\//.test(userAgent)) return "samsung";
  if (/Firefox\//.test(userAgent)) return "firefox";
  if (/EdgA\//.test(userAgent)) return "edge";
  if (/OPR\/|YaBrowser\/|DuckDuckGo\/|Ecosia|UCBrowser|MiuiBrowser|HuaweiBrowser/.test(userAgent)) return "other";
  return /Chrome\//.test(userAgent) ? "chrome" : "other";
}

function isIos26(userAgent: string): boolean {
  // Safari stopped telling the system's version and gives its own, which matches it. Chrome and
  // Edge still tell the system's. Firefox tells neither: take a current iPhone for granted.
  const version = /(?:CriOS|EdgiOS)\//.test(userAgent) ? /OS (\d+)_/.exec(userAgent) : /Version\/(\d+)/.exec(userAgent);
  return version === null || Number(version[1]) >= 26;
}

/** The phone and browser this is, or null on a computer, where there is no home screen to add to. */
export function phoneOf(userAgent: string, touchPoints: number): Phone | null {
  if (/Android/.test(userAgent)) return { device: "android", browser: androidBrowser(userAgent), ios26: false };
  // An iPad introduces itself as a Mac; only its touch screen tells the two apart.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) {
    return { device: "ios", browser: iosBrowser(userAgent), ios26: isIos26(userAgent) };
  }
  return null;
}

/**
 * `seen`: the guide shown on the first visit has been closed, so it is not shown unasked again.
 * `owned`: the learner says the app is on the home screen already, so nothing offers it any more.
 */
export const installStore = createStore("omasuomi.install", { seen: false, owned: false });

/** The browser's own install dialog, held back until asked for. Not in TypeScript's DOM types. */
type InstallPrompt = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let prompt: InstallPrompt | undefined;
let installed = false;
const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((listener) => listener());
}

// Listened for from the start: the browser offers its dialog once, soon after the page loads,
// whichever screen happens to be showing. Holding it back also keeps the browser's own banner away.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    prompt = event as InstallPrompt;
    changed();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    changed();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The last reading, kept so the same phone is the same object from one render to the next. */
let read: { userAgent: string; phone: Phone | null } | undefined;

function currentPhone(): Phone | null {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed || standalone) return null;
  if (read?.userAgent !== navigator.userAgent) {
    read = { userAgent: navigator.userAgent, phone: phoneOf(navigator.userAgent, navigator.maxTouchPoints) };
  }
  return read.phone;
}

/**
 * The phone to show install help for. Null on a computer, inside the installed app,
 * and while the page is still as the server built it.
 */
export function usePhone(): Phone | null {
  return useSyncExternalStore(subscribe, currentPhone, () => null);
}

/** Whether the browser has an install dialog waiting to be opened. */
export function useInstallDialog(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => prompt !== undefined,
    () => false,
  );
}

/** Opens the browser's install dialog and says whether the app was installed. */
export async function requestInstall(): Promise<boolean> {
  if (!prompt) return false;
  // A dialog can be opened only once.
  const dialog = prompt;
  prompt = undefined;
  changed();
  try {
    await dialog.prompt();
    return (await dialog.userChoice).outcome === "accepted";
  } catch {
    return false;
  }
}
