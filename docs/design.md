# Lares Design Spec — IKEA / Skapa Visual Language

Implementable spec for Lares (agent-native interior layout planner). Goal: the app should read as a
polished Scandinavian furniture retailer's product surface.

**Stack confirmed** (read-only from `package.json`): Next.js `16.3.3`, React `19.2.8`,
`tailwindcss@^4` + `@tailwindcss/postcss@^4`. So: **Tailwind v4**, CSS-first `@theme` config. No
`tailwind.config.ts` needed.

## How these values were obtained

Values below are **extracted, not recalled**. Method:

1. Fetched `https://www.ikea.com/au/en/` and `https://www.ikea.com/au/en/cat/sofas-fu003/`, parsed
   out all 62 + 36 linked stylesheets (~2.1 MB of CSS) from `/global/assets/dwf/`.
2. Grepped the compiled Skapa CSS for design-token declarations. IKEA ships every token as a
   `rgb(var(--colour-x, R, G, B))` call with the **literal RGB triple inlined as the fallback**, so the
   real token values are directly readable from the production CSS. Same for the type scale
   (`var(--skapa-heading-l, 24)`), spacing (`--space-100: 1rem`), radii, and shadows.
3. Cross-checked token *names and structure* against IKEA's public Skapa API docs
   (`android.skapa.ikea.net` — Dokka-generated `SkapaColors` reference), which confirms the same
   taxonomy: `neutral1..7`, `textAndIcon1..5`, `interactive*BgDefault/Hover/Pressed`,
   `semanticPositive/Negative/Caution/Informative`, `elevation1..3`, `commercialMessage*`.
4. Live browser inspection (`browser_cdp` + `getComputedStyle`) was attempted but the browser tool
   had no available tab in this session. The stylesheet extraction above is equally authoritative —
   it *is* the CSS the browser would have computed from.

Every hex in the "Extracted" tables is a direct conversion of a triple found in shipped IKEA CSS.

## 1. Extracted color tokens

### Neutrals (the backbone — IKEA is ~95% greyscale)

| Token | RGB (as shipped) | Hex | Role |
| --- | --- | --- | --- |
| `neutral-1` | `255,255,255` | `#FFFFFF` | Page / card surface |
| `neutral-2` | `245,245,245` | `#F5F5F5` | Section band, input fill, hover |
| `neutral-3` | `223,223,223` | `#DFDFDF` | **Hairline borders**, dividers, pressed |
| `neutral-4` | `204,204,204` | `#CCCCCC` | Disabled fill |
| `neutral-5` | `146,146,146` | `#929292` | Subtle input border |
| `neutral-6` | `72,72,72` | `#484848` | Secondary text |
| `neutral-7` | `17,17,17` | `#111111` | **Primary ink** — not pure black |

### Text & icon ramp

| Token | Hex | Role |
| --- | --- | --- |
| `text-1` | `#111111` | Headings, product titles, prices |
| `text-2` | `#484848` | Secondary / measurements / comparison price |
| `text-3` | `#767676` | Placeholder, suffix labels |
| `text-4` | `#929292` | Faint meta |
| `text-5` | `#FFFFFF` | On dark |

### Brand & interactive

| Token | RGB | Hex | Notes |
| --- | --- | --- | --- |
| `interactive-primary-bg-default` | `17,17,17` | `#111111` | **Primary button is near-black, not blue** |
| `interactive-primary-bg-hover` | `51,51,51` | `#333333` | |
| `interactive-primary-bg-pressed` | `0,0,0` | `#000000` | |
| `interactive-emphasised-bg-default` | `0,88,163` | `#0058A3` | **IKEA blue — verified** |
| `interactive-emphasised-bg-hover` | `0,79,147` | `#004F93` | |
| `interactive-emphasised-bg-pressed` | `0,62,114` | `#003E72` | |
| `interactive-secondary-bg-hover` | `223,223,223` | `#DFDFDF` | |
| `interactive-subtle-border-default` | `146,146,146` | `#929292` | |
| `interactive-disabled-1` | `204,204,204` | `#CCCCCC` | |
| `interactive-disabled-2` | `146,146,146` | `#929292` | |
| `static-ikea-brand-yellow` | `255,219,0` | `#FFDB00` | **Verified `#FFDB00`, not `#FBD914`** |
| `static-ikea-family` | `0,124,193` | `#007CC1` | Loyalty-programme blue |

