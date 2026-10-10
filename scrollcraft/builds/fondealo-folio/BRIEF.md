# Fondealo · BRIEF

**Self-authored under explicit creative delegation.** The user supplied a written
creative brief covering topics 1 to 4 verbatim (vibe, references, the six-act
journey, the energy curve, the emotional journey and the memorable moment) and
delegated the rest: *"I want you to take the creative lead on Fondealo's website
rebranding. You have explicit creative delegation within the following direction
and engineering constraints."* Topics 5 to 8 are **authored decisions**, labeled
as such below. The user was not interviewed a second time, by their instruction.

Build: `scrollcraft/builds/fondealo-folio/`
Date: 2026-10-10

---

## 1. Vibe and references — USER, verbatim

> Five words: Cinematic, editorial, trustworthy, innovative, human.
>
> Creative references:
> - Swiss editorial graphic design: strong typographic hierarchy, disciplined composition, exceptional whitespace.
> - Contemporary cinematic title sequences: controlled motion, atmospheric depth, intentional transitions.
> - Scientific data visualization: complex information made elegant, intuitive, and understandable.
>
> Avoid generic Web3 aesthetics, excessive neon gradients, cookie-cutter SaaS layouts, repetitive cards, and animation without purpose.
>
> Preserve recognizable elements of Fondealo's existing emerald/night identity where appropriate, but refine them into a more coherent premium brand system.

## 2. The scroll journey — USER, verbatim (abridged to the act spine)

> Create a cohesive six-act narrative.
>
> **Act I — The Invisible Opportunity.** An exceptionally strong hero. Present Fondealo's core promise through editorial typography, subtle atmospheric effects, and a compelling visual representation of portable financial identity. The visitor should immediately understand that Fondealo helps businesses build a financial reputation that can support access to funding.
>
> **Act II — The Problem.** Show how valuable business activity and repayment history can remain fragmented or difficult to demonstrate. Use visual fragmentation, separated data elements, or disconnected signals to illustrate the problem. Keep the storytelling grounded and understandable.
>
> **Act III — The Business Passport.** Introduce the Fondealo Passport as the central product. Create a sophisticated animated representation based on the application's actual Passport interface. Signals converge into one coherent identity. Avoid fake user records or invented performance figures.
>
> **Act IV — Reputation That Evolves.** This is the emotional and visual peak. A business's repayment history and verified information become part of a continuously developing reputation. Explore a cinematic transformation where fragmented activity resolves into a portable financial identity. Important: distinguish the product vision from functionality currently implemented in production. The existing repository has limitations in its live credit-score update flow.
>
> **Act V — Opportunities and Ecosystem.** Explain how businesses and funders interact through Fondealo. Use restrained product UI previews to communicate functionality. Clearly distinguish sandbox, Testnet, and live capabilities.
>
> **Act VI — The Future of Business Credit.** Conclude with a confident editorial statement and one unmistakable primary CTA. The closing should feel intentional and memorable, not like a generic footer.

## 3. The energy curve — USER, verbatim

> Act I: Quiet confidence and intrigue.
> Act II: Controlled tension.
> Act III: Discovery and clarity.
> Act IV: Cinematic intensity and transformation.
> Act V: Confidence and understanding.
> Act VI: Calm conviction.
> Use one major visual peak, not constant spectacle.

## 4. The emotional journey and the memorable moment — USER, verbatim

> The visitor should progress through: Curiosity → Recognition → Discovery → Understanding → Trust → Action.
>
> The memorable moment: disparate business information transforms into a coherent, portable Business Passport as the visitor scrolls.
>
> The experience should make an invisible financial concept visually understandable.

## 5. One thing no other site does — AUTHORED

The margin keeps the visitor's own reading record and then spends it. Every
verified signal the visitor scrolls past is **typeset into the folio margin** as
a numbered line of a real document. At the peak the margin empties: the
collected lines lift out of the margin, travel into the plate, and bind
themselves into the Passport. See §9, the signature move.

## 6. Distance from premium-minimal — AUTHORED

**Editorial, leaning dense.** Not premium-minimal: the user asked for Swiss
typographic hierarchy and scientific data visualization, both of which are
information-forward, and "trustworthy" in credit infrastructure is carried by
legible density rather than by air and one accent. Paper grounds, folios,
measure, tabular figures, a capability ledger that reads as a table because it
is one.

## 7. One unbroken world, or distinct scenes — AUTHORED

**Distinct chapters, hard cuts.** The user asked for "a cohesive six-act
narrative" with "intentional transitions" and a close that is "a confident
editorial statement" — that is a printed feature with chapters, not one
continuous camera flight. A single unbroken world would also fight Act V, which
has to present an honest capability ledger, and nothing about Fondealo's subject
is travel through a place. Chapters land on their own ground and stay there.

## 8. Existing assets — AUTHORED from the repository

No photography, no footage, no brand kit beyond code. What exists and is used:

- **Real faces from the app:** Space Grotesk (display) and Instrument Sans
  (text), both already in `apps/web/src/app/layout.tsx`, self-hosted here.
  Fraunces, the third face in the app, is dropped: two families maximum.
- **Real palette:** emerald `#10b981` / `#34d399` / `#047857` and the night
  grounds `#0a1020` / `#070b16` from `apps/web/src/app/globals.css`.
- **Real product surface:** the Passport interface and the five-stage trust
  pipeline (Wallet Connected → Identity → KYB → Reputation → Funding) specified
  in `docs/design/web3-ux-states.md`.
- **Real facts** (the only numbers on the page): three Soroban contracts,
  `business_passport`, `credit_score`, `loan_escrow`; `loan_escrow` is
  `credit_score`'s reporter; USDC settlement on Stellar; PII stays off-chain
  with only a hash on-chain; the web MVP is live on Vercel; the contracts are
  not yet deployed.

