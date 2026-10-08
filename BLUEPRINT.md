# Book-to-App Blueprint

A phone-first revision app built from the pages of your own course book: vocabulary,
phrases, verb tables and grammar drills, installable on a phone and usable offline.

This file is a complete build specification. Hand it to a coding agent (for example
Claude Code) in an empty folder. The agent asks four things, then builds, tests and ships
the app. The framework, the learning logic, the screens and the design are all specified
here. Everything about the language itself is worked out from your book while building.

---

## 0. For the person: what you do

You need on your computer: Node.js 22 or newer, git, the GitHub CLI (`gh`, signed in), the
Vercel CLI (`vercel`, signed in), and photos of the book pages you want in the app.

1. Make an empty folder and save this file in it as `BLUEPRINT.md`.
2. Put the page photos in a subfolder called `book/`. Any filenames. Include the table of
   contents if you can: it tells the agent how the book is divided.
3. Start the agent in that folder and say: **"Build the app described in BLUEPRINT.md."**

The agent then asks you four things:

| # | It asks | You answer with |
|---|---------|-----------------|
| 1 | The app's name | One short word, about 12 letters at most (it sits under a home-screen icon) |
| 2 | The GitHub repo | "Create a new private one", or the address of an empty repo |
| 3 | The Vercel account | Which account or team to deploy into |
| 4 | The pages | Confirmation that the photos in `book/` are the pages you want |

Near the end it asks you to run **one command yourself** to choose the password that
protects the book photos. The agent never sees or chooses that password.

What you get: a web app at an address like `https://<name>.vercel.app` that you add to
your phone's home screen. Search engines are told not to list it, and the book photos
need your password. It has a timed flashcard sprint through every word of the book, decks by
chapter, word class, theme, verb type and grammar topic, five kinds of exercise, hints and
explanations beside every question, word forms on tap, search, your book pages behind a
password, progress saved on the phone, and it works without a connection.

Expect the agent to work for a few hours. Most of that is reading the book.

Everything below is written for the agent.

---

## 1. For the agent: your job

Rebuild the app specified here for this person's book.

- **Sections 5 to 11 and the appendices are language-neutral.** Reproduce them as written.
  The code in the appendices is to be used as it stands.
- **Section 4 is the language layer.** You derive all of it from the book's pages while you
  build. Carry over no rule, word list, example or assumption from any other language or
  course. If the book does not teach something, the app does not contain it.

Two placeholders appear throughout: `{{App}}` is the display name the person gives,
`{{slug}}` is that name in lowercase a–z, 0–9 and `-`.

### 1.1 Preflight, then ask four things in one message

Run these first and report anything missing before asking:

```bash
node -v && git --version && gh auth status && vercel whoami
```

Then ask, in one message:

1. **App name.** From it derive the display name `{{App}}`, the slug `{{slug}}`, and the
   letter of the logo (its first letter).
2. **GitHub repo.** Offer "create a new private repo `{{slug}}` under `<gh user>`", or take
   the address of an empty repo.
3. **Vercel scope.** Show what `vercel whoami` and `vercel teams ls` return and ask which
   account or team to deploy into. The project is named `{{slug}}`.
4. **Pages.** Say how many photos you found in `book/` and ask whether these are all the
   pages wanted.

### 1.2 What you do not ask

| Decision | Default |
|----------|---------|
| Base language (interface text, translations) | The language the person writes to you in |
| Target language | Whatever the book teaches; read it off the photos and state it in one line |
| Which chapters | The ones the photos cover |
| Exam or goal date | Unset. The learner picks it on the Blitz tab |
| Password for the book photos | The person sets it themselves (section 11.4). Never choose, type or log it |
| Visual design, logo colours, fonts | As specified in section 7 |
| Repo visibility | Private |
| Videos | None. The module ships empty (section 6.9) |

Stop and ask only when: a whole page cannot be read; the chapter structure cannot be
determined from the photos; a tool is not signed in; or an action outside this document
would delete or publish something.

### 1.3 Ground rules

These were decided by use. They outrank convenience.

1. **Legibility first.** The app is used when tired. No text under 14px. Prefer a clear
   layout to a compact one. Never shrink type to make something fit a design; a long word
   is fitted individually (section 7.4) and never below 16px.
2. **Dark only, high contrast.** One theme. No light mode, no `prefers-color-scheme`.
3. **Target-language forms are never broken, hyphenated or cut off.** A word, a word with
   its marker, a verb form: each stays whole on one line. No ellipsis anywhere: a long
   name takes a second line.
4. **Breadth over repetition.** A session should get through many different words. A miss
   returns once soon and once late, and no session ends on an unresolved miss.
5. **Nothing waits for an animation.** The new state is on screen and takes taps at once;
   motion is laid over it.
6. **The book is the source for words and phrases. You write the explanations and
   drills.** Word lists and phrases follow the book exactly, in its order. Grammar
   explanations, example sentences, hints and drills are written for the app in your own
   words; do not copy the book's exercises or running text.
7. **Do not invent facts about the language.** Anything you are not sure you read or
   formed correctly goes into `REVIEW.md` (section 4.6).
8. **The photos are private.** They are never committed and never part of the deployed
   bundle. They live in a private store behind a password. The app is `noindex`.
9. **No backend except the two photo routes.** Progress and settings live in the phone's
   localStorage. No accounts, no database, no analytics.
10. **Read the installed framework's own docs before writing code**
    (`node_modules/next/dist/docs/`). Framework APIs change between versions; the versions
    in section 3 are the known-good baseline.

### 1.4 Build order

Each phase ends when its exit check passes. Give a one-line status after each.

| Phase | Work | Exit check |
|-------|------|------------|
| 0 | Preflight and the four questions | Answers in hand |
| 1 | Scaffold: project, dependencies, config, styles, shell, navigation | `npm run lint && npm test && npm run build` pass; six empty tabs switch |
| 2 | Prepare the photos; read the table of contents; write the language profile | `LANGUAGE.md` written; chapter outline stated to the person in 15 lines or fewer |
| 3 | Content for the **first** chapter only | Content tests pass |
| 4 | Learning engine with unit tests (section 5) | All suites in section 10.1 pass |
| 5 | Screens (section 6) against the first chapter | Browser walk-through (section 10.2) passes |
| 6 | Content for the remaining chapters | Content tests pass; `REVIEW.md` complete |
| 7 | Platform: offline worker, install guide, splash, logo and icons (section 8) | Offline check passes |
| 8 | Book pages module (section 9) | Photo opens locally after the password |
| 9 | Full verification (section 10) | Everything green |
| 10 | Ship (section 11) | Production URL answers; post-deploy checks pass |
| 11 | Hand-over message (section 12) | Sent |

Do not wait for approval between phases.

---

## 2. The product in one page

A single-page app. Which screen shows lives in the query string, so the phone's back
gesture works and nothing needs the network after the first load.

| Address | Screen |
|---------|--------|
| `/` | Blitz tab (home) |
| `/?t=chapters` `words` `verbs` `grammar` `sources` | The other five tabs |
| `/?b=1` | A blitz sprint |
| `/?d=<deck>` | A deck's own screen |
| `/?d=<deck>&x=<exercise>` | An exercise, or the list, on that deck |

What the learner can do:

- **Blitz**: a timed sprint (2, 5 or 10 minutes) through one card per word, phrase or verb.
  Look, guess, reveal, say whether you knew it. Shows coverage (known / learning / not
  seen) and a daily pace towards an exam date.
- **Decks**: every chapter, every word class, every themed word list, every verb type and
  every grammar topic is a deck. A deck screen offers its exercises to tick, a list to
  browse, and ways to narrow it (chapters, parts of the book, key words only, weak only,
  direction).
- **Exercises**: cards to flip, multiple choice, typing, whole verb tables, and
  recognising a verb form (its meaning, its base form, whose form it is). Where the
  language has them: a marker drill and a key-forms drill.
- **Help beside every question**: hints one at a time, then the full rule, then the page in
  the book. An answer given after reading the rule does not count as known.
- **Lists**: the deck as a two-column word list with either column covered for
  self-testing; tap an underlined word to see its forms.
- **Search** across every word, in either language.
- **Sources**: the book's pages as photos, behind a password, with an index from page
  number to the deck that practises it.
- **Install**: a guide to adding the app to the home screen, worded for the phone's own
  browser.

---

## 3. Stack and repository skeleton

Known-good baseline. Newer versions are fine if every check passes.

| Package | Version |
|---------|---------|
| `next` | 16.3.8 (App Router) |
| `react`, `react-dom` | 19.2.8 |
| `@vercel/blob` | ^2.8.1 |
| `tailwindcss`, `@tailwindcss/postcss` | ^4 |
| `typescript` | ^5 |
| `vitest` | ^5 |
| `eslint`, `eslint-config-next` | ^9, same version as `next` |
| `@types/node`, `@types/react`, `@types/react-dom` | ^22, ^19, ^19 |

`sharp` comes with Next and is used only by the icon script. No other dependencies: no UI
kit, no state library, no animation library, no router beyond the query string.

Scripts: `dev: next dev`, `build: next build`, `start: next start`, `lint: eslint src`,
`test: vitest run`.

```
.gitignore            also ignores /.source/ and .env*
.vercelignore         .source
BLUEPRINT.md          this file
LANGUAGE.md           the language profile in prose (section 4.2)
REVIEW.md             readings and forms for a human to check (section 4.6)
README.md             how it is put together; adding a chapter; adding a page
next.config.ts        Appendix A
vitest.config.mts     Appendix A
brand/                mark.svg, icon.svg, icon-maskable.svg, icon-monochrome.svg
scripts/brand-assets.mjs
public/sw.js
public/icons/         drawn by the script
public/splash/        drawn by the script
.source/pages/        the photos (never committed)
src/app/              layout.tsx, page.tsx, manifest.ts, globals.css, icon.svg, apple-icon.png
src/app/api/pages/[name]/route.ts
src/app/api/pages/unlock/route.ts
src/content/          types.ts, profile.ts, index.ts, chapter0.ts … chapterN.ts, videos.ts, content.test.ts
src/lib/              cards, decks, session, check, progress, store, blitz, forms, help,
                      search, nav, motion, feedback, install, zoom, bookPages, pagesAuth
                      (each with a .test.ts where section 10.1 lists one)
src/components/       App, Home, Blitz, BlitzSprint, DeckPage, Study, Conjugate, ListView,
                      FormsSheet, HelpSheet, Sheet, GrammarBlocks, BookPages, VideoCard,
                      InstallGuide, InstallSteps, Mark, Splash, Cheer, ServiceWorker,
                      ViewportSync, ui
```

`tsconfig.json` maps `@/*` to `./src/*`. `src/app/page.tsx` renders `<App />` and nothing
else. Everything under `src/components` that uses state is a client component.

---

## 4. The language layer (derived from the book)

### 4.1 Prepare and read the photos

1. Move the photos from `book/` to `.source/pages/`. Add `/.source/` to `.gitignore` and
   `.source` to `.vercelignore` before the first commit.
2. Normalise each photo: rotate by its EXIF orientation, strip all metadata (phone photos
   carry a location), convert to JPEG, long edge at most 2400px, quality about 80. Each
   file must end up well under 4.5 MB, the limit for a function's response. If a photo
   shows a two-page spread, split it down the gutter into two files.
3. Read each photo and find its printed page number. Rename to `p<3 digits>.jpg`
   (`p038.jpg`). Table-of-contents photos become `toc1.jpg`, `toc2.jpg`.
4. Read the table of contents. From it and the page headers, list the chapters the photos
   cover: number, the book's own label for it, title, first page.
5. For every page, note what it holds: a word list, phrases, a verb table, a grammar
   explanation, a text, exercises. Only the first four become content.

Read every photo at full resolution. Transcribe diacritics and doubled letters exactly: in
many languages they change the word. Where a letter cannot be made out, do not guess
silently: see section 4.6.

If the book gives no translations into the base language (a monolingual course book),
write the glosses yourself, keep them short, and list every chapter where you did so in
`REVIEW.md`.

### 4.2 The language profile

The framework has a fixed set of **slots** where a language plugs in. Decide each slot from
what the covered pages actually teach, write the decisions and your reasons in
`LANGUAGE.md`, and encode them in `src/content/profile.ts`. An empty slot is a valid
answer: the app then simply has no such exercise.

```ts
// src/content/profile.ts
import type { WordKind } from "./types";

export type KeyForm = {
  id: string;            // "plural", "partitive" …: your own ids
  kinds: WordKind[];     // word classes that have it
  label: string;         // base language, as a heading: "Plural"
  short: string;         // abbreviation for narrow tables
  inList: boolean;       // printed under the word in lists and on blitz cards
  drilled: boolean;      // gets typing cards (the "forms" exercise)
  topic?: string;        // id of the grammar topic that explains it
};

export type Paradigm = {
  id: string;            // "present" …
  label: string;         // base language
  slots: string[];       // the person or slot labels exactly as the book prints them
  order: number[];       // display order in two columns: singular left, plural right
};

export type VerbClass = {
  id: string;
  title: string;         // deck title, base language
  examples: string;      // deck subtitle: three or four verbs of the class, target language
  tag: string | null;    // short label shown beside a verb of this class; null for the plain one
  hints: string[];       // two nudges, mildest first, valid for every verb of the class
  topic?: string;        // id of the grammar topic that teaches the class
};

export type Profile = {
  app: { name: string; slug: string };
  base: { code: string; name: string };      // BCP 47 code and the language's name in the base language
  target: { code: string; name: string };
  tagline: string;                           // "<Target> revision · <what the chapters cover>"
  specialKeys: string[];
  folds: [typed: string, wanted: string][];
  marker?: {
    kinds: WordKind[];
    values: string[];                        // fixed order, 2 to 4 values
    tone: Record<string, 1 | 2 | 3>;         // colour slot per value (--tag-1 … --tag-3)
    shown: "before" | "tag";                 // written before the word everywhere, or kept as a small tag
    label: string;                           // name of the exercise
    hints: string[];
    topic?: string;
  };
  keyForms: KeyForm[];
  paradigms: Paradigm[];
  verbClasses: VerbClass[];
};

export const profile: Profile = { /* … */ };
```

How to decide each slot:

| Slot | What it is | Define it when | Leave empty when |
|------|-----------|----------------|------------------|
| `specialKeys` | Letters of the target alphabet missing from a base-language keyboard. Shown as on-screen keys above the phone keyboard. At most five | The book's words use such letters | None are needed |
| `folds` | Pairs of spellings where the typed one counts as **right but is pointed out**. Capitals are always treated this way and need no entry | The target orthography itself accepts the substitute, or the difference is purely typographic | In doubt. Two letters that make different words are never folded |
| `marker` | A closed class each word of some kind belongs to, which must be memorised with the word and which the book prints with every entry | The book's word lists print it with each word | The language has no such class |
| `keyForms` | Forms of a word, beyond the dictionary form, that a learner must know individually | The book's word lists print the form with entries, or a covered chapter teaches it as something to learn per word | Not taught yet |
| `paradigms` | Full conjugations the covered chapters teach as a table. The first is the primary one | A chapter teaches the table | The book has not conjugated a verb yet (then there is no Verbs tab content) |
| `verbClasses` | The book's own classification of verbs | The book groups verbs by type | The book does not: use one class with `tag: null` |

Further decisions to record in `LANGUAGE.md`:

- **Which forms the word-forms sheet shows per word class** (section 5.8). Only forms the
  covered chapters teach.
- **Whether a form may be generated by rule or must be stored.** Store every form as data
  unless the rule has no exceptions in the whole vocabulary and a test proves it over
  every word. Stem changes, irregulars and exceptions are data, not code.
- **How a changed ending is marked** in a forms table: highlight what the form adds to the
  dictionary form, or from the first letter that differs.
- **Which word classes exist** in this book's lists (the six in `WordKind`), and what the
  "small words" class holds.
- **Whether the book marks key vocabulary** (bold, a star). If not, `core` is never set,
  the "Key words only" chip is hidden, and verbs alone count as key for ordering.
- **Fonts.** The two fonts in section 7.2 cover Latin scripts. For another script choose
  a UI font and a reading font that cover it and keep the two roles.

### 4.3 Content data model

```ts
// src/content/types.ts
export type WordKind = "noun" | "verb" | "adj" | "other" | "phrase" | "number";

/** One word, fixed phrase or short sentence with its meaning. */
export type VocabItem = {
  /** Unique across the app and stable. Lowercase a–z, 0–9 and "-": "c1-<ascii slug>". Progress is saved under it. */
  id: string;
  /** Target language as the learner should produce it: the dictionary form the book lists. A marker is not part of it. */
  target: string;
  /** Meaning in the base language, short. Several senses separated by commas. */
  base: string;
  kind: WordKind;
  /** Only where the profile defines a marker for this kind: this word's value. */
  marker?: string;
  /** Key forms by id: { plural: "…" }. "-" means the word has no such form. */
  forms?: Record<string, string>;
  /** The book marks it as key vocabulary. */
  core?: boolean;
  /** Other target-language answers that are also right when typed. */
  alt?: string[];
  /** A clarification in the base language that is safe beside the question in either direction: it never contains or hints at the target word. */
  cue?: string;
  /** A usage note shown only with the answer. It may quote the target language. */
  note?: string;
};

export type VocabGroup = {
  id: string;                    // "c1-vocab", "c1-numbers"
  title: string;                 // base-language heading
  section: "words" | "phrases";  // word lists and numbers, or conversational phrases
  /** The chapter's main running word list, not a themed one: reached through the chapter, not listed under Themes. */
  general?: boolean;
  pages?: number[];              // where it is printed
  items: VocabItem[];
};

export type VerbTable = {
  id: string;                    // "v-<ascii slug>"
  inf: string;                   // dictionary form
  base: string;                  // meaning
  class: string;                 // a VerbClass id
  /** Per paradigm id: one form per slot. The form only, without the slot's pronoun. */
  forms: Record<string, string[]>;
  note?: string;                 // what is special about it, base language; may quote forms
  hints?: string[];              // replaces the class hints for a verb that follows no pattern
};

/** What a table column holds, which decides where a narrow phone may break its lines. */
export type TableColumn =
  | "target"   // target-language forms: every cell stays whole on one line
  | "text"     // broken between words only: sentences, lists of words, notes that quote the target language
  | "base"     // base language: may also be hyphenated
  | "gloss";   // a translation of the column before it; on a narrow phone it goes under that column

export type GrammarBlock =
  | { type: "text"; text: string }
  | { type: "table"; head: string[]; cols: TableColumn[]; rows: string[][] }
  | { type: "examples"; items: { target: string; base: string }[] };

/** A fill-the-gap exercise. Works as multiple choice and as typing. */
export type Drill = {
  id: string;                    // "<topic id>-01"
  prompt: string;                // a sentence containing exactly one "___"
  answer: string;
  options: string[];             // 3 or 4, containing `answer` exactly once
  hint?: string;                 // shown in parentheses after the prompt, typically the dictionary form
  base?: string;                 // translation of the completed sentence
  alt?: string[];                // other answers right when typed
  chooseOnly?: boolean;          // too long to type: multiple choice only
};

export type GrammarTopic = {
  id: string;                    // "c1-<ascii slug>"
  title: string;                 // base language
  hints?: string[];              // one to three nudges, mildest first
  blocks: GrammarBlock[];
  pages?: number[];
  drills: Drill[];
};

export type Chapter = {
  id: number;                    // 0, 1, 2 … in book order; 0 for an unnumbered introduction
  label: string;                 // what the book calls it, as printed: its word for "chapter" and the number
  title: string;                 // the chapter's own title as printed
  topics: string;                // base-language one-liner of its themes
  structures: string;            // base-language one-liner of its grammar
  vocab: VocabGroup[];
  verbs: VerbTable[];
  grammar: GrammarTopic[];
};
```

`src/content/index.ts` exports `chapters: Chapter[]` in book order.

### 4.4 Authoring rules