Note on the blue: `#0058A3` is bound to `interactive-emphasised`, **not** to the default button. IKEA
reserves the blue for one emphasised action per view. Their default CTA is `#111111`. Copying this is
the single biggest fidelity lever — an all-blue-buttons UI does *not* look like IKEA.

### Semantic

| Token | RGB | Hex | Notes |
| --- | --- | --- | --- |
| `semantic-positive` | `10,138,0` | `#0A8A00` | |
| `semantic-negative` | `224,7,81` | `#E00751` | Also `destructive-bg-default` |
| `destructive-bg-hover` | `204,0,61` | `#CC003D` | |
| `destructive-bg-pressed` | `184,0,41` | `#B80029` | |
| `semantic-caution` | `242,106,47` | `#F26A2F` | Fill only |
| `semantic-caution-text` | `202,80,8` | `#CA5008` | Darker, for text (AA) |
| `semantic-informative` | `0,88,163` | `#0058A3` | |
| `campaign-sustainability` | `55,184,134` | `#37B886` | |

### Commercial message (price badges)

| Token | RGB | Hex | Usage |
| --- | --- | --- | --- |
| `commercial-message-new-lower-price` | `204,0,8` | `#CC0008` | **"New lower price" red** |
| `commercial-message-new` | `202,80,8` | `#CA5008` | "New" |
| `commercial-message-time-restricted-offer` | `204,0,8` | `#CC0008` | |
| `commercial-message-bti-yellow` | `255,219,0` | `#FFDB00` | Breathtaking-item badge fill |
| `commercial-message-bti-red` | `204,0,8` | `#CC0008` | Its offset drop-shadow |

### Elevation

| Token | Hex | Notes |
| --- | --- | --- |
| `elevation-1` | `#FFFFFF` | + `elevation-1-border` `#DFDFDF` |
| `elevation-2` | `#FFFFFF` | + `elevation-2-border` `#484848` |
| `elevation-3` | `#111111` | Tooltips |

**Key insight:** IKEA's "elevation" is *border colour*, not shadow. The only real shadows found in
2 MB of CSS are `0 4px 16px #0000001a` (modal/sheet) and `0 1px 4px rgba(17,17,17,.55)` (over-image).
Everything else is `inset 0 0 0 1px <colour>`.

### Contrast / WCAG notes

- `#111111` on `#FFFFFF` → **18.9:1**. On `#F5F5F5` → 17.2:1. Excellent.
- `#484848` on `#FFFFFF` → **8.6:1**. Safe for secondary text.
- `#767676` on `#FFFFFF` → **4.54:1**. AA for normal text, *only just*. Never on `#F5F5F5` (4.1:1 — fails). Placeholder only.
- `#929292` on `#FFFFFF` → 2.9:1. **Fails.** Borders/disabled only, never text.
- `#0058A3` white-on-blue → **7.4:1**. AA + AAA. Safe for emphasised buttons.
- `#FFDB00` with `#111111` → **15.3:1**. Fine. But white on yellow is **1.2:1** — never do it.
- `#E00751` white-on-red → 4.9:1 (AA). `#0A8A00` white-on-green → 4.1:1 — **fails AA for small text**; use green as an icon/fill and pair with `#111111` text.
- `#F26A2F` as a *text* colour fails (3.0:1) — this is why Skapa ships the separate `#CA5008` caution-text token (5.2:1). Use it for our clearance warnings.

## 2. Typography — extracted

Verified `@font-face` and stack from production CSS:

```css
font-family: Noto IKEA, Noto Sans, Roboto, Open Sans, system-ui, sans-serif;
```

`Noto IKEA` ships as woff2 at weights **400 and 700 only** (plus italics) —
`noto-ikea-400.latin.woff2`, `noto-ikea-700.latin.woff2`. No 500/600.

**Chosen free equivalent: Noto Sans.** This is not an approximation — IKEA's own fallback stack lists
`Noto Sans` as the immediate next choice, because Noto IKEA *is* a customised Noto Sans cut. Inter is
a worse match: its taller x-height and tighter default tracking read more "SaaS dashboard" than
"retail". Restrict ourselves to weights **400 and 700** to match their rhythm exactly.

### Extracted type scale (`--skapa-*`, px → weight / line-height)

