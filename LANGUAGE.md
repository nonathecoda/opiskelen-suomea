# Language profile

The app teaches **Finnish** to an **English** speaker, from *Oma suomi 2*, chapters 1–4
(pages 8–99). Each chapter ends in a *Sanasto* (word list) and most have grammar pages
(*Kielioppi*) and phrase boxes. The book is monolingual: it gives no English at all, so every
gloss is the app's own and is listed in `REVIEW.md`.

What follows is each decision `src/content/profile.ts` encodes, and why.

## Chapters

| Chapter | Label | Title | Pages | Word list |
|---|---|---|---|---|
| 1 | Kappale 1 | Peltipoliisi (Vuoden loppu) | 8–27 | p. 27 |
| 2 | Kappale 2 | Talvikirppis (Tammikuu) | 28–45 | p. 45 |
| 3 | Kappale 3 | Ensimmäiset askeleet (Helmikuu) | 46–69 | p. 69 |
| 4 | Kappale 4 | Etsitään harjoittelijoita (Maaliskuu) | 70–99 | p. 99 |

The book's word for chapter is *kappale* ("Tässä kappaleessa opit…"), so the labels are
"Kappale N". No table of contents was photographed.

## Slots

**specialKeys: ä, ö.** Every list uses them; å never appears.

**folds: none.** In Finnish a dotted and an undotted vowel make different words (*paattaa* is not
*päättää*), and so do single and double letters (*tuli* / *tulli*). Only capitals are forgiven,
which the checker does anyway.

**marker: none.** Finnish has no articles and no grammatical gender, and the lists print nothing
of the kind.

**keyForms.**

| id | For | Printed in the lists? | Drilled | Why |
|---|---|---|---|---|
| `gen` | nouns, adjectives | Yes: *asiakas, asiakkaan*; *astia, -n* | yes, shown in lists | The lists print it with every noun; the book's exercises build on it (genitive, partitive, mihin-form, p. 13). |
| `plPart` | nouns, adjectives | No | yes, not shown in lists | Chapter 1 teaches the plural partitive as something to form per word (pp. 16–18) and chapter 2 builds on it. Every form is written into the data by hand and listed in `REVIEW.md`. |
| `first` | verbs | Yes: *järjestää (1), järjestän* | yes, shown in lists | The lists print the minä-form with every verb. |

The plural genitive and plural illative (chapter 3) are taught and drilled through their grammar
topics, not stored per word: storing them for some 300 nouns would add some 600 unread forms for a
person to check, for little gain over the topics' drills.

**paradigms.** The present tense is not taught in these chapters (it belongs to the first book), so
it is not a paradigm. Chapter 4 teaches the perfect and the pluperfect as tables with their
negatives (pp. 74, 79), so each verb has four:

| id | Label | Built as |
|---|---|---|
| `perfect` | Perfect | olen / olet / on + participle; olemme / olette / ovat + plural participle |
| `perfect-neg` | Perfect, negative | en / et / ei ole …; emme / ette / eivät ole … |
| `pluperfect` | Pluperfect | olin / olit / oli …; olimme / olitte / olivat … |
| `pluperfect-neg` | Pluperfect, negative | en / et / ei ollut …; emme / ette / eivät olleet … |

The person labels are the book's: minä, sinä, hän, me, te, he. They are shown in two columns,
singular left and plural right; a table whose forms do not fit goes to one column in person order.

**verbClasses: types 1–5.** The lists print the book's verb type in brackets, *(1)* to *(5)*. Type 6
does not occur. The hints for each type say how its past participle is made, as p. 75 shows it
(*luke|a → lukenut*, *syö|dä → syönyt*, *kuunnel|la → kuunnellut*, *tava|ta → tavannut*,
*häiri|tä → häirinnyt*), using the book's own example verbs so that a hint never gives away the
verb being asked.

## Further decisions

**Word classes.** Nouns and adjectives (the app decides which; the book does not say), verbs,
phrases (fixed expressions, sentences, spoken-language words) and "small words" (adverbs and words
that do not change). There are no numbers in these lists.

**Verbs without a minä-form.** Where the list gives a verb only with its type (*tapahtua (1)*) or
with an impersonal use (*haitata (4), minua haittaa*), it is used in the third person only. Those
entries are "small words" with a note, not verbs: a table of six persons would invent forms the
book does not teach.

**Expressions in the lists.** An entry such as *ottaa (1), otan selvää + mistä* is entered as the
expression *ottaa selvää* with the book's line as its note.

**Stored, not generated.** Every genitive, plural partitive and past participle is data. The only
rule in code builds a plural participle from the singular (-ut/-yt → -eet) and adds the forms of
*olla*; it has no exception in the vocabulary, and a content test proves it over every verb.

**Alternatives.** Where the book allows two plural partitives (long words in -li, -lo, -lö, -ri, -ro,
-kko, -kkö, p. 18), both are stored ("meisseleitä / meisselejä") and either is accepted when typed.

**Marking a changed ending.** In the forms sheet, what a form adds to the dictionary form is
highlighted from the first letter that differs.

**Forms sheet.** Nouns and adjectives: genitive and plural partitive. Verbs: the minä-form and the
four tables. Everything else has no forms sheet.

**Key vocabulary.** The book does not mark key words, so `core` is never set and the "Key words
only" chip does not appear; verbs alone count as key in the Blitz.

**Fonts.** Instrument Sans and Newsreader both cover Finnish.