**Ids.** Stable for ever: progress is saved under them. Build the slug by stripping
diacritics and replacing anything else with `-`. A word listed in two chapters gets one id
per chapter; the Blitz merges them (section 5.6).

**Word lists.** Every entry of every photographed list, in the book's order, one
`VocabGroup` per list as the book groups them. `target` is the dictionary form. Optional
parts the book prints in parentheses are left out of `target`; the long variant goes to
`alt`. A clarification the book prints with the gloss goes to `cue` if it gives nothing
away, otherwise to `note`.

**Phrases.** Kind `phrase`, in groups with `section: "phrases"`, titled by the situation
(base language).

**Numbers.** Kind `number`, in their own groups.

**Verbs.** Every verb in the word lists whose conjugation the covered chapters teach gets a
`VerbTable`, in the chapter that introduces it. Every slot of every paradigm it lists is
filled. A test checks that each `kind: "verb"` word has a table.

**Grammar topics.** One per rule the book teaches on the covered pages. `blocks` explain
the rule briefly in the base language: two or three short paragraphs, the table that
carries the rule, four to six example sentences with translations. Use only vocabulary
from this chapter and earlier ones.

**Hints.** One to three per topic, from a gentle reminder of what to look at to the rule in
a nutshell. Each must help with every drill of the topic and none may state a particular
answer.

**Drills.** Eight to twenty-five per topic: enough that every case of the rule (each
person, each class, each exception taught) is asked at least twice. Each has exactly one
gap. Every option other than the answer must be **wrong in that sentence**, not merely
less likely. Give the translation in `base`. Vary the sentences; reuse the chapter's
themes and words.

**Scale, for orientation.** A first-year course book of six chapters gave roughly 950 word
and phrase entries, 95 verb tables, 21 grammar topics and 300 drills, from which the
engine derived about 3,600 cards and 890 blitz cards.

### 4.5 Content tests (`src/content/content.test.ts`)

Each test collects offending ids and expects the list to be empty.

- Chapters are in order and ids are consecutive.
- Every id is unique: cards, groups, topics. Ids match `^[a-z0-9-]+$`.
- No `target` or `base` is empty.
- With a marker in the profile: every word of a marked kind has a valid value (or a `note`
  saying why not), no other word has one, and no `target` begins with a marker value.
- Every key-form id used exists in the profile for that word's kind.
- Every verb's `class` exists; every paradigm it lists has exactly as many forms as slots,
  none empty; every verb has the primary paradigm.
- Every `kind: "verb"` word has a verb table (once a paradigm exists).
- Every `topic` id the profile refers to exists.
- Tables: `cols`, `head` and every row have the same length; `cols[0]` is not `"gloss"`.
- Drills: exactly one gap; 3 or 4 options; no duplicates; the answer among them exactly once.
- No `cue` shares a stem with its own answer (first five letters of any answer word of
  four letters or more).
- Every page number in `pages` has a photo in `BOOK_PHOTOS`.

### 4.6 `REVIEW.md`

A plain list for a person who knows the language, grouped by chapter: readings you were
unsure of (with the page), glosses you wrote yourself, forms you derived rather than read,
drills whose distractors rest on a judgement. Say at the top how many entries there are.
The README tells the owner to have the content reviewed before relying on it.

### 4.7 Illustration: how the slots might fill for Finnish

Not a specification. The book decides; this only shows the kind of answer each slot takes.

- `marker`: none. Finnish has no articles and no grammatical gender, so there is no marker
  drill and nothing is colour-coded by class.
- `keyForms`: possibly one or two case forms per noun, if the word lists print them.
- `paradigms`: the present tense in six persons; a negative present as a second paradigm
  once the book teaches it.
- `verbClasses`: the numbered verb types, if and as the book numbers them.
- `specialKeys`: the vowels with dots. `folds`: empty, because a dotted and an undotted
  vowel make different words, as do single and doubled letters.
- Forms sheet: only the cases taught so far. Stems change between forms, so every form is
  stored, never generated.

---

## 5. The learning engine

All of this is language-neutral. It reads the content and the profile and nothing else.

### 5.1 Cards (`src/lib/cards.ts`)

One card is one thing the learner can be asked. Every exercise works on cards.

```ts
export type Section =
  | "words" | "phrases" | "verbs" | "grammar"          // the book's own parts
  | "marker" | "forms" | "verb-meaning"                // derived from the same data
  | "recognise-meaning" | "recognise-base" | "recognise-slot";

export const GAP = "___";

export type Card = {
  id: string;
  chapter: number;
  section: Section;
  kind: "vocab" | "verb" | "drill" | "marker" | "form" | "recognise";
  source: string;          // id of the word, verb or grammar topic it comes from; decks are sets of these
  prompt: string;          // a base-language meaning, a sentence with a gap, or (promptTarget) a form to recognise
  ask?: string;            // the question put to the learner when it is not simply "say it in the target language"
  promptTarget?: boolean;  // the prompt is target language although it has no gap
  answerBase?: boolean;    // the answer is base language (a meaning)
  fixedOrder?: boolean;    // show the choices in the order given, not shuffled
  hint?: string;           // shown in parentheses with a gap prompt
  cue?: string;            // shown small with the question
  note?: string;           // shown small with the answer
  answer: string;
  accept: string[];        // everything that counts as right when typed
  options?: string[];      // fixed choices, when the card brings its own
  writable: boolean;       // short enough to type
  reversible: boolean;     // can also be asked target → base
  core: boolean;
  pool: string;            // cards sharing a pool make plausible wrong choices for each other
  word?: WordKind;
  verbClass?: string;
  marker?: string;
  bare?: string;           // the word without its marker
};
```

`shown(item)` is the word as displayed: with `marker.shown === "before"` it is
`"<marker> <target>"`, otherwise `target`.

Cards are built once at module load, in this order, for each chapter:

| From | Card id | Section | Details |
|------|---------|---------|---------|
| Each vocab item | `item.id` | the group's section | kind `vocab`; prompt `base`; answer `shown(item)`; accept the answer plus each `alt` (given the marker if it lacks one); `writable` when `target` has 5 words or fewer; reversible; pool = the word kind; `cue`, `note` from the item; `bare` = `target` when it has a marker |
| Item with a marker | `<id>-mk` | `marker` | prompt `"___ <target>"`; options = all marker values; fixed order; not writable; cue and note = `base`; pool `marker` |
| Each drilled key form the item has (not `"-"`) | `<id>-f-<form>` | `forms` | prompt `"<shown> → ___"`; `ask` = the form's label; answer the form; writable; pool `form:<form>` |
| Each verb | `<verb>-m` | `verb-meaning` | kind `vocab`; prompt `base`; answer `inf`; writable; reversible; core; pool `verb` |
| Each verb, paradigm, slot | `<verb>-<paradigm>-<n>` | `verbs` | kind `verb`; prompt `"<slot label> ___"`; hint `inf`; cue `base`; options = the distinct forms of that paradigm; writable; core; pool = the verb id |
| Each **distinct** form of a paradigm | `<verb>-rm-<paradigm>-<n>` | `recognise-meaning` | prompt the form; `promptTarget`; ask "What does it mean?"; answer `base`; `answerBase`; not writable; pool `verb-meaning` |
| | `<verb>-ri-<paradigm>-<n>` | `recognise-base` | ask "What is the base form?"; answer `inf`; writable; pool `verb-base` |
| | `<verb>-rs-<paradigm>-<n>` | `recognise-slot` | ask "Whose form is it?"; answer the labels of every slot that has this form, joined by ", "; options = that string for each distinct form; fixed order; hint `inf`; cue `base` |
| Each drill | `drill.id` | `grammar` | kind `drill`; source = the topic id; options from the drill; writable unless `chooseOnly`; cue and note = `drill.base`; pool = the topic id |

`<n>` for recognise cards is the first slot that has the form. Marker and form cards are
`core` when their word is; verb, recognise and drill cards always are.

Two passes over the finished list:

- **Lookalikes.** Vocab cards that show exactly the same question (`prompt` and `cue`) get
  each other's answers added to `accept`: when nothing on screen tells two words apart,
  typing either is right.
- **Meanings.** Every `recognise-meaning` card gets as `options` the distinct meanings of
  all verbs.

### 5.2 Progress (`src/lib/progress.ts`, `src/lib/store.ts`)

```ts
export type Mark = { box: number; seen: number; missed: number; at?: number };
export type Progress = Record<string, Mark>;   // by card id
const MAX_BOX = 4;
const KNOWN_FROM_BOX = 2;

/** `alreadyKnown`: a card known the very first time it is met counts as known at once. */
export function marked(mark: Mark | undefined, correct: boolean, now: number, alreadyKnown = false): Mark {
  const before = mark ?? { box: 0, seen: 0, missed: 0 };
  const box = Math.max(before.box + 1, alreadyKnown && !mark ? KNOWN_FROM_BOX : 0);
  return { box: correct ? Math.min(box, MAX_BOX) : 0, seen: before.seen + 1, missed: before.missed + (correct ? 0 : 1), at: now };
}
export const isKnown = (mark?: Mark) => mark !== undefined && mark.box >= KNOWN_FROM_BOX;
/** Missed at some point and not yet known twice running. */
export const isWeak = (mark?: Mark) => mark !== undefined && mark.missed > 0 && mark.box < KNOWN_FROM_BOX;
```

`record(id, correct)` saves `marked(...)` for one card. `setMarks(marks)` saves several at
once and deletes any card mapped to `undefined` (used to take an answer back).

```ts
export type Direction = "b2t" | "t2b";   // base → target, target → base
export type Settings = {
  chapters: number[];                    // chapters included in decks that span chapters
  sections: Section[];                   // parts of the book included in chapter decks
  direction: Direction;
  coreOnly: boolean;
  weakOnly: boolean;
  picked: Record<string, string[]>;      // exercises ticked, remembered per kind of deck
};
// defaults: all chapters; ["words","phrases","verbs","grammar"]; "b2t"; false; false; {}
```

Stores, each a `createStore` (Appendix A) under its own localStorage key:
`{{slug}}.progress`, `{{slug}}.settings`, `{{slug}}.blitz`, `{{slug}}.install`.

### 5.3 Decks and exercises (`src/lib/decks.ts`)

```ts
export type Deck = {
  id: string;
  title: string;
  subtitle?: string;
  targetTitle?: boolean;                        // the title is target language (a chapter's name)
  kind: "mixed" | "words" | "verbs" | "grammar";
  filter: "chapters" | "sections" | "none";     // how the learner can narrow it on its screen
  sources: ReadonlySet<string>;                 // ids of the words, verbs and topics in it
};

export type Exercise =
  | "list" | "flash" | "choose" | "write" | "conjugate"
  | "marker" | "forms"                          // only where the profile has them
  | "meaning" | "base" | "slot"                 // recognising a verb form
  | "mix"                                       // the exercises ticked on the deck screen, in one session
  | "weak";                                     // the list, narrowed to what was got wrong
```

The decks, in the order they are registered:

| Deck | id | kind | filter | Holds |
|------|----|------|--------|-------|
| All chapters | `all` | mixed | sections | everything; subtitle = the first and last chapter labels |
| One per chapter | `c<id>` | mixed | sections | that chapter; title = the chapter's title, subtitle = its `topics` |
| All words | `words` | words | chapters | every vocab item |
| One per word class with entries | `nouns`, `adjectives`, `small-words`, `numbers`, `phrases` | words | chapters | items of that kind. Titled Nouns, Adjectives, Small words, Numbers, Phrases and expressions, each with a one-line subtitle you write |
| One per themed group (not `general`) | `g-<group id>` | words | none | that group; subtitle = the chapter's label |
| All verbs | `verbs` | verbs | chapters | every verb table |
| One per verb class | `verbs-<class>` | verbs | chapters | verbs of that class |
| All grammar | `grammar` | grammar | chapters | every topic |
| One per topic | `t-<topic id>` | grammar | none | that topic; its rule is shown on the deck screen |

Which sections an exercise draws from:

| Exercise | Sections | Asked as |
|----------|----------|----------|
| `marker` | `marker` | choose |
| `forms` | `forms` | write |
| `meaning` | `recognise-meaning` | choose |
| `base` | `recognise-base` | write |
| `slot` | `recognise-slot` | choose |
| `flash`, `choose`, `write` in a words deck | `words`, `phrases` | themselves |
| … in a grammar deck | `grammar` | |
| … in a verbs deck | `verb-meaning` for `flash`, `verbs` otherwise | |
| … in a mixed deck | `words`, `phrases`, `verbs`, `grammar` | |

`cardsFor(deck, exercise, settings, progress)` is every card whose source is in the deck,
whose section the exercise draws from, that passes the deck's filter (`chapters`: the
card's chapter is ticked; `sections`: its section is ticked), and then: key cards only if
`coreOnly`, weak cards only if `weakOnly`, writable cards only if asked by typing.

Exercises a deck offers, in groups, in this order:

- Verbs deck: **Conjugate** (`conjugate`, `choose`, `write`), **Recognise the form**
  (`meaning`, `base`, `slot`), **Vocabulary** (`flash`).
- Any other deck: **Practise** (`flash`, `choose`, `write`, then `marker` and `forms` in a
  words deck that has such cards).

Ticked by default: `conjugate` in verbs decks, `choose` everywhere else. The ticks are
remembered per deck **kind**. Toggling a tick on one deck leaves alone the ticks that deck
does not offer: they belong to another deck of the same kind.

`candidatesFor(deck, exercises, settings, progress)` is everything a session over the
ticked exercises could ask. A card wanted by several exercises appears once, with every
way it may be asked. `conjugate` adds one candidate per verb and paradigm (mode `table`);
with `weakOnly`, only verbs with a weak slot.

Also needed: `statsOf(deck, progress)` (known and total over the sections `choose` would
draw from), `countFor` (what one exercise would ask), `contentOf` (the deck as chapters of
groups, verbs and topics, for the list), `weakSources(progress)`, `topicOf(deck)`, and
`emptiedBy(...)`, which names the narrowing that left a deck with nothing to ask when it is
one the learner can lift on the spot: `"chapters"` (none ticked) or `"weak"` ("weak only"
is on and nothing is weak).

### 5.4 Rounds and questions (`src/lib/session.ts`)

```ts
export type Mode = "flash" | "choose" | "write";
export type Candidate = { card: Card; modes: (Mode | "table")[]; verb?: VerbTable; paradigm?: string };
export const ROUND_SIZE = 15;
const CHOICES = 4;
export type Question = {
  key: string;              // unique per asking: `${card.id}#${counter}`
  mode: Mode | "table";
  candidate: Candidate; card: Card; verb?: VerbTable; paradigm?: string;
  reversed: boolean;        // asked target → base
  prompt: string; solution: string; choices: string[];
};
```

**Picking a round.** A candidate's familiarity is the mean `box` of its cards (0.5 for a
card never seen; a table uses its slot cards). Rank each by familiarity plus
`Math.random() * 0.9`, take the 15 lowest, shuffle them. Missed and new things come first,
well-known ones last, never in a fixed order.

**Asking.** Choose one of the candidate's modes at random. The question is reversed when
the card is reversible, the direction is `t2b`, and the mode is `flash` or `choose`.
Typing is always into the target language.

**Wrong choices.** A card with its own `options` uses three of them at random (all of them
in the given order when `fixedOrder`). A vocab card takes three other vocab cards from the
same pool, same chapter first, skipping any that would also be right: one whose answer is
among this card's accepted answers, or whose gloss shares a sense with this card's gloss
(split glosses on `,` and `;`), or whose text equals one already picked. Compare with
letters and digits only, lowercase (`\p{L}` and `\p{N}`).

**The round on screen** (`Study.tsx`):

- A missed question goes to the back of the queue, asked afresh, until it is answered
  right. Only the **first** try of each candidate is saved to progress.
- A right answer moves on by itself after 1000 ms (2400 ms when a spelling note is shown).
  A wrong one waits for "Continue" so the correction can be read.
- While the help sheet is open nothing moves on; the wait starts over when it closes.
- An answer given after the full explanation was opened is **aided**: it is saved as not
  known, the verdict says so, and it is listed with the misses. Hints alone do not count
  against it. Reading the explanation after the verdict changes nothing.
- A tap within 300 ms of a screen change is ignored (it was aimed at the button that was
  there before).
- The round ends in a summary: right on the first try out of the total, the misses to go
  over, and "Retry mistakes" (a round of exactly those) or "New round".

### 5.5 Checking a typed answer (`src/lib/check.ts`)

```ts
export type Verdict =
  | { kind: "correct"; exact: boolean }   // exact is false when only capitals or a fold differ
  | { kind: "needs-marker" }              // the word is right but its marker is missing
  | { kind: "wrong" };
```

- `tidy(text)`: Unicode NFC; remove apostrophes and hyphens (`' ’ ‘ \` -`); replace
  punctuation (`. , ! ? ; : … " „ “ ” ‚ ( ) / – —`) with a space; collapse spaces; trim.
- `loose(text)`: `tidy`, lowercase, then apply each of the profile's `folds`.
- Correct when `loose(input)` equals `loose` of any accepted answer; `exact` when `tidy`
  matches too. A right but inexact answer shows "Mind the spelling" with the exact form.
- `needs-marker` only with `marker.shown === "before"` and when the input equals the bare
  word. It is not a verdict: the screen asks for the marker, and the marker values replace
  the special keys as buttons. Tapping one checks marker plus word together.
- Empty input is wrong. Everything not folded must match letter for letter.

### 5.6 Blitz (`src/lib/blitz.ts`)

The quick way through everything: one card per target-language word, phrase or verb.

```ts
export type BlitzKind = "words" | "phrases" | "verbs";
export type Meaning = { base: string; note?: string; cue?: string };
export type BlitzItem = {
  key: string;          // the target text itself: one card however many chapters list it
  target: string;       // as shown, with its marker
  kind: BlitzKind;
  chapters: number[];   // chapters that list it, earliest first
  core: boolean;        // key vocabulary, or a verb: worth meeting first
  meanings: Meaning[];  // every distinct meaning the book gives it
  forms: { label: string; value: string }[];   // key forms with `inList`
  verb?: VerbTable;
  also: string[];       // other target text that answers the same question
  ids: string[];        // the cards whose progress this one shares
};
export type Scope = { kinds: readonly BlitzKind[]; chapters: readonly number[] };
```

**Building the items.**

1. Key every vocab item by `shown(item)` with closing `. ! ? …` removed, so the same
   phrase with different end punctuation is one card. Collect the items and the chapters.
2. Key every verb table by its `inf` into the same map: a verb in a word list and its
   table are one thing to know.
3. Kind: `verbs` if it has a table, else `phrases` if its first item is a phrase, else
   `words`. `core` if it is a verb or any of its items is.
4. Meanings: for a verb, the table's gloss with the items' cues joined by " · ". Otherwise
   keep each gloss that adds a sense: go through the items fullest gloss first (senses
   split on `,` and `;`, compared letters-only) and drop one whose senses have all been
   said; then restore book order.
5. `ids`: the items' ids plus `<verb>-m`.
6. `also`: everything typing would accept for those cards, minus anything that is only the
   answer spelt another way. Then, so that a card asked in the base language owns up to
   every other card that answers the same question: add the `target` of every item with
   exactly the same meanings and cues, and of every item sharing a gloss that has no cue.

`itemsIn(scope)` filters by kind and by any shared chapter.

**Everything else is in Appendix A as code** and must be used as it stands: an item's
shared progress (`markOf`, `marksAfter`), statuses and counts, the line-up, the sprint
(`startSprint`, `answer`), and the daily pace (`daysUntil`, `paceFor`, `goalFor`). In words:

- **Shared progress.** An item is as weak as its weakest answered card and as recent as
  its latest answer. Answering it moves all its cards together. Known the first time it is
  ever met, it is known at once. Known again before its rest is over, a known card stays
  where it was.
