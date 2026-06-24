# Cheatsheet Project

Beginner-friendly developer cheatsheets. **Markdown is the source of truth.** `scripts/build.ts`
converts `src/<topic>/index.md` → static **HTML**; `scripts/pdf.ts` renders that HTML → PDF.
Live demos for JS-family topics run in sandboxed iframes.

Audience is **beginners** — prefer full terms ("TypeScript", not "TS") in prose, explain each
concept in one plain sentence before the code, and keep examples short.

**Exception — the "Advanced" tier:** six pages are deliberate **senior-level** pages — they use
long explanatory prose and cover tradeoffs, not one-sentence intros: `react-vs-vue`,
`typescript-patterns`, `react-patterns`, `nextjs-patterns`, `vue-patterns`, `nuxt-patterns`. They
are the approved deviations from the beginner-prose rule; do not "simplify" them back down. These
topics carry `advanced: true` in `src/index.ts`, which both records the classification and renders
them in a separate **"Advanced"** section on the homepage. The ~10-line-per-code-block rule (a
PDF-rendering constraint) still applies to them. Every other topic stays beginner-focused — do not
add `advanced: true` without that being the explicit intent.

## Working agreements (read first)

- **Make the change, then verify it.** After editing content run `npm run build:html`; after
  editing `pdf.ts` run `npm run build:pdf`. Both must finish without error before you call a task
  done. Run `npm run check` (typecheck + lint) before committing.
- **`npm run dev`** starts a nodemon watch loop — rebuilds HTML whenever a `.md`, `.css`, or `.ts` file changes. No live-reload; refresh manually after it prints "Built:".
- **Don't over-engineer.** This is a small static-site generator. Add a dependency or a new script
  only when an existing one can't do the job; say so first.
- **Keep docs honest.** When you finish a topic or script, update the "Current status" list below
  and the matching rows in `README.md`. Stale status is worse than none.
- Touch one concern at a time; don't reformat files you aren't changing.

## Current status

Fifteen topics registered; all fifteen complete. Phases 1–2 shipped: content linter, CI, watch mode, copy buttons, per-page TOC, meta descriptions, PDF print fix.

**JavaScript is topic #1 in the manifest** — it is the foundation for TypeScript, React, Vue, Next.js, and Nuxt. Always list and build JavaScript before TypeScript.