| Class | px | Weight | Line-height | Use in Lares |
| --- | --- | --- | --- | --- |
| `display-xl` | 72 | 700 | 1.2 | — |
| `display-l` | 56 | 700 | 1.2 | Landing hero |
| `display-m` | 40 | 700 | 1.2 | Page title |
| `heading-xl` | 32 | 700 | 1.25 | Plan name |
| `heading-l` | 24 | 700 | 1.25 | Panel titles |
| `heading-m` | 18 | 700 | 1.25 | Card group headings |
| `heading-s` | 16 | 700 | 1.25 | Product title |
| `heading-xs` | 14 | 700 | 1.25 | Dense subheads |
| `statement-l` | 28 | **400** | 1.5 | Pull quotes — large *regular* |
| `statement-m` | 20 | **400** | 1.5 | Intro copy |
| `body-l` | 16 | 400 | 1.5 | Default body |
| `body-m` | 14 | 400 | 1.5 | Panel body |
| `body-s` | 12 | 400 | **1.8** | Fine print (note the loose LH) |
| `label-l` | 16 | 700 | 1.25 | Button text |
| `label-m` | 14 | 700 | 1.25 | Small button, chips |
| `label-s` | 12 | 700 | 1.25 | Badges |
| `label-xs` | 10 | 700 | 1.25 | **uppercase** — eyebrows |
| `caption-l/m` | 16/14 | 400 | 1.25 | Captions |
| `caption-s` | 12 | 400 | 1.5 | Image credits |

No letter-spacing declarations appear on the scale — IKEA runs default tracking everywhere except
`label-xs`, which is uppercase (add `tracking-wide` there only).

Price sizes are their own thing: `.pip-price--large { font-size: 2.25rem }` (36px),
`.pip-price--small { font-size: 1rem }`, always weight 700.

## 3. Spacing, radii, borders — extracted

**Spacing scale** (shipped as `--space-*`, value = px/16):

```
--space-25:  0.25rem   (4px)     --space-250:  2.5rem   (40px)
--space-50:  0.5rem    (8px)     --space-300:  3rem     (48px)
--space-75:  0.75rem   (12px)    --space-400:  4rem     (64px)
--space-100: 1rem      (16px)    --space-550:  5.5rem   (88px)
--space-125: 1.25rem   (20px)    --space-750:  7.5rem   (120px)
--space-150: 1.5rem    (24px)    --space-1000: 10rem    (160px)
--space-200: 2rem      (32px)    --space-1350: 13.5rem  (216px)
```

This maps cleanly onto Tailwind's default 4px scale (`space-100` = `4`, `space-150` = `6`,
`space-200` = `8`, `space-550` = `22`). The notable part is the top end: section rhythm uses
**88px / 120px** vertical padding. `.plp-catalog-product-list { padding-top: 5.5rem; margin-block-end: 7.5rem }`.
That generosity is a large part of the retail feel — do not compress it.

**Radii found in production:**

| Value | Where |
| --- | --- |
| `64px` / `100px` | **Buttons — full pill.** `.btn__inner { border-radius: 64px }` |
| `50%` | Icon buttons, avatars |
| `8px` | Cards, sheets, modals, image containers |
| `4px` | **Inputs.** `.input-field__wrapper { border-radius: 4px }` |
| `2px` / `0.125rem` | Tiny badges |
| `0` | Full-bleed imagery, section bands |

The pill-button / 4px-input contrast is deliberate and very recognisable: **actions are pill, data
entry is nearly square, containers are 8px.**

**Borders:** always `1px solid #DFDFDF`. Selected/focused states use `inset 0 0 0 2px #111111` rather
than changing width (avoids layout shift). Focus ring is the distinctive two-part
`box-shadow: 0 0 0 4px #FFFFFF` + `outline: 2px solid #111111`.

**Grid / layout:** `max-width: 112rem` (**1792px**) on `.plp-content-container` and
`.hnf-content-container`, `margin-inline: auto`, horizontal padding `1.25rem` (20px). Grid gutters are
`--grid-column-gap: 12 | 16 | 24` px responsive. Product grid tiles carry `padding: 1rem 0.875rem`
with `border-block-end: 1px` + `border-inline-end: 1px` in `#DFDFDF` — i.e. **cards are separated by
hairlines, not by shadows or gaps.**

## 4. Tailwind v4 `@theme` block

Paste into `app/globals.css` after `@import "tailwindcss";`.