- **Rest.** A known card is left alone by box: 0, 20, 72, 144, 336 hours.
- **Line-up.** Three sources dealt in proportion to their weights: earlier misses (weight
  3, or 6 once 60 have piled up; oldest first), new cards (weight 6; key words and verbs
  of every chapter first, then the rest chapter by chapter, shuffled within), cards due
  for review (weight 2, or 6 once 30 are due; weakest first). Cards still resting come
  last of all.
- **Sprint.** A miss comes back once after 5 other cards (`COMEBACK`), known or not. After
  that it waits for the closing round. The closing round begins when nothing new is left,
  or, in a timed sprint, when the time left is what the waiting cards will take at the
  pace so far. It runs past the time until every miss has been known, the card shown
  longest ago first; only the last card left follows itself. Only a card's first showing
  is saved.
- **Pace.** New cards to meet today so that every chosen card has been met by the eve of
  the exam: `ceil((unseen + metToday) / max(1, daysLeft - 1))`.

```ts
export type BlitzSettings = {
  minutes: number;        // 2, 5 or 10; default 5
  direction: Direction;   // default "t2b"
  reveal: number;         // seconds until the answer shows by itself: 3, 5, or 0 for "on tap"; default 3
  kinds: BlitzKind[];     // default all three
  chapters: number[];     // default all
  exam: string;           // "YYYY-MM-DD"; default "" (unset)
  day: string; fresh: number;   // new cards met on `day`, for the pace
};
```

While `exam` is empty there is no pace: the Blitz tab asks for a date instead.

### 5.7 Help (`src/lib/help.ts`)

```ts
export type Help = { title: string; hints: string[]; topic?: GrammarTopic; verb?: VerbTable; paradigm?: string; pages: number[] };
```

`helpFor(card)`:

| Card | Title | Hints | Explanation |
|------|-------|-------|-------------|
| drill | the topic's title | the topic's hints | the topic |
| form | the key form's label | its topic's hints | its topic |
| marker | the marker's label | the marker's hints | its topic, if any |
| verb slot, verb meaning | `"<inf> · <base>"` | the verb's own `hints`, else its class's | the verb's table, its note, and the class's topic |
| recognise-meaning, recognise-base | the form shown (the usual title would be the answer) | as above | as above |
| plain vocab | no help button | | |

`pageLabel(pages)` in the base language: one page, a run ("19–20"), or a list ("67 and 69").

### 5.8 Word forms (`src/lib/forms.ts`)

`formsOf(item)` returns what the forms sheet shows for a word of a list, or `undefined`
for a word with nothing to show (then the word is not tappable):

```ts
export type FormsView = {
  kindLabel: string;                                  // one quiet line under the headword: what kind of word it is
  tables: {
    title?: string;
    head?: string[];
    rows: { label: string; hint?: string; cells: string[]; tone?: 1 | 2 | 3 }[];
  }[];
  verb?: { table: VerbTable; paradigm: string }[];    // shown as paradigm tables
  notes: string[];                                    // short base-language remarks under the tables
};
```

What each word class shows is a language decision (section 4.2). Verbs show their
paradigms. A row's `hint` is a short base-language reminder of what the form is for. In a
cell, what the form adds to the dictionary form is highlighted. Tests cover every word
class and every exception stored as data.

### 5.9 Search (`src/lib/search.ts`)

A word is found by: its target text, the text with its marker, each listed key form, its
gloss, and each sense of its gloss (split on `,` and `;`). Compare trimmed and lowercase.
Rank 0 when one of these equals the query, 1 when one starts with it, 2 when one contains
it. `searchWords` returns best rank first and book order within a rank, each word once
however many chapters list it (same target and gloss). An empty query finds nothing.

---

## 6. Screens

Every screen is an `.app-shell`: a fixed column as tall as the visible viewport, at most
34rem wide, centred. Its `<main>` scrolls (`.scroll-y`); its header and footer do not.
Side gutters are 20px. Components named here without a description are in Appendix A.
All interface text is in the base language and is given below in English: translate it if
the base language is another.

`App.tsx` draws the current screen alone inside `<div id="stage">` (so a change of screen
can move, Appendix A `motion.ts`), plus the confetti overlay. An unknown deck id shows the
Chapters tab. An exercise gets `key="<deck>:<exercise>"` so each opens a fresh round.

### 6.1 Home: the six tabs (`Home.tsx`)

One scrolling page and a tab bar. The tab bar: six buttons, each 56px tall, icon over
label (14px semibold); the current tab's icon sits on a yellow pill that glides from the
tab left behind. Tabs: **Blitz**, **Chapters**, **Words**, **Verbs**, **Grammar**,
**Sources**, with the icons a bolt, a book, three lines of text, a table grid, a
written page and a framed play triangle. Switching tabs replaces the history entry (a tab
is not a step back). Each
tab remembers how far it was scrolled; a tab opened for the first time starts at the top.
Tab titles are serif 32px semibold.

A **deck row** (used on four tabs): min 56px tall, a hairline under it; optional mark
(chapter number, or a "mixed" icon for the deck that mixes everything); title (16px
medium, or serif 20px for a target-language title) and subtitle (15px muted), each
allowed a second line; at the right `known/total` (14px muted) over a thin meter, and a
chevron.

- **Chapters.** Title `{{App}}`, subtitle the profile's tagline. One highlighted yellow
  card: "Revise everything" (serif 26px), "Words, phrases, verbs and grammar mixed", a
  meter and `known/total`; opens deck `all`. Heading "Chapter by chapter", then a row per
  chapter, marked with its number.
- **Words.** A search field (pill, 48px, placeholder "Search in <target> or <base>").
  With a query: the hits as list rows (section 6.5), at most 60, with "Showing the first
  60 matches. Narrow the search." beyond that, "No matches." for none, and "Tap an
  underlined word to see its forms." when any hit has forms. Without: the "All words"
  row, heading "Word classes" and its rows, heading "Themes" and a row per themed group.
- **Verbs.** Subtitle "Meaning and conjugation in every person." The "All verbs" row,
  heading "Verb types", a row per class.
- **Grammar.** The "All grammar" row, then per chapter a chapter head and its topic rows
  (no subtitle: the heading says it).
- **Sources.** Subtitle "The pages of the book the content comes from. Tap a page number
  to go straight to practising." The "Book pages" row (section 9). Then per chapter: a
  chapter head, any videos, and an index in page order: page label (15px semibold,
  tabular), the list's or topic's title, a chevron. A row opens the deck that practises
  it (the chapter deck for a `general` list).

### 6.2 Blitz tab (`Blitz.tsx`)

Top to bottom:

1. Title "Blitz" and "Look, guess, check. A miss comes back a moment later and again at
   the end of the blitz, until you know it."
2. **Coverage** of the chosen cards: one bar (known in solid yellow, laid over learning in
   a hatched yellow, on the track) and three rows with a swatch, a label and a count:
   "Known", "Learning", "Not seen".
3. **Plan** (space reserved from first paint so nothing jumps): "N days to the exam" /
   "The exam is tomorrow" / "The exam is today" / "The exam date has passed", and at the
   right the date as underlined text with the phone's own date picker lying invisible on
   top of it. Unset: "Pick your exam date to get a daily pace" with the same picker.
   Under it the day's goal: "Today 12/40 new cards" with a meter; "Today's goal reached ·
   N new cards today" with a full meter; "Every card has been seen. The rest is review.";
   "Change the exam date to see today's goal."
4. "Length": segmented 2 min / 5 min / 10 min.
5. "Direction": segmented "<target> → <base>" / "<base> → <target>".
6. "Answer shows": segmented "3 s" / "5 s" / "on tap".
7. "Content": chips Words, Phrases, Verbs.
8. "Chapters" with a "Clear" / "Select all" link, and a chip per chapter.
9. The install row (section 8.3).

Pinned above the tab bar, where the thumb is: the **start button**, 64px tall, yellow,
"Start blitz" (serif 24px) over "5 min · <direction>", with a round bolt badge at the
right. With nothing chosen it is disabled and says what is missing: "Pick a chapter" or
"Pick content".

### 6.3 A blitz sprint (`BlitzSprint.tsx`)

The settings are read once when the sprint begins.

- **Top bar** (quiet): close; a bar that empties as time runs out, in the secondary colour
  with linear easing; the time left as `m:ss` (`role="timer"`); an undo button, drawn
  faint while there is nothing to take back.
- **The clock** ticks every 250 ms and counts only visible time: nothing while the page is
  hidden, and at most four ticks' worth after a gap.
- **The card.** The asked side alone at the top: the target text at hero size (section
  7.3), or the base-language meanings as a list (26px, or 22px when one is over 30
  characters) each with its `cue`. Tapping anywhere on the card reveals.
- **Reveal.** By itself after `reveal × 1000 + min(letters, 50) × 40` ms, while the "Show
  answer" button fills up; or on tap; never automatically when set to "on tap". Under a
  hairline: the other side, the key forms with `inList`, "Also: …" for `also`, notes not
  already shown, and for a verb its primary paradigm table and note.
- **Footer.** A line saying why the card is here: "New", "Missed last time", "Again",
  "Final round · 3 left" / "· last one", "Review"; plus " · verb". When the time is up and
  nothing is waiting: "Time is up: this is the last card." Then "Show answer", or after
  the reveal two buttons: "Didn't know" (quiet) and "Knew it" (yellow).
- **Guards.** A reveal within 300 ms of the card appearing, and a grade within 300 ms of
  the reveal, are ignored.
- **Keys.** Space or Enter reveals; → knew; ← did not.
- **Grading.** On a card's first showing its marks are saved at once (`marksAfter`), so
  leaving early loses nothing; a new card counts towards the day's pace. Undo restores the
  sprint, the marks and the day's count exactly. The next card comes in from the right; a
  card taken back comes from the left.
- **Feedback.** A light tick for "knew it"; confetti when the sprint ends.
- **Nothing to show**: "No cards" / "Pick content and at least one chapter on the Blitz
  tab." / "Back".