| Path | State |
|------|-------|
| `src/index.ts` | Manifest — twelve topics registered, JavaScript first |
| `src/javascript/index.md` | Complete, live demos |
| `src/typescript/index.md` | Complete, live demos |
| `src/react/index.md` | Complete, live demos |
| `src/nextjs/index.md` | Complete, live demos |
| `src/vue/index.md` | Complete, live demos |
| `src/nuxt/index.md` | Complete, live demos |
| `src/rails/index.md` | Complete, static code + `# =>` output |
| `src/elixir/index.md` | Complete, static code + `# =>` output |
| `src/python/index.md` | Complete, static code + `# =>` output |
| `src/typescript-patterns/index.md` | Complete, static, **Advanced** (`advanced: true`) — generics, utility types, keyof/typeof, overloads, never/exhaustiveness, branded types, security + distributive conditionals, assertion functions, interface-vs-type, variance/`in`/`out`, `const` type params, variadic tuples, compiler strictness, type-checker perf |
| `src/react-patterns/index.md` | Complete, **live demos + editable playground** (in `JSX_TOPICS` + `PLAYGROUND_TOPICS`), **Advanced** (`advanced: true`) — React 19: custom hooks, useReducer, context re-render trap, memoization/React Compiler, refs, useId, useTransition/useDeferredValue, useSyncExternalStore, error boundaries, Suspense, key-reset, controlled/uncontrolled, `use()`, form actions, no-effect, StrictMode, security (dangerouslySetInnerHTML, URL injection, SSR state) |
| `src/nextjs-patterns/index.md` | Complete, static, **Advanced** (`advanced: true`) — Next 16 App Router: server/client components, server data fetch, Cache Components/`use cache`, route handlers, server actions, async request APIs, `proxy.ts`, segment config, generateStaticParams, streaming, metadata, image/font, navigation, parallel/intercepting routes, security (env, action auth) |
| `src/vue-patterns/index.md` | Complete, **live demos + editable playground** (in `VUE_TOPICS` + `PLAYGROUND_TOPICS`), **Advanced** (`advanced: true`) — script setup, Pinia, composables, slots, lifecycle, reactivity perf, watcher cleanup, security + reactive props destructure (3.5), composable design/`toValue`, flush timing/`nextTick`, Suspense, `defineExpose`/`useTemplateRef`, reactivity steering, `effectScope` |
| `src/nuxt-patterns/index.md` | Complete, static, **Advanced** (`advanced: true`) — useFetch, routeRules/hybrid rendering, Nitro caching, SSR auth, security headers, server-side auth + Nuxt 4 structure, SSR data-fetch model, server `$fetch` short-circuit, `callOnce`, client/server boundaries, Nitro cache storage/SWR, server middleware/plugins, route validation |
| `src/react-vs-vue/index.md` | Complete, static, **Advanced** (`advanced: true`) — senior-level deep dive: reactivity model, ref/reactive/computed/watch/watchEffect vs useState/useEffect/useRef/useMemo, computed vs useMemo cache guarantee, composables vs hooks, immutable vs mutable, React 19 ref-as-prop, decision framework |
| `scripts/validate.ts` | Content linter — untagged fences, H1, demo/live, SHIKI_LANGS |
| `scripts/build.ts` | Markdown → HTML (shiki, esbuild, demo iframes) |
| `scripts/pdf.ts` | HTML → PDF (headless Chrome) — **optional local tool**, not run in CI |
| `scripts/dev.ts` | Not needed — `npm run dev` uses nodemon directly |
| `assets/input.css` | Tailwind v3 source (committed) |
| `assets/style.css` | Generated by Tailwind — gitignored, do not edit |
| `eslint.config.js` | ESLint v10 + typescript-eslint, flat config |

## Roadmap

`TODO.md` is the source of truth for what's next — keep it current as work lands. The project is
committed to a **Foundation-first** route: harden the toolchain before expanding reach or coverage.
Phases are **strictly ordered** — don't start a later phase while an earlier one is unfinished.

1. ~~**Harden the toolchain**~~ — ✓ done (`validate`, CI, nodemon watch mode).
2. ~~**Reader UX**~~ — ✓ done (copy buttons, per-page TOC, meta descriptions, PDF print fix).
3. ~~**Publish & distribute**~~ — ✓ done (GitHub Pages CI deploy, release dist.zip, last-updated dates, OG tags, browser "Save as PDF").
4. **Broaden coverage** — new topics (HTML, CSS, Git, SQL, Go, Rust, Docker), more demos.
5. **Discovery & polish** — client-side search, dark mode, accessibility audit, topic grouping.

When picking up unscoped "what's next" work, start at the earliest unfinished phase in `TODO.md`,
not whatever is most interesting. If you finish a roadmap item, tick it off in `TODO.md`.

## Commands

```bash
npm run dev          # watch src/ + assets/, rebuild HTML on change
npm run build        # CSS + HTML + PDF (full build)
npm run build:html   # CSS + HTML only — use this while editing content
                     # Set SITE_URL=https://... for absolute OG/canonical URLs
npm run build:css    # Tailwind regen only
npm run build:pdf    # PDF only (needs Chrome/Chromium; build HTML first)
npm run clean        # rm -rf dist
npm run validate     # content linter — runs fast, no build needed
npm run typecheck    # tsc --noEmit
npm run lint         # eslint scripts/ src/
npm run check        # typecheck + lint — run before committing
```

Build scripts are `.ts`, run via `tsx`. Keep them runtime-portable (no Node-only APIs beyond
`node:fs`/`node:path`/`node:url`) so Deno/Bun could run them too.

## Directory structure

```
src/
  index.ts            # topic manifest (see below)
  <topic>/index.md    # cheatsheet content — source of truth, one H1 = the title
scripts/
  build.ts            # md → dist/*.html
  pdf.ts              # dist/*.html → dist/<topic>/<topic>-cheatsheet.pdf
assets/
  input.css           # Tailwind entry (edit this)
  style.css           # generated (gitignored)
tailwind.config.cjs   # Tailwind + @tailwindcss/typography
dist/                 # generated — never edit or commit
```

