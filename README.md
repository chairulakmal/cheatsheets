# Developer Cheatsheets

A collection of quick-reference guides for programming languages and frameworks — written for beginners who want a handy reference while they learn.

Each cheatsheet is a single page with short code examples and plain-English explanations. Open it in a browser and keep it beside your editor while you code.

---

## What's covered

| Topic | Live examples? | Status |
|-------|---------------|--------|
| JavaScript | Yes | Available |
| TypeScript | Yes | Available |
| React | Yes | Available |
| Next.js | Yes | Available |
| Vue | Yes | Available |
| Nuxt | Yes | Available |
| Ruby on Rails | No (code + expected output shown) | Available |
| Elixir | No (code + expected output shown) | Available |
| Python | No (code + expected output shown) | Available |

"Live examples" means you can see the code run directly on the page. Languages that run on a server (like Ruby and Elixir) show the expected output as a comment instead.

---

## Where this project is headed

All nine cheatsheets are written and the core tooling is in place. See `TODO.md` for the full checklist. In short:

1. ~~**Better tooling** — automatic checks that catch mistakes, and a watch mode that rebuilds pages as you edit.~~ ✓ Done — `npm run validate`, `npm run dev`, GitHub Actions CI.
2. ~~**Nicer to read** — copy-to-clipboard buttons, an in-page table of contents, and meta descriptions.~~ ✓ Done — copy buttons on every code block, per-page TOC, `<meta description>` on every page.
3. **Published online** — host the cheatsheets on the web so you don't have to build them yourself.
4. **More topics** — HTML, CSS, Git, SQL, Go, Rust, and Docker, in the same beginner-friendly style.
5. **Easier to browse** — search across all cheatsheets, a dark mode, and an accessibility pass.

These are tackled in order: the foundation first, new content later.

---

## How to use

Open any file from the `dist/` folder directly in your browser — for example, `dist/typescript/index.html`. That's it. The pages work without an internet connection and without JavaScript enabled.

If you don't have a `dist/` folder yet, see the **For contributors** section below to build the files.

---

## Questions or suggestions?

If something is unclear or you spot a mistake, open an issue or submit a pull request. All skill levels are welcome.

---

## For contributors

### Running the project locally

You need [Node.js](https://nodejs.org) (version 18 or newer) installed.

```bash
# Install dependencies (only needed once)
npm install

# Watch src/ and assets/ — rebuilds HTML on every change
npm run dev

# Build all cheatsheets (HTML + PDF)
npm run build

# Build HTML pages only (faster, skips PDF export)
npm run build:html

# Export PDF files only (requires Google Chrome or Chromium)
npm run build:pdf

# Delete all generated files and start fresh
npm run clean

# Run the content linter (catches untagged fences, missing H1s, etc.)
npm run validate

# Check for TypeScript errors and linting
npm run check
```

### Project layout

```
src/
  index.ts          ← list of all topics (add new ones here)
  <topic>/
    index.md        ← cheatsheet content — edit this
scripts/
  build.ts          ← converts markdown files into HTML pages
  pdf.ts            ← exports HTML pages to PDF
assets/
  input.css         ← Tailwind CSS source (edit this)
  style.css         ← generated — do not edit, not committed to git
dist/               ← generated output — never edit or commit
```

### Adding a cheatsheet

1. Create `src/<topic>/index.md` with your content (one `# Title`, then `##` sections).
2. Register the topic in `src/index.ts`.
3. Run `npm run build:html` and open `dist/<topic>/index.html` to check it.
4. Run `npm run check` before submitting.

Every code block must have a language label (` ```typescript `, ` ```python `, etc.) — unlabelled blocks get no syntax highlighting. Keep each block to around 10 lines and explanations to one sentence.