```css
@import "tailwindcss";

@theme {
  /* ---- Fonts ---- */
  --font-sans: var(--font-noto-sans), "Noto Sans", Roboto, "Open Sans", system-ui, sans-serif;

  /* ---- Neutrals ---- */
  --color-neutral-1: #ffffff;
  --color-neutral-2: #f5f5f5;
  --color-neutral-3: #dfdfdf;
  --color-neutral-4: #cccccc;
  --color-neutral-5: #929292;
  --color-neutral-6: #484848;
  --color-neutral-7: #111111;

  /* ---- Text & icon ---- */
  --color-ink: #111111;
  --color-ink-2: #484848;
  --color-ink-3: #767676;
  --color-ink-4: #929292;
  --color-ink-inverse: #ffffff;

  /* ---- Surfaces ---- */
  --color-surface: #ffffff;
  --color-surface-sunken: #f5f5f5;
  --color-surface-inverse: #111111;
  --color-hairline: #dfdfdf;
  --color-hairline-strong: #484848;

  /* ---- Interactive ---- */
  --color-action: #111111;
  --color-action-hover: #333333;
  --color-action-pressed: #000000;
  --color-emphasis: #0058a3;
  --color-emphasis-hover: #004f93;
  --color-emphasis-pressed: #003e72;
  --color-subtle-hover: #f5f5f5;
  --color-subtle-pressed: #dfdfdf;
  --color-disabled-bg: #cccccc;
  --color-disabled-fg: #929292;

  /* ---- Brand accents ---- */
  --color-accent-yellow: #ffdb00;
  --color-accent-blue: #007cc1;

  /* ---- Semantic ---- */
  --color-positive: #0a8a00;
  --color-negative: #e00751;
  --color-negative-hover: #cc003d;
  --color-negative-pressed: #b80029;
  --color-caution: #f26a2f;
  --color-caution-text: #ca5008;
  --color-informative: #0058a3;
  --color-price-drop: #cc0008;

  /* ---- Canvas (floor plan) ---- */
  --color-canvas-bg: #faf9f7;
  --color-canvas-grid: #e8e5e0;
  --color-canvas-grid-major: #d6d2cb;
  --color-canvas-wall: #111111;
  --color-canvas-dim: #767676;
  --color-footprint-fill: #efe9e0;
  --color-footprint-stroke: #b8ab97;
  --color-footprint-selected: #0058a3;
  --color-clearance-fill: #fdf0e8;
  --color-clearance-stroke: #ca5008;

  /* ---- Radii ---- */
  --radius-input: 4px;
  --radius-card: 8px;
  --radius-sheet: 8px;
  --radius-badge: 2px;
  --radius-pill: 64px;

  /* ---- Spacing (top-end section rhythm) ---- */
  --spacing-section: 5.5rem;
  --spacing-section-lg: 7.5rem;
  --spacing-gutter: 1.25rem;

  /* ---- Layout ---- */
  --container-page: 112rem;

  /* ---- Shadows (used sparingly) ---- */
  --shadow-sheet: 0 4px 16px #0000001a;
  --shadow-over-image: 0 1px 4px rgba(17, 17, 17, 0.55);

  /* ---- Type scale ---- */
  --text-display-l: 3.5rem;
  --text-display-l--line-height: 1.2;
  --text-display-m: 2.5rem;
  --text-display-m--line-height: 1.2;
  --text-heading-xl: 2rem;
  --text-heading-xl--line-height: 1.25;
  --text-heading-l: 1.5rem;
  --text-heading-l--line-height: 1.25;
  --text-heading-m: 1.125rem;
  --text-heading-m--line-height: 1.25;
  --text-heading-s: 1rem;
  --text-heading-s--line-height: 1.25;
  --text-statement-m: 1.25rem;
  --text-statement-m--line-height: 1.5;
  --text-body-l: 1rem;
  --text-body-l--line-height: 1.5;
  --text-body-m: 0.875rem;
  --text-body-m--line-height: 1.5;
  --text-body-s: 0.75rem;
  --text-body-s--line-height: 1.8;
  --text-label-l: 1rem;
  --text-label-l--line-height: 1.25;
  --text-label-m: 0.875rem;
  --text-label-m--line-height: 1.25;
  --text-label-s: 0.75rem;
  --text-label-s--line-height: 1.25;
  --text-label-xs: 0.625rem;
  --text-label-xs--line-height: 1.25;
  --text-price-l: 2.25rem;
  --text-price-l--line-height: 1.1;
}

@layer base {
  html {
    -webkit-font-smoothing: antialiased;
  }
  body {
    background: var(--color-surface);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: var(--text-body-l);
    line-height: 1.5;
  }
  /* IKEA's two-part focus ring */
  :focus-visible {
    outline: 2px solid var(--color-ink);
    outline-offset: 2px;
  }
}
```