There are **no `demo/` directories and no separate demo files.** Demos are written inline in the
markdown (see Live demos). If you see a `demo/` reference anywhere, it is stale — remove it.

### Manifest (`src/index.ts`)

```typescript
export const topics: Topic[] = [
  { slug: "javascript", title: "JavaScript", live: true },
  { slug: "typescript", title: "TypeScript", live: true },
  // ...
];
```

`live: true` → the topic may use ` ```demo ` fences. `live: false` → a ` ```demo ` fence is an
error and `build.ts` throws. A topic does not exist until it is in this array.

## Markdown conventions

- **One `# H1` per file** = the title. `build.ts` strips it from the body and renders it in the
  page header, so **do not** repeat the title as a heading in the body (that caused a duplicate-H1
  bug). Use `##` for sections.
- **Tag every fenced block with its language** (` ```typescript `, ` ```ruby `, ` ```elixir `,
  ` ```erb `, ` ```bash `, …). An untagged block renders without highlighting and is a defect.
- **Keep each code block to ~10 lines.** Split a long example into several small fenced blocks with
  a one-line label between them. Long blocks force a PDF page break and leave the prior page mostly
  empty (`break-inside: avoid` keeps a block whole, so a tall block wastes space).
- Minimal prose: one sentence of explanation per example, not paragraphs.

## Live demos

Authored **inline** as a ` ```demo ` fence; the fence body is the demo source. `build.ts` transpiles
it with esbuild and writes a standalone `dist/<topic>/demos/demo-N.html`, embedded via a
`sandbox="allow-scripts"` iframe. The runtime depends on the topic:

| Topic kind | Set in build.ts | esbuild loader | Mount | Runtime (pinned CDN) |
|------------|-----------------|----------------|-------|----------------------|
| TypeScript / plain JS | (neither set) | `ts` | captures `console.log` into `#out` | none |
| React | `JSX_TOPICS` | `tsx` + `jsx:automatic` | `#root` | react/react-dom 19.2.0 via esm.sh |
| Vue | `VUE_TOPICS` | `ts` | `#app` | vue 3.5.35 esm-browser via jsDelivr |

- **Vue is not JSX** — it uses runtime template strings, so the import map points at the *full* build
  (`vue.esm-browser.js`, includes the template compiler). Don't move Vue into `JSX_TOPICS`.
- **CDN versions are pinned on purpose.** Bump them deliberately, never "to latest" as a side effect.
  Current pins match framework peer deps: React 19.2.0 (Next.js 16 peer dep), Vue 3.5.35 (Nuxt 4 peer dep).
- A TS/JS demo should `console.log` its results (that's what shows). A framework demo must
  `createRoot(...).render(...)` (React) or `createApp(...).mount("#app")` (Vue).
- **Rails / Elixir never execute.** Show static code with an expected-output annotation (trailing
  `# => 42` or an `# Output:` comment). Do not add demos or attempt server-side/WASM execution.

### Editable playground (Tier-2 — `vue-patterns` and `react-patterns`)

Topics in `PLAYGROUND_TOPICS` render each ` ```demo ` fence as the normal pre-rendered iframe
**plus** an "✎ Edit code" affordance. Clicking Edit lazy-loads **CodeMirror 6** (from esm.sh CDN,
`?bundle` flag to keep deps self-contained) and mounts a full syntax-highlighted editor in a
`<div class="pg-editor">`. The original source is stored in a hidden `<textarea class="pg-src-data">`
and is never modified. "▶ Run" transpiles the editor content **in the browser** with **Sucrase**
(`https://esm.sh/sucrase@3.35.0`, also lazy-loaded), then re-renders by setting `iframe.srcdoc`.
"↺ Reset" dispatches a CodeMirror doc-replace transaction to restore the original source and restores
the iframe's `src`. Logic lives in `PLAYGROUND_SCRIPT` in `build.ts`, injected by `pageHtml` **only**
for playground topics. `var PLAYGROUND_TOPIC = "${slug}";` is injected just before the script so it
can branch on topic at runtime.

| Setting | Vue (`vue-patterns`) | React (`react-patterns`) |
|---------|---------------------|--------------------------|
| Sucrase transforms | `['typescript']` | `['typescript', 'jsx']` |
| Preview import map | `VUE_IMPORT_MAP` (vue 3.5.35 esm-browser via jsDelivr) | `REACT_IMPORT_MAP` (react/react-dom 19.2.0 via esm.sh) |
| Mount target | `#app` | `#root` |
| CodeMirror language | `javascript({ typescript: true, jsx: false })` | `javascript({ typescript: true, jsx: true })` |

Notes and constraints:

- The preview iframe stays `sandbox="allow-scripts"` (no `allow-same-origin`); Sucrase and CodeMirror
  run in the trusted parent page, only compiled JS crosses into the sandbox.
- CDN versions in `PLAYGROUND_SCRIPT` must be kept in sync with `VUE_IMPORT_MAP` / `REACT_IMPORT_MAP`.
- Print is preserved: the static Shiki-highlighted code shows, `.pg-editor` and `.pg-toolbar` are
  `no-print`, the preview iframe is already hidden by the global `@media print` rule.
- Editing only works for runtime-template Vue (what the demos already use); `<script setup>` SFC
  syntax won't compile in-browser without `@vue/compiler-sfc`.

## PDF / print

**Readers get PDFs from the browser**, not from CI. Each topic page has a "Save as PDF" button
(`<button onclick="window.print()" class="no-print">`) and the compact print layout lives in a
single `@media print` block in `assets/input.css` — smaller root font, tighter margins, breadcrumb
nav / copy buttons / demo iframes hidden, `break-inside: avoid` on code blocks, `@page` A4 + 14mm.

`scripts/pdf.ts` (run via `npm run build:pdf`) is an **optional local tool** that renders the same
print output to real `.pdf` files via headless Chrome — it calls `emulateMediaType('print')` so it
reuses the `@media print` CSS (no separate injected styles). **CI never runs it**, so neither the
deploy nor release workflow installs Chromium. Chrome is located via a path list
(`/usr/bin/google-chrome-stable` first).

## Gotchas (silent failures — check these first when something looks wrong)

- **Shiki language not in the list** → block silently falls back to unhighlighted `<pre>`. Add the
  language to `SHIKI_LANGS` in `build.ts`.
- **Tailwind typography overriding code blocks** → code-block wrappers use `not-prose` so the
  `prose` plugin doesn't restyle shiki output. Keep that class on any new code/demo wrapper.
- **Editing `assets/style.css` directly** → it's regenerated and gitignored; edit `assets/input.css`
  or `tailwind.config.cjs` instead.
- **New Tailwind classes not applying** → `tailwind.config.cjs` `content` globs only scan
  `scripts/**/*.ts` and `src/**/*.ts`. Classes must appear in those files (they're emitted from
  `build.ts`), not invented in markdown.
- **TOC links broken** → heading IDs are generated by `slugify()` in `build.ts` (lowercase, strip
  non-word chars, spaces → hyphens). The TOC uses the same function, so they always match — but if
  you rename a heading the anchor in the TOC updates automatically on next build.
- **Copy button not appearing** → the button is `opacity-0` by default and shown via
  `.code-block:hover .copy-btn` in `input.css`. All code wrappers must carry the `code-block` class.

## Adding a topic

1. `src/<topic>/index.md` with one `# H1` and `##` sections.
2. Add `{ slug, title, live }` to `topics` in `src/index.ts`.
3. If `live: true` for a *new framework*, wire its runtime in `build.ts` (import map, loader, mount,
   and the `*_TOPICS` set) — see the Live demos table.
4. `npm run build:html` and open `dist/<topic>/index.html`; `npm run typecheck`.
5. Update the status table above and the coverage table in `README.md`.

## Invariants

- Generated HTML must be valid, accessible, and readable with JavaScript disabled (demos are
  progressive enhancement on top of static content).
- Never edit or commit anything under `dist/`.
- Build tooling stays framework-agnostic (it's a generator, not an app).