- **Summary.** A large count "37 cards" with the mascot beside it (eyes shut when the
  day's goal is met); "52 answers in 5:00"; rows "New cards", "Knew at once", "Left to
  learn"; the day's goal; "Whole selection" with the coverage; "These come back in the
  next blitz" listing the misses. Buttons: "Done" and "One more"; once the day's goal is
  met "Done" becomes the yellow one and the other reads "One more blitz".

### 6.4 Deck screen (`DeckPage.tsx`)

Top to bottom: back arrow; the title (serif 32px) and subtitle; a meter with "known
12/40"; for a single-topic deck the rule itself (`GrammarBlocks`), "In the book: p. 51"
and any videos; for a `chapters` filter the chapter chips with "Clear" / "Select all";
for a `sections` filter the chips Words, Phrases, Verbs, Grammar; then each exercise
group as a ruled list of **tick rows**; then "Browse" with a row into the list (not for a
single-topic deck); then "Narrow": chips "Key words only" (word and mixed decks, if the
book marks any) and "Weak only", a link "Show weak ones as a list (7)", and the direction
as a segmented control (not for grammar decks).

A tick row: a checkbox square, the exercise's name and a hint, and how many items it would
ask. An exercise with nothing in it cannot be ticked: dashed box, secondary colour.

| Exercise | Name | Hint (verbs decks in brackets) |
|----------|------|------|
| `conjugate` | Conjugate | the whole table at once |
| `flash` | Cards | flip and check [base form and meaning] |
| `choose` | Choose | the right option [the right form] |
| `write` | Write | in <target> [one form at a time] |
| `marker` | the marker's label | pick the right one |
| `forms` | Forms | write the form asked for |
| `meaning` | Meaning | what the form means |
| `base` | Base form | write the base form |
| `slot` | Person | whose form it is |
| `list` | List | browse and cover a column |

Pinned footer: one yellow button. "Pick an exercise" with nothing ticked; "Nothing to
practise" with nothing to ask; otherwise "Start · 15 items" (the round size, or fewer).
When a narrowing emptied the deck, a line above it says so with the way out beside it:
"Nothing to practise: 'Weak only' is on." + "Show all", or "Pick at least one chapter."

### 6.5 Exercises (`Study.tsx`, `Conjugate.tsx`)

Common frame: a quiet top bar with close, a progress bar, `cleared/total`, and the round
"?" help button when the card has help. Then the **prompt**: a small label saying what to
do ("In <target>", "In <base>", "Fill in", or the card's own `ask`), then the question:
target-language text at hero size, or a base-language meaning at 26px, or a sentence with
its gap. Under it, small, the hint in parentheses and the cue. Each new question comes in
from the right.

- **Cards (`flash`).** One large card (at least 58% of the viewport tall, bordered,
  rounded 24px). Tap it or "Show answer" to reveal the answer at the foot of the card with
  its note. Then "Didn't know" and "Knew it".
- **Choose.** The choices as full-width buttons, at least 64px tall. Once one is picked
  all are disabled: the right one becomes a green band with a tick and hops, a wrong pick
  becomes a red band with a cross and shakes, the others lose their box and step back. A
  verdict banner rises from below: "Correct!", "Correct, with the explanation", or "Wrong"
  with "Right answer" and the answer highlighted, then "Continue".
- **Write.** One field (64px tall, serif 26px, no autocapitalise, no autocorrect, no
  spellcheck, `lang` = the target code) that **stays mounted across questions** so the
  phone keyboard never closes. Under it the special keys, which insert at the caret and do
  not take the focus (`onPointerDown` prevented). Footer: "Don't know" and "Check". A
  right answer turns the field green; an inexact one adds "Mind the spelling" and the
  exact form. A wrong one turns it red and shows "You wrote:" over "Right answer" in the
  same size, so the difference shows itself. Enter checks, then continues.
- **Conjugate.** The verb (34px), its class tag and meaning; the special keys **above**
  the table so they stay in view over the keyboard; one row per slot: label, field (44px),
  and after checking the right form beside any field that was not exactly right. Enter
  moves to the next field and checks from the last. Each slot is saved under its own
  slot-card id, so every exercise shares one progress. Verdict: "All correct!" or "4/6
  correct". Footer: "Don't know" and "Check", then "Continue".
- **Empty.** "Nothing to practise" / "This selection has nothing for this exercise." /
  "Back".
- **Summary.** "Round done"; `13/15` at 56px with the mascot (eyes shut for a clean
  round); "correct on the first try" or "All correct on the first try."; "Worth going
  over" listing each miss; "Done" and either "Retry mistakes (2)" or "New round".

### 6.6 List (`ListView.tsx`)

Top bar with close and a search field. A segmented control: "Show all" / "Cover <target>"
/ "Cover <base>". Then per chapter: its heading (serif 26px, number in the secondary
colour), each word group under a ruled label with its page label, then "Verbs", then
"Grammar".

- **A word row**: two columns. Left the target text (serif 19px; bold for key vocabulary,
  medium otherwise) with its `inList` key forms under it in the secondary colour. Right
  the gloss (16px) and its note (14px). A single word, or a word with its marker, never
  wraps; a form too long for its half takes the room it needs and the gloss moves along.
- **Covering.** The covered column is a block that can be seen on the dark page. Tapping a
  row shows its covered side (the cover cross-fades away); tapping again covers it.
- **Forms.** A word that has forms is underlined with dots and opens the forms sheet. With
  the base column covered, the sheet leaves the meaning out too.
- **A verb row**: the infinitive (serif 22px) and meaning, its paradigm table, its note.
- **A grammar row**: a disclosure that opens the rule and its page label.
- The **weak** list is the same, narrowed to weak sources, opening with "These had a
  mistake and have not yet been known twice in a row." Empty states: "No matches.", "No
  weak spots. Well done!", "Nothing in this selection."

### 6.7 Help sheet (`HelpSheet.tsx`)

A sheet titled with the help's title. Opens on the first hint ("Hint 1"). "Next hint"
shows one more. "Show explanation" opens the rule (a verb's table and note, then the
topic), "In the book: p. 51", and any videos; while the answer is still to come and would
count, a line under that button says "After the explanation, the answer no longer counts
towards 'known'." With no hints to give, the sheet opens on the explanation. "Back to the
exercise" closes it. The focus returns to the answer field, keyboard and all.

### 6.8 Forms sheet (`FormsSheet.tsx`)

A sheet whose title is the headword itself (serif 30px, fitted to its line), with
`kindLabel` under it, then the meaning and note (unless hidden), the tables, the notes,
and "Close". Tables sit straight on the sheet under a ruled head; a row is a label with
its hint and the forms in serif 19px. Two columns of forms stand side by side while every
form fits; when one would break, they stack and each gets a small label. No form is ever
broken.

### 6.9 Grammar blocks and videos

`GrammarBlocks.tsx` (Appendix A) renders a topic: paragraphs at 16px, tables that always
fit the phone, and examples (target text in serif 19px, translation under it at 15px).

`src/content/videos.ts` ships as an empty list of
`{ id, title, chapter, kind: "grammar" | "culture", topics: string[], embed, url, embeddable, minHeight?, needs? }`.
A `VideoCard` shows a framed 16:9 face with a play button ("Watch video"), loads the
player only when asked, and has an "Open" link beside its title. A video that cannot be
embedded opens on its own page instead. Videos appear under their chapter on the Sources
tab, on a topic's deck screen and in its explanation.

---

## 7. Design system

### 7.1 Colour

One dark theme. The tokens, with their contrast on the page, are at the top of the
stylesheet (Appendix B). In short: warm near-black paper, a raised surface for fields and
bars, warm white ink, one secondary text colour, three weights of line (`line` parts rows,
`edge` draws a control that can be tapped, `rule` opens a section), **one yellow** for the
next thing to do, the current tab and progress, and one green and one red for a verdict.

- Yellow carries black text, never white. A highlight is the yellow itself with the
  letters in black on it.
- Green and red appear only as verdicts: as a band with black text, or as a field's edge
  and text.
- Three tag colours (blue, pink, blue-green) are reserved for the profile's marker; without
  one they colour only the confetti.
- Known and learning are told apart by pattern (solid and hatched), not by hue.
- A sheet is told from the screen under it by a darker veil and a drawn edge. Shadows show
  nothing on a dark page; use none.

### 7.2 Type

- **Instrument Sans** for the interface (`--font-ui`), **Newsreader** for everything in
  the target language and for titles and figures (`--font-word`). Both through
  `next/font/google`.
- Every span of target-language text carries `lang` = the target code and the serif. The
  `<html lang>` is the base code.
- The thing being learnt is the largest type on its screen.

| Use | Size |
|-----|------|
| Hero (the target text on a card): by length ≤16 / ≤34 / longer | 46 / 38 / 30px, medium |
| Base-language question or meaning | 26px |
| Screen title | 32px serif semibold |
| Summary figure | 56px serif, tabular |
| Choice button | 24px target, 20px base |
| List target text; forms | 19px serif |
| Body, rows, chips | 16px |
| Buttons | 17px semibold |
| Secondary lines, labels | 15px (labels semibold) |
| Smallest anywhere | 14px |

Inputs are 16px or larger: an iPhone zooms into anything smaller.

### 7.3 Shape and touch

- Tap targets at least 44px. Rows at least 56px. Primary and quiet buttons 56px tall,
  radius 16px. Chips 44px tall, fully rounded. Fields radius 16px with a 2px edge.
- A label is one plain word in 15px semibold that names what follows; with `ruled` it
  stands on the rule that opens a list. No uppercase labels, no badges, no cards within
  cards.
- Icons are drawn on a 24-unit grid with round caps, and land on screen 2px thick at any
  size.
- One highlighted thing per screen: the yellow button or card.
- A disabled button stays readable and says why it cannot be pressed.

### 7.4 Fitting text (never breaking it)

- `fitWord` (Appendix A) sets a word too long for its line smaller, one pixel at a time,
  never under 16px, and re-measures when the width changes or the fonts arrive.
- A paradigm table that has a form too long for its column sets each label above its form.
- A grammar table too wide for the phone first puts a translation column under the column
  it translates (or sets its forms in two halves), and only then allows the base language
  to hyphenate. Should it still not fit, it scrolls sideways within its own box.

### 7.5 Language-shaped components (write these; the rest is in Appendix A)

- **`Target`**: target-language text. Props `text`, `fit`, `whole`, `mark`. With a marker
  shown before the word, the marker is semibold in its tag colour. `mark` highlights the
  word (not the marker) and draws the highlight in. `fit` applies `fitWord`; the text stays
  on one line when it is a single word or `whole`.
- **`Gapped`**: a sentence with its gap. Empty, the gap is a 2em blank with a 3px yellow
  underline. Filled, the answer stands there highlighted and semibold, drawn in unless
  `still`. Where the answer is a marker, it is underlined in yellow and keeps its tag
  colour.
- **`ParadigmTable`**: a paradigm's forms beside their slot labels in two columns (labels
  15px muted, forms serif 18px medium, never wrapping), in the profile's display order.
  `stacked` sets each label above its form at 21px.
- **`ChapterHead`**: the book's label in the secondary colour, then the chapter's title,
  serif 22px semibold on a rule.
- **`Mark`** and **`AppIcon`**: section 8.5.

### 7.6 Motion

One clock and one set of curves, all in the stylesheet (Appendix B), which also explains
them. Each kind of change shows one way: what comes, travels (a screen or the next card
from the right, a verdict from below, a sheet from the foot); what is shown, settles (an
answer under its question); what is marked, is drawn (a tick, the highlighter, a bar);
what is pressed, gives at once. Only transform, opacity and clip-path move. There are two
pieces of theatre: the splash, and the moment a round's result comes in. With reduced
motion nothing travels: changes are a short fade.

### 7.7 Details that regress easily

Each of these was a bug once. Keep them.

1. An iPhone raises its keyboard only inside a tap. So the screen changes synchronously
   inside the tap (no view transitions, no deferred navigation), the answer field stays
   mounted across questions, and `focus()` is called inside the tap or key handler.
2. Buttons that must not take the focus from the field (special keys, the help button)
   prevent `pointerdown`.
3. The screen is never zoomed: `touch-action: pan-x pan-y` on every element, and
   `gesturestart` refused. Only a book photo zooms, inside its own frame.
4. A scrolling box hides sideways overflow explicitly (`.scroll-y`), or Safari lets the
   whole screen be pushed aside by a card on its way in.
5. The app's height follows the visual viewport, so the bottom button stays above the
   keyboard (`ViewportSync`).
6. A tap within 300 ms of a screen change is ignored.
7. A bar is a full-width fill cut by `clip-path`, never a changing width.
8. The store follows other open copies of the app (a second tab, the browser beside the
   installed app), or one would overwrite the other's saves.
9. A swipe back has already moved the old screen: when the browser reports its own visual
   transition, do not animate again.
10. Values the server cannot know (today's date, the phone, the saved progress) render as
    absent on the server and arrive through `useSyncExternalStore`; room is reserved so
    nothing jumps.
11. On an iPhone the installed app does not share the browser's storage. Offer the install
    guide on the first visit, before there is progress to leave behind.
12. The splash is timed by the stylesheet alone, so it goes even if no script runs.

---

## 8. Platform

### 8.1 Document and manifest

`layout.tsx` and `manifest.ts` are in Appendix A. Points to keep: `robots` noindex;
`viewport` with `maximumScale: 1`, `userScalable: false`, `viewportFit: "cover"`,
`interactiveWidget: "resizes-content"` and the paper colour as `themeColor`; Apple web-app
capable with a translucent status bar and one launch image per device; the manifest's
`display: "standalone"`, portrait, paper as background and theme colour, the five icons,
and two shortcuts ("Start blitz" → `/?b=1`, "Words" → `/?t=words`).

### 8.2 Offline (`public/sw.js`, `ServiceWorker.tsx`)

In Appendix A. The page is served from cache at once and refreshed in the background;
build files are cached for ever; a book photo is kept once it has been looked at. A new
deploy replaces the cached page only when every file it refers to has arrived, so a
half-fetched update can never break offline use. `next.config.ts` serves `/sw.js` with
`no-cache`. The worker is registered in production only.

### 8.3 Install guide (`install.ts`, `InstallGuide.tsx`, `InstallSteps.tsx`)

- `install.ts` (Appendix A) works out the phone and browser from the user agent, holds
  back Android's install dialog, and returns no phone on a computer or inside the
  installed app.
- **`InstallOffer`** shows the guide once, on the first visit in a phone's browser.
  **`InstallRow`**, at the foot of the Blitz tab, opens it again: the app icon, "Add
  {{App}} to the Home Screen", "Full screen, works offline".
- **The guide** is a full-screen dialog drawn through a portal on `document.body`, so
  nothing can clip it. It takes the focus as a sheet does and hands it back
  (`dialogFocus`), leaves as a screen does (`depart`), and Esc closes it. On it: the icon, the title, "Works like an
  app, without the app store.", three benefits ("Full screen, no browser bars", "Opens
  with one tap", "Works offline too"). Where the browser offers an install dialog: one
  yellow button "Install {{App}}". Otherwise "Steps for <browser>" where the browser's
  name is the phone's own picker under plain text, so the learner can correct it, and
  three numbered steps. Then "Then open {{App}} from the Home Screen."; on an iPhone also
  "Your progress is saved there." or, when there already is progress, "Progress made in
  the browser does not carry over." At the foot: "Continue in the browser" and "I already
  have the app" (which stops every offer).
- **The steps** name each control exactly as the browser's own menu spells it in the base
  language, with the browser's icon drawn inline as a small round key. Verify the wording
  against the current browsers when you build; `InstallSteps.tsx` is the one place to
  change.

| Browser | 1 | 2 | 3 |
|---------|---|---|---|
| iPhone Safari, iOS 26 on | Tap ⋯ beside the address field, then **Share** (or ⬆ directly) | Scroll to **Add to Home Screen**; if you first see ⋯ **More**, tap that | Leave **Open as Web App** on and tap **Add** |
| iPhone Safari, earlier | Tap the Share button ⬆ | Scroll to **Add to Home Screen** | Tap **Add** |
| iPhone Chrome | Tap ⬆ at the right of the address bar | Scroll to **Add to Home Screen** (iOS 26: through ⋯ **More**) | Tap **Add** |
| iPhone Firefox | Tap the Share icon in the address bar | as Safari | Tap **Add** |
| iPhone Edge | Tap ⋯ in the bottom toolbar and choose **Share** | as Chrome | Tap **Add** |
| Android Chrome | Tap ⋮ beside the address bar | Choose **Add to Home screen** (or **Install app**) | Choose **Install** |
| Samsung Internet | Tap the menu ☰ | Choose **Add to** | Choose **Home screen** |
| Android Firefox | Tap the menu ⋮ | Open **More** and choose **Add app to Home screen** | Tap **Add** |
| Android Edge | Tap ⋯ at the bottom of the screen | Choose **Add to phone** | Choose **Install** |
| Inside another app | Tap ⋯ or ⋮ in the corner | Choose **Open in browser** | Add {{App}} from there |
| Any other | Open the browser's menu (iPhone: choose **Share**) | Find **Add to Home Screen** or **Install** | Confirm |

### 8.4 Keyboard, haptics, celebration

`ViewportSync`, `feedback.ts` and `Cheer` are in Appendix A. A right answer: a short
vibration (on an iPhone, the system's own tick through a switch control) and a burst of
confetti. A quick "knew it": the tick alone. A wrong answer: a double vibration and no
celebration. Call them from the tap itself.

### 8.5 Logo, icons and splash

The mark is **the app name's first letter with a pair of eyes above it**: a face. It
blinks on the splash and shuts its eyes when a round goes well.

- Draw the letter as one closed SVG path from geometric shapes, heavy enough to read at
  29px, with eased corners. Two round eyes above it, symmetrical about the letter's
  optical centre.
- `brand/mark.svg`: the face alone, with even air on every side. `brand/icon.svg`: a
  512-unit tile, corner radius 112, yellow `#ffe000`, the face in `#111111`.
  `brand/icon-maskable.svg`: a full yellow square with the face inside the central safe
  circle. `brand/icon-monochrome.svg`: the face alone on transparent.
- `src/app/icon.svg`, the browser tab's icon, is a copy of `brand/icon.svg`.
- `scripts/brand-assets.mjs` (Appendix A) draws every icon and one launch screen per
  device from those. Run it and commit what it writes. Its device list must match the one
  in `layout.tsx`.
- `Mark.tsx` exports `MarkLetter` (the path), `MarkEyes` (two circles, each scaling about
  its own middle), `Mark` (the face at a given height in the current text colour, with
  `eyes="open" | "closed"`), `AppIcon` (the tile), and `ON_TILE` (the transform that
  places the face on the tile).
- `Splash.tsx` and its styles are in the appendices. The cover opens along the line of the
  eyes. That line is set by two numbers in the stylesheet (`--splash-seam` and the
  `transform-origin` of `.splash-eyes`): the eyes' height on the tile as a fraction of it.
  Update both to match your icon.

---

## 9. Book pages

- **Store.** A private Vercel Blob store. Each photo at `pages/<id>.jpg` (`pages/p038.jpg`,
  `pages/toc1.jpg`).
- **List.** `src/lib/bookPages.ts` (Appendix A) names every photo in book order. A page
  not listed is never served.
- **Password.** `PAGES_PASSWORD` in the Vercel environment. `pagesAuth.ts` (Appendix A)
  turns it into a slow hash that is all the cookie ever holds; changing the password locks
  everyone out. Eight wrong guesses pause guessing for ten minutes for everyone; a guess
  is counted before anything is awaited, so guesses sent together cannot slip past.
- **Routes** (Appendix A). `GET /api/pages/unlock`: 200 unlocked, 401 not, 503 no password
  set. `POST /api/pages/unlock` with `{ password }`: sets an http-only cookie for a year
  scoped to `/api/pages`; 401 after a 600 ms pause; 429 when guessing is paused.
  `GET /api/pages/<id>`: the photo, `private, max-age=31536000, immutable`; 401 without
  the cookie; 404 for an unknown id.
- **Screens** (`BookPages.tsx`). The "Book pages" row on the Sources tab opens a full
  screen list: "Photos of the book's pages, in the book's order.", "Contents" first, then
  each chapter's pages; a row is the page label and what the app's own headings say the
  page holds. A row opens the **viewer**: the page label and "3/42" in the top bar, the
  photo filling the width, "Previous" and "Next" at the foot. A tap enlarges the photo
  2.2× about the tapped point or sets it whole again; two fingers enlarge it up to 4×
  with the point between them staying between them (`usePhotoZoom`, Appendix A).
- Both the list and the viewer are full-screen dialogs drawn through a portal on
  `document.body`; Esc closes the one on top.
- **States.** "Loading…"; locked: "The book pages are behind a password. It is asked only
  once.", a password field, "Open" / "Opening…", and errors "Wrong password.", "Too many
  tries. Wait ten minutes.", "No connection. Try again."; unset: "The photo password has
  not been set on the server yet (PAGES_PASSWORD)."; failed: "The photo could not be
  loaded. Check your connection." with "Try again".

Check what environment variables the store connection creates in the project and read the
installed `@vercel/blob` docs for how a private blob is fetched in that version; pass a
token explicitly only if the project has one.

---

## 10. Tests and verification

### 10.1 Unit tests (Vitest, `src/**/*.test.ts`)

Write these as the engine is built. Each name is a behaviour to prove.

| Suite | Proves |
|-------|--------|
| `content` | Section 4.5 |
| `check` | Exact answer; wrong capitals accepted but noted; each fold accepted but noted; an unfolded letter rejected; punctuation and spacing ignored; alternatives accepted; empty rejected; the marker asked for when only the word is typed; the wrong marker rejected |
| `progress` | A weak spot is a card missed and not yet known twice running; not one right the only time asked; not one never asked |
| `store` | A value is read back later; a copy follows what another saves; other keys are ignored; an unsaved answer is kept rather than falling back to disk |
| `decks` | Unique ids that resolve; every deck offers something in every exercise it lists; every deck but a single topic can be listed; narrowing by chapter; mixing exercises never asks a card twice; whole tables beside single forms; verb meanings on cards and forms elsewhere; the count equals what a round would ask; another deck's ticks survive a toggle; toggling starts from the defaults; the emptying narrowing is named |
| `session` | A word with the same meaning is never a wrong choice; four choices with the right one among them |
| `blitz` | One card per word and verb; a word in several chapters is one card; distinct meanings kept, repeats dropped; a verb is one card with its table; end punctuation merged; the word itself is never an "also"; twins name each other; narrowing by kind and chapter; new → learning → known; known at first sight is known; all of a word's cards move together; a known card is not pushed further before its rest is over; the line-up order and weights; a miss returns once after five and again at the end; only the first answer is saved; no card follows itself except the last; the closing round starts when the time left is what the misses need and runs past the time; days to the exam; the pace; each state of the day's goal |
| `forms` | Every word class's forms; every stored exception; every verb in the word lists has its table; nothing for words that never change |
| `help` | A recognise card's help does not name the verb; a slot card's does |
| `search` | Found by target text, marker and all, by a key form, by gloss and by one sense; ranking; book order among equals; a word once however many chapters list it; nothing for an empty query |
| `install` | Each browser on each system from its user agent; an iPad that says it is a Mac; a page inside another app; nothing on a computer |
| `pagesAuth` | Nobody in without a password set; a pass only for the right one; a changed password locks out; eight wrong guesses pause for ten minutes; guesses counted as taken; a right guess forgiven; the photo list unique and in book order |
| `sw` | The cached page is served at once and a new deploy fetched in the background; the working page is kept when a file of the new one fails; the new one is taken once all of it has arrived |
| `zoom` | Clamped between whole and 4×; the point under the fingers stays under them |

### 10.2 Browser walk-through

Run the built app (`npm run build && npm run start`) and drive it in a browser at
375×812 and again at 320×568. On every screen: no sideways scroll, no clipped or broken
target-language text, nothing under 14px, every control at least 44px.

1. First load on a phone user agent shows the install guide; closing it shows the Blitz tab.
2. Start a 2-minute sprint; reveal, grade both ways, undo, miss a card and see it return
   after five; let it end; the summary adds up.
3. Each tab lists its decks with counts; search finds a word by either language.
4. Open a word deck: tick two exercises, start, answer by choosing and by typing, use a
   special key, open help, read the explanation, see "Correct, with the explanation".
5. Open a verbs deck: conjugate a whole table; do each recognise exercise.
6. Open a grammar topic: the rule fits the width at 320px; a drill round runs.
7. Open a list: cover each column, reveal a row, open a word's forms.
8. Reload: progress and settings are still there.
9. Sources: the page index opens the right decks; a photo asks for the password, opens,
   zooms by tap, turns pages.
10. Go offline and reload: the app still opens and a viewed photo still shows.

Check the same in a WebKit engine (Playwright's WebKit will do): Safari-only layout bugs do
not show in Chromium. Tell the person to try the real phone as well: that is the last word.

### 10.3 Gate

`npm run lint`, `npm test` and `npm run build` all pass on the branch being shipped. There
is no CI on purpose: local verification is the source of truth.

---

## 11. Ship

### 11.1 Git and GitHub

Commit as the git identity already configured on the machine; do not override the author.
Vercel refuses to deploy a commit whose author it cannot match to an account, and that
looks like a failed build. Stage explicit paths and check `git status` first: `.source/`,
`.env*` and tool scratch folders must never be committed.

```bash
git init -b main
```

```bash
gh repo create {{slug}} --private --source=. --remote=origin --push
```

Commit the `AGENTS.md` and `CLAUDE.md` that `next dev` writes; removing them only brings
them back as an uncommitted change.

### 11.2 Vercel project

Check the current syntax with `vercel <command> --help`; the CLI changes.

```bash
vercel link --yes --project {{slug}} --scope <scope>
```

```bash
vercel git connect
```

With the repository connected, every merge to `main` deploys production and every pull
request gets a preview. Do not also deploy from the CLI: a checkout behind `main` would
put old code in production.

### 11.3 The photo store

Create a **private** Blob store named `{{slug}}-pages` and connect it to the project
(dashboard: Storage → Create → Blob → Private; or the CLI's `vercel blob` store commands).
Pull the environment and upload every photo:

```bash
vercel env pull .env.local
```

```bash
vercel blob put .source/pages/p038.jpg --access private --pathname pages/p038.jpg --rw-token "$BLOB_READ_WRITE_TOKEN"
```

List them back (`vercel blob list --limit 1000`) and check the count against
`BOOK_PHOTOS`.

### 11.4 The password (the person's step)

Ask the person to run this themselves and type a long passphrase when prompted. Do not
run it for them and do not ask what they chose.

```bash
vercel env add PAGES_PASSWORD production --sensitive
```

Then rebuild production so it takes effect:

```bash
vercel redeploy <production domain>
```

### 11.5 After the deploy

- The production domain answers 200 and shows the app. It is `{{slug}}.vercel.app` unless
  that name was taken: use the one Vercel assigned. The longer alias that
  carries the team's name may sit behind Vercel's own login: a redirect or 401 there is
  Vercel's answer, not the app's.
- `GET /api/pages/unlock` answers 401 once the password is set (503 before).
- `/manifest.webmanifest` and `/sw.js` are served; `/sw.js` with `no-cache`.
- The response carries `noindex`.
- Open it on a phone, add it to the home screen, turn on flight mode, open it again.

### 11.6 Later

- **A new page:** add the photo to `.source/pages/`, upload it, add its number to
  `bookPages.ts`.
- **A new chapter:** add `chapterN.ts`, register it in `index.ts`, extend the profile if
  the chapter teaches something new, run the tests, add to `REVIEW.md`.
- **A new deploy** reaches an installed app the next time it is opened with a connection,
  and shows from the opening after that.

---

## 12. Done

Everything here is true before you hand over:

- [ ] The four answers were the only things asked, plus the password step.
- [ ] Every photographed word list, phrase list and verb table is in the content, in book order.
- [ ] Every grammar topic taught on the covered pages has an explanation, hints and drills.
- [ ] `LANGUAGE.md` records each slot and why; `REVIEW.md` lists what a person should check.
- [ ] No rule, word or example comes from anywhere but this book.
- [ ] All suites in 10.1 pass; lint and build pass; the walk-through in 10.2 passes at both
      widths and in WebKit.
- [ ] Photos are in the private store only; nothing under `.source/` is in git or the bundle.
- [ ] Production answers; the five checks in 11.5 pass.
- [ ] The README says how the app is put together and how to add a chapter and a page.

The hand-over message, in this order: the address; how to add it to the home screen (one
line); the password command if it is still to be run; how many entries are in `REVIEW.md`
and that the content should be checked by someone who knows the language; what to test on
the real phone.

<!-- APPENDICES -->

---

## Appendix A. Reference code: the language-neutral modules

Working code, to be used as it stands. Replace the placeholders: `{{App}}` (display name),
`{{slug}}`, `{{base}}` (the base language's code), `{{tagline}}` (the profile's tagline).
Where a file imports a module specified in sections 4 to 6 (the content, the profile,
cards, decks, progress, the screens), write that module to match.

### A.1 Configuration

**`next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The browser must always re-check the worker, or app updates never arrive.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**`vitest.config.mts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
```

### A.2 Document and manifest

**`src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import { Splash } from "@/components/Splash";
import { ViewportSync } from "@/components/ViewportSync";
import "./globals.css";

const ui = Instrument_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
});

const word = Newsreader({
  variable: "--font-word",
  subsets: ["latin"],
});

/**
 * What iOS shows while the app starts, one picture per screen: paper with the icon in the middle,
 * so the splash (Splash.tsx) takes over without a change. Width and height in points, and pixels
 * per point. scripts/brand-assets.mjs draws these: keep its DEVICES list in step.
 */
const LAUNCH_SCREENS = [
  [440, 956, 3],
  [430, 932, 3],
  [428, 926, 3],
  [420, 912, 3],
  [414, 896, 3],
  [414, 896, 2],
  [402, 874, 3],
  [393, 852, 3],
  [390, 844, 3],
  [375, 812, 3],
  [375, 667, 2],
  [414, 736, 3],
  [768, 1024, 2],
  [820, 1180, 2],
  [834, 1194, 2],
  [1024, 1366, 2],
].map(([width, height, ratio]) => ({
  url: `/splash/apple-splash-${width * ratio}x${height * ratio}.png`,
  media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
}));

export const metadata: Metadata = {
  title: "{{App}}",
  description: "{{tagline}}",
  applicationName: "{{App}}",
  appleWebApp: {
    capable: true,
    title: "{{App}}",
    // The page runs under the status bar and pads for it itself (viewportFit: cover).
    statusBarStyle: "black-translucent",
    startupImage: LAUNCH_SCREENS,
  },
  // A personal study aid, not something to be found through search.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The screen stays at its size, as an app's does. Safari in a tab ignores this; the styles and
  // ViewportSync say it again for that case. A photo is enlarged in its own frame (BookPages.tsx).
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Android: let the on-screen keyboard shrink the page so the bottom buttons stay in view.
  interactiveWidget: "resizes-content",
  themeColor: "#151412",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="{{base}}" className={`${ui.variable} ${word.variable} antialiased`}>
      <body>
        {/* First in the page, so it is painted before anything it covers. */}
        <Splash />
        {children}
        <ServiceWorker />
        <ViewportSync />
      </body>
    </html>
  );
}
```

**`src/app/manifest.ts`**

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "{{App}}",
    short_name: "{{App}}",
    description: "{{tagline}}",
    lang: "{{base}}",
    categories: ["education"],
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#151412",
    theme_color: "#151412",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-monochrome-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
    // Long-press on the home-screen icon (Android).
    shortcuts: [
      {
        name: "Start blitz",
        url: "/?b=1",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Words",
        url: "/?t=words",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
```

### A.3 A value kept in localStorage

**`src/lib/store.ts`**

```ts
import { useSyncExternalStore } from "react";

/** A small value kept in localStorage that React components can subscribe to. */
export function createStore<T extends object>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  /** What storage held when it was last read or written here. */
  let stored: string | null = null;
  const listeners = new Set<() => void>();

  /** Takes over what is in storage. False when there is nothing new there. */
  function read(): boolean {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw || raw === stored) return false;
      value = { ...initial, ...JSON.parse(raw) };
      stored = raw;
      return true;
    } catch {
      // Private mode or corrupt data: carry on with what there is.
      return false;
    }
  }

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    read();
    // The app can be open twice: in two tabs, or in the browser beside the installed app. Each
    // save writes the whole value, so a copy that did not follow the other's saves would wipe them.
    const follow = () => {
      if (read()) listeners.forEach((listener) => listener());
    };
    window.addEventListener("storage", (event) => {
      if (event.key === key || event.key === null) follow();
    });
    // A copy asleep in the background is told nothing: it looks again when it comes back.
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) follow();
      });
    }
  }

  function get(): T {
    load();
    return value;
  }

  function set(next: T) {
    value = next;
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(key, raw);
      stored = raw;
    } catch {
      // Storage full or blocked: the session still works, it just is not remembered.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function use(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { get, set, use };
}
```

### A.4 Navigation through the query string

**`src/lib/nav.ts`**

```ts
import { useMemo, useSyncExternalStore } from "react";
import type { Exercise } from "./decks";
import { travel, type Travel } from "./motion";

/**
 * The app is one page; which screen shows lives in the query string so the
 * phone's back gesture works and no navigation ever needs the network.
 *
 *   /?t=words          a top-level tab (blitz, chapters, words, verbs, grammar, sources)
 *   /?b=1              a blitz sprint
 *   /?d=nouns          a deck's own screen
 *   /?d=nouns&x=write  an exercise (or the list) on that deck
 */
export type Tab = "blitz" | "chapters" | "words" | "verbs" | "grammar" | "sources";

export type View =
  | { name: "tab"; tab: Tab }
  | { name: "blitz" }
  | { name: "deck"; deck: string }
  | { name: "exercise"; deck: string; exercise: Exercise };

const CHANGED = "{{slug}}:view";
const TABS: Tab[] = ["blitz", "chapters", "words", "verbs", "grammar", "sources"];
/** Where the app opens. */
const HOME: Tab = "blitz";
const EXERCISES: Exercise[] = [
  "list",
  "flash",
  "choose",
  "write",
  "conjugate",
  "marker",
  "forms",
  "meaning",
  "base",
  "slot",
  "mix",
  "weak",
];

function parse(search: string): View {
  const params = new URLSearchParams(search);
  const deck = params.get("d");
  const exercise = params.get("x") as Exercise | null;
  const tab = params.get("t") as Tab | null;
  if (deck && exercise && EXERCISES.includes(exercise)) return { name: "exercise", deck, exercise };
  if (deck) return { name: "deck", deck };
  if (params.has("b")) return { name: "blitz" };
  return { name: "tab", tab: tab && TABS.includes(tab) ? tab : HOME };
}

function toUrl(view: View): string {
  if (view.name === "exercise") return `/?d=${view.deck}&x=${view.exercise}`;
  if (view.name === "deck") return `/?d=${view.deck}`;
  if (view.name === "blitz") return "/?b=1";
  return view.tab === HOME ? "/" : `/?t=${view.tab}`;
}

/** How far into the app a screen lies: a tab, a screen opened from a tab, an exercise on a deck. */
function depth(view: View): number {
  return view.name === "tab" ? 0 : view.name === "exercise" ? 2 : 1;
}

/** Which way a step leads, for the motion that goes with it. */
function way(from: View, to: View): Travel {
  const step = depth(to) - depth(from);
  return step > 0 ? "open" : step < 0 ? "close" : "tab";
}

/** The address of the screen that is showing, to tell which way a step through history leads. */
let shown = "";

function announce() {
  shown = window.location.search;
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(listener: () => void) {
  shown = window.location.search;
  const onHistory = (event: PopStateEvent) => {
    const from = shown;
    shown = window.location.search;
    // A swipe back has already slid the old screen away under the finger: it must not move twice.
    if (from === shown || event.hasUAVisualTransition) listener();
    else travel(way(parse(from), parse(shown)), listener);
  };
  window.addEventListener("popstate", onHistory);
  window.addEventListener(CHANGED, listener);
  return () => {
    window.removeEventListener("popstate", onHistory);
    window.removeEventListener(CHANGED, listener);
  };
}

export function useView(): View {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => parse(search), [search]);
}

/** Goes one level deeper; the back gesture returns. */
export function open(view: View) {
  travel("open", () => {
    window.history.pushState({ opened: true }, "", toUrl(view));
    announce();
  });
}

/** Switching tabs is not a step back in history, as in a native app. */
export function switchTab(tab: Tab) {
  const url = toUrl({ name: "tab", tab });
  const change = () => {
    window.history.replaceState(window.history.state, "", url);
    announce();
  };
  // The tab that is already open has nowhere to go.
  if (url === window.location.pathname + window.location.search) change();
  else travel("tab", change);
}

/** Leaves the current screen: back in history when we came from inside the app, otherwise one level up. */
export function close() {
  if (window.history.state?.opened) {
    // The screens move when the step arrives, in `subscribe`.
    window.history.back();
    return;
  }
  const here = parse(window.location.search);
  const up: View = here.name === "exercise" ? { name: "deck", deck: here.deck } : { name: "tab", tab: HOME };
  travel("close", () => {
    window.history.replaceState(null, "", toUrl(up));
    announce();
  });
}
```

### A.5 Motion between screens

**`src/lib/motion.ts`**

```ts
/**
 * How one screen gives way to the next.
 *
 * The change itself is never put off. nav.ts alters the address and React swaps the screen
 * inside the tap, exactly as before, so a field that takes the focus takes it inside the tap:
 * the only moment an iPhone will raise its keyboard. That rules out the browser's own view
 * transitions, which hand the page over a frame later. The motion is laid around the change
 * instead. A still of the old screen stays on top for a moment and clears away; under it the
 * new screen is already there, already taking taps, and settles into place. The styles are in
 * the Motion section of globals.css.
 *
 * What is laid over a screen goes the same way (`depart`): a sheet or the install guide is gone
 * the instant it is closed, the focus back where it was, and a still of it leaves in its place.
 */

/** Deeper into the app, back out of it, or sideways to another tab. */
export type Travel = "open" | "close" | "tab";

/** The element App.tsx draws the screen in. */
export const STAGE = "stage";

/** What an element out of view is left as: these can be given a size. Text in a line cannot. */
const BOXES = new Set(["block", "flex", "grid", "list-item", "flow-root"]);

type Scroll = [copy: Element, top: number, left: number];

let ghost: HTMLElement | undefined;
let resting: ReturnType<typeof setTimeout> | undefined;
let settleMs: number | undefined;

/** A time from the styles, in milliseconds. The build may have rewritten "260ms" as ".26s". */
export function ms(element: Element, property: string): number {
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  return parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) || 0;
}

/** The learner has asked the phone for less motion. */
function calm(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Makes the change, and lets the screens move as the kind of step asks. */
export function travel(kind: Travel, change: () => void) {
  const stage = document.getElementById(STAGE);
  const screen = stage?.firstElementChild;
  if (!stage || !screen) {
    change();
    return;
  }
  // A little longer than anything here moves: by then the still is clear and the new screen is in place.
  settleMs ??= (ms(stage, "--dur-enter") || 260) + 100;
  rest(stage);
  // With motion turned down nothing travels: the styles give the new screen a short fade.
  if (!calm()) {
    try {
      leave(screen, kind);
    } catch {
      // The still is a nicety: without it the screen changes as it always did.
    }
  }
  stage.dataset.nav = kind;
  resting = setTimeout(rest, settleMs, stage);
  change();
}

/** Clears up after a step, whether it has finished or the next one has begun. */
function rest(stage: HTMLElement) {
  clearTimeout(resting);
  ghost?.remove();
  ghost = undefined;
  delete stage.dataset.nav;
}

/** Leaves a still of the screen on top of whatever comes next. It takes no taps and no focus. */
function leave(screen: Element, kind: Travel) {
  const scrolls: Scroll[] = [];
  const still = picture(screen, scrolls);
  ghost = document.createElement("div");
  ghost.className = "ghost";
  ghost.dataset.nav = kind;
  ghost.inert = true;
  ghost.setAttribute("aria-hidden", "true");
  ghost.append(still);
  document.body.append(ghost);
  for (const [copy, top, left] of scrolls) copy.scrollTo(left, top);
}

/**
 * A copy of a screen as it looks now. Whatever is scrolled out of view is left as an empty box
 * of its own size, so a list of a thousand words costs no more to copy than the dozen in sight.
 */
function picture(source: Element, scrolls: Scroll[]): Element {
  const copy = source.cloneNode(false) as Element;
  // A video would start loading all over again.
  if (copy instanceof HTMLIFrameElement) copy.removeAttribute("src");
  if (source.scrollTop || source.scrollLeft) scrolls.push([copy, source.scrollTop, source.scrollLeft]);
  for (const child of source.childNodes) {
    if (child instanceof Element) copy.append(unseen(child) ?? picture(child, scrolls));
    else if (child instanceof Text) copy.append(child.cloneNode());
  }
  return copy;
}

/** An empty box for an element that lies wholly above or below the screen; nothing for one in sight. */
function unseen(element: Element): Element | undefined {
  if (!(element instanceof HTMLElement)) return;
  const box = element.getBoundingClientRect();
  if (box.bottom > 0 && box.top < window.innerHeight) return;
  if (!box.height || !BOXES.has(getComputedStyle(element).display)) return;
  const blank = element.cloneNode(false) as HTMLElement;
  blank.style.cssText += `;box-sizing:border-box;flex:none;width:${box.width}px;height:${box.height}px`;
  return blank;
}

/** How something laid over a screen leaves: a sheet falls back to the foot of it, a screen goes as on a step back. */
export type Exit = "sheet" | "screen";

/**
 * For something laid over a screen that is being taken away this instant: call it while the
 * element is still in the page (as its ref is let go). A still of it stays where it was and
 * leaves in its own time, as the styles say. Nothing waits for that: the still takes no taps
 * and no focus.
 */
export function depart(element: HTMLElement, exit: Exit) {
  const stage = document.getElementById(STAGE);
  // A change of screen leaves a still of everything, this included: once is enough.
  if (!stage || stage.dataset.nav || calm()) return;
  try {
    const scrolls: Scroll[] = [];
    const still = picture(element, scrolls);
    const leaving = document.createElement("div");
    if (exit === "sheet") {
      leaving.className = "sheet-ghost";
      // Closed while it was still rising, it falls from where it had got to.
      const panel = element.firstElementChild;
      if (panel) leaving.style.setProperty("--at", `${new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42}px`);
      leaving.style.setProperty("--veil", getComputedStyle(element, "::before").opacity);
    } else {
      leaving.className = "ghost";
      leaving.dataset.nav = "close" satisfies Travel;
    }
    leaving.inert = true;
    leaving.setAttribute("aria-hidden", "true");
    leaving.append(still);
    document.body.append(leaving);
    for (const [copy, top, left] of scrolls) copy.scrollTo(left, top);
    // React rehearses the letting go once when a component first appears (strict mode): then it is still here.
    queueMicrotask(() => element.isConnected && leaving.remove());
    setTimeout(() => leaving.remove(), (ms(stage, "--dur-enter") || 260) + 100);
  } catch {
    // The still is a nicety: without it the thing closes as it always did.
  }
}

/**
 * Something that has changed places (the marker of the current tab) is shown going there:
 * it starts where it was, `from` pixels from the left of the screen, and comes to rest where it now is.
 */
export function glide(element: HTMLElement, from: number) {
  const by = from - element.getBoundingClientRect().left;
  if (!by || calm() || !element.animate) return;
  element.animate([{ transform: `translateX(${by}px)` }, { transform: "none" }], {
    duration: ms(element, "--dur-fast") || 140,
    easing: getComputedStyle(element).getPropertyValue("--ease-out").trim() || "ease-out",
  });
}
```

### A.6 Blitz: shared progress, line-up, sprint and pace
The second half of `src/lib/blitz.ts`. The first half (the types and building the items) is section 5.6.
While `exam` is empty the callers skip the pace.

**`src/lib/blitz.ts`**

```ts
import { chapters } from "@/content";
import { isKnown, marked, type Direction, type Mark, type Progress } from "./progress";
import { createStore } from "./store";

// … BlitzKind, Meaning, BlitzItem, Scope, BLITZ_ITEMS and itemsIn: section 5.6 …

/** An item's progress: as weak as its weakest answered card, as recent as its latest answer. */
export function markOf(item: BlitzItem, progress: Progress): Mark | undefined {
  let whole: Mark | undefined;
  for (const id of item.ids) {
    const mark = progress[id];
    if (!mark) continue;
    whole = whole
      ? {
          box: Math.min(whole.box, mark.box),
          seen: Math.max(whole.seen, mark.seen),
          missed: Math.max(whole.missed, mark.missed),
          at: Math.max(whole.at ?? 0, mark.at ?? 0),
        }
      : mark;
  }
  return whole;
}

/**
 * The marks to save when an item is answered. All its cards move together: one with no mark
 * of its own starts from the item's, so a word known from one chapter's list is not set
 * back by its untouched twin in another. Known the first time it is ever met, it is known.
 * Known again before its rest was over, a known card stays as it was: that proves little, and
 * a few sprints run back to back would otherwise put it away until after the exam.
 */
export function marksAfter(item: BlitzItem, progress: Progress, knew: boolean, now: number): Record<string, Mark> {
  const whole = markOf(item, progress);
  if (knew && whole && isKnown(whole) && !rested(whole, now)) {
    return Object.fromEntries(item.ids.map((id) => [id, progress[id] ?? whole]));
  }
  return Object.fromEntries(item.ids.map((id) => [id, marked(progress[id] ?? whole, knew, now, true)]));
}

export type Status = "new" | "learning" | "known";

export function statusOf(item: BlitzItem, progress: Progress): Status {
  const mark = markOf(item, progress);
  if (!mark) return "new";
  return isKnown(mark) ? "known" : "learning";
}

export function countsOf(items: BlitzItem[], progress: Progress): Record<Status, number> {
  const counts = { known: 0, learning: 0, new: 0 };
  for (const item of items) counts[statusOf(item, progress)]++;
  return counts;
}

/** Why a card is in a sprint: never met, missed last time, or known and due for another look. */
export type Why = "new" | "again" | "review";

export type Slot = { item: BlitzItem; why: Why };

const HOUR = 3_600_000;
/** How long a card that was known is left alone, by box: a day, three, six, then past any exam. */
const REST_HOURS = [0, 20, 72, 144, 336];

/** Whether a card has been left alone for as long as its box asks. */
function rested(mark: Mark, now: number): boolean {
  return now - (mark.at ?? 0) >= REST_HOURS[Math.min(mark.box, REST_HOURS.length - 1)] * HOUR;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * The cards of a sprint in the order they would come up. New cards go by worth: the key
 * words and the verbs of every chapter, then the rest, chapter by chapter. Earlier misses
 * take one slot in three: each was gone over in the sprint that missed it, and a sprint is
 * for getting through the words. Once many have piled up they take every other slot, so
 * that meeting new words never outruns learning them; cards due for review are dealt in
 * more thinly. Cards known recently come last of all.
 */
export function lineUp(items: BlitzItem[], progress: Progress, now: number, random: () => number = Math.random): Slot[] {
  type Seen = { item: BlitzItem; mark: Mark };
  const fresh: BlitzItem[] = [];
  const missed: Seen[] = [];
  const due: Seen[] = [];
  const resting: Seen[] = [];
  for (const item of items) {
    const mark = markOf(item, progress);
    if (!mark) fresh.push(item);
    else if (mark.box === 0) missed.push({ item, mark });
    else if (rested(mark, now)) due.push({ item, mark });
    else resting.push({ item, mark });
  }
  const worth = (item: BlitzItem) => (item.core ? 0 : 100) + item.chapters[0];
  const oldestFirst = (a: Seen, b: Seen) => (a.mark.at ?? 0) - (b.mark.at ?? 0);
  const weakestFirst = (a: Seen, b: Seen) => a.mark.box - b.mark.box || oldestFirst(a, b);

  const sources: { why: Why; items: BlitzItem[]; weight: number }[] = [
    {
      why: "again",
      items: missed.sort(oldestFirst).map((seen) => seen.item),
      weight: missed.length >= 60 ? 6 : 3,
    },
    { why: "new", items: shuffle(fresh, random).sort((a, b) => worth(a) - worth(b)), weight: 6 },
    { why: "review", items: due.sort(weakestFirst).map((seen) => seen.item), weight: due.length >= 30 ? 6 : 2 },
  ];
  // Deal from the sources in proportion to their weights.
  const slots: Slot[] = [];
  const taken = sources.map(() => 0);
  for (;;) {
    let next = -1;
    sources.forEach((source, index) => {
      if (taken[index] >= source.items.length) return;
      if (next < 0 || (taken[index] + 1) / source.weight < (taken[next] + 1) / sources[next].weight) next = index;
    });
    if (next < 0) break;
    slots.push({ item: sources[next].items[taken[next]++], why: sources[next].why });
  }
  return [...slots, ...resting.sort(weakestFirst).map(({ item }): Slot => ({ item, why: "review" }))];
}

/**
 * How many other cards pass before a missed card is shown again. That early return comes
 * once, known or not: after it the card waits for the closing round.
 */
export const COMEBACK = 5;

/** A card missed this sprint and not yet known in the closing round. */
type Waiting = {
  item: BlitzItem;
  /** How many cards had been answered when it was last shown. */
  at: number;
  /** Its early return is still to come. */
  soon: boolean;
};

/** The card on screen. */
export type Turn = {
  item: BlitzItem;
  /** "retry" is a miss's early return, "closing" its turn in the closing round. */
  why: Why | "retry" | "closing";
  /** Its first showing this sprint: the only answer that is saved. */
  first: boolean;
};

export type Sprint = {
  queue: Slot[];
  waiting: Waiting[];
  /** The closing round has begun: nothing new is dealt, and the sprint lasts until every miss has been known. */
  closing: boolean;
  /** Cards answered so far. */
  cards: number;
  current: Turn | null;
  /** Known at first showing. */
  knew: number;
  /** Met for the first time ever. */
  fresh: number;
  /** Missed at first showing, in the order they came. */
  missed: BlitzItem[];
};

/** A sprint's time, in milliseconds. */
export type Clock = { elapsed: number; total: number };

function pick(
  queue: Slot[],
  waiting: Waiting[],
  cards: number,
  closing: boolean,
  last?: BlitzItem,
): Pick<Sprint, "queue" | "waiting" | "closing" | "current"> {
  const back = (entry: Waiting, why: "retry" | "closing") => ({
    queue,
    waiting: waiting.filter((other) => other !== entry),
    closing: why === "closing",
    current: { item: entry.item, why, first: false },
  });
  if (!closing) {
    const due = waiting.find((entry) => entry.soon && cards - entry.at >= COMEBACK);
    if (due) return back(due, "retry");
    if (queue.length > 0) {
      const [{ item, why }, ...rest] = queue;
      return { queue: rest, waiting, closing, current: { item, why, first: true } };
    }
  }
  // The closing round, which nothing new left to deal also begins. The card shown longest ago
  // comes first, so one missed again waits behind all the others, and comes round the sooner
  // the fewer they are. Only the last card left follows itself.
  const others = waiting.filter((entry) => entry.item !== last);
  const entry = (others.length > 0 ? others : waiting).reduce<Waiting | undefined>(
    (a, b) => (a && a.at <= b.at ? a : b),
    undefined,
  );
  return entry ? back(entry, "closing") : { queue, waiting, closing: true, current: null };
}

export function startSprint(slots: Slot[]): Sprint {
  return { ...pick(slots, [], 0, false), cards: 0, knew: 0, fresh: 0, missed: [] };
}

/**
 * The sprint after the card on screen was answered. `current` is null when nothing is left to show.
 * A timed sprint gives its clock. The closing round then begins when the time left is what the
 * waiting cards will take at the pace so far, and runs past the time if they take longer:
 * no sprint ends on a miss that was not known since.
 */
export function answer(sprint: Sprint, knew: boolean, clock?: Clock): Sprint {
  const turn = sprint.current;
  if (!turn) return sprint;
  const cards = sprint.cards + 1;
  // Known at first showing or in the closing round, a card is done. After any other answer it waits.
  const done = knew && (turn.first || turn.why === "closing");
  const waiting = done ? sprint.waiting : [...sprint.waiting, { item: turn.item, at: cards, soon: turn.first }];
  const closing =
    sprint.closing || (clock !== undefined && clock.total - clock.elapsed <= waiting.length * (clock.elapsed / cards));
  return {
    ...pick(sprint.queue, waiting, cards, closing, turn.item),
    cards,
    knew: sprint.knew + (turn.first && knew ? 1 : 0),
    fresh: sprint.fresh + (turn.why === "new" ? 1 : 0),
    missed: turn.first && !knew ? [...sprint.missed, turn.item] : sprint.missed,
  };
}

/** A calendar day in the learner's own time zone: "2026-10-05". */
export function dayKey(date: Date): string {
  const two = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

/** Whole days from `today` to `exam`; negative once the exam is past. */
export function daysUntil(exam: string, today: string): number {
  return Math.round((Date.parse(`${exam}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / (24 * HOUR));
}

