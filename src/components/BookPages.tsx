"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { TAP_ZOOM, clampZoom, heldAt, scrollFor } from "@/lib/zoom";
import { chapters } from "@/content";
import { BOOK_PHOTOS, type BookPhoto } from "@/lib/bookPages";
import { depart } from "@/lib/motion";
import { dialogFocus } from "./Sheet";
import { GLYPH, Icon, Label, PrimaryButton, QuietButton, TopBar } from "./ui";

type Point = { x: number; y: number };

/**
 * A photo that is enlarged inside its frame, as in the phone's own photos: two fingers spread
 * make it larger, one moves it about, and a tap sets it large or whole again. The frame scrolls
 * over the photo. Nothing else on the screen changes size, here or anywhere (globals.css).
 */
function usePhotoZoom() {
  const frame = useRef<HTMLElement>(null);
  // How many times the frame's width the photo is.
  const [zoom, setZoom] = useState(1);
  // The same figure for the fingers, which cannot wait for a render to learn it.
  const now = useRef(1);

  /** The point of the photo that lies under a place in the frame. */
  const hold = useCallback((x: number, y: number): Point => {
    const box = frame.current;
    return { x: heldAt(box?.scrollLeft ?? 0, x, now.current), y: heldAt(box?.scrollTop ?? 0, y, now.current) };
  }, []);

  /** Sets the photo at a size, with a point of it under a place in the frame. */
  const place = useCallback((size: number, held: Point, x: number, y: number) => {
    now.current = size;
    // Laid out at once: a frame can only be scrolled over a photo that is already that large.
    flushSync(() => setZoom(size));
    frame.current?.scrollTo(scrollFor(held.x, x, size), scrollFor(held.y, y, size));
  }, []);

  useEffect(() => {
    const box = frame.current;
    if (!box) return;
    let pinch: { span: number; zoom: number; held: Point } | undefined;
    /** How far apart two fingers are, and where in the frame the middle between them is. */
    const fingers = (event: TouchEvent) => {
      const [a, b] = [event.touches[0], event.touches[1]];
      const edge = box.getBoundingClientRect();
      return {
        span: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        x: (a.clientX + b.clientX) / 2 - edge.left,
        y: (a.clientY + b.clientY) / 2 - edge.top,
      };
    };
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      const { span, x, y } = fingers(event);
      if (span > 0) pinch = { span, zoom: now.current, held: hold(x, y) };
    };
    const onMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return;
      // Two fingers are the photo's own: the frame does not scroll under them as well.
      event.preventDefault();
      const { span, x, y } = fingers(event);
      // What was between the fingers stays between them, wherever they go.
      place(clampZoom((pinch.zoom * span) / pinch.span), pinch.held, x, y);
    };
    const onEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = undefined;
    };
    box.addEventListener("touchstart", onStart, { passive: true });
    box.addEventListener("touchmove", onMove, { passive: false });
    box.addEventListener("touchend", onEnd);
    box.addEventListener("touchcancel", onEnd);
    return () => {
      box.removeEventListener("touchstart", onStart);
      box.removeEventListener("touchmove", onMove);
      box.removeEventListener("touchend", onEnd);
      box.removeEventListener("touchcancel", onEnd);
    };
  }, [hold, place]);

  return {
    frame,
    zoom,
    /** A tap: large about the place that was tapped, or whole again. */
    tap: (event: MouseEvent) => {
      const edge = frame.current?.getBoundingClientRect();
      if (!edge) return;
      const [x, y] = [event.clientX - edge.left, event.clientY - edge.top];
      place(now.current > 1 ? 1 : TAP_ZOOM, hold(x, y), x, y);
    },
    /** Another photo starts whole. */
    reset: () => {
      now.current = 1;
      setZoom(1);
    },
  };
}

