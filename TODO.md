# TODO & Roadmap

**Committed route: Foundation-first.** Build a solid assembly line before expanding reach or
coverage — harden the toolchain and CI first, then reader UX, then publish, then more topics.
Slower to user-visible payoff, but every later topic and feature is cheaper and safer to add.

Keep the project's "small generator, don't over-engineer" ethos — add a dependency or script only
when an existing one can't do the job. Phases are strictly ordered: don't start a phase until the
previous one is done.

---

## Phase 1 — Harden the toolchain (do this first)

Goal: mistakes are caught by machine, and authoring has a fast feedback loop. Nothing else starts
until this is green.

- [ ] **Content validation — start here.** A pre-pass (in `build.ts` or a small standalone script)
  that fails loudly on:
  - untagged code fences,
  - duplicate or missing `# H1`,
  - a ` ```demo ` fence in a `live:false` topic,
  - any fenced language not in `SHIKI_LANGS`.

  The Python-highlighting defect would have been caught here instead of shipping silently.
- [ ] **`scripts/dev.ts` — watch + rebuild.** Watch `src/` + `assets/` and rebuild on change.
  `chokidar` is already installed and `npm run dev` is wired but currently throws (the file doesn't
  exist).
- [ ] **CI.** Run `npm run check` + a full build (including validation) on every push so a broken
  topic can't merge.

## Phase 2 — Reader UX

Goal: the existing nine topics become genuinely pleasant to use.

- [ ] **Copy-to-clipboard buttons** on code blocks — the highest-value cheatsheet affordance,
  currently absent.
- [ ] **Per-page table of contents** — long pages (Python has 13 sections) have no in-page nav.
- [ ] **PDF download links** — link each topic page to its own `<slug>-cheatsheet.pdf`.
- [ ] **Real landing page** — flesh out `dist/index.html` beyond the bare topic grid.
- [ ] **Fix PDF demo rendering** — interactive iframes are dead weight on paper (a React/Vue button
  can't be clicked, the iframe is frozen at 70px). In print, collapse the demo to just its code
  (or a static result) instead of a frozen iframe.

## Phase 3 — Publish & distribute

Goal: people can find and use the cheatsheets, not just build them locally.

- [ ] **Deploy** the static site (GitHub Pages or Railway — use **Railpack**, never Nixpacks).
- [ ] **Combined "all topics" PDF** for offline/print use, alongside the per-topic PDFs.
- [ ] **"Last updated" date** per cheatsheet (from git history) so readers can gauge freshness.
- [ ] **Open Graph / meta tags** for shareable link previews.

## Phase 4 — Broaden coverage

Goal: more languages and tools, same beginner-first format. Safe to expand now that validation,
CI, and UX are in place. Each new topic follows the "Adding a topic" checklist in `CLAUDE.md`.

- [ ] Foundational web: HTML, CSS.
- [ ] Tooling every beginner hits: Git, Bash/shell, SQL.
- [ ] Popular languages: Go, Rust.
- [ ] DevOps basics: Docker.
- [ ] For any topic with a browser runtime, wire a live-demo runtime; otherwise static + `# =>`.
- [ ] Add more demos across existing JS-family topics (e.g. JavaScript async/await, destructuring).

## Phase 5 — Discovery & polish

Goal: the collection stays navigable as it grows past ~15 topics.

- [ ] Client-side search across all cheatsheets (lightweight, no backend).
- [ ] Dark mode toggle.
- [ ] Accessibility audit (keyboard nav, contrast, screen-reader labels on demos).
- [ ] Tag/group topics by category (languages vs frameworks vs tools) on the landing page.

---

## Someday / maybe

Ideas worth noting but not committed. Revisit only if there's clear demand.

- [ ] Translations / i18n for non-English readers.
- [ ] Per-topic theming or printable "one-pager" condensed variants.
- [ ] "Try it" expansion that opens a demo full-screen in a sandbox.
