import { chapter1 } from "./chapter1";
import { chapter2 } from "./chapter2";
import { chapter3 } from "./chapter3";
import { chapter4 } from "./chapter4";
import type { Chapter } from "./types";

/** Every chapter, in book order. */
export const chapters: Chapter[] = [chapter1, chapter2, chapter3, chapter4];
