# Cheatsheet Project

Developer cheatsheets for programming languages and frameworks. **Markdown is the source
of truth.** Build scripts convert `src/**/index.md` → static **HTML** (and optionally PDF),
injecting live demos where supported.

## Current status

Pipeline is built and working. `npm run build` and `npm run typecheck` both pass.

**What exists:**
- `package.json`, `tsconfig.json` — project config
- `src/index.ts` — topic manifest (all five topics registered)
- `src/typescript/index.md` — TypeScript cheatsheet content (complete)
- `src/react/index.md` — React cheatsheet content (complete)
- `src/vue/index.md` — Vue cheatsheet content (complete)
- `scripts/build.ts` — Markdown → HTML pipeline (shiki, esbuild, sandboxed iframes; JSX and Vue CDN import-map support)
- `scripts/pdf.ts` — PDF export via headless Chrome; compact styles injected at export time
- `assets/input.css` / `assets/style.css` — Tailwind v3 source and generated output
- `tailwind.config.cjs` — Tailwind config with `@tailwindcss/typography`

**npm scripts:**
- `npm run build` — CSS + HTML + PDF (full build)
- `npm run build:html` — CSS + HTML only (faster for content iteration)
- `npm run build:pdf` — PDF export only
- `npm run build:css` — Tailwind CSS generation only
- `npm run typecheck` — tsc --noEmit

**Still to write:**
- `scripts/dev.ts` — dev server with hot reload
- `src/rails/index.md`, `src/elixir/index.md` — cheatsheet content for remaining topics

**Remaining build order:**

4. **Rails** — static demos only (Ruby). Proves Ruby highlighting + the expected-output
   annotation convention.
5. **Elixir** — static demos only. Reuses the Rails path; second non-JavaScript language.

## Output format: HTML only

The build emits **static HTML**, not JSX/React components. Rules:

- A generated page must render and be readable **with JavaScript disabled**.
- Live demos are **progressive-enhancement islands** layered onto that static HTML, not the
  page itself.
- `.jsx`/`.tsx` files under a topic's `demo/` are **authoring inputs** for those islands —
  they are bundled into a sandboxed `<iframe>`, never shipped as the page format.
- There is no "JSX output" target. If you find a reference to one, it is stale — remove it.

## Directory structure

```
src/
  index.ts            # manifest: registers every topic (see below)
  <topic>/
    index.md          # cheatsheet content (source of truth)
    demo/             # optional: live-demo sources — .jsx/.tsx ONLY
scripts/
  build.ts            # md → dist/ (parse, highlight, inject demo sandboxes)
  pdf.ts              # dist/*.html → PDF via headless Chromium
dist/                 # generated — never edit by hand, never commit
  <topic>/
    index.html
    index.pdf
```

`demo/` holds JavaScript-framework demo sources only. Rails/Elixir/Ruby topics have **no** `demo/`
dir — their examples are static code blocks with output annotations (see Live demos).

### Manifest (`src/index.ts`)

Registers topics in display order. Each entry:

```typescript
export const topics: Topic[] = [
  { slug: "typescript", title: "TypeScript", live: true },
  { slug: "rails",      title: "Rails",      live: false },
];
```

`live: true` → topic may contain ` ```demo ` fences. `live: false` → demos are static only;
treat a ` ```demo ` fence as an authoring error.

## Markdown conventions

- One `# H1` per file: the cheatsheet title. Use `##` for sections.
- Tag every fenced block with its language (` ```typescript `, ` ```ruby `, ` ```elixir `, …) so
  highlighting works. Untagged code blocks are a defect.
- Live demo, inline: ` ```demo ` (body is the demo source).
- Live demo, from file: ` ```demo:./demo/counter.tsx `.
- Keep prose minimal. Cheatsheets are reference material, not tutorials — favor code +
  one-line annotations over paragraphs.
- **Keep code blocks short — ~10 lines each.** If a section has many examples, split them
  into separate fenced blocks with a one-line label between them rather than one long block.
  Long blocks cause PDF pages to be nearly empty (the block forces a page break and the
  remaining space goes unused). Prefer several small blocks over one tall one.

## Live demos

- **JavaScript/TypeScript/Vue/React** (`live: true`): run **in-browser**, server-free, inside a sandboxed
  `<iframe>`. Self-contained and dependency-free where possible; if a CDN import is
  required, **pin the exact version**.
- **Ruby/Rails/Elixir** (`live: false`): **never executed.** Show static code with an
  expected-output annotation, e.g. a trailing `# => 42` or an `# Output:` comment. Do not
  add a `demo/` dir or attempt server-side / WASM execution for these.

## Build & verify

Canonical package manager is **npm**. Run `.ts` build scripts through a TypeScript runner (`tsx`,
e.g. `npx tsx scripts/build.ts`, wired to the npm scripts below). Keep the scripts
runtime-portable (no runtime-specific APIs) so Node/Deno can run them too.

```bash
npm run build        # CSS + HTML + PDF (full build)
npm run build:html   # CSS + HTML only (faster for content work)
npm run build:pdf    # PDF export only (requires Chrome or Chromium)
npm run dev          # dev server, hot reload (not yet implemented)

npm run typecheck    # tsc --noEmit — must pass before done
npm run lint         # if configured — must pass before done
```

After any change, run `typecheck` (and `lint` if present) and confirm `npm run build`
succeeds before considering the task complete.

## Code style & invariants

- Build scripts are TypeScript; no UI-framework lock-in in the tooling.
- Generated HTML must be valid, accessible, and JavaScript-optional (demos degrade gracefully).
- **Never edit or commit anything under `dist/`** — it is generated output.
- When adding a topic: create `src/<topic>/index.md`, add a `demo/` dir only if `live`,
  and register it in `src/index.ts`. A topic is not "added" until it is in the manifest.
