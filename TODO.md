# TODO & Roadmap

**Committed route: Foundation-first.** Build a solid assembly line before expanding reach or
coverage — harden the toolchain and CI first, then reader UX, then publish, then more topics.
Slower to user-visible payoff, but every later topic and feature is cheaper and safer to add.

Keep the project's "small generator, don't over-engineer" ethos — add a dependency or script only
when an existing one can't do the job. Phases are strictly ordered: don't start a phase until the
previous one is done.

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

- [ ] **Watch mode.** Try `nodemon --watch src --watch assets --ext md,css,ts --exec "npm run build:html"`
  first — zero custom code. Only write `scripts/dev.ts` if browser live-reload is needed; if so,
  reach for Browsersync before writing a custom solution. Wire `npm run dev`.

**Exit criteria:** editing any `src/*.md` file triggers a visible rebuild in under 2 s.

---

## Phase 2 — Reader UX + accessibility baseline

Goal: the existing nine topics become genuinely pleasant to use, and are accessible from day one
(retrofitting across 15+ topics later is far more expensive).

- [ ] **Copy-to-clipboard buttons** on code blocks — the highest-value cheatsheet affordance.
- [ ] **Accessibility baseline.** Semantic HTML pass + ARIA labels on interactive elements (demos,
  nav, copy buttons). Targets Lighthouse accessibility score ≥ 90 on all nine pages. Scoped to
  structural fixes now; full audit is Phase 5.
- [ ] **Per-page table of contents** on pages with ≥ 5 sections (Python has 13).
- [ ] **Minimal landing page** — working topic grid, correct `<title>` and `<meta description>`
  per page. Full visual polish belongs in Phase 5; define "done" as functional, not beautiful.
- [ ] **Fix PDF demo rendering** — in print, hide iframes and show only the static code. Consider
  whether `@media print` CSS covers this without needing `pdf.ts` changes at all.

**Exit criteria:** Lighthouse a11y ≥ 90 on all nine topic pages. Copy buttons work in Chrome,
Firefox, and Safari. Every page has a valid `<title>` and `<meta description>`.

---

## Phase 3 — Publish & distribute

Goal: people can find and use the cheatsheets without cloning or building locally.

- [ ] **Deploy** the static site (GitHub Pages or Railway — use **Railpack**, never Nixpacks).
  Wire CI to auto-deploy on merge to `main`.
- [ ] **Pre-built `dist.zip`** attached to each GitHub Release so beginners can download-and-open
  without Node installed.
- [ ] **"Last updated" date** per cheatsheet (from `git log`) so readers can gauge freshness.
- [ ] **Open Graph / meta tags** for shareable link previews (validate with Slack and Twitter card
  validator).
- [ ] **PDF download links** on each topic page (now that PDFs exist at a stable deployed URL).
- [ ] **User feedback loop** — pin a GitHub Discussions thread ("What's missing or broken?") so
  future prioritisation is driven by actual usage, not assumptions.

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

**Exit criteria:** Pagefind returns correct results for ten representative test queries. Landing
page groups are accurate for all topics.

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