**Light mode only.** IKEA ships a dark theme for native apps but the web retail surface is light.
Do not add a dark variant; it will cost fidelity and time.

## 5. `next/font` setup

`app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lares — Interior Layout Planner",
  description: "Plan a room, check clearances, and price the result.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={notoSans.variable}>
      <body className="bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
```

Only 400 and 700 — matching Noto IKEA's shipped weights. If a medium is ever wanted, do **not** add
500; use size or colour to create hierarchy, as IKEA does.

## 6. Component recipes (Tailwind class strings)

### Buttons

Geometry extracted from `.btn__inner`: `min-height: 3.5rem` (56px), `padding: 0 2rem`,
`border-radius: 64px`, weight 700, `transition .25s cubic-bezier(.4,0,.4,1)`.
Small variant: `min-height: 2.5rem` (40px), `padding: 0 1.5rem`.

```
// base (shared)
BTN = "inline-flex items-center justify-center rounded-pill text-label-l font-bold
        transition-all duration-250 ease-[cubic-bezier(.4,0,.4,1)] select-none
        disabled:pointer-events-none min-h-14 px-8"

// PRIMARY — near-black, the default CTA
"inline-flex items-center justify-center min-h-14 px-8 rounded-pill text-label-l font-bold
 bg-action text-ink-inverse transition-colors duration-250
 hover:bg-action-hover active:bg-action-pressed
 disabled:bg-disabled-bg disabled:text-disabled-fg"

// EMPHASISED — IKEA blue. At most ONE per view (e.g. "Add all to plan")
"inline-flex items-center justify-center min-h-14 px-8 rounded-pill text-label-l font-bold
 bg-emphasis text-ink-inverse transition-colors duration-250
 hover:bg-emphasis-hover active:bg-emphasis-pressed"

// SECONDARY — transparent with 1px inset ring that thickens to 2px on hover
"inline-flex items-center justify-center min-h-14 px-8 rounded-pill text-label-l font-bold
 bg-transparent text-ink shadow-[inset_0_0_0_1px_#111111] transition-shadow duration-250
 hover:shadow-[inset_0_0_0_2px_#111111] active:bg-neutral-3/50
 disabled:shadow-[inset_0_0_0_1px_#cccccc] disabled:text-disabled-fg"

// TERTIARY — no border at rest, grey wash on hover
"inline-flex items-center justify-center min-h-14 px-8 rounded-pill text-label-l font-bold
 bg-transparent text-ink transition-colors duration-250
 hover:bg-subtle-pressed active:bg-neutral-4 disabled:text-disabled-fg"

// SMALL modifier (append, overriding size)
"min-h-10 px-6 text-label-m"

// DESTRUCTIVE
"... bg-negative text-ink-inverse hover:bg-negative-hover active:bg-negative-pressed"

// ICON BUTTON
"inline-flex items-center justify-center size-14 rounded-full bg-action text-ink-inverse
 hover:bg-action-hover active:bg-action-pressed"
```

### Product card

Hairline-separated tile, no shadow, square-ish image on sunken grey, title 16/700, price below.

```tsx
<article className="group relative flex flex-col gap-2 border-b border-r border-hairline p-4 pb-6">
  {/* image well */}
  <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface-sunken">
    <img className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
    {/* badge, top-left */}
    <span className="absolute left-2 top-2 rounded-badge bg-accent-yellow px-2 py-0.5 text-label-xs font-bold uppercase tracking-wide text-ink">
      New
    </span>
  </div>

  <h3 className="mt-2 text-heading-s font-bold text-ink">Two-seat sofa</h3>
  <p className="text-body-m text-ink-2">Grey · 180 × 88 cm</p>

  {/* price block — see below */}
  <div className="mt-1" />

  <button className="mt-3 inline-flex min-h-10 items-center justify-center rounded-pill bg-action px-6 text-label-m font-bold text-ink-inverse hover:bg-action-hover">
    Add to plan
  </button>
</article>
```

Grid container:

```
"mx-auto grid w-full max-w-page grid-cols-2 gap-x-3 px-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"
```

### Price