/**
 * New cards to meet today so that every card has been met by the eve of the exam,
 * which leaves the last day for going over them. Those already met today count in.
 */
export function paceFor(unseen: number, freshToday: number, daysLeft: number): number {
  return Math.ceil((unseen + freshToday) / Math.max(1, daysLeft - 1));
}

/** Where the day's new cards stand. */
export type Goal =
  /** Nothing is chosen: there is nothing to pace. */
  | { is: "none" }
  /** The exam day has gone. */
  | { is: "past" }
  /** Every chosen card has been met: the rest is review. */
  | { is: "seen" }
  | { is: "open"; fresh: number; pace: number }
  /** The pace is met. It is left out then: new cards met in a wider selection can outnumber it. */
  | { is: "met"; fresh: number };

/** Today's goal for a selection of `chosen` cards, `unseen` of them never met, after `fresh` new cards today. */
export function goalFor(chosen: number, unseen: number, fresh: number, daysLeft: number): Goal {
  if (chosen === 0) return { is: "none" };
  if (daysLeft < 0) return { is: "past" };
  if (unseen === 0) return { is: "seen" };
  const pace = paceFor(unseen, fresh, daysLeft);
  return fresh >= pace ? { is: "met", fresh } : { is: "open", fresh, pace };
}

export type BlitzSettings = {
  /** Length of a sprint. */
  minutes: number;
  direction: Direction;
  /** Seconds until the answer shows by itself; 0 leaves it to a tap. */
  reveal: number;
  kinds: BlitzKind[];
  chapters: number[];
  /** The day of the exam: "YYYY-MM-DD", or "" until the learner picks one. */
  exam: string;
  /** New cards met on `day`, for the day's pace. */
  day: string;
  fresh: number;
};

