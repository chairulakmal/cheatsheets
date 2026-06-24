# TODO & Roadmap

**Committed route: Foundation-first.** Build a solid assembly line before expanding reach or
coverage — harden the toolchain and CI first, then reader UX, then publish, then more topics.
Slower to user-visible payoff, but every later topic and feature is cheaper and safer to add.

Keep the project's "small generator, don't over-engineer" ethos — add a dependency or script only
when an existing one can't do the job. Phases are strictly ordered: don't start a phase until the
previous one is done.

---

## Deviations from the plan (keep honest)

- **An "Advanced" (senior-level) tier now exists**, exempt from the beginner-prose convention:
  `react-vs-vue` plus five Patterns sheets — `typescript-patterns`, `react-patterns`,
  `nextjs-patterns`, `vue-patterns`, `nuxt-patterns`. All shipped off-roadmap (user-requested);
  the three original Patterns sheets were reclassified from "intermediate" to senior-level. These
  carry `advanced: true` in `src/index.ts` and render in a separate "Advanced" section on the
  homepage. Documented in `CLAUDE.md` (audience section) and `README.md`.
- **Editable playground upgraded to Tier 2** (CodeMirror 6 editor, shipped off-roadmap):
  `vue-patterns` and `react-patterns` both have syntax-highlighted in-browser editing. Sucrase
  transpiles; topic drives import map + transforms. No new npm deps — CodeMirror loads from CDN.
- **Topic count is now 15**, which crosses the Phase 5 unlock threshold (≥ 15). Note the project's
  Foundation-first ordering: Phase 4a/4b coverage topics (HTML, CSS, Git, SQL, Bash) are still
  unstarted, so the Advanced tier grew the count ahead of that planned beginner coverage.

---

## Phase 1 — Validate & CI (correctness gate)

Goal: mistakes are caught by machine before they ship. Nothing else starts until CI is green.