**No imagery was generated.** `KIE_AI_API_KEY` is unset, and the world chosen
below needs no camera. Every mark on the page is drawn in SVG or CSS and is
therefore selectable, themeable and sharp at any density.

---

## 9. Authored decisions carried into the build

**World.** Technical drawing (worlds.md §8), refined: monochrome ink linework,
dimension lines and leader callouts, orthographic plates, on two grounds — warm
paper for the document chapters and Fondealo night for the cinematic ones. It is
the one non-photographic world that reads premium rather than cheap, because it
is honest about being a diagram, and it is the only world that serves "scientific
data visualization" without inventing a photograph of a business that does not
exist.

**Grammar.** Chaptered editorial (uniqueness.md §2.2).

**Signature move: the binding margin.** The folio margin is the navigation, the
trace and the peak, in one system:

1. Chapters I to III: each verified signal the visitor passes is stamped into
   the margin as a numbered folio line. Six are filed in Chapter II and the
   seventh, KYB status, in Chapter III, so the margin visibly holds an empty
   slot for a chapter and a half. The margin fills as they read.
2. Chapter IV, the peak: the margin empties. Every collected line lifts out of
   the margin, travels across the plate, and binds into the Passport specimen,
   which then stamps.
3. Chapters V and VI: the margin carries the bound folio instead of loose
   lines, so arriving at the end means holding a completed document rather than
   reaching a footer.

**One accent, two stops.** Emerald, one hue: `#047857` on paper, `#34d399` on
ink. The page hard-cuts between light and dark grounds, which is the single
licensed exception in taste.md. The app's gold `#f59e0b` is deliberately not
carried over: a second hue would be confetti, and state is better carried by
fill weight (filled / half / hollow marks) than by colour, which is also what
makes it survive a colourblind reader and a greyscale print.

**Honesty rules, binding on this build.** No fake user records: the Passport
specimen carries field labels and state marks with **no values** — it is a blank
specimen, the way a real passport is shown in a specification. No invented
statistics: the only figures are the three contracts and the contract names.
Chapter V distinguishes live, Testnet and in-design capabilities on its face,
and Chapter IV says in the page, not in a footnote, that the continuous score
update flow is design intent and not yet live in production.

**The one action.** `Start a Passport` →
`https://fondealo.vercel.app/onboarding?intent=business`. One label, used in the
margin and at the close, nowhere else.

**What the visitor must believe by the end.** That a business's own repayment
record can become portable, verifiable credit identity the business owns and
carries from lender to lender.

---

## 10. The feeling curve

Written before the acts. Emotion first, cause second.

```
I    Curiosity    a title page, and one unfinished edge of a document in the gutter
                  that the planes keep sliding past
II   Doubt        true signals, scattered across the spread, none of them joined,
                  each one labelled with what it cannot do alone
III  Clarity      the specimen plate wipes in and the dimension lines name every
                  field of the thing the signals were trying to be
--   Silence      authored: one ink screen with the empty plate and no copy
IV   Awe          the margin empties into the plate and the document binds itself
V    Confidence   the ledger, dense and tabulated, saying exactly what is live
VI   Conviction   the smallest type on the site, the bound folio, one line of
                  running text that is the ask
```

No two adjacent feelings repeat. Curiosity, doubt, clarity, awe, confidence,
conviction.

**Authored silence:** as built, it is the entry viewport of Chapter IV rather
than the tail of Chapter III. The pinned stage slides up for a full screen
before its progress leaves 0, so the visitor gets one whole viewport of the ink
ground carrying the unbound plate and no copy at all. Same silence, one screen
later than planned, and it is intentional rather than dead scroll.

## 11. The peak

Chapter IV, the binding. The largest span on the page by a visible margin
(3.4vh against a 2.0vh median), the only act that empties the margin, and the
only chapter that changes its ground mid-argument.

**The sentence a visitor would say to a friend:**

> everything I had scrolled past was stacked up in the margin, and then the
> whole margin lifted off the side of the page and bound itself into a passport
> in front of me

## 12. The tell-someone sentence

> It's the site where the margin collects every signal you scroll past, and then
> empties itself into the document it was describing.

An experience, phrased from the visitor's side, and it names the peak and the
signature move as the same moment.


---

## 13. The feel check, run cold against the final contact sheets

| Act | Intended | Felt | Verdict |
|---|---|---|---|
| I | Curiosity | Intrigue | holds |
| II | Doubt | **Inventory** | failed, fixed |
| III | Clarity | Clarity | holds |
| -- | Silence | Anticipation | holds |
| IV | Awe | Assembly, satisfaction | holds, and it is the largest change on the sheet |
| V | Confidence | Confidence | holds |
| VI | Conviction | Quiet resolve | holds |

**The one disagreement, and what changed.** Act II was laid out on a tidy twelve
column grid with six uniformly treated items. It read as an inventory: orderly,
complete, legible down the page. The fragmentation was in the copy and nowhere
in the composition, which is exactly the failure the brief named. The page was
wrong, not the curve. Fixed by breaking the grid: no two fragments share a
baseline, each is a different width, each sits a fraction off square, and the
rules under them are different lengths. It now reads as six true things lying
where they fell.

**Peak check.** On the sheet the peak is the largest visual change on the page
(an unbound ghost plate becoming a bound and stamped document) and holds the
most scroll room (3.4 viewport-heights against a 2.0 median, and 8 of 29 sampled
frames). The act before it is the quietest screen on the page.

**Ending check.** The last screen stands still with content on it: the colophon,
the ask as running text, and the closed folio in the margin. Nothing fades out.