export const MINUTES = [2, 5, 10];
export const REVEALS = [3, 5, 0];

export const blitzStore = createStore<BlitzSettings>("{{slug}}.blitz", {
  minutes: 5,
  direction: "t2b",
  reveal: 3,
  kinds: ["words", "phrases", "verbs"],
  chapters: chapters.map((chapter) => chapter.id),
  // Unset until the learner picks a day on the Blitz tab.
  exam: "",
  day: "",
  fresh: 0,
});

/** New cards met so far today. */
export function freshToday(settings: BlitzSettings, today: string): number {
  return settings.day === today ? settings.fresh : 0;
}

/** Counts one more new card towards today's pace, or with -1 takes one back. */
export function noteFresh(by = 1) {
  const settings = blitzStore.get();
  const today = dayKey(new Date());
  blitzStore.set({ ...settings, day: today, fresh: Math.max(0, freshToday(settings, today) + by) });
}
```

### A.7 Haptics and the celebration

**`src/lib/feedback.ts`**

```ts
/**
 * The little rewards and warnings around an answer: a celebration on screen
 * and, where the phone allows it, something to feel.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Lets the celebration overlay know when to fire. */
export function onCheer(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * iPhones have no vibration API for web pages. Toggling a switch control makes
 * the system play its own light tick (iOS 18 and later); elsewhere this does nothing.
 */
function systemTick() {
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.display = "none";
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.setAttribute("switch", "");
  label.appendChild(toggle);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

function feel(pattern: number | number[], tickInstead: boolean) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
    else if (tickInstead) systemTick();
  } catch {
    // Feedback is a nicety; never let it break an answer.
  }
}

/** A right answer. Call it from the tap or key press itself: phones only vibrate in response to a touch. */
export function cheer() {
  feel(18, true);
  listeners.forEach((listener) => listener());
}

/** A light touch for a quick "knew it": felt, with no celebration to wait for. */
export function tick() {
  feel(12, true);
}

/** A wrong answer: felt, not celebrated. */
export function miss() {
  feel([35, 60, 35], false);
}
```

**`src/components/Cheer.tsx`**

```tsx
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { onCheer } from "@/lib/feedback";

const COLORS = ["var(--accent)", "var(--good)", "var(--tag-1)", "var(--tag-2)", "var(--tag-3)"];
const PIECES = 16;
const LIFETIME_MS = 900;

type Piece = { color: string; dx: number; dy: number; turn: number; size: number; round: boolean };
type Burst = { id: number; pieces: Piece[] };

let nextId = 0;

function scatter(): Burst {
  const pieces = Array.from({ length: PIECES }, (_unused, index): Piece => {
    // Evenly fanned upwards and sideways, with enough randomness not to look like a clock face.
    const angle = Math.PI * (1.05 + (0.9 * index) / (PIECES - 1)) + (Math.random() - 0.5) * 0.35;
    const reach = 70 + Math.random() * 90;
    return {
      color: COLORS[index % COLORS.length],
      dx: Math.cos(angle) * reach,
      dy: Math.sin(angle) * reach,
      turn: (Math.random() - 0.5) * 540,
      size: 7 + Math.random() * 6,
      round: index % 3 === 0,
    };
  });
  return { id: nextId++, pieces };
}

/** A short burst of confetti for every right answer. Mounted once; it never takes taps. */
export function Cheer() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(
    () =>
      onCheer(() => {
        const burst = scatter();
        setBursts((current) => [...current, burst]);
        setTimeout(() => setBursts((current) => current.filter((other) => other.id !== burst.id)), LIFETIME_MS);
      }),
    [],
  );

  return (
    <div className="burst pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      {bursts.map((burst) => (
        <div key={burst.id} className="absolute left-1/2 top-[34%]">
          {burst.pieces.map((piece, index) => (
            <span
              key={index}
              className="burst-piece absolute block"
              style={
                {
                  width: piece.size,
                  height: piece.round ? piece.size : piece.size * 0.55,
                  borderRadius: piece.round ? "50%" : 2,
                  background: piece.color,
                  "--dx": `${piece.dx}px`,
                  "--dy": `${piece.dy}px`,
                  "--turn": `${piece.turn}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### A.8 Which phone, which browser

**`src/lib/install.ts`**

```ts
import { useSyncExternalStore } from "react";
import { createStore } from "./store";

/**
 * Adding the app to the phone's home screen. Every browser hides that behind a menu of
 * its own, so the guide needs to know which browser it is in; an Android browser that
 * supports it also hands over an install dialog to open on request.
 */
export type Device = "ios" | "android";

/** The browsers with steps of their own. "in-app" is a page opened inside another app, such as Instagram. */
export type Browser = "safari" | "chrome" | "samsung" | "firefox" | "edge" | "other" | "in-app";

export type Phone = {
  device: Device;
  browser: Browser;
  /** iOS 26 moved Safari's Share behind three dots and shortened the share sheet's list. */
  ios26: boolean;
};

/** The browsers a device can be running, in the order the guide offers them. The device itself is never in doubt. */
export const BROWSERS: Record<Device, Browser[]> = {
  ios: ["safari", "chrome", "firefox", "edge", "other", "in-app"],
  android: ["chrome", "samsung", "firefox", "edge", "other", "in-app"],
};

/** How apps that show pages in a browser of their own sign their name. */
const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|LinkedInApp|Snapchat|musical_ly|BytedanceWebview|TikTok|Pinterest|MicroMessenger/;

function iosBrowser(userAgent: string): Browser {
  // The Google app shows pages too, but like the apps above it cannot add one to the home screen.
  if (IN_APP.test(userAgent) || /GSA\//.test(userAgent)) return "in-app";
  if (/EdgiOS\//.test(userAgent)) return "edge";
  if (/CriOS\//.test(userAgent)) return "chrome";
  if (/FxiOS\//.test(userAgent)) return "firefox";
  if (/OPT\/|OPiOS|YaBrowser| Brave(?:\s|$)|Ddg\/|DuckDuckGo|VivaiOS|Ecosia/.test(userAgent)) return "other";
  // Every browser on an iPhone signs off as Safari; a page that does not is inside some app.
  return /Safari\//.test(userAgent) ? "safari" : "in-app";
}

function androidBrowser(userAgent: string): Browser {
  // "wv" marks the web view Android lends to apps.
  if (IN_APP.test(userAgent) || /;\s*wv\)/.test(userAgent)) return "in-app";
  if (/SamsungBrowser\//.test(userAgent)) return "samsung";
  if (/Firefox\//.test(userAgent)) return "firefox";
  if (/EdgA\//.test(userAgent)) return "edge";
  if (/OPR\/|YaBrowser\/|DuckDuckGo\/|Ecosia|UCBrowser|MiuiBrowser|HuaweiBrowser/.test(userAgent)) return "other";
  return /Chrome\//.test(userAgent) ? "chrome" : "other";
}

function isIos26(userAgent: string): boolean {
  // Safari stopped telling the system's version and gives its own, which matches it. Chrome and
  // Edge still tell the system's. Firefox tells neither: take a current iPhone for granted.
  const version = /(?:CriOS|EdgiOS)\//.test(userAgent) ? /OS (\d+)_/.exec(userAgent) : /Version\/(\d+)/.exec(userAgent);
  return version === null || Number(version[1]) >= 26;
}

/** The phone and browser this is, or null on a computer, where there is no home screen to add to. */
export function phoneOf(userAgent: string, touchPoints: number): Phone | null {
  if (/Android/.test(userAgent)) return { device: "android", browser: androidBrowser(userAgent), ios26: false };
  // An iPad introduces itself as a Mac; only its touch screen tells the two apart.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) {
    return { device: "ios", browser: iosBrowser(userAgent), ios26: isIos26(userAgent) };
  }
  return null;
}

/**
 * `seen`: the guide shown on the first visit has been closed, so it is not shown unasked again.
 * `owned`: the learner says the app is on the home screen already, so nothing offers it any more.
 */
export const installStore = createStore("{{slug}}.install", { seen: false, owned: false });

/** The browser's own install dialog, held back until asked for. Not in TypeScript's DOM types. */
type InstallPrompt = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let prompt: InstallPrompt | undefined;
let installed = false;
const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((listener) => listener());
}

// Listened for from the start: the browser offers its dialog once, soon after the page loads,
// whichever screen happens to be showing. Holding it back also keeps the browser's own banner away.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    prompt = event as InstallPrompt;
    changed();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    changed();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The last reading, kept so the same phone is the same object from one render to the next. */
let read: { userAgent: string; phone: Phone | null } | undefined;

function currentPhone(): Phone | null {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed || standalone) return null;
  if (read?.userAgent !== navigator.userAgent) {
    read = { userAgent: navigator.userAgent, phone: phoneOf(navigator.userAgent, navigator.maxTouchPoints) };
  }
  return read.phone;
}

/**
 * The phone to show install help for. Null on a computer, inside the installed app,
 * and while the page is still as the server built it.
 */
export function usePhone(): Phone | null {
  return useSyncExternalStore(subscribe, currentPhone, () => null);
}

/** Whether the browser has an install dialog waiting to be opened. */
export function useInstallDialog(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => prompt !== undefined,
    () => false,
  );
}

/** Opens the browser's install dialog and says whether the app was installed. */
export async function requestInstall(): Promise<boolean> {
  if (!prompt) return false;
  // A dialog can be opened only once.
  const dialog = prompt;
  prompt = undefined;
  changed();
  try {
    await dialog.prompt();
    return (await dialog.userChoice).outcome === "accepted";
  } catch {
    return false;
  }
}
```

### A.9 Book pages: the list, the password, the routes, the zoom

**`src/lib/bookPages.ts`**

```ts
/** Book pages that have a photo in the private store, ascending. */
const PAGES: number[] = [
  /* 8, 9, 11, 12, … */
];

export type BookPhoto = {
  /** Name of the photo in the store, and in its address: "p038", "toc1". */
  id: string;
  label: string;
  page?: number;
};

/** Every photo, in the order of the book. */
export const BOOK_PHOTOS: BookPhoto[] = [
  { id: "toc1", label: "Contents 1" },
  { id: "toc2", label: "Contents 2" },
  ...PAGES.map((page) => ({ id: `p${String(page).padStart(3, "0")}`, label: `p. ${page}`, page })),
];
```

**`src/lib/pagesAuth.ts`**

```ts
import { scryptSync, timingSafeEqual } from "node:crypto";

/** Holds the pass once the password has been given. Only the server can read it. */
export const PAGES_COOKIE = "{{slug}}-pages";

/**
 * What the cookie holds instead of the password: a hash that is slow on purpose, so a copied
 * cookie cannot be turned back into the password by trying words quickly.
 */
function passOf(password: string): string {
  return scryptSync(password, "{{slug}}-pages", 32).toString("hex");
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** The password the book photos are behind. Unset means nobody gets in. */
function password(): string | undefined {
  return process.env.PAGES_PASSWORD || undefined;
}

export function passwordIsSet(): boolean {
  return password() !== undefined;
}

/** The pass to put in the cookie, when `attempt` is the password. */
export function passFor(attempt: string): string | undefined {
  const real = password();
  if (!real) return undefined;
  const pass = realPass(real);
  return same(passOf(attempt), pass) ? pass : undefined;
}

/** Whether a cookie value is the pass for the current password. Changing the password locks everyone out. */
export function unlocked(cookie: string | undefined): boolean {
  const real = password();
  return Boolean(real && cookie && same(cookie, realPass(real)));
}

let known: { password: string; pass: string } | undefined;

/**
 * The pass for the real password. Every photo asks for it, so it is worked out once.
 * Only the server's own setting is ever compared here, never a guess.
 */
function realPass(real: string): string {
  if (known?.password !== real) known = { password: real, pass: passOf(real) };
  return known.pass;
}

const WINDOW = 10 * 60 * 1000;
const WRONG_GUESSES = 8;
/** When the recent wrong guesses were made, whoever made them. */
let wrong: number[] = [];

/**
 * Take one of the guesses that are left, or learn that guessing is paused: after 8 wrong
 * passwords, for ten minutes, for everyone. A guess counts as wrong from the moment it is
 * taken, before anything is waited for, so guesses sent at the same time cannot all slip
 * past the count. `forgive` it once it has turned out right.
 *
 * Counted per running server, which Vercel reuses between requests but may start more of,
 * so this slows guessing down a great deal without making a short password safe.
 */
export function takeGuess(now = Date.now()): number | undefined {
  wrong = wrong.filter((time) => now - time < WINDOW);
  if (wrong.length >= WRONG_GUESSES) return undefined;
  wrong.push(now);
  return now;
}

export function forgive(guess: number): void {
  const index = wrong.indexOf(guess);
  if (index >= 0) wrong.splice(index, 1);
}
```

**`src/app/api/pages/[name]/route.ts`**

```ts
import { get } from "@vercel/blob";
import { cookies } from "next/headers";
import { BOOK_PHOTOS } from "@/lib/bookPages";
import { PAGES_COOKIE, unlocked } from "@/lib/pagesAuth";

/** One photo of a book page, from the private store, for a browser that has given the password. */
export async function GET(_request: Request, context: RouteContext<"/api/pages/[name]">) {
  const jar = await cookies();
  if (!unlocked(jar.get(PAGES_COOKIE)?.value)) return new Response(null, { status: 401 });

  const { name } = await context.params;
  if (!BOOK_PHOTOS.some((photo) => photo.id === name)) return new Response(null, { status: 404 });

  const photo = await get(`pages/${name}.jpg`, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN });
  if (photo?.statusCode !== 200) return new Response(null, { status: 404 });

  return new Response(photo.stream, {
    headers: {
      "Content-Type": "image/jpeg",
      // A photo never changes, and must not be kept by anything shared between people.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
```

**`src/app/api/pages/unlock/route.ts`**

```ts
import { cookies } from "next/headers";
import { PAGES_COOKIE, forgive, passFor, passwordIsSet, takeGuess, unlocked } from "@/lib/pagesAuth";

const YEAR = 60 * 60 * 24 * 365;

/** Whether this browser has already given the password: 200 yes, 401 no, 503 no password is set. */
export async function GET() {
  if (!passwordIsSet()) return new Response(null, { status: 503 });
  const jar = await cookies();
  return new Response(null, { status: unlocked(jar.get(PAGES_COOKIE)?.value) ? 200 : 401 });
}

/** Give the password; a right one is remembered for a year. 429 means too many wrong ones lately. */
export async function POST(request: Request) {
  if (!passwordIsSet()) return new Response(null, { status: 503 });
  // Counted before the request is even read: see takeGuess.
  const guess = takeGuess();
  if (guess === undefined) return new Response(null, { status: 429 });
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const pass = typeof body?.password === "string" ? passFor(body.password) : undefined;
  if (!pass) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return new Response(null, { status: 401 });
  }
  forgive(guess);
  const jar = await cookies();
  jar.set(PAGES_COOKIE, pass, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/pages",
    maxAge: YEAR,
  });
  return new Response(null, { status: 200 });
}
```

**`src/lib/zoom.ts`**

```ts
/**
 * Enlarging a photo inside its own frame, as a phone's photo app does. The screen itself is
 * never enlarged (globals.css): two fingers on a photo make the photo bigger and nothing else.
 *
 * A size is how many times the frame's width the photo is: 1 fits it exactly.
 */

/** Enough to read the small print of a book page on a phone. */
export const MAX_ZOOM = 4;

/** What a single tap enlarges a photo to. */
export const TAP_ZOOM = 2.2;

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, 1), MAX_ZOOM);
}

/**
 * The point of a photo that is under the fingers: how far into the photo it lies, measured at
 * size 1. `scroll` is how far the frame has been scrolled, `at` where in the frame the fingers are.
 */
export function heldAt(scroll: number, at: number, zoom: number): number {
  return (scroll + at) / zoom;
}

/** How far the frame must be scrolled for that point to lie under the fingers at another size. */
export function scrollFor(held: number, at: number, zoom: number): number {
  return held * zoom - at;
}
```

**`src/components/BookPages.tsx (the zoom hook; the screens around it are section 9)`**

```tsx
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { TAP_ZOOM, clampZoom, heldAt, scrollFor } from "@/lib/zoom";

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
```

### A.10 Offline

**`public/sw.js`**

```js
// Offline support. The app is a single page ("/") plus hashed build files, so:
//  - the page is served from cache at once and refreshed in the background,
//  - build files are cached forever (their names change when their content does),
//  - a photo of a book page is kept once it has been looked at.
const CACHE = "{{slug}}-v1";
const ASSET = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\\\s)<>]+/g;

/** Every build file a page refers to, as absolute paths. */
function assetsOf(html) {
  const found = new Set();
  for (const hit of html.match(ASSET) ?? []) {
    found.add(hit.startsWith("/_next/") ? hit : `/_next/${hit}`);
  }
  return [...found];
}

/**
 * Fetch the page and everything it needs, and only then replace the cached copy.
 * Swapping the page first could leave a new page pointing at files that were never cached.
 */
async function refreshPage() {
  const response = await fetch("/", { cache: "no-store" });
  if (!response.ok) return response;
  const cache = await caches.open(CACHE);
  const html = await response.clone().text();
  const arrived = await Promise.all(
    assetsOf(html).map(async (url) => {
      if (await cache.match(url)) return true;
      return cache.add(url).then(
        () => true,
        () => false,
      );
    }),
  );
  // One file short, the new page would not start offline: the page already cached stays.
  if (arrived.every(Boolean)) await cache.put("/", response.clone());
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    refreshPage()
      .then(() => caches.open(CACHE))
      .then((cache) => cache.addAll(["/manifest.webmanifest", "/icons/icon-192.png"]).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// The first visit loads before this worker is in control; the page then reports what it loaded.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-urls") return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.urls.map(async (url) => {
          if (!(await cache.match(url))) await cache.add(url).catch(() => {});
        }),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/").then((cached) => {
        const fresh = refreshPage().catch(() => cached);
        if (cached) {
          event.waitUntil(fresh);
          return cached;
        }
        return fresh;
      }),
    );
    return;
  }

  // Only a photo that loaded is kept: a locked one (401) is asked for again.
  const photo = url.pathname.startsWith("/api/pages/") && url.pathname !== "/api/pages/unlock";
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || photo) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
            }
            return response;
          }),
      ),
    );
  }
});
```

**`src/components/ServiceWorker.tsx`**

```tsx
"use client";

