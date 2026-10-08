import type { CSSProperties, ElementType, ReactNode } from "react";
import { GAP } from "@/lib/cards";
import { profile } from "@/content/profile";
import type { VerbTable } from "@/content/types";

const TARGET = profile.target.code;

/** Every icon line lands on screen this many pixels thick, whatever size the icon is drawn at. */
const STROKE = 2;

/** An icon drawn on a 24-unit grid, in the app's one line weight. */
export function Icon({ size = 22, className, children }: { size?: number; className?: string; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={(STROKE * 24) / size}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** The shapes more than one screen uses. */
export const GLYPH = {
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  forward: <path d="M9 5l7 7-7 7" />,
  down: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

/**
 * The app's one label: a plain word that names what follows. With `ruled` it stands on the
 * ink rule that opens a list, the way a table carries its head.
 */
export function Label({
  as: Tag = "h2",
  ruled = false,
  className = "",
  children,
}: {
  as?: ElementType;
  ruled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`text-[15px] font-semibold leading-snug ${ruled ? "border-b border-rule pb-1.5" : ""} ${className}`}>
      {children}
    </Tag>
  );
}

/** What a label adds in passing: a page number, a chapter's name. */
export function Aside({ children }: { children: ReactNode }) {
  return <span className="font-normal text-muted">{children}</span>;
}

/** Runs `fit` now, and again whenever the element gets another width or the fonts arrive. */
export function onWidth(element: HTMLElement, fit: () => void): () => void {
  let width = element.clientWidth;
  let watching = true;
  fit();
  const observer = new ResizeObserver(() => {
    if (element.clientWidth === width) return;
    width = element.clientWidth;
    fit();
  });
  observer.observe(element);
  // Until its font has loaded a word is measured in another one, a little wider or narrower.
  document.fonts.ready.then(() => watching && fit());
  return () => {
    watching = false;
    observer.disconnect();
  };
}

/** The smallest size a word too long for its line is set in. */
const SMALLEST_FIT = 16;

/**
 * A target-language word is never broken and never cut off. One too long for its line
 * is set smaller instead: just enough to fit, and never under 16px. Whatever fits is
 * left as it is.
 */
function fitWord(word: HTMLElement | null) {
  if (!word) return;
  let line = word.parentElement;
  while (line && ["inline", "contents"].includes(getComputedStyle(line).display)) line = line.parentElement;
  if (!line) return;
  const box = line;
  return onWidth(box, () => {
    word.style.fontSize = "";
    const style = getComputedStyle(box);
    const room = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    let size = parseFloat(getComputedStyle(word).fontSize);
    while (size > SMALLEST_FIT && word.getBoundingClientRect().width > room) {
      size -= 1;
      word.style.fontSize = `${size}px`;
    }
  });
}

/**
 * The target language is the thing being learnt: the largest type on its screen. A long phrase
 * is set a step smaller so that it stays on a few lines; a single long word is fitted by `Target fit`.
 */
export function heroSize(text: string): string {
  return text.length > 34 ? "text-[30px]" : text.length > 16 ? "text-[38px]" : "text-[46px]";
}


/**
 * Target-language text: always in the serif and tagged with its language. A single word, or
 * `whole` text, stays on one line; `fit` sets a word too long for its line smaller (never under
 * 16px). `mark` highlights it, drawn in when `draw` is set.
 */
export function Target({
  text,
  fit = false,
  whole = false,
  mark = false,
  draw = false,
  className = "",
}: {
  text: string;
  fit?: boolean;
  whole?: boolean;
  mark?: boolean;
  draw?: boolean;
  className?: string;
}) {
  const oneLine = whole || !/\s/.test(text.trim());
  return (
    <span
      lang={TARGET}
      ref={fit ? fitWord : undefined}
      className={`font-serif ${oneLine ? "whitespace-nowrap" : ""} hyphens-none ${className}`}
    >
      {mark ? <span className={`hl ${draw ? "hl-write" : ""}`}>{text}</span> : text}
    </span>
  );
}

/** A sentence with its gap: an empty underlined blank, or the answer standing in it, highlighted. */
export function Gapped({ text, fill, still = false, className = "" }: { text: string; fill?: string; still?: boolean; className?: string }) {
  const [before, after = ""] = text.split(GAP);
  return (
    <span lang={TARGET} className={`font-serif hyphens-none ${className}`}>
      {before}
      {fill === undefined ? (
        <span aria-label="gap" className="inline-block w-[2em] translate-y-[-0.15em] border-b-[3px] border-accent align-baseline" />
      ) : (
        <span className={`hl whitespace-nowrap font-semibold ${still ? "" : "hl-write"}`}>{fill}</span>
      )}
      {after}
    </span>
  );
}

/**
 * Sets each label above its form when a form does not fit beside its label, and goes down to one
 * column, in person order, when a form does not fit even so.
 */
function stackWhenTight(table: HTMLElement | null) {
  if (!table) return;
  return onWidth(table, () => {
    const tight = () =>
      [...table.querySelectorAll<HTMLElement>("[data-form]")].some((cell) => cell.scrollWidth > cell.clientWidth + 1);
    delete table.dataset.stacked;
    delete table.dataset.single;
    if (!tight()) return;
    table.dataset.stacked = "";
    if (tight()) table.dataset.single = "";
  });
}

/**
 * A paradigm: its forms beside their person labels in two columns, singular left and plural right,
 * in the profile's order. A form never wraps; where one would not fit, every label stands above its form.
 */
export function ParadigmTable({
  verb,
  paradigm,
  stacked = false,
  title,
}: {
  verb: VerbTable;
  paradigm: string;
  stacked?: boolean;
  title?: string;
}) {
  const spec = profile.paradigms.find((one) => one.id === paradigm);
  const forms = verb.forms[paradigm];
  if (!spec || !forms) return null;
  return (
    <div>
      {title && <p className="mb-1 text-[15px] font-semibold">{title}</p>}
      <div
        ref={stacked ? undefined : stackWhenTight}
        data-stacked={stacked ? "" : undefined}
        className="group/para grid grid-cols-2 gap-x-4 gap-y-1.5 data-[single]:grid-cols-1"
      >
        {spec.order.map((slot) => (
          <div
            key={slot}
            style={{ "--slot": slot } as CSSProperties}
            className="flex min-w-0 items-baseline gap-2 group-data-[stacked]/para:block group-data-[single]/para:[order:var(--slot)]"
          >
            <span className="w-9 shrink-0 text-[15px] text-muted group-data-[stacked]/para:block group-data-[stacked]/para:w-auto">
              {spec.slots[slot]}
            </span>
            <span
              data-form
              lang={TARGET}
              className="min-w-0 overflow-hidden whitespace-nowrap font-serif text-[18px] font-medium group-data-[stacked]/para:block group-data-[stacked]/para:overflow-visible group-data-[stacked]/para:text-[21px]"
            >
              {forms[slot]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A chapter's heading in a list: the book's label, then its title in the serif, on a rule. */
export function ChapterHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-rule pb-1.5">
      <p className="text-[15px] text-muted">{label}</p>
      <h2 lang={TARGET} className="font-serif text-[22px] font-semibold leading-tight">
        {title}
      </h2>
    </div>
  );
}

export function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`press h-11 min-w-11 rounded-full border px-4 text-[16px] font-medium ${
        on ? "border-ink bg-ink text-bg" : "border-edge bg-surface text-ink active:bg-line"
      }`}
    >
      {children}
    </button>
  );
}

/** Two or three mutually exclusive choices side by side. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  /** `name` is the option said in full, for when the label on screen is an abbreviation. */
  options: { value: T; label: string; name?: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    // On one line this is a pill. Where three long names do not fit a narrow phone, they take a second line.
    <div role="group" aria-label={label} className="flex flex-wrap rounded-[26px] border border-edge bg-surface p-[3px]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-label={option.name}
          onClick={() => onChange(option.value)}
          className={`press h-11 flex-1 whitespace-nowrap rounded-full px-3 text-[16px] font-medium ${
            option.value === value ? "bg-ink text-bg" : "text-ink active:bg-line"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Header of a sub-screen: a way out on the left, the screen's own controls on the right. */
export function TopBar({
  onClose,
  back = false,
  quiet = false,
  children,
}: {
  onClose: () => void;
  /** Show a back arrow (one level up) instead of a cross (leave the exercise). */
  back?: boolean;
  /** Over an exercise: the way out is there to be found, and no louder than that. */
  quiet?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="pad-top flex items-center gap-2 px-3 pb-3">
      <button
        type="button"
        onClick={onClose}
        aria-label={back ? "Back" : "Close"}
        className={`press grid h-11 w-11 shrink-0 place-items-center rounded-full active:bg-line ${quiet ? "text-muted" : ""}`}
      >
        <Icon>{back ? GLYPH.back : GLYPH.close}</Icon>
      </button>
      {children}
    </header>
  );
}

/**
 * The filled part of a bar: `value` of its track, from 0 to 1. It is always as wide as the track
 * and cut off where the value ends (.bar-fill), so a new value moves the cut and nothing is laid out again.
 */
export function Fill({ value, className = "" }: { value: number; className?: string }) {
  const part = Math.min(Math.max(value || 0, 0), 1);
  return <span className={`bar-fill block h-full ${className}`} style={{ "--value": part } as CSSProperties} />;
}

/** Thin bar showing how much of something is known: highlighted as far as it goes. */
export function Meter({ known, total }: { known: number; total: number }) {
  return (
    <span className="block h-1.5 overflow-hidden rounded-full bg-line">
      <Fill value={total ? known / total : 0} className="bg-accent" />
    </span>
  );
}

export function PrimaryButton({
  onClick,
  children,
  type = "button",
  tone = "ink",
  disabled = false,
}: {
  onClick?: () => void;
  children: ReactNode;
  type?: "button" | "submit";
  tone?: "ink" | "accent";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      // A button that cannot be pressed still says why ("Pick an exercise"), so it stays readable:
      // its fill is gone and a hairline is left, with the words in the secondary colour on the surface.
      className={`press h-14 w-full rounded-2xl text-[17px] font-semibold disabled:bg-surface disabled:text-muted disabled:ring-1 disabled:ring-inset disabled:ring-line ${
        tone === "accent" ? "bg-accent text-accent-ink active:bg-accent-press" : "bg-ink text-bg active:bg-ink/85"
      }`}
    >
      {children}
    </button>
  );
}

export function QuietButton({
  onClick,
  children,
  disabled = false,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press h-14 w-full rounded-2xl border border-edge bg-surface text-[17px] font-medium active:bg-line disabled:border-line disabled:text-muted"
    >
      {children}
    </button>
  );
}

/**
 * Says plainly whether an answer was right or wrong: a band of bright colour with black on it,
 * and under it, on the plain surface, whatever there is to read (the right answer, with its
 * marker colours intact). It comes up from below while the answer hops or shakes: one gesture.
 */
export function VerdictBanner({
  correct,
  title,
  children,
}: {
  correct: boolean;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className={`verdict rounded-2xl border-2 ${correct ? "border-good bg-good" : "border-bad bg-bad"}`}
    >
      <p className="flex items-center gap-2.5 px-3.5 py-2.5 text-[20px] font-bold leading-tight text-accent-ink">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-ink ${
            correct ? "text-good" : "text-bad"
          }`}
        >
          <Icon size={18}>{correct ? GLYPH.check : GLYPH.close}</Icon>
        </span>
        {title}
      </p>
      {children && <div className="rounded-b-[14px] bg-surface px-3.5 py-3 text-ink">{children}</div>}
    </div>
  );
}

/** An answer shown under a verdict: the right one, or the one that was typed. Both in one size, so they can be compared. */
export function Answer({ children }: { children: ReactNode }) {
  return <div className="text-[24px] font-medium leading-snug">{children}</div>;
}
