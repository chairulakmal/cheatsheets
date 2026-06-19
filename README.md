# Developer Cheatsheets

[![Deploy](https://img.shields.io/github/deployments/chairulakmal/cheatsheets/github-pages?label=deploy)](https://cheat.chairulakmal.com/)

Quick-reference guides for programming languages and frameworks — one page per topic, plain English, short examples you can copy and run right away.

**[Open the cheatsheets →](https://cheat.chairulakmal.com/)**

---

## What's inside

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
| TypeScript Patterns | No |
| Vue Patterns | No |
| Nuxt Patterns | No |

The **Patterns** sheets (TypeScript, Vue, Nuxt) go a step further — they cover patterns and pitfalls that come up at the intermediate level, including scalability and security topics.

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
npm run validate     # lint content (untagged fences, missing headings, etc.)
npm run check        # TypeScript typecheck + ESLint
```

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