/** The chapter a page belongs to: the last chapter whose first page is at or before it. */
const FIRST_PAGES: Record<number, number> = { 1: 8, 2: 28, 3: 46, 4: 70 };
function chapterOf(page: number): number {
  return chapters.map((chapter) => chapter.id).filter((id) => (FIRST_PAGES[id] ?? Infinity) <= page).pop() ?? chapters[0].id;
}

/** What the app's own headings say a page holds. */
function holds(page: number): string {
  const titles = chapters.flatMap((chapter) => [
    ...chapter.vocab.filter((group) => group.pages?.includes(page)).map((group) => group.title),
    ...chapter.grammar.filter((topic) => topic.pages?.includes(page)).map((topic) => topic.title),
  ]);
  return titles.join(" · ");
}

/** A full-screen dialog over the app: drawn on the body so nothing clips it; Esc closes the one on top. */
function Dialog({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Only the dialog on top: it is the last one in the page.
      const dialogs = document.querySelectorAll("[data-full-dialog]");
      if (dialogs[dialogs.length - 1] === ref.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div
      ref={(element) => {
        ref.current = element;
        if (!element) return;
        const giveBack = dialogFocus(element);
        return () => {
          depart(element, "screen");
          giveBack?.();
        };
      }}
      data-full-dialog=""
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className="onward fixed inset-0 z-20 bg-bg outline-none"
    >
      <div className="app-shell">{children}</div>
    </div>,
    document.body,
  );
}

/** The row on the Sources tab that opens the book's pages. */
export function BookPagesRow() {
  const [shown, setShown] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setShown(true)}
        className="press-dim flex min-h-14 w-full items-center gap-3 border-b border-line py-2.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-medium">Book pages</span>
          <span className="block text-[15px] text-muted">{BOOK_PHOTOS.length} photos, behind a password</span>
        </span>
        <Icon size={20} className="shrink-0 text-muted">
          {GLYPH.forward}
        </Icon>
      </button>
      {shown && <BookPages onClose={() => setShown(false)} />}
    </li>
  );
}

function BookPages({ onClose }: { onClose: () => void }) {
  const [at, setAt] = useState<number | null>(null);
  const contents = BOOK_PHOTOS.filter((photo) => photo.page === undefined);
  const byChapter = chapters.map((chapter) => ({
    chapter,
    photos: BOOK_PHOTOS.filter((photo) => photo.page !== undefined && chapterOf(photo.page) === chapter.id),
  }));
  const row = (photo: BookPhoto) => (
    <li key={photo.id}>
      <button
        type="button"
        onClick={() => setAt(BOOK_PHOTOS.indexOf(photo))}
        className="press-dim flex min-h-14 w-full items-center gap-3 border-b border-line py-2 text-left"
      >
        <span className="w-16 shrink-0 text-[15px] font-semibold tabular-nums">{photo.label}</span>
        <span className="min-w-0 flex-1 text-[15px] leading-snug text-muted">{photo.page ? holds(photo.page) : ""}</span>
        <Icon size={20} className="shrink-0 text-muted">
          {GLYPH.forward}
        </Icon>
      </button>
    </li>
  );
  return (
    <Dialog label="Book pages" onClose={onClose}>
      <TopBar onClose={onClose} back>
        <h1 className="flex-1 text-[17px] font-semibold">Book pages</h1>
      </TopBar>
      <main className="scroll-y flex-1 px-5 pb-8">
        <p className="mb-5 text-[16px] text-muted">Photos of the book&apos;s pages, in the book&apos;s order.</p>
        {contents.length > 0 && (
          <section className="mb-6">
            <Label ruled>Contents</Label>
            <ul>{contents.map(row)}</ul>
          </section>
        )}
        {byChapter.map(({ chapter, photos }) => (
          <section key={chapter.id} className="mb-6">
            <Label ruled>
              {chapter.label} · <span lang="fi">{chapter.title}</span>
            </Label>
            <ul>{photos.map(row)}</ul>
          </section>
        ))}
      </main>
      {at !== null && <Viewer at={at} setAt={setAt} onClose={() => setAt(null)} />}
    </Dialog>
  );
}

