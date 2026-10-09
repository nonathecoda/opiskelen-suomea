"use client";

import { useEffect, useState, type ReactNode } from "react";
import { depart } from "@/lib/motion";
import { GLYPH, Icon } from "./ui";

/**
 * Takes the focus into a dialog when it opens, and hands it back to whatever had it when the
 * dialog closes: the word that was tapped, or the answer field, which brings its keyboard back.
 */
export function dialogFocus(dialog: HTMLElement | null) {
  if (!dialog) return;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.focus({ preventScroll: true });
  return () => {
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
}

/**
 * A closed sheet is gone at once: the screen under it takes taps again and the focus is back
 * where it was, inside the tap that closed it. What is seen falling away is a still (motion.ts).
 */
function leaving(sheet: HTMLElement | null) {
  if (!sheet) return;
  return () => depart(sheet, "sheet");
}

/** A panel that rises over the screen. The cross, a tap beside it or Esc closes it. */
export function Sheet({
  label,
  title,
  detail,
  onClose,
  children,
}: {
  /** What the panel is, for screen readers. */
  label: string;
  title: ReactNode;
  /** One quiet line under the title, the way a dictionary follows a headword with what kind of word it is. */
  detail?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  // Once the body has moved under the title, a line shows where it goes.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // The veil that darkens the screen behind is drawn by the styles (.sheet), so it can come and go apart from the panel.
    <div ref={leaving} className="sheet fixed inset-0 z-10 flex items-end justify-center" onClick={onClose}>
      <div
        ref={dialogFocus}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
        // On a dark page a shadow shows nothing: the sheet is told from what lies under it by a darker veil and a drawn edge.
        className="sheet-panel scroll-y pad-bottom max-h-[86dvh] w-full max-w-[34rem] rounded-t-3xl border-t border-edge bg-bg px-5 outline-none"
      >
        {/*
          The title and the cross stay in sight however long the sheet is; the rest scrolls under them.
          The title leads and is never broken inside a word form: the cross floats beside it,
          and a headword too long for that line takes the full width under it.
        */}
        <div
          // The room under the title, and its rule, are taken out of the flow again: the body starts where it always did.
          className={`sticky top-0 z-[1] -mx-5 -mb-[calc(0.5rem+1px)] flow-root border-b bg-bg px-5 pb-2 pt-4 ${
            scrolled ? "border-line" : "border-transparent"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press float-right -mr-2 ml-3 grid h-11 w-11 place-items-center rounded-full active:bg-line"
          >
            <Icon>{GLYPH.close}</Icon>
          </button>
          <h2 className="pt-1.5 font-display text-[24px] font-semibold leading-tight">{title}</h2>
          {detail && <p className="mt-0.5 text-[15px] text-muted">{detail}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
