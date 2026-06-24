# Developer Cheatsheets

[![Deploy](https://img.shields.io/github/deployments/chairulakmal/cheatsheets/github-pages?label=deploy)](https://cheat.chairulakmal.com/)

Quick-reference guides for programming languages and frameworks — one page per topic, plain English, short examples you can copy and run right away.

**[Open the cheatsheets →](https://cheat.chairulakmal.com/)**

---

## What's inside

### Beginner sheets

Plain-English, one-concept-at-a-time references — the main collection.

| Topic | Runnable examples? |
|-------|-------------------|
| JavaScript | Yes — code runs in the page |
| TypeScript | Yes — code runs in the page |
| React | Yes — code runs in the page |
| Next.js | Yes — code runs in the page |
| Vue | Yes — code runs in the page |
| Nuxt | Yes — code runs in the page |
| Ruby on Rails | No — expected output shown as comments |
| Elixir | No — expected output shown as comments |
| Python | No — expected output shown as comments |

### Advanced (senior-level)

Deeper deep-dives written in fuller prose — patterns, pitfalls, and tradeoffs rather than one-line intros. Aimed at engineers who already know the basics.

| Topic | Runnable examples? |
|-------|-------------------|
| TypeScript Patterns | No |
| React Patterns | Yes — live demos + editable CodeMirror playground |
| Next.js Patterns | No |
| Vue Patterns | Yes — live demos + editable CodeMirror playground |
| Nuxt Patterns | No |
| React vs Vue | No |

The **Patterns** sheets (TypeScript, React, Next.js, Vue, Nuxt) cover patterns and pitfalls — including performance, scalability, and security topics. **React vs Vue** is a side-by-side deep dive into both reactivity models and their tradeoffs. React Patterns and Vue Patterns include an editable sandbox: click "✎ Edit code" on any demo to open a CodeMirror editor, modify the code, and hit "▶ Run" to see the result live.

---

## How to read them

Go to **[cheat.chairulakmal.com](https://cheat.chairulakmal.com/)** and pick a topic. That's it — no account, no install, no login.

Every page has a **"Save as PDF"** button in the header if you want an offline copy.

---

## Something wrong or missing?

Open an issue or submit a pull request. All skill levels are welcome.

---

## For contributors

You need [Node.js](https://nodejs.org) 24 or newer (see `.nvmrc`).

```bash
npm install          # install dependencies (once)
npm run dev          # watch mode — rebuilds on every file save
npm run build:html   # one-off build of all HTML pages
npm run serve        # static-serve dist/ at http://localhost:8080
npm run validate     # lint content (untagged fences, missing headings, etc.)
npm run check        # TypeScript typecheck + ESLint
```

The live demos and editable playground load their runtimes (Vue, React, CodeMirror) from the
site's own origin, so **preview the built site with `npm run serve`** — opening the HTML files
directly from disk (`file://`) shows the static content but won't run the demos.

### Adding a cheatsheet

1. Create `src/<topic>/index.md` — one `# Title`, then `##` sections.
2. Register the topic in `src/index.ts`.
3. Run `npm run build:html` and open `dist/<topic>/index.html`.
4. Run `npm run check` before submitting.

Every code block needs a language tag (` ```typescript `, ` ```python `, etc.) — untagged blocks get no syntax highlighting.

### Project layout

```
src/
  index.ts          ← topic list (add new topics here)
  <topic>/index.md  ← cheatsheet content — edit this
scripts/
  build.ts          ← converts Markdown to HTML
assets/
  input.css         ← Tailwind CSS source (edit this)
dist/               ← generated — never edit or commit
```

---

## License

Released under the [MIT License](LICENSE).
