import { chapters } from "@/content";
import type { VocabItem } from "@/content/types";
import { shown } from "./cards";

export type Hit = { item: VocabItem; chapter: number };

type Indexed = Hit & { keys: string[]; order: number };

const clean = (text: string) => text.trim().toLowerCase();

const INDEX: Indexed[] = (() => {
  const seen = new Set<string>();
  const index: Indexed[] = [];
  for (const chapter of chapters) {
    for (const group of chapter.vocab) {
      for (const item of group.items) {
        // One word once, however many chapters list it.
        const id = `${clean(item.target)}|${clean(item.base)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const forms = Object.values(item.forms ?? {}).flatMap((value) => value.split(" / ")).filter((value) => value !== "-");
        const keys = [item.target, shown(item), ...forms, item.base, ...item.base.split(/[,;]/)].map(clean).filter(Boolean);
        index.push({ item, chapter: chapter.id, keys, order: index.length });
      }
    }
  }
  return index;
})();

/** Words matching a query in either language: exact first, then beginnings, then anywhere; book order within each. */
export function searchWords(query: string): Hit[] {
  const wanted = clean(query);
  if (!wanted) return [];
  const rank = (keys: string[]) =>
    keys.some((key) => key === wanted) ? 0 : keys.some((key) => key.startsWith(wanted)) ? 1 : keys.some((key) => key.includes(wanted)) ? 2 : 3;
  return INDEX.map((entry) => ({ entry, rank: rank(entry.keys) }))
    .filter(({ rank }) => rank < 3)
    .sort((a, b) => a.rank - b.rank || a.entry.order - b.entry.order)
    .map(({ entry }) => ({ item: entry.item, chapter: entry.chapter }));
}