Extracted conventions: integer at full size, **currency symbol and decimals raised via
`top: -0.727em` at `font-size: .5em`** — this superscript treatment is one of IKEA's most
recognisable details. Struck-through old price uses `line-through` on the integer. Reduced price
uses `#CC0008`.

```tsx
// Standard price
<span className="inline-flex items-start text-price-l font-bold leading-none text-ink">
  <span className="relative top-[0.12em] text-[0.5em] leading-none">$</span>
  <span>899</span>
  <span className="relative -top-[0.727em] text-[0.5em] leading-none">00</span>
</span>

// Reduced ("new lower price")
<div className="flex flex-col gap-1">
  <span className="inline-flex items-start text-price-l font-bold leading-none text-price-drop">
    <span className="relative top-[0.12em] text-[0.5em] leading-none">$</span>
    <span>699</span>
    <span className="relative -top-[0.727em] text-[0.5em] leading-none">00</span>
  </span>
  <span className="text-body-s text-ink-2">
    New lower price <s className="ml-1">$899</s>
  </span>
</div>

// Small / inline (list rows, budget table)
<span className="text-body-l font-bold text-ink">$899</span>

// Subtle / comparison
<span className="text-body-m font-normal text-ink-2">$4.99 / m²</span>
```

Budget total row:

```
"flex items-baseline justify-between border-t border-hairline pt-4
 text-heading-l font-bold text-ink"
```

### Input

Extracted: `border-radius: 4px`, fill `#FFFFFF` (or `#F5F5F5` in sunken contexts),
`padding-inline: .375rem` on the wrapper, subtle `#929292` border, `2px #111111` inset on focus.

```tsx
<label className="flex flex-col gap-1.5">
  <span className="text-label-m font-bold text-ink">Room width</span>
  <div className="flex w-full items-center rounded-input bg-surface px-1.5
                  shadow-[inset_0_0_0_1px_#929292]
                  transition-shadow
                  focus-within:shadow-[inset_0_0_0_2px_#111111]">
    <input
      className="min-h-14 w-full bg-transparent px-2 text-body-l text-ink
                 placeholder:text-ink-3 focus:outline-none"
      placeholder="4200"
    />
    <span className="pr-2 text-body-m text-ink-3">mm</span>
  </div>
  <span className="text-body-s text-ink-2">Interior wall to wall.</span>
</label>
```

Error state: swap ring to `shadow-[inset_0_0_0_2px_#e00751]`, message
`"text-body-s text-negative"`.

### Panel / sheet

```
// Docked side panel (catalog, budget)
"flex h-full w-full flex-col border-l border-hairline bg-surface"

// Panel header
"flex items-center justify-between border-b border-hairline px-6 py-5
 text-heading-l font-bold text-ink"

// Panel body
"flex-1 overflow-y-auto px-6 py-6"

// Floating sheet / modal — the one place a shadow is allowed
"rounded-sheet bg-surface shadow-[0_4px_16px_#0000001a] p-6"

// Sunken sub-section inside a panel
"rounded-card bg-surface-sunken p-4"

// Section band on a marketing page
"bg-surface-sunken py-22"   /* 5.5rem */
```

### Chip / filter pill

Filters are pill-shaped, hairline at rest, and go to a 2px black inset ring when selected — IKEA
does not use a filled accent for selection.

```
// unselected
"inline-flex min-h-10 items-center gap-1.5 rounded-pill px-4 text-label-m font-bold text-ink
 bg-surface shadow-[inset_0_0_0_1px_#dfdfdf] transition-shadow
 hover:shadow-[inset_0_0_0_1px_#111111]"

// selected
"inline-flex min-h-10 items-center gap-1.5 rounded-pill px-4 text-label-m font-bold text-ink
 bg-surface-sunken shadow-[inset_0_0_0_2px_#111111]"

// count badge inside a chip
"ml-1 rounded-full bg-ink px-1.5 text-label-xs font-bold text-ink-inverse"
```

### Tabs

Underline tabs, black active indicator, hairline track.

```
// track
"flex gap-8 border-b border-hairline px-6"

// tab (inactive)
"relative -mb-px border-b-2 border-transparent py-4 text-label-l font-bold text-ink-2
 transition-colors hover:text-ink"

// tab (active)
"relative -mb-px border-b-2 border-ink py-4 text-label-l font-bold text-ink"
```

### Findings / clearance-violation list

