/** Book pages that have a photo in the private store, ascending. */
const PAGES: number[] = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 63, 65, 66, 67, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 95, 96, 99,
];

export type BookPhoto = {
  /** Name of the photo in the store, and in its address: "p038", "toc1". */
  id: string;
  label: string;
  page?: number;
};

/** Every photo, in the order of the book. */
export const BOOK_PHOTOS: BookPhoto[] = [
  ...PAGES.map((page) => ({ id: `p${String(page).padStart(3, "0")}`, label: `p. ${page}`, page })),
];
