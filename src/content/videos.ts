/** A video that goes with a chapter or a grammar topic. */
export type Video = {
  id: string;
  title: string;
  chapter: number;
  kind: "grammar" | "culture";
  /** Grammar topic ids it explains. */
  topics: string[];
  /** Address of the player, for an iframe. */
  embed: string;
  /** Address of the video's own page. */
  url: string;
  embeddable: boolean;
  minHeight?: number;
  /** What the viewer needs, said in one line (an account, a region). */
  needs?: string;
};

/** None yet: add them here. */
export const videos: Video[] = [];