type Access = "loading" | "open" | "locked" | "unset";

/** Whether this browser has given the password. Offline, the photos looked at before still show. */
function useAccess(): [Access, (access: Access) => void] {
  const [access, setAccess] = useState<Access>("loading");
  useEffect(() => {
    let live = true;
    fetch("/api/pages/unlock", { cache: "no-store" })
      .then((response) => live && setAccess(response.status === 200 ? "open" : response.status === 503 ? "unset" : "locked"))
      .catch(() => live && setAccess("open"));
    return () => {
      live = false;
    };
  }, []);
  return [access, setAccess];
}

function Viewer({ at, setAt, onClose }: { at: number; setAt: (index: number) => void; onClose: () => void }) {
  const [access, setAccess] = useAccess();
  const photo = BOOK_PHOTOS[at];
  const { frame, zoom, tap, reset } = usePhotoZoom();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const go = (index: number) => {
    reset();
    setFailed(false);
    setAt(index);
  };
  return (
    <Dialog label={`Page ${photo.label}`} onClose={onClose}>
      <TopBar onClose={onClose} back>
        <span className="flex-1 text-[17px] font-semibold">{photo.label}</span>
        <span className="pr-2 text-[15px] tabular-nums text-muted">
          {at + 1}/{BOOK_PHOTOS.length}
        </span>
      </TopBar>
      <main className="relative flex-1 overflow-hidden">
        {access === "loading" && <p className="p-5 text-[16px] text-muted">Loading…</p>}
        {access === "unset" && (
          <p className="p-5 text-[16px] text-muted">The photo password has not been set on the server yet (PAGES_PASSWORD).</p>
        )}
        {access === "locked" && <Unlock onOpen={() => setAccess("open")} />}
        {access === "open" &&
          (failed ? (
            <div className="grid gap-3 p-5">
              <p className="text-[16px] text-muted">The photo could not be loaded. Check your connection.</p>
              <QuietButton
                onClick={() => {
                  setFailed(false);
                  setAttempt((count) => count + 1);
                }}
              >
                Try again
              </QuietButton>
            </div>
          ) : (
            <section
              ref={frame as React.RefObject<HTMLElement>}
              onClick={tap}
              className="absolute inset-0 overflow-auto"
              style={{ touchAction: zoom > 1 ? "pan-x pan-y" : "pan-y" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a private photo behind a cookie, not an optimisable asset */}
              <img
                key={`${photo.id}-${attempt}`}
                src={`/api/pages/${photo.id}`}
                alt={`Book page ${photo.label}`}
                draggable={false}
                onError={() => setFailed(true)}
                style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
                className="block h-auto select-none"
              />
            </section>
          ))}
      </main>
      <footer className="pad-bottom grid grid-cols-2 gap-2 px-5 pt-3">
        <QuietButton disabled={at === 0} onClick={() => go(at - 1)}>
          Previous
        </QuietButton>
        <QuietButton disabled={at === BOOK_PHOTOS.length - 1} onClick={() => go(at + 1)}>
          Next
        </QuietButton>
      </footer>
    </Dialog>
  );
}

function Unlock({ onOpen }: { onOpen: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pages/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) onOpen();
      else setError(response.status === 429 ? "Too many tries. Wait ten minutes." : "Wrong password.");
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="grid gap-3 p-5"
    >
      <p className="text-[16px]">The book pages are behind a password. It is asked only once.</p>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        aria-label="Password"
        className="h-14 rounded-2xl border-2 border-edge bg-surface px-4 text-[18px] outline-none focus:border-ink"
      />
      {error && (
        <p role="alert" className="text-[16px] text-bad">
          {error}
        </p>
      )}
      <PrimaryButton type="submit" disabled={busy}>
        {busy ? "Opening…" : "Open"}
      </PrimaryButton>
    </form>
  );
}