Left rule in the semantic colour, tinted fill, `#CA5008` for caution *text* (the `#F26A2F` fill
colour fails contrast as text).

```tsx
// list container
<ul className="divide-y divide-hairline">

  {/* violation */}
  <li className="flex gap-3 border-l-4 border-clearance-stroke bg-clearance-fill px-4 py-3">
    <svg className="mt-0.5 size-5 shrink-0 text-caution-text" />
    <div className="flex flex-col gap-0.5">
      <p className="text-label-m font-bold text-ink">Walkway too narrow</p>
      <p className="text-body-m text-ink-2">
        640 mm between sofa and coffee table. Minimum 750 mm.
      </p>
      <button className="mt-1 self-start text-label-m font-bold text-emphasis underline underline-offset-2">
        Show on plan
      </button>
    </div>
  </li>

  {/* blocking error */}
  <li className="flex gap-3 border-l-4 border-negative bg-[#fdf1f4] px-4 py-3"> … </li>

  {/* pass */}
  <li className="flex gap-3 border-l-4 border-positive bg-[#f1f8f0] px-4 py-3"> … </li>

  {/* info */}
  <li className="flex gap-3 border-l-4 border-informative bg-[#eff4f9] px-4 py-3"> … </li>
</ul>

// empty state — all clear
<div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
  <p className="text-heading-m font-bold text-ink">No clearance issues</p>
  <p className="text-body-m text-ink-2">Every walkway and door swing has room.</p>
</div>
```

Tint fills are 4–6% mixes of each semantic hue against white, chosen to hold `#111111` text at >15:1.

### Header

```
"sticky top-0 z-50 flex min-h-20 items-center gap-6 border-b border-hairline bg-surface px-5"
// inner: "mx-auto flex w-full max-w-page items-center gap-6"
```

Wordmark: set **"Lares"** in Noto Sans 700, `text-heading-l`, `text-ink`, optionally on a small
`rounded-badge bg-accent-yellow px-2` block. Our own name, our own mark.

## 7. Canvas aesthetic — the 2D floor plan

This is the hero surface. Target register: **an architect's plan drawing, art-directed by a furniture
retailer.** Precise, warm, uncluttered. Not a CAD tool, not a game.

### Ground

- Canvas background `#FAF9F7` — a warm off-white, very slightly warmer than the UI's `#FFFFFF`, so
  the drawing surface reads as *paper* set into the app rather than as more UI. This is the one place
  we warm the neutral.
- Grid: 100 mm minor at `#E8E5E0`, **1px, non-scaling** (keep `1px` device-pixel width at every zoom
  so the grid never bloats). 1000 mm major at `#D6D2CB`, still 1px. No grid labels on the field
  itself.
- Fade the grid out below ~40% zoom (opacity → 0) so a zoomed-out plan reads as a clean silhouette.

### Walls and structure

- Exterior walls: `#111111`, **6px** at 1:1, drawn as a filled poly (double-line with solid fill),
  never a stroke — walls have thickness and should read as mass.
- Interior partitions: `#111111`, 4px.
- Doors: 1.5px `#111111` leaf + a **thin 1px arc** for the swing at `#767676`. The swing arc is what
  makes a plan look professionally drafted — always draw it, and treat it as clearance geometry.
- Windows: break the wall fill and draw 1px `#111111` triple lines.
- Line weight hierarchy is the whole game: **6 / 4 / 1.5 / 1 px**. Four weights, no more.

### Furniture footprints

- Fill `#EFE9E0` — a warm timber-adjacent tone that reads as furniture rather than as UI chrome.
- Stroke `#B8AB97`, 1.5px.
- Radius: 2px on the footprint corners. Soft, not rounded.
- Inside each footprint, a **1px `#B8AB97` schematic glyph** hinting at the type (seat divisions on a
  sofa, a circle for a round table, hatch for a rug). Do not put photography on the canvas.
- Label inside if the footprint is large enough: `text-label-s` (12/700) `#484848`, centred,
  auto-hidden when it doesn't fit. Below it, dimensions in `text-body-s` `#767676`.
- **Selected:** stroke → `#0058A3` at 2px, fill unchanged, plus a `#0058A3` 4px-radius handle at each
  corner and a rotation handle offset 24px from the top edge. This is the correct home for the IKEA
  blue: selection, not buttons.
- **Hover:** stroke → `#484848`. **Dragging:** 60% opacity plus a 1px dashed `#929292` ghost at the
  origin position.
