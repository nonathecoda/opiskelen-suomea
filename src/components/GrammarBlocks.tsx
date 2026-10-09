import { Fragment } from "react";
import type { GrammarBlock, GrammarTopic, TableColumn } from "@/content/types";
import { profile } from "@/content/profile";
import { onWidth } from "./ui";

const TARGET = profile.target.code;
const BASE = profile.base.code;

type Table = Extract<GrammarBlock, { type: "table" }>;

/** A grammar rule as written for the app: short texts, tables and example sentences. */
export function GrammarBlocks({ topic }: { topic: GrammarTopic }) {
  return (
    // A new key per topic: its tables are measured afresh.
    <div key={topic.id} className="grid gap-3.5 text-[16px] leading-relaxed">
      {topic.blocks.map((block, index) => {
        if (block.type === "text") return <p key={index}>{block.text}</p>;
        if (block.type === "table") return <Fitted key={index} table={block} />;
        return (
          <ul key={index} className="grid gap-2">
            {block.items.map((example, line) => (
              <li key={line}>
                <span lang={TARGET} className="block font-display text-[19px] font-medium leading-snug">
                  {example.target}
                </span>
                <span className="block text-[15px] text-muted">{example.base}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

/** One way to set a table: which of its columns, and the column of translations that goes under the one before it. */
type Layout = { columns: number[]; under?: number };

/**
 * The same table for a phone too narrow for it, where there is a way to set it that breaks no
 * target-language form: a translation goes under what it translates, and forms beside their row labels
 * are set in two halves, one under the other.
 */
function narrower(cols: TableColumn[]): Layout[] | undefined {
  const all = cols.map((_kind, column) => column);
  const gloss = cols.indexOf("gloss");
  if (gloss > 0) return [{ columns: all.filter((column) => column !== gloss), under: gloss }];
  const forms = all.slice(1);
  if (forms.length < 3 || forms.some((column) => cols[column] !== "target")) return undefined;
  const half = Math.ceil(forms.length / 2);
  return [forms.slice(0, half), forms.slice(half)].map((part) => ({ columns: [0, ...part] }));
}

/**
 * A table is set whole and unhyphenated wherever that fits. One too wide for the phone is marked
 * `narrow` and shows its narrower setting, if it has one; and only one that is still too wide is
 * marked `tight`, which lets its base-language text be hyphenated. That fits almost anything, in columns a
 * few letters wide, so it comes last.
 */
function fit(box: HTMLDivElement | null) {
  if (!box) return;
  return onWidth(box, () => {
    const tooWide = () => box.scrollWidth > box.clientWidth;
    delete box.dataset.narrow;
    delete box.dataset.tight;
    if (!tooWide()) return;
    if (box.childElementCount > 1) {
      box.dataset.narrow = "";
      if (!tooWide()) return;
    }
    box.dataset.tight = "";
  });
}

/** A table that always fits the phone's width. Should one ever fail to, it still scrolls sideways. */
function Fitted({ table }: { table: Table }) {
  const whole = { columns: table.cols.map((_kind, column) => column) };
  const narrow = narrower(table.cols);
  return (
    <div ref={fit} className="group/table overflow-x-auto">
      <Grid table={table} parts={[whole]} className={narrow ? "group-data-[narrow]/table:hidden" : ""} />
      {narrow && <Grid table={table} parts={narrow} className="hidden group-data-[narrow]/table:table" />}
    </div>
  );
}

/**
 * How a cell of each kind is set and may be broken. The target-language forms are what the table
 * teaches: they stand in the display face, and the translation beside them steps back. The base language
 * is hyphenated when the table is.
 */
const CELL: Record<TableColumn, string> = {
  // Kept a step under the body size, so that a table of four forms still fits a narrow phone whole.
  target: "whitespace-nowrap hyphens-none font-display text-[16px] font-medium",
  text: "hyphens-none",
  base: "",
  gloss: "text-muted",
};

const LANG: Record<TableColumn, string | undefined> = { target: TARGET, text: undefined, base: BASE, gloss: BASE };

/** The table itself. Set in several parts, each part has its own headings and all share their columns, so they line up. */
function Grid({ table, parts, className = "" }: { table: Table; parts: Layout[]; className?: string }) {
  const width = Math.max(...parts.map((part) => part.columns.length));
  return (
    <table
      className={`w-full border-collapse text-left text-[15px] leading-snug group-data-[tight]/table:hyphens-auto ${className}`}
    >
      {parts.map((part, index) => {
        // A part with fewer columns than the widest is filled out with empty ones.
        const blanks = Array.from({ length: width - part.columns.length }, (_none, blank) => blank);
        const headings = (
          <tr>
            {part.columns.map((column) => {
              // Over target-language forms the heading may be a form itself: it is not hyphenated either.
              const forms = table.cols[column] === "target";
              return (
                <th
                  key={column}
                  scope="col"
                  lang={forms ? undefined : BASE}
                  // A heading on several lines stands on the rule, as the others do.
                  className={`border-b border-rule px-1 py-1.5 align-bottom font-semibold first:pl-0 last:pr-0 ${
                    forms ? "hyphens-none" : ""
                  } ${index > 0 ? "pt-6" : ""}`}
                >
                  {table.head[column]}
                </th>
              );
            })}
            {blanks.map((blank) => (
              <th key={`blank-${blank}`} className="border-b border-rule" />
            ))}
          </tr>
        );
        return (
          <Fragment key={part.columns.join()}>
            {index === 0 && <thead>{headings}</thead>}
            <tbody>
              {index > 0 && headings}
              {table.rows.map((row, line) => (
                <tr key={line}>
                  {part.columns.map((column) => {
                    const kind = table.cols[column];
                    return (
                      <td
                        key={column}
                        lang={LANG[kind]}
                        className={`border-b border-line px-1 py-2 align-top first:pl-0 last:pr-0 ${CELL[kind]}`}
                      >
                        {row[column]}
                        {part.under === column + 1 && (
                          <span lang={BASE} className="block whitespace-normal text-muted">
                            {row[part.under]}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {blanks.map((blank) => (
                    <td key={`blank-${blank}`} className="border-b border-line" />
                  ))}
                </tr>
              ))}
            </tbody>
          </Fragment>
        );
      })}
    </table>
  );
}