import { useEffect } from "react";

/** Registers the offline worker and hands it the files this visit already loaded. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    navigator.serviceWorker.ready
      .then((registration) => {
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => new URL(entry.name))
          .filter((url) => url.origin === location.origin && url.pathname.startsWith("/_next/static/"))
          .map((url) => url.pathname);
        registration.active?.postMessage({ type: "cache-urls", urls });
      })
      .catch(() => {});
  }, []);
  return null;
}
```

### A.11 The shell

**`src/components/App.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { deckById, pickedFor, type Deck, type Exercise } from "@/lib/decks";
import { STAGE } from "@/lib/motion";
import { useView } from "@/lib/nav";
import { settingsStore } from "@/lib/progress";
import { BlitzSprint } from "./BlitzSprint";
import { Cheer } from "./Cheer";
import { DeckPage } from "./DeckPage";
import { Home } from "./Home";
import { ListView } from "./ListView";
import { releaseSplash } from "./Splash";
import { Study } from "./Study";

export function App() {
  // By now the screen is drawn from what this phone has saved, so the splash may open on it.
  useEffect(releaseSplash, []);
  return (
    <>
      {/* The screen stands alone in here, so that a change of screen can be told and can move (motion.ts). */}
      <div id={STAGE}>
        <Screen />
      </div>
      <Cheer />
    </>
  );
}

function Screen() {
  const view = useView();
  if (view.name === "tab") return <Home tab={view.tab} />;
  if (view.name === "blitz") return <BlitzSprint />;
  const deck = deckById(view.deck);
  if (!deck) return <Home tab="chapters" />;
  if (view.name === "deck") return <DeckPage deck={deck} />;
  if (view.exercise === "list") return <ListView deck={deck} />;
  if (view.exercise === "weak") return <ListView deck={deck} weakOnly />;
  // A new key per deck and exercise starts a fresh round.
  return <Session key={`${deck.id}:${view.exercise}`} deck={deck} exercise={view.exercise} />;
}

/** "mix" runs whatever is ticked on the deck screen; any other exercise can still be opened on its own. */
function Session({ deck, exercise }: { deck: Deck; exercise: Exercise }) {
  const exercises = exercise === "mix" ? pickedFor(deck, settingsStore.get()) : [exercise];
  return <Study deck={deck} exercises={exercises} />;
}
```

**`src/components/ViewportSync.tsx`**

```tsx
"use client";

import { useEffect } from "react";

const KEYBOARD_MIN_HEIGHT = 120;

/**
 * Keeps the app exactly as tall as the part of the screen that is really visible.
 * On iPhones the on-screen keyboard covers the page instead of resizing it, which
 * would hide whatever sits at the bottom: the button to check an answer.
 */
