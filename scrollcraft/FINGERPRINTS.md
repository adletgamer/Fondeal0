# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| **fondealo-folio** | Chaptered editorial | Fixed folio margin: chapter index plus a live collation stub; a bottom strip on phones. No bar, no progress readout | Title page, five drawn ink planes at differential rates, one glyph of the headline occluded by the document. No photograph, no video | parallax > flow+in > reveal+count > **pin (peak)** > flow+in > pin. 6 chapters, 9.7vh desktop / 11.8vh phone | Colophon plate on paper: smallest type on the site, the ask set as a line of running text inside the statement, closed folio in the margin | **The binding margin**: signals file into the margin as numbered folio lines, then fly out of it and bind into the Passport plate at the peak | Technical drawing, ink on two grounds (Fondealo night and warm paper), hard cuts | 4500 |

*(First build. It had nothing to clear; from here on this table is the
constraint.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- **Chaptered editorial** is taken, with hard-cut grounds and no fixed bar.
- **The folio margin as chrome** is taken: a fixed left margin carrying a
  chapter index plus an accumulating stub, collapsing to a bottom strip on
  phones.
- **The binding margin** is taken: any later build that empties its chrome into
  its own peak is repeating this one, whatever it files.
- **Colophon close with the CTA as running text** is taken.
- **Drawn ink planes as a hero** (no photograph, no clip) is taken.
- **6 chapters at 9.7vh** is taken as an act-count-and-length band.
- The emerald/night and warm paper two-ground pairing is taken.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
