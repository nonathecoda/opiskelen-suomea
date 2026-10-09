"use client";

import { profile } from "@/content/profile";
import type { VocabItem } from "@/content/types";
import { shown } from "@/lib/cards";
import { formsOf, splitForm } from "@/lib/forms";
import { Sheet } from "./Sheet";
import { Label, ParadigmTable, PrimaryButton, Target } from "./ui";

const TARGET = profile.target.code;

/** The forms of one word: its headword, what kind of word it is, its meaning and its tables. */
export function FormsSheet({ item, hideMeaning = false, onClose }: { item: VocabItem; hideMeaning?: boolean; onClose: () => void }) {
  const view = formsOf(item);
  if (!view) return null;
  return (
    <Sheet
      label="Word forms"
      title={<Target text={shown(item)} fit whole className="text-[30px]" />}
      detail={view.kindLabel}
      onClose={onClose}
    >
      <div className="grid gap-5 pb-4 pt-4">
        {!hideMeaning && (
          <div>
            <p className="text-[18px] leading-snug">{item.base}</p>
            {item.note && <p className="mt-1 text-[15px] text-muted">{item.note}</p>}
          </div>
        )}
        {view.tables.map((table, index) => (
          <div key={index}>
            {table.title && <Label ruled>{table.title}</Label>}
            <ul className="border-t border-rule">
              {table.rows.map((row) => (
                <li key={row.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line py-2">
                  <span className="min-w-[9rem] flex-1">
                    <span className="block text-[15px] font-semibold">{row.label}</span>
                    {row.hint && <span className="block text-[14px] text-muted">{row.hint}</span>}
                  </span>
                  <span className="flex flex-wrap gap-x-3">
                    {row.cells.map((cell) => {
                      const [kept, changed] = splitForm(item.target, cell);
                      return (
                        <span key={cell} lang={TARGET} className="whitespace-nowrap font-display text-[19px]">
                          {kept}
                          {changed && <span className="hl">{changed}</span>}
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {view.verb?.map(({ table, paradigm }) => (
          <ParadigmTable key={paradigm} verb={table} paradigm={paradigm} title={profile.paradigms.find((one) => one.id === paradigm)?.label} />
        ))}
        {view.notes.map((note) => (
          <p key={note} className="text-[15px] text-muted">
            {note}
          </p>
        ))}
        <PrimaryButton onClick={onClose}>Close</PrimaryButton>
      </div>
    </Sheet>
  );
}