export function ViewportSync() {
  // Safari announces two fingers with an event of its own, and enlarges the screen unless it is
  // told not to. The styles already say so (touch-action); this is for a Safari that does not listen.
  useEffect(() => {
    const refuse = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", refuse);
    return () => document.removeEventListener("gesturestart", refuse);
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const sync = () => {
      // A pinch-zoomed page also has a smaller visual viewport; leave the layout alone then.
      if (Math.abs(viewport.scale - 1) > 0.01) return;
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`);
      root.classList.toggle("keyboard", window.innerHeight - viewport.height > KEYBOARD_MIN_HEIGHT);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);
  return null;
}
```

**`src/components/Splash.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ms } from "@/lib/motion";
import { MarkEyes, MarkLetter, ON_TILE } from "./Mark";

const ID = "splash";
/** Every keyframe that belongs to the cover going away starts with this (Motion, globals.css). */
const LEAVING = "splash-out";
/** The last of them: after it there is nothing left to see. */
const END = "splash-out-end";

function leaving(splash: HTMLElement): CSSAnimation[] {
  return splash
    .getAnimations({ subtree: true })
    .filter(
      (animation): animation is CSSAnimation =>
        animation instanceof CSSAnimation && animation.animationName.startsWith(LEAVING),
    );
}

let released = false;

/**
 * The app is on screen with the learner's own numbers: the cover need not wait out its own
 * deadline. It still lets the blink finish, then goes at once. Nothing but the clock is touched,
 * so a splash this never reaches goes all the same.
 */
export function releaseSplash() {
  const splash = document.getElementById(ID);
  if (released || !splash?.getAnimations) return;
  released = true;
  const hold = ms(splash, "--splash-hold");
  const leave = ms(splash, "--splash-leave");
  for (const animation of leaving(splash)) {
    const elapsed = Number(animation.currentTime ?? 0);
    animation.currentTime = elapsed + Math.max(0, leave - Math.max(elapsed, hold));
  }
}

/**
 * What the app opens with: the icon's face on paper. It blinks once, and the cover parts along
 * the line of its eyes to show the app. Drawn by the server, so it is the first thing painted and
 * hides the moment in which the page still shows nobody's numbers; timed by the styles alone, so
 * it goes even if no script ever runs. It takes no taps, and screen readers are not told of it.
 */
export function Splash() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const splash = document.getElementById(ID);
    const end = splash?.getAnimations ? leaving(splash).find((animation) => animation.animationName === END) : undefined;
    let mounted = true;
    end?.finished.then(
      () => mounted && setGone(true),
      // Cancelled (the styles changed under it): the cover is hidden by them either way.
      () => {},
    );
    return () => {
      mounted = false;
    };
  }, []);

  if (gone) return null;
  return (
    <div id={ID} className="splash" aria-hidden="true">
      <span className="splash-lid splash-lid-upper" />
      <span className="splash-lid splash-lid-lower" />
      <span className="splash-mark">
        <Face />
      </span>
    </div>
  );
}

/**
 * The face as it is on the home-screen icon (Mark.tsx), in the app's own yellow and ink. The
 * eyes lie on a layer of their own (.splash-eyes), so they can close.
 */
function Face() {
  return (
    <>
      <svg viewBox="0 0 512 512">
        <rect width="512" height="512" rx="112" className="fill-accent" />
        <g transform={ON_TILE} className="fill-accent-ink">
          <MarkLetter />
        </g>
      </svg>
      <svg viewBox="0 0 512 512" className="splash-eyes fill-accent-ink">
        <g transform={ON_TILE}>
          <MarkEyes />
        </g>
      </svg>
    </>
  );
}
```

**`src/components/Sheet.tsx`**

```tsx
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
          <h2 className="pt-1.5 font-serif text-[24px] font-semibold leading-tight">{title}</h2>
          {detail && <p className="mt-0.5 text-[15px] text-muted">{detail}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
```

### A.12 Interface primitives
From `src/components/ui.tsx`. The same file also holds `Target`, `Gapped`, `ParadigmTable` and `ChapterHead`: section 7.5.

**`src/components/ui.tsx`**

```tsx
import type { CSSProperties, ElementType, ReactNode } from "react";

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

// … Target, Gapped, ParadigmTable: section 7.5 …

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
```

### A.13 Grammar blocks and tables that fit

**`src/components/GrammarBlocks.tsx`**

```tsx
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
                <span lang={TARGET} className="block font-serif text-[19px] font-medium leading-snug">
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
 * teaches: they stand in the serif, and the translation beside them steps back. The base language
 * is hyphenated when the table is.
 */
const CELL: Record<TableColumn, string> = {
  // Kept a step under the body size, so that a table of four forms still fits a narrow phone whole.
  target: "whitespace-nowrap hyphens-none font-serif text-[16px] font-medium",
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
```

### A.14 Icons and launch screens

**`scripts/brand-assets.mjs`**

```js
// Draws every picture the installed app needs, from the SVGs in brand/:
// the home-screen icons, and the iOS launch screens that stand in for the white flash.
//
//   node scripts/brand-assets.mjs
//
// It uses sharp, which comes with Next (it is not a dependency of its own). The output is
// committed, so this runs only when the mark changes. Nothing in brand/ is written to.

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/** The app's paper in the dark theme (--bg in globals.css): what the launch screens are filled with. */
const PAPER = "#151412";
/** The brand yellow: what fills the corners of the Apple icon, which iOS rounds by itself. */
const YELLOW = "#ffe000";
/** The tile on the launch screens in CSS pixels: the splash's --splash-size, 6rem at 16px (globals.css). */
const TILE = 96;
/** Apple's icon is always 180 by 180. */
const APPLE_ICON = 180;

/**
 * Each iPhone and iPad, portrait: width and height in CSS points, and pixels per point.
 * Keep the list in step with `startupImage` in src/app/layout.tsx.
 */
const DEVICES = [
  [440, 956, 3],
  [430, 932, 3],
  [428, 926, 3],
  [420, 912, 3],
  [414, 896, 3],
  [414, 896, 2],
  [402, 874, 3],
  [393, 852, 3],
  [390, 844, 3],
  [375, 812, 3],
  [375, 667, 2],
  [414, 736, 3],
  [768, 1024, 2],
  [820, 1180, 2],
  [834, 1194, 2],
  [1024, 1366, 2],
];

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = (name) => readFile(path.join(root, "brand", name), "utf8");

/** The SVG at an exact size in pixels. The density is set first so curves are drawn at that size, not scaled up. */
function raster(svg, size) {
  return sharp(Buffer.from(svg), { density: (72 * size) / 512 }).resize(size, size);
}

/** Smallest file for flat art: nothing here is photographic, so every pixel keeps its colour. */
const PNG = { compressionLevel: 9, effort: 10 };

async function write(file, image, options = PNG) {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, await image.png(options).toBuffer());
  const { width, height, hasAlpha } = await sharp(target).metadata();
  const { size } = await stat(target);
  console.log(`${file}  ${width}x${height}  ${hasAlpha ? "alpha" : "opaque"}  ${size} bytes`);
}

/** What lies between the outer <svg> tags, so the icon can be placed inside a larger picture. */
function inside(svg) {
  return svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];
}

/** A launch screen: paper to the edges, the icon tile in the middle, as the splash draws it. */
function launchScreen(icon, [width, height, ratio]) {
  const [w, h, tile] = [width * ratio, height * ratio, TILE * ratio];
  // Where the splash puts it: dead centre of the screen. On a phone of odd size that is half a pixel.
  const [x, y] = [(w - tile) / 2, (h - tile) / 2];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${PAPER}"/>
  <svg x="${x}" y="${y}" width="${tile}" height="${tile}" viewBox="0 0 512 512">${inside(icon)}</svg>
</svg>`;
  return sharp(Buffer.from(svg), { density: 72 });
}

const icon = await brand("icon.svg");
const maskable = await brand("icon-maskable.svg");
const monochrome = await brand("icon-monochrome.svg");

// The icon, with the see-through corners of its rounded tile.
for (const size of [192, 512]) {
  await write(`public/icons/icon-${size}.png`, raster(icon, size));
}

// The same on a full yellow square, with the mark inside Android's safe circle: Android cuts its own shape.
for (const size of [192, 512]) {
  await write(`public/icons/icon-maskable-${size}.png`, raster(maskable, size).removeAlpha());
}

// The mark alone, for Android to tint.
await write("public/icons/icon-monochrome-512.png", raster(monochrome, 512));

// iOS shows the whole square and rounds it itself, so this one has no corners and no alpha.
// It is drawn from the icon rather than the maskable art: that one keeps its mark small for Android's
// circle and would look lost here. The icon's own tile has the corner radius iOS uses, so the mark
// sits the same in it. The corners are filled with yellow before they can show through.
await write("src/app/apple-icon.png", raster(icon, APPLE_ICON).flatten({ background: YELLOW }));

// Flat colour and a few edge tones: a palette of 256 holds it exactly and the files stay small.
for (const device of DEVICES) {
  const [width, height, ratio] = device;
  const name = `apple-splash-${width * ratio}x${height * ratio}.png`;
  await write(`public/splash/${name}`, launchScreen(icon, device), { ...PNG, palette: true, colours: 256, dither: 0 });
}
```

---

## Appendix B. The stylesheet

`src/app/globals.css`, whole. The tokens, the base rules for a phone, and all the motion.

**`src/app/globals.css`**

```css
@import "tailwindcss";

:root {
  /* One theme, the dark one: a page read at night. Nothing here follows the system's light mode. */
  color-scheme: dark;
  /* Paper and ink. The paper is the one the launch screens are printed on (scripts/brand-assets.mjs). */
  --bg: #151412;
  /* Raised a step: fields, buttons, the bars at the foot of a screen. */
  --surface: #201e1b;
  /* Warm white, 16:1 on the paper. Pure white would glare on it. */
  --ink: #f5f1e8;
  /* Secondary text: 8.7:1 on the paper, 7.9:1 on the raised surface. It never stands on a filled line. */
  --muted: #b9b2a4;
  /* Three weights of line. --line parts one row from the next, --edge draws a control that
     can be tapped (3.9:1 on the paper, 3.5:1 on the surface), --rule opens a section. */
  --line: #37332c;
  --edge: #7a7365;
  --rule: #9a9384;
  /* The one yellow: the icon's own (Mark.tsx, brand/). The next thing to do, the current tab,
     progress. 14:1 on the paper, and brand black is 14:1 on it. */
  --accent: #ffe000;
  --accent-press: #e6ca00;
  --accent-ink: #111111;
  /* The highlighter. On a dark page it cannot be a wash under light letters, which would dim
     them: it is the yellow itself, with the letters in black on it. */
  --mark: var(--accent);
  --mark-ink: var(--accent-ink);
  /* The text cursor: the highlighter again. */
  --caret: var(--accent);
  /* Right and wrong. Each is bright enough to be read as text on the paper (7:1 and more)
     and to carry black text as a band (8:1 and more), so there is one green and one red. */
  --good: #49de78;
  --bad: #ff8b75;
  /* Tag colours: kept for the profile's marker, a class of words worth telling apart by colour,
     and thrown by the confetti. Blue, pink and blue-green, each
     7.6:1 or more even on the raised surface, and set as far from each other, from the yellow
     and from the green and red of a verdict as three such colours can be. */
  --tag-1: #8daffe;
  --tag-2: #fe8acf;
  --tag-3: #4ae6d6;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-line: var(--line);
  --color-edge: var(--edge);
  --color-rule: var(--rule);
  --color-accent: var(--accent);
  --color-accent-press: var(--accent-press);
  --color-accent-ink: var(--accent-ink);
  --color-good: var(--good);
  --color-bad: var(--bad);
  --color-tag-1: var(--tag-1);
  --color-tag-2: var(--tag-2);
  --color-tag-3: var(--tag-3);
  --font-sans: var(--font-ui), system-ui, sans-serif;
  --font-serif: var(--font-word), Georgia, serif;
}

/* Native feel on phones: no tap flash, no pull-to-refresh, no rubber-band reload. */
* {
  -webkit-tap-highlight-color: transparent;
}

html,
body {
  overscroll-behavior: none;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  -webkit-text-size-adjust: 100%;
}

button,
a,
[role="button"],
summary {
  user-select: none;
  -webkit-user-select: none;
}

button {
  cursor: pointer;
}

/* In the base layer so that utility classes on an element can still override these. */
@layer base {
  /*
   * The screen is never enlarged, as an app's is not: one finger scrolls, two do not zoom, and
   * a double tap does not either (so no tap waits to see whether a second one follows). Said on
   * every element, because Safari forgets what an ancestor said at each thing that scrolls.
   * A photo is enlarged inside its own frame instead (BookPages.tsx).
   */
  * {
    touch-action: pan-x pan-y;
  }

  /* iOS zooms into any field under 16px and never zooms back out. */
  input,
  select,
  textarea {
    font-size: 16px;
  }

  :focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  /* The parts the browser draws carry the same ink and the same yellow. */
  :root {
    accent-color: var(--accent);
    scrollbar-color: var(--edge) transparent;
  }

  ::selection {
    background: var(--mark);
    color: var(--mark-ink);
  }

  input,
  textarea {
    caret-color: var(--caret);
  }
}

/* A text link: ink with a firm underline, so it reads as something to tap. */
@utility link {
  text-decoration-line: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
  text-decoration-color: var(--edge);
}

/* The highlighter over a few letters: the answer in a gap, the ending a word takes, the right answer after a miss. */
@utility hl {
  background: var(--mark);
  color: var(--mark-ink);
  border-radius: 3px;
  /* A little more on the right: the serif's f and r reach past their own width. */
  padding-inline: 0.12em 0.18em;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

/* The same stroke drawn under the letters, where they must keep a colour of their own: a marker. */
@utility hl-under {
  text-decoration-line: underline;
  text-decoration-color: var(--mark);
  text-decoration-thickness: 0.13em;
  text-underline-offset: 0.16em;
  text-decoration-skip-ink: none;
}

/* Half highlighted: what is being learnt but is not yet known. Told apart by pattern, not by hue alone. */
@utility hatch {
  background-image: repeating-linear-gradient(-45deg, var(--accent) 0 2px, transparent 2px 5px);
}

/*
 * The app owns the whole visible screen; each view scrolls inside it. Height and
 * offset follow the visual viewport (see ViewportSync), so the bottom of a screen
 * stays above the on-screen keyboard.
 */
.app-shell {
  position: fixed;
  top: var(--app-top, 0px);
  left: 0;
  right: 0;
  height: 100vh;
  height: var(--app-height, 100dvh);
  display: flex;
  flex-direction: column;
  max-width: 34rem;
  margin: 0 auto;
}

.pad-top {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}

.pad-bottom {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

/* With the keyboard up there is no home indicator to keep clear of. */
.keyboard .pad-bottom {
  padding-bottom: 0.5rem;
}

/*
 * Up and down, and never sideways. A box told to scroll one way scrolls the other way too the
 * moment anything in it reaches past its edge, and a card on its way in from the right does
 * (onward): Safari then let the whole screen be pushed aside. What is meant to scroll sideways
 * inside one of these (a wide table, an enlarged photo) is a box of its own and still does.
 */
.scroll-y {
  overflow-x: hidden;
  overflow-y: auto;
  touch-action: pan-y;
  scrollbar-width: thin;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

/* The mascot's face (Mark.tsx) when it is content: both eyes shut to a line. Each eye scales about its own middle. */
.mark[data-eyes="closed"] .mark-eye {
  transform: scaleY(0.2);
}

/* ══════════════════════════════════════════════════════════════════════════════════════
   Motion

   One clock and one set of curves for everything that moves. What arrives slows into its
   place; what leaves is quicker and gets out of the way; what answers a finger is over
   before the finger lifts. Nothing waits for an animation: the new state is always there
   already, taking taps, and the motion is laid over it.

   Each kind of change has one way of showing, so that the way itself says what happened:

     what comes, travels      a screen or the next card from the right, a verdict from below,
                              a sheet from the foot of the screen (transform)
     what is shown, settles   an answer under its question, a rule under its heading (opacity,
                              and a few pixels from the thing it belongs to)
     what is marked, is drawn a tick, the highlighter, the fill of a bar: a cut moves across
                              something already laid out (clip-path)
     what is pressed, gives   at once, and eases back

   Transform, opacity and clip-path do it, so nothing is laid out again and a busy phone
   keeps time (the one exception, the highlighter's yellow, says why; it lays nothing out
   either). There are two pieces of theatre: the splash, and the small moment when a round
   is over and its result comes in. Everything else stays quiet.
   ══════════════════════════════════════════════════════════════════════════════════════ */

:root {
  /* How long. */
  --dur-fast: 140ms; /* an answer to the finger: a press, a tick, a change of tab */
  --dur-exit: 180ms; /* leaving */
  --dur-enter: 260ms; /* arriving */
  --dur-slow: 340ms; /* a whole gesture, there to be seen: the hop and the shake of an answer */
  /* Not for coming or going. A line drawn by hand, timed to be seen as drawn and not waited for;
     the splash's blink has always taken as long (half of --splash-hold). */
  --dur-stroke: 200ms; /* one stroke: the highlighter over a word, the blink of an eye */
  /* Along what curve. */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* arrives fast, settles gently */
  --ease-in: cubic-bezier(0.4, 0, 1, 1); /* leaves without lingering */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* goes from one place on screen to another */
  /* How far a screen travels as it comes. */
  --shift: 24px;
  /* Tailwind's `transition-*` and `ease-*` utilities keep the same time. */
  --default-transition-duration: var(--dur-fast);
  --default-transition-timing-function: var(--ease-out);
}

/*
 * The splash (Splash.tsx): the first thing painted, before any script has run. The icon's
 * face is on the paper, exactly where the phone's own launch screen showed it (public/splash),
 * so the two are one picture. It blinks once; then the cover opens along the line of its eyes,
 * the way they just did, and the app is behind it.
 *
 * From the first paint: 0 the face is there, 200 to 400 it blinks, and then the cover opens in
 * 300. "Then" is 400 when the app is ready by that time, because Splash.tsx winds the clock
 * forward. It is --splash-leave at the very latest, script or no script, so the cover can
 * never stay. Everything that belongs to its going is named splash-out-*.
 */
.splash {
  --splash-size: 6rem;
  /* Splash.tsx reads these two. */
  --splash-hold: 400ms;
  --splash-leave: 1400ms;
  --splash-open: 300ms;
  /* The line of the eyes, where the cover parts: they sit 91 of 512 down the icon. */
  --splash-seam: calc(50% - var(--splash-size) * 0.3222);
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  /* It is only ever looked at. A tap goes to the app, even one that comes early. */
  pointer-events: none;
  animation: splash-out-end 0s linear calc(var(--splash-leave) + var(--splash-open)) forwards;
}

.splash-lid {
  position: absolute;
  left: 0;
  right: 0;
  background: var(--bg);
  animation: splash-out-lid var(--splash-open) cubic-bezier(0.45, 0, 0.15, 1) var(--splash-leave) forwards;
}

.splash-lid-upper {
  --to: -100%;
  top: 0;
  /* A pixel of overlap, so no line of the app shows between the two. */
  height: calc(var(--splash-seam) + 1px);
}

.splash-lid-lower {
  --to: 100%;
  top: var(--splash-seam);
  bottom: 0;
}

.splash-mark {
  position: relative;
  width: var(--splash-size);
  height: var(--splash-size);
  animation: splash-out-mark var(--dur-fast) var(--ease-in) var(--splash-leave) forwards;
}

.splash-mark svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* A layer of their own: an eye that closes is then a matter for the graphics chip alone. */
.splash-eyes {
  transform-origin: 50% 17.78%;
  animation: splash-blink calc(var(--splash-hold) / 2) linear calc(var(--splash-hold) / 2);
}

/* Shut quickly, open a little more slowly, as an eye does. */
@keyframes splash-blink {
  from {
    transform: scaleY(1);
    animation-timing-function: var(--ease-in);
  }
  40% {
    transform: scaleY(0.08);
    animation-timing-function: var(--ease-out);
  }
  to {
    transform: scaleY(1);
  }
}

@keyframes splash-out-lid {
  to {
    transform: translateY(var(--to));
  }
}

@keyframes splash-out-mark {
  to {
    opacity: 0;
    transform: scale(1.12);
  }
}

@keyframes splash-out-fade {
  to {
    opacity: 0;
  }
}

/* Gone: not drawn, not in the way of a tap, not there for a screen reader. */
@keyframes splash-out-end {
  to {
    visibility: hidden;
  }
}

/*
 * From screen to screen (motion.ts). The new screen is in place at once. A still of the old
 * one lies on top of it, on paper of its own, and clears like breath off a window.
 *
 *   deeper    the old screen draws away to the left, the new one comes in from the right
 *   back      the same, the other way
 *   sideways  another tab: the one clears into the other, and nothing travels
 *
 * The two screens are one movement, so they ride one curve, side by side like two frames of
 * a film. That curve does most of its work at once: the old screen is nearly gone within
 * three frames, so two pages of words are never read through each other, and what is left
 * to watch is the new screen coming to rest.
 */
.ghost {
  position: fixed;
  inset: 0;
  z-index: 15;
  background: var(--bg);
  pointer-events: none;
  animation: ghost-clear var(--dur-exit) var(--ease-out) forwards;
}

.ghost[data-nav="tab"] {
  animation-duration: var(--dur-fast);
}

/* A still does not move by itself: whatever was mid-flight in the old screen is shown landed. */
.ghost * {
  animation: none !important;
  transition: none !important;
}

.ghost[data-nav="open"] > *,
.ghost[data-nav="close"] > * {
  --to: calc(var(--shift) * -1);
  animation: ghost-recede var(--dur-enter) var(--ease-out) forwards !important;
}

.ghost[data-nav="close"] > * {
  --to: var(--shift);
}

#stage[data-nav="open"] > .app-shell,
#stage[data-nav="close"] > .app-shell {
  --from: var(--shift);
  animation: screen-in var(--dur-enter) var(--ease-out);
}

#stage[data-nav="close"] > .app-shell {
  --from: calc(var(--shift) * -1);
}

@keyframes ghost-clear {
  to {
    opacity: 0;
  }
}

@keyframes ghost-recede {
  to {
    transform: translateX(var(--to));
  }
}

@keyframes screen-in {
  from {
    transform: translateX(var(--from));
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

/*
 * A press, and there is one. Down at once: while the finger is on it nothing eases. Let go,
 * it comes back in --dur-fast, and so does a colour the tap changed (a choice judged, a chip
 * switched on). A button sinks a little under the finger (press). A row of a list or a word
 * in a line of text is too wide or too slight to sink, and dims instead (press-dim).
 *
 * The sinking is `scale`, not `transform`: it is then its own, and the hop of a right answer
 * starts from wherever the press had got to.
 */
@utility press {
  transition-property: scale, background-color, border-color, color;
  transition-duration: var(--dur-fast);
  transition-timing-function: var(--ease-out);

  &:active:not(:disabled) {
    scale: 0.97;
    transition-duration: 0s;
  }
}

@utility press-dim {
  transition: opacity var(--dur-fast) var(--ease-out);

  &:active:not(:disabled) {
    opacity: 0.6;
    transition-duration: 0s;
  }
}

/*
 * What comes next on a screen that stays comes as a screen does, from the right: the next
 * card, the next question, the install guide over the app. A step that leads back (an answer
 * taken back) comes from the left. Only what is read moves; what is tapped is in place from
 * the first frame.
 */
.onward {
  --from: var(--shift);
  animation:
    screen-in var(--dur-enter) var(--ease-out),
    fade-in var(--dur-exit) var(--ease-out);
}

.onward[data-way="back"] {
  --from: calc(var(--shift) * -1);
}

/*
 * A sheet (Sheet.tsx) rises from the foot of the screen, and the screen behind it darkens.
 * The veil is a layer of its own, so each of the two is a matter for the graphics chip alone.
 * Closed, the sheet is gone that instant: the screen under it takes taps and the focus is
 * back where it was. What is seen falling is a still (motion.ts), quicker than it rose, and
 * from wherever it had got to if it was closed on its way up.
 */
.sheet::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.65);
  animation: fade-in var(--dur-enter) var(--ease-out);
}

.sheet-panel {
  position: relative;
  animation: sheet-rise var(--dur-enter) var(--ease-out);
}

.sheet-ghost {
  position: fixed;
  inset: 0;
  z-index: 15;
  pointer-events: none;
}

.sheet-ghost * {
  animation: none !important;
  transition: none !important;
}

.sheet-ghost .sheet::before {
  animation: sheet-clear var(--dur-exit) var(--ease-in) forwards;
}

.sheet-ghost .sheet-panel {
  animation: sheet-fall var(--dur-exit) var(--ease-in) forwards !important;
}

@keyframes sheet-rise {
  from {
    transform: translateY(100%);
  }
}

@keyframes sheet-fall {
  from {
    transform: translateY(var(--at, 0px));
  }
  to {
    transform: translateY(100%);
  }
}

@keyframes sheet-clear {
  from {
    opacity: var(--veil, 1);
  }
  to {
    opacity: 0;
  }
}

/* Something the app has to say, on a screen that stays: it comes up into its place. */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

.rise {
  animation: rise var(--dur-enter) var(--ease-out);
}

/*
 * Something the learner asked to see, which was under what is above it all along: the answer
 * under its question, the next hint, a rule under its heading. It comes out from there. The
 * heading does not move, and neither does anything below: what opens is in its full height
 * at once.
 */
@keyframes settle {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
}

.settle,
details[open] > summary ~ * {
  animation: settle var(--dur-enter) var(--ease-out);
}

/*
 * In one place, one thing clears as another comes through: a covered word that is peeked at,
 * the steps for another browser. What clears lies on top and takes no taps.
 */
.cross-in {
  animation: fade-in var(--dur-fast) var(--ease-out);
}

.cross-out {
  opacity: 0;
  pointer-events: none;
  animation: cross-out var(--dur-fast) var(--ease-out);
}

@keyframes cross-out {
  from {
    opacity: 1;
  }
}

/*
 * Drawn from the left, as the hand draws: a cut moves across something that is already in its
 * place, so no letter and no line is laid out again. It reaches a little past the box, where
 * an underline does. For a thing that stands on one line: a tick, a marker.
 */
@keyframes draw {
  from {
    clip-path: inset(-0.2em 100% -0.2em -0.2em);
  }
  to {
    clip-path: inset(-0.2em);
  }
}

/* A box ticked by this tap: the tick is drawn in the time the tap takes. */
.tick-draw {
  animation: draw var(--dur-fast) var(--ease-out);
}

/*
 * The highlighter writes. Over what has only just been shown (the right answer in a verdict,
 * the word that goes into a gap) it is drawn once, at the even pace of a marker over a word.
 * A highlight that is part of a page, in a list or a table of forms, was always there.
 *
 * The yellow is drawn out as a layer of its own, line by line where an answer takes several:
 * each line of the mark is a box to itself (hl clones them), and each fills from its own left
 * edge. The letters are the marker's black, which the dark page does not show until the
 * yellow is under them, so the word appears as the stroke passes. This is the one thing here
 * that is painted rather than cut: a cut (clip-path) takes a mark of several lines for its
 * first line alone and drops the rest until the end. Nothing is laid out for it either.
 */
.hl.hl-write {
  background: linear-gradient(var(--mark), var(--mark)) 0 0 / 100% 100% no-repeat;
  animation: write var(--dur-stroke) var(--ease-in-out);
}

@keyframes write {
  from {
    background-size: 0% 100%;
  }
}

/* Where the highlighter is a stroke under a marker, which keeps its own colour, the cut does it: a marker never takes two lines. */
.hl-under.hl-write {
  animation: draw var(--dur-stroke) var(--ease-in-out);
}

/*
 * A bar (ui.tsx, Fill). Its fill is as wide as its track, and cut off where its value ends:
 * a new value moves the cut and nothing is laid out again. The cut is rounded by itself, so
 * it does not lean on the track to clip it, which a moving layer can escape on an iPhone.
 * --bar-ease is for the one bar that is a clock.
 */
.bar-fill {
  clip-path: inset(0 calc(100% - var(--value, 0) * 100%) 0 0 round var(--bar-round, 99px));
  transition: clip-path var(--dur-enter) var(--bar-ease, var(--ease-out));
}

@keyframes bar-in {
  from {
    clip-path: inset(0 100% 0 0 round var(--bar-round, 99px));
  }
}

/* A right answer: the answer gives a small hop and confetti flies. Up quickly, down a little more slowly. */
@keyframes pop {
  30% {
    transform: scale(1.04);
  }
}

.pop {
  animation: pop var(--dur-slow) var(--ease-out);
}

/* A wrong answer shakes its head: each turn smaller than the one before, and it is still. */
@keyframes shake {
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(1.5px);
  }
}

.shake {
  animation: shake var(--dur-slow) var(--ease-in-out);
}

/*
 * The verdict (ui.tsx) comes up from below while the answer hops or shakes: one gesture, on
 * one clock, and all of it is still at the same moment. Whatever stands under the verdict to
 * be tapped is in its place from the first frame.
 */
@keyframes verdict {
  from {
    opacity: 0;
    transform: translateY(var(--shift));
  }
}

.verdict {
  animation: verdict var(--dur-slow) var(--ease-out);
}

/*
 * A round is over (the summaries in BlitzSprint.tsx and Study.tsx): the app's second and last
 * authored moment. The result comes in from the top down, each part (--i) half a beat after
 * the one above it and the last no more than a fifth of a second after the first. Its bars
 * fill as they come. The mascot has been watching: it blinks as it lands, the blink of the
 * splash, and where it is content it shuts its eyes then, and does not arrive with them shut.
 * The buttons at the foot are no part of this. They are there, and they work, from the start.
 */
.summary > * {
  animation: rise var(--dur-enter) var(--ease-out) calc(var(--dur-fast) / 2 * var(--i, 0)) backwards;
}

.summary .bar-fill {
  animation: bar-in var(--dur-slow) var(--ease-out) calc(var(--dur-fast) / 2 * var(--i, 0)) backwards;
}

.summary .mark-eye {
  animation: splash-blink var(--dur-stroke) linear var(--dur-fast);
}

.summary .mark[data-eyes="closed"] .mark-eye {
  animation: eyes-shut var(--dur-stroke) var(--ease-in-out) var(--dur-fast) backwards;
}

@keyframes eyes-shut {
  from {
    transform: scaleY(1);
  }
}

/* Blitz: the button that shows the answer fills up while the learner thinks. */
@keyframes fill {
  from {
    clip-path: inset(0 100% 0 0);
  }
}

/*
 * A cut that moves, as in a bar: nothing is laid out while the learner thinks. The fill has
 * the button's own corners and is its full size, so it never leans on the button to clip it.
 */
.fill {
  clip-path: inset(0);
  animation: fill linear both;
}

/*
 * Confetti (Cheer.tsx): thrown up and out, then left to fall. Two legs, each on its own
 * curve, make the arc: quick off the mark and slowing to the top, then gathering speed down.
 */
@keyframes burst-piece {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0) scale(0.4);
    animation-timing-function: cubic-bezier(0.12, 0.7, 0.3, 1);
  }
  36% {
    transform: translate(calc(var(--dx) * 0.85), var(--dy)) rotate(calc(var(--turn) * 0.6)) scale(1);
    animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.6);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), calc(var(--dy) + 64px)) rotate(var(--turn)) scale(1);
  }
}

.burst-piece {
  animation: burst-piece 0.85s linear forwards;
}

/*
 * For those who have asked their phone for less motion: nothing travels, nothing is drawn and
 * nothing is staged. A change of screen is a short fade, and so is a sheet, the next card and
 * anything that takes another's place. The splash is the face standing still for a moment. An
 * answer is told by its colour alone, a bar is simply at its value, and what is asked for is
 * simply there. A press still gives under the finger: that is an answer, not a journey.
 */
@media (prefers-reduced-motion: reduce) {
  .rise,
  .pop,
  .shake,
  .settle,
  details[open] > summary ~ *,
  .verdict,
  .tick-draw,
  .hl.hl-write,
  .hl-under.hl-write,
  .sheet::before,
  .sheet-panel,
  .summary > *,
  .summary .bar-fill,
  .summary .mark-eye,
  .summary .mark[data-eyes="closed"] .mark-eye {
    animation: none;
  }

  .bar-fill {
    transition: none;
  }

  .burst,
  .fill,
  .ghost,
  .sheet-ghost,
  .cross-out {
    display: none;
  }

  /* A new screen fades in whole. Between tabs only the page does: the tab bar never left. */
  #stage[data-nav="open"] > .app-shell,
  #stage[data-nav="close"] > .app-shell,
  #stage[data-nav="tab"] > .app-shell > main,
  .onward,
  .sheet {
    animation: fade-in var(--dur-fast) linear;
  }

  .splash {
    --splash-hold: 300ms;
    animation:
      splash-out-fade var(--dur-fast) linear var(--splash-leave) forwards,
      splash-out-end 0s linear calc(var(--splash-leave) + var(--dur-fast)) forwards;
  }

  .splash-lid,
  .splash-mark,
  .splash-eyes {
    animation: none;
  }
}
```
