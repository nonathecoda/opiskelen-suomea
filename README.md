# Omasuomi

A phone-first revision app for *Oma suomi 2*, chapters 1–4: every word and phrase of the word lists,
the verbs with their perfect and pluperfect tables, and drills for each grammar rule. It installs on
the home screen and works offline. Built from `BLUEPRINT.md`.

> **Have the content checked.** The book gives no English, so every gloss, and every form the book
> does not print, was written for the app. `REVIEW.md` lists all of it. Have someone who knows
> Finnish well go through it before relying on the app.

## Commands

```bash
npm run dev     # local development
npm test        # unit and content tests
npm run lint
npm run build
```

Lint, tests and build must all pass before anything is merged to `main`; merging to `main` deploys.

## How it is put together

| Where | What |
|---|---|
| `src/content/` | The language layer. `profile.ts` (what the app knows about Finnish; reasons in `LANGUAGE.md`), `chapter1.ts` … `chapter4.ts` (word lists in book order, phrases, grammar topics and drills), `make.ts` (builders that turn the compact entries into ids, forms and verb tables), `content.test.ts`. |
| `src/lib/` | The engine, language-neutral: cards, decks, rounds, answer checking, progress (localStorage), the Blitz, help, word forms, search, navigation and motion. Each has its tests. |
| `src/components/` | The screens: Home (six tabs), Blitz and BlitzSprint, DeckPage, Study and Conjugate, ListView, the sheets, BookPages, the install guide. |
| `src/app/` | The single page, the manifest and two API routes for the book photos. |
| `public/sw.js` | Offline support. |
| `brand/`, `scripts/brand-assets.mjs` | The logo (an O with eyes: also an ö) and the script that draws every icon and launch screen. |
| `book/kappale-N/` | Your original photos, one folder per chapter. Never committed. |
| `.source/` | Working copies: normalised photos (`pages/pNNN.jpg`), transcripts and crops. Never committed. |

Progress lives on the phone only. The only server code serves the book photos, from a private Vercel
Blob store, to a browser that has given the password (`PAGES_PASSWORD`).

## Adding a chapter

1. Put the photos in `book/kappale-5/` (any names; iPhone HEICs or a PDF scan).
2. Convert and number them: HEIC → JPEG with `sips`, a PDF with `pdftoppm -r 200`, then
   `node .source/normalize.mjs` (it ignores the iPhone's orientation tags and turns each photo the
   right way up), and copy each to `.source/pages/pNNN.jpg` by its printed page number.
3. Write `src/content/chapter5.ts` like the others: the *Sanasto* in book order, phrase boxes, and a
   grammar topic with hints and 8–25 drills per rule. Register it in `src/content/index.ts` and add
   its first page to `FIRST_PAGES` in `src/components/BookPages.tsx`.
4. If the chapter teaches something new about the language (a new case to learn per word, a new
   tense), extend `profile.ts` and `LANGUAGE.md`.
5. `npm test`, then add what you derived or were unsure of to `REVIEW.md`.
6. Add the photos (below), commit, push.

## Adding a page photo

1. Put the normalised photo at `.source/pages/pNNN.jpg`.
2. Upload it: `vercel blob put .source/pages/pNNN.jpg --access private --pathname pages/pNNN.jpg`.
3. Add the page number to `PAGES` in `src/lib/bookPages.ts`, commit and push.

## The photo password

Set or change it yourself; changing it locks every browser out until the new one is given.

```bash
vercel env add PAGES_PASSWORD production --sensitive
```

Then redeploy production.