- [x] **`scripts/validate.ts` — standalone content linter.** Decoupled from `build.ts` so it runs
  fast without a full Shiki/esbuild pass. Fails loudly on:
  - untagged code fences,
  - duplicate or missing `# H1`,
  - a ` ```demo ` fence in a `live: false` topic,
  - any fenced language not in `SHIKI_LANGS`.

  Add `npm run validate` to `package.json`. The Python-highlighting defect would have been caught
  here instead of shipping silently.
- [x] **CI.** Run `npm run check` + `npm run validate` + a full build on every push. A broken topic
  must not be mergeable.

**Exit criteria:** `validate` catches a known-bad fixture (untagged fence, missing H1) and exits
non-zero. CI passes for five consecutive commits on `main`. Both scripts finish in under 3 s.

---

## Phase 1.5 — Fast authoring loop

Goal: editing a markdown file triggers a rebuild in under 2 s, no manual restarts.

- [x] **Watch mode.** `nodemon --watch src --watch assets --ext md,css,ts --exec "npm run build:html"` — zero custom code. Wired as `npm run dev`.

**Exit criteria:** editing any `src/*.md` file triggers a visible rebuild in under 2 s.

---

## Phase 2 — Reader UX + accessibility baseline

Goal: the existing nine topics become genuinely pleasant to use, and are accessible from day one
(retrofitting across 15+ topics later is far more expensive).

- [x] **Copy-to-clipboard buttons** on code blocks — the highest-value cheatsheet affordance.
- [x] **Accessibility baseline.** Semantic HTML pass + ARIA labels on interactive elements (demos,
  nav, copy buttons). Targets Lighthouse accessibility score ≥ 90 on all nine pages. Scoped to
  structural fixes now; full audit is Phase 5.
- [x] **Per-page table of contents** on pages with ≥ 5 sections (Python has 13).
- [x] **Minimal landing page** — working topic grid, correct `<title>` and `<meta description>`
  per page. Full visual polish belongs in Phase 5; define "done" as functional, not beautiful.
- [x] **Fix PDF demo rendering** — in print, hide iframes and show only the static code. `@media print` in input.css covers this without needing `pdf.ts` changes.

**Exit criteria:** Lighthouse a11y ≥ 90 on all nine topic pages. Copy buttons work in Chrome,
Firefox, and Safari. Every page has a valid `<title>` and `<meta description>`.

---

## Phase 3 — Publish & distribute

Goal: people can find and use the cheatsheets without cloning or building locally.

- [x] **Deploy** to GitHub Pages. CI auto-deploys on merge to `main` via `actions/deploy-pages`.
  Enable Pages in repo Settings → Pages → Source: GitHub Actions.
- [x] **Pre-built `dist.zip`** — `.github/workflows/release.yml` builds the HTML site and attaches
  `dist.zip` to every GitHub Release automatically (no Chromium/PDF step).
- [x] **"Last updated" date** per cheatsheet — `git log -1 --format="%as"` per file, shown in the
  page header. Requires `fetch-depth: 0` in CI checkout (already set).
- [x] **Open Graph / meta tags** — `og:title`, `og:description`, `og:url`, `og:type`,
  `twitter:card` emitted in `build.ts`. Set `SITE_URL` env var at build time for absolute URLs.
- [x] **"Save as PDF" on each topic page** — a header button calling `window.print()`; the compact
  layout lives in an `@media print` block in `input.css`. No Chromium in CI; `npm run build:pdf`
  remains an optional local tool for generating real `.pdf` files.
- [ ] **User feedback loop** — manually pin a GitHub Discussions thread ("What's missing or
  broken?") after the site goes live.

**Exit criteria:** public URL live and link-check clean, OG preview renders correctly, ZIP is
downloadable from the Releases page, CI auto-deploys on merge.

---

## Phase 4a — Broaden coverage: quick wins

Goal: three high-reach topics with no new build infrastructure. Safe to expand now that validation,
CI, and UX are in place.

- [ ] **HTML** cheatsheet — live DOM-manipulation demos, `live: true`.
- [ ] **CSS** cheatsheet — live demos (visual output in iframe), `live: true`.
- [ ] **Git** cheatsheet — static code + terminal output annotation, `live: false`.

Each topic follows the "Adding a topic" checklist in `CLAUDE.md`.

**Exit criteria:** all three pass `npm run validate`, render correctly on mobile, and CI is green.
Ship Phase 4a before starting 4b.

---

## Phase 4b — Broaden coverage: mid-tier (time-boxed 2 weeks)

- [ ] **SQL** cheatsheet — decide: in-browser via `sql.js`/PGlite (adds ~700 KB, enables live
  demos) vs. static output annotations. Choose based on bundle size tolerance at that point.
- [ ] **Bash/shell** cheatsheet — static code + expected output, `live: false`.

**Exit criteria:** both topics pass validate and CI. If either is not done within the 2-week
time-box, ship what's ready and explicitly defer the rest.

---

## Phase 5 — Discovery & polish (unlock when topic count ≥ 15)

Goal: the collection stays navigable as it grows.

- [ ] **Client-side search** using [Pagefind](https://pagefind.app) — post-build step, ~25 KB JS
  bundle, no backend required.
- [ ] **Topic grouping / tags** on the landing page (languages vs. frameworks vs. tools).
- [ ] **Dark mode** toggle.
- [ ] **Full accessibility audit** — keyboard navigation, contrast ratios, screen-reader labels
  across all topics.
- [x] **Editable demo playground — Tier 2 shipped.** CodeMirror 6 editor (lazy-loaded, `?bundle`)
  with TypeScript/JSX syntax highlighting on both `vue-patterns` and `react-patterns`. Sucrase
  handles in-browser transpilation; topic is detected at runtime via `PLAYGROUND_TOPIC` injected by
  `build.ts`. Vue uses `['typescript']` transforms + Vue import map; React adds `'jsx'` + React
  import map. See `PLAYGROUND_TOPICS` / `PLAYGROUND_SCRIPT` in `build.ts` and the CLAUDE.md
  "Editable playground" section. Possible Tier-3 additions (not committed): full-screen sandbox
  expand, CodeMirror autocomplete tuning, generalise to more topics.

**Exit criteria:** Pagefind returns correct results for ten representative test queries. Landing
page groups are accurate for all topics.

---

## Advanced patterns accuracy fixes (do before Phase 4a)

Review of `typescript-patterns`, `vue-patterns`, and `nuxt-patterns` found two real bugs in Vue
Patterns plus several minor gaps. Fix these before adding more topics — broken examples undermine
reader trust.

### Vue Patterns — real bugs (fix first)

- [x] **Pinia store missing imports.** `stores/auth.ts` example (the `useAuthStore` block) uses
  `ref`, `computed` without importing them, and calls `$fetch` which is a Nuxt auto-import — not
  available in a plain Vue + Pinia project. Add `import { ref, computed } from 'vue'` and replace
  `$fetch(...)` with `fetch(...)` or add a comment that `$fetch` is Nuxt-specific (the watcher
  cleanup example has the same `$fetch` problem).

- [x] **`onWatcherCleanup` version gate missing.** Added in Vue **3.5** — a reader on 3.4 gets a
  runtime error with no helpful message. Add "(Vue 3.5+)" to the heading or prose, matching the
  `defineModel` treatment above it.

### Vue Patterns — minor gaps (fix in same pass)

- [x] **`defineEmits` typed call-signature syntax requires Vue 3.3+.** Add a brief version note
  alongside the existing `defineModel` / `onWatcherCleanup` callouts so the page is consistent.

### TypeScript Patterns — minor gaps

- [x] **Missing version callouts for newer utility types.** `satisfies` is TypeScript 4.9+;
  `Awaited` is TypeScript 4.5+. Beginners on an older tsconfig baseline will get confusing errors.
  Add inline version notes (e.g. "TypeScript 4.9+") to those two sections.

- [x] **Overload example uses `raw: true` literal type** in the second signature — a call of
  `parse('{}', false)` would fail at the type level, which isn't obvious from the prose. Adjust
  the prose or add a `raw: false` overload so the example is unambiguous.

### Nuxt Patterns — minor improvement

- [x] **CORS section could mention H3 built-ins.** The manual origin check is correct but H3
  ships `handleCors` / `appendCorsHeaders` that handle preflight automatically. Add a one-line
  note pointing readers to `h3`'s CORS utilities.

**Exit criteria:** no imports are missing from any example, all version-gated APIs carry a version
note, and `npm run validate` still passes.

---

## Someday / maybe

Ideas worth noting but not committed. Revisit only if there is clear user demand.

- [ ] Phase 4c — stretch topics: Go, Rust, Docker. Gated on Phase 4a shipping cleanly and a demand
  signal (issues, traffic, stars).
- [ ] "Try it" full-screen sandbox — expand an iframe to full viewport (the infrastructure is
  already there; it is a small CSS/JS change).
- [ ] Combined "all topics" PDF for offline/print use (significant pagination complexity; validate
  demand before building).
- [ ] Translations / i18n for non-English readers (requires a content workflow that does not exist
  yet).
