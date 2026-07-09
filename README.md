# Noble Billing — marketing site

Premium, animated one-page marketing site repositioning **Noble Billing** as the
revenue-cycle operating partner for behavioral health. White + royal-emerald-green
design system, Arcadia typography, a cinematic scroll-zoom hero (Three.js + GSAP),
count-up metrics, an animated claims pipeline, and a live "Revenue Console" dashboard
with real bar / donut / line charts.

## Run it

It's a static site — no build step.

```bash
# from this folder
python3 -m http.server 4321
# then open http://localhost:4321
```

(A Claude Code preview config is already in `.claude/launch.json`.)
You can also just open `index.html` directly in a browser while online (the animation
libraries load from CDN).

## Deploy

Drop the folder onto any static host — **Vercel**, Netlify, Cloudflare Pages, GitHub
Pages, or S3. No server code. For Vercel: `vercel deploy` from this directory.

## File structure

```
index.html              # all page markup + metadata + JSON-LD
assets/css/styles.css    # design tokens + every section's styles
assets/js/hero3d.js      # Three.js "revenue network" hero background
assets/js/main.js        # scroll choreography, count-ups, charts, nav
.claude/launch.json      # local preview server config
```

## Design system

- **Colors:** white / paper (`--white`, `--paper`) + a royal green scale
  (`--green-950 … --green-050`), with a sparing champagne-gold accent (`--gold`) for
  the "classy/royal" note. All defined as CSS variables at the top of `styles.css`.
- **Type:** Arcadia stack per brand — `--font-display` (headlines), `--font-body`
  (UI/body), `--font-mono` (finance figures). **See font note below.**
- **Motion:** transform/opacity only; a pinned hero scrubbed by scroll; everything
  respects `prefers-reduced-motion` and degrades to a static, readable layout.

### ⚠️ Arcadia fonts — action needed

Arcadia is a licensed brand typeface, so it is **not** bundled here. The CSS uses your
exact requested stack, so it renders in Arcadia **if the font is installed/licensed**,
and falls back to system sans otherwise (that's what you see if Arcadia isn't present).
To ship the true brand type, add the licensed web-font files and an `@font-face` block:

```css
@font-face { font-family:"Arcadia";        src:url("assets/fonts/Arcadia.woff2") format("woff2"); font-weight:400 600; font-display:swap; }
@font-face { font-family:"Arcadia Display"; src:url("assets/fonts/ArcadiaDisplay.woff2") format("woff2"); font-weight:600; font-display:swap; }
@font-face { font-family:"Arcadia Mono";    src:url("assets/fonts/ArcadiaMono.woff2") format("woff2"); font-weight:400 600; font-display:swap; }
```

Place the `.woff2` files in `assets/fonts/`. No other change needed — the variables
already reference these family names.

## Placeholder content to replace before launch

| Where | Replace with |
|---|---|
| Metrics marked `*` (98% clean claim rate, <30 days A/R, 95% first-pass) | Noble's **real, audited** figures. The `*` footnote already flags them as benchmarks. |
| Dashboard "Revenue Console" numbers & charts (`assets/js/main.js` → `buildBars`, and the KPI/donut/line values in `index.html`) | Real anonymized client data or keep as an illustrative product visual. |
| Team bios / `SW` `RV` monogram avatars | Real headshots + finalized bios for Sam Woodbury & Raquel Vargas. |
| Consultation form transport (`assets/js/main.js` → `contactForm`) | Works out of the box via `mailto:` (opens the visitor's email client, pre-filled to sam@noblebill.com). For silent server-side submission, point the form at Formspree / Netlify Forms / HubSpot — set the `<form>` `action`+`method` and replace the `mailto` line with a `fetch()`. Or drop in a Calendly embed for scheduling. |
| — | Add client logos + testimonials (a proof/results section) once consented. |

## SEO — already baked in

- Homepage `<title>` + meta description + Open Graph + `ProfessionalService`
  JSON-LD are keyword-optimized for **behavioral health billing / RCM**.
- Copy uses real buyer-intent terms: VOB, utilization review, days in A/R, clean claim
  rate, first-pass resolution, in/out-of-network, prior authorization, level of care,
  EKRA-aware, MHPAEA.
- **Next step (service pages):** the keyword research produced primary/secondary
  keywords + a `<title>` + meta description for each of the 6 service pages
  (Verification of Benefits, Utilization Review, Billing & Collections, Denials &
  Appeals, Reporting & Analytics, Consulting & Training) and a hub-and-spoke internal
  link plan. Ask me and I'll build those routes.

## Analytics hooks

CTA elements carry `data-analytics` attributes (`cta_consultation_hero`,
`cta_audit_hero`, `cta_consultation_footer`, `cta_audit_footer`). Wire them to GA4 /
Vercel Analytics with a few lines, e.g.:

```js
document.querySelectorAll('[data-analytics]').forEach(el =>
  el.addEventListener('click', () => gtag?.('event', el.dataset.analytics)));
```

## Accessibility

Semantic landmarks, skip link, visible focus states, keyboard-operable nav, and a full
`prefers-reduced-motion` fallback (no pinning/scrub; content stacks and stays readable).
No information is conveyed by animation alone.

## Porting to the Next.js stack (from the dossier)

This site is intentionally framework-free so it runs and deploys instantly. To move it
to the documented **Next.js + React + TS + Tailwind + Motion** stack:

- Each `<section>` → a React component (`Hero`, `Metrics`, `Pipeline`, `Solutions`,
  `Dashboard`, `WhyNoble`, `Leadership`, `CTA`, `Footer`).
- `hero3d.js` → a `HeroCanvas` client component (react-three-fiber optional).
- The GSAP scroll timeline → `motion` `useScroll`/`useTransform`, or keep GSAP.
- Content strings → a typed `content.ts` config object.
- Add routes `/solutions/*`, `/results`, `/about`, `/contact` using the SEO plan above.

## Credits / libraries

Three.js r128, GSAP 3.12 + ScrollTrigger (CDN). Swap to npm packages when porting.
