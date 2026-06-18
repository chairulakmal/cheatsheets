# Developer Cheatsheets

A collection of quick-reference guides for programming languages and frameworks — written for beginners who want a handy reference while they learn.

Each cheatsheet is a single page with short code examples and plain-English explanations. Open it in a browser and keep it beside your editor while you code.

---

## What's covered

| Topic | Live examples? | Status |
|-------|---------------|--------|
| TypeScript | Yes | Available |
| React | Yes | Available |
| Vue | Yes | Available |
| Ruby on Rails | No (code + expected output shown) | Coming soon |
| Elixir | No (code + expected output shown) | Coming soon |

"Live examples" means you can see the code run directly on the page. Languages that run on a server (like Ruby and Elixir) show the expected output as a comment instead.

---

## How to use these cheatsheets

1. Download or clone this repository.
2. Run `npm install` to set up the project.
3. Run `npm run build` to generate the HTML pages.
4. Open any file inside the `dist/` folder in your browser — for example, `dist/typescript/index.html`.

The pages work without an internet connection and without JavaScript enabled.

---

## How the project is organised

```
src/
  index.ts        ← list of all topics (add new ones here)
  typescript/
    index.md      ← the cheatsheet content (edit this)
    demo/         ← live examples (JavaScript-based topics only)
  react/
    index.md
    demo/
  vue/
    index.md
    demo/
  rails/          ← coming soon
  elixir/         ← coming soon
scripts/
  build.ts        ← converts the markdown files into HTML pages
  pdf.ts          ← exports HTML pages to PDF
assets/
  input.css       ← Tailwind CSS source (edit this)
  style.css       ← generated CSS (do not edit)
dist/             ← generated output — open these in your browser
```

The markdown files inside `src/` are the source of truth. **Do not edit anything inside `dist/`** — those files are overwritten every time you run the build.

---

## What is Markdown?

Markdown is a simple way to write formatted text using plain characters. For example, `**bold**` becomes **bold** and a line starting with `#` becomes a heading. You can open any `.md` file in a plain text editor.

---

## Running the project locally

You need [Node.js](https://nodejs.org) installed (version 18 or newer is recommended).

```bash
# Install dependencies (only needed once)
npm install

# Build all cheatsheets (HTML + PDF)
npm run build

# Build HTML pages only (faster, skips PDF export)
npm run build:html

# Export PDF files only (requires Google Chrome or Chromium)
npm run build:pdf

# Check for any TypeScript errors
npm run typecheck
```

The following command is planned but not yet available:

```bash
# Watch for changes and rebuild automatically (coming soon)
npm run dev
```

---

## Contributing a new cheatsheet

1. Create a new folder: `src/<topic>/`
2. Add a file called `index.md` with your cheatsheet content.
3. If the topic supports live examples, add a `demo/` folder inside it.
4. Register the topic in `src/index.ts` (there are examples in that file to follow).
5. Run `npm run build` and check that your page looks right in the browser.
6. Run `npm run typecheck` to make sure there are no errors before submitting.

---

## Writing a cheatsheet

- Start the file with a single `# Title` heading.
- Use `##` for sections within the cheatsheet.
- Every code block must have a language label — for example:

  ````
  ```typescript
  const greeting: string = "Hello!";
  ```
  ````

  Unlabelled code blocks will not get syntax highlighting.

- Keep explanations short. One sentence per example is usually enough.

---

## Questions or suggestions?

If something is unclear or you spot a mistake, open an issue or submit a pull request. All skill levels are welcome.
