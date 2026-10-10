# Fondealo · scroll-craft prototype (`fondealo-folio`)

An isolated, self-contained landing prototype for the Fondealo rebrand. It is a
**design prototype, not application code**: one static HTML file, no build step,
no framework, and nothing in this folder is imported by `apps/web`.

Grammar: chaptered editorial. Six chapters, ink and paper grounds, a folio
margin that collects every verified signal the visitor scrolls past and then
empties itself into the Business Passport at the peak. The full creative brief,
the feeling curve, the peak and the feel-check diff are in
[`BRIEF.md`](BRIEF.md).

## Preview it locally

Any static server works, because the page has no build step.

```bash
cd scrollcraft/builds/fondealo-folio
npx serve . -l 4500        # or: python -m http.server 4500
# then open http://localhost:4500
```

Opening `index.html` straight from the filesystem also mostly works, but the
self-hosted fonts and the engine files load more reliably over HTTP.

## Re-running the verification pass

The harness ships with the scroll-craft skill, not with this repository.

```bash
npm install                 # playwright-core, for the harness only
node <scroll-craft>/scripts/serve.mjs --root . --port 4500 &
node <scroll-craft>/scripts/shoot.mjs --url http://localhost:4500 --out lab/shots
node <scroll-craft>/scripts/shoot.mjs --url http://localhost:4500 --out lab/mobile --width 390 --height 844
node <scroll-craft>/scripts/shoot.mjs --url http://localhost:4500 --out lab/reduced --reduced-motion
```

`lab/peek.mjs` shoots arbitrary scroll positions (the harness only walks acts)
and `lab/tabs.mjs` dumps focus order, heading outline and horizontal overflow.
Screenshot output under `lab/<run>/` is gitignored on purpose: it is large and
reproducible.

Last run, 10 October 2026: desktop 9.7vh, phone 11.8vh, reduced motion 9.7vh.
No dead scroll, every cue reaches full opacity, every cue clears 4.5:1 at its
worst frame, no console errors, no horizontal overflow at 1440 or 390.

## What is in here

| Path | What it is |
|---|---|
| `index.html` | The page. Markup, theme tokens, and the bespoke binding-margin script |
| `scrollcraft.css`, `scrollcraft.js` | The scroll-craft engine, copied verbatim and **not** edited |
| `assets/fonts/` | Space Grotesk and Instrument Sans, latin subsets, self-hosted |
| `BRIEF.md` | Creative brief, feeling curve, peak, feel-check diff |
| `lab/*.mjs` | Verification helpers |

## Fonts

Both faces are the ones `apps/web` already loads through `next/font`
(`apps/web/src/app/layout.tsx`). They are self-hosted here so the prototype has
no runtime dependency on Google Fonts. Both are licensed under the SIL Open Font
License 1.1; the full licenses are in `assets/fonts/`.

Fraunces, the third face in the app, is deliberately not used here: two families
maximum.

## Content accuracy

Every claim on the page was taken from this repository on 10 October 2026. The
Passport drawing is a blank specimen with field labels and no values, so there
are no invented business records, and the only figure on the page is the three
Soroban contracts. Chapter V separates live, Testnet and in-design capabilities,
and the peak states on its own face that the continuous score update on
repayment is not live in production. **If the deployment table in the root
`README.md` changes, the ledger in Chapter V has to change with it.**

## Before integrating into Next.js

This has not been ported, and porting it is not a copy and paste:

1. Decide the scope first: whether this replaces `apps/web/src/app/page.tsx` or
   ships alongside it at a separate route while Track A continues.
2. The engine drives plain `data-sc-*` attributes off a `mount(document.body)`
   call. In React that wants a client component with a single mount effect and a
   cleanup, not a re-render per scroll tick.
3. The theme tokens here are plain CSS custom properties. They need reconciling
   with the Tailwind theme and the design-system tokens that landed in the nine
   `feat(ui)` commits on `main`, rather than being pasted in beside them.
4. The binding margin reads `--sc-p` off the peak act and measures element
   positions. It needs a resize observer and a remount guard under React strict
   mode.
5. Re-run the verification pass against the integrated route. A green run here
   says nothing about the Next.js build.
6. Check it on a real phone. Headless Chrome cannot reproduce iOS touch
   scrolling, and the margin-to-plate flight has only ever run in headless
   Chrome.