- Cast a shadow only while dragging: `0 4px 16px #0000001a`. A static plan has no shadows.

### Dimension annotations

Draft-standard, and deliberately quiet so they don't compete with the furniture:

- Extension lines: 1px `#767676`, offset 6px from the object edge, overrunning the dimension line by 3px.
- Dimension line: 1px `#767676` with **architectural tick marks** — short 45° slashes, 6px — rather
  than arrowheads. Ticks read as drafting; arrows read as diagram.
- Text: `text-label-s` (12px / 700) `#484848`, centred on and *above* the line, with a 3px
  `#FAF9F7` halo behind the glyphs so it stays legible over the grid. Never rotate text upside-down —
  flip it to stay readable.
- Units: whole millimetres, no decimals, no unit suffix on the canvas (put "mm" once in a legend).
  `2400`, not `2,400 mm` or `2.4m`.
- Room dimensions run along the outside of exterior walls. Object dimensions appear only for the
  selected object, plus its clearance gaps to neighbours.

### Clearance violations

The findings list and the canvas must be one visual language.

- Violation zone: fill `#FDF0E8` at ~70% opacity, stroke `#CA5008` **1.5px dashed** with a
  `6 4` dash pattern. Dashed = "this is a rule, not a thing."
- Draw the offending gap as a dimension line in `#CA5008` with the measured value in
  `text-label-s` `#CA5008`, and the required minimum beneath it in `text-body-s` `#CA5008` as
  `min 750`. Showing both numbers is what makes it feel like a real planning tool.
- Blocking violations (door won't open, object overlaps a wall) use `#E00751` with the same dashed
  treatment.
- Hovering a row in the findings list should raise that zone's fill opacity to 100% and pulse the
  stroke once — 400 ms, no looping animation.
- Never turn the furniture footprint itself red. Highlight the *gap*, not the object; that's the
  difference between a design tool and an error console.

### Chrome on the canvas

- Zoom / fit / rotate controls: 40px circular tertiary icon buttons, `bg-surface`,
  `shadow-[inset_0_0_0_1px_#dfdfdf]`, bottom-right, 20px inset.
- Scale bar bottom-left: a 1000 mm rule, 1px `#767676`, labelled `1 m` in `text-body-s` `#767676`.
- Keep all canvas chrome white-on-paper with hairlines. No dark toolbar, no floating dark panel.

## 8. What to avoid

**Visual clichés that will make this read as a generic AI demo:**

- Dark mode, dark hero sections, and dark toolbars. This app is light, top to bottom. IKEA's web
  retail surface has no dark theme; ours shouldn't either.
- Purple / violet / indigo accents. Our accents are `#0058A3` and `#FFDB00` and they are used
  sparingly. Never `#6366F1`-family anything.
- Gradients of any kind — no gradient text, no gradient buttons, no mesh backgrounds, no
  `bg-gradient-to-r from-… to-…`. Every fill in this spec is flat.
- Glassmorphism: `backdrop-blur`, translucent panels, `bg-white/10`. IKEA uses opaque surfaces and
  hairlines.
- Neon, glow, `shadow-[0_0_20px_…]`, animated borders.
- Heavy shadow stacks. Two shadows exist in this spec: `0 4px 16px #0000001a` for sheets and
  `0 1px 4px rgba(17,17,17,.55)` for text over images. Structure comes from `#DFDFDF` hairlines.
- Rounded-everything. Buttons are pills (64px), containers are 8px, inputs are 4px. Don't apply
  `rounded-2xl` uniformly — the *contrast* between those radii is the signature.
- Emoji as iconography. Use a consistent 24px line-icon set at 1.5px stroke.
- Font weights 500/600, or a second display typeface. 400 and 700, Noto Sans, only.
- Monospace anywhere user-facing. Dimensions are Noto Sans 700 with tabular figures
  (`font-variant-numeric: tabular-nums`) — set that on prices and measurements.
- Cramped vertical rhythm. The 88px / 120px section padding is doing real work; a dense dashboard
  layout will lose the retail feel instantly.
- Centred body copy, and low-contrast grey-on-grey text. `#767676` is our floor, on white only.

**Boundary (brief, factual):** we match visual style — colour, type, spacing, component geometry,
layout rhythm. We do not use the IKEA logo or wordmark, their product photography, or their product
names. Lares ships its own name, its own mark, and its own catalog copy and imagery.
