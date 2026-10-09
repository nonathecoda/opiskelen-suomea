"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { profile } from "@/content/profile";
import { BROWSERS, installStore, requestInstall, useInstallDialog, usePhone, type Browser, type Phone } from "@/lib/install";
import { depart } from "@/lib/motion";
import { progressStore } from "@/lib/progress";
import { AppIcon } from "./Mark";
import { BROWSER_NAMES, stepsFor } from "./InstallSteps";
import { dialogFocus } from "./Sheet";
import { GLYPH, Icon, PrimaryButton, QuietButton } from "./ui";

const APP = profile.app.name;

/** Shows the guide once, on the first visit in a phone's browser. */
export function InstallOffer() {
  const phone = usePhone();
  const install = installStore.use();
  const [closed, setClosed] = useState(false);
  if (!phone || install.seen || install.owned || closed) return null;
  return (
    <InstallGuide
      phone={phone}
      onClose={() => {
        setClosed(true);
        installStore.set({ ...installStore.get(), seen: true });
      }}
    />
  );
}

/** At the foot of the Blitz tab: opens the guide again. */
export function InstallRow() {
  const phone = usePhone();
  const install = installStore.use();
  const [open, setOpen] = useState(false);
  if (!phone || install.owned) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press-dim flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line px-4 py-3 text-left"
      >
        <AppIcon size={44} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-medium">Add {APP} to the Home Screen</span>
          <span className="block text-[15px] text-muted">Full screen, works offline</span>
        </span>
        <Icon size={20} className="shrink-0 text-muted">
          {GLYPH.forward}
        </Icon>
      </button>
      {open && <InstallGuide phone={phone} onClose={() => setOpen(false)} />}
    </>
  );
}

function InstallGuide({ phone, onClose }: { phone: Phone; onClose: () => void }) {
  const [browser, setBrowser] = useState<Browser>(phone.browser);
  const dialogReady = useInstallDialog();
  const progress = progressStore.use();
  const hasProgress = Object.keys(progress).length > 0;
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const steps = stepsFor(phone, browser, APP);
  return createPortal(
    <div
      ref={(element) => {
        root.current = element;
        if (!element) return;
        const giveBack = dialogFocus(element);
        return () => {
          depart(element, "screen");
          giveBack?.();
        };
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Add ${APP} to the Home Screen`}
      tabIndex={-1}
      className="onward fixed inset-0 z-30 bg-bg outline-none"
    >
      <div className="app-shell">
        <main className="scroll-y pad-top flex-1 px-5 pb-6">
          <div className="mt-6 flex flex-col items-center text-center">
            <AppIcon size={88} />
            <h1 className="headline mt-4 text-[30px] leading-tight">Add {APP} to the Home Screen</h1>
            <p className="mt-2 text-[16px] text-muted">Works like an app, without the app store.</p>
          </div>
          <ul className="mt-6 grid gap-2">
            {["Full screen, no browser bars", "Opens with one tap", "Works offline too"].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-[16px]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                  <Icon size={16}>{GLYPH.check}</Icon>
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          {dialogReady ? (
            <div className="mt-7">
              <PrimaryButton
                tone="accent"
                onClick={async () => {
                  if (await requestInstall()) {
                    installStore.set({ ...installStore.get(), seen: true, owned: true });
                    onClose();
                  }
                }}
              >
                Install {APP}
              </PrimaryButton>
            </div>
          ) : (
            <section className="mt-7">
              <h2 className="text-[17px] font-semibold">
                Steps for{" "}
                <span className="relative inline-block">
                  <span className="link">{BROWSER_NAMES[browser]}</span>
                  <select
                    aria-label="Your browser"
                    value={browser}
                    onChange={(event) => setBrowser(event.target.value as Browser)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  >
                    {BROWSERS[phone.device].map((one) => (
                      <option key={one} value={one}>
                        {BROWSER_NAMES[one]}
                      </option>
                    ))}
                  </select>
                </span>
              </h2>
              <ol key={browser} className="cross-in mt-3 grid gap-3">
                {steps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-[16px] leading-relaxed">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-edge text-[15px] font-semibold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <p className="mt-6 text-[16px]">Then open {APP} from the Home Screen.</p>
          {phone.device === "ios" && (
            <p className="mt-1 text-[15px] text-muted">
              {hasProgress ? "Progress made in the browser does not carry over." : "Your progress is saved there."}
            </p>
          )}
        </main>
        <footer className="pad-bottom grid gap-2 px-5 pt-3">
          <PrimaryButton onClick={onClose}>Continue in the browser</PrimaryButton>
          <QuietButton
            onClick={() => {
              installStore.set({ ...installStore.get(), seen: true, owned: true });
              onClose();
            }}
          >
            I already have the app
          </QuietButton>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
