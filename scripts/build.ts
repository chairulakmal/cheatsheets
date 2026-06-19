import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';
import * as esbuild from 'esbuild';
import { topics, type Topic } from '../src/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SHIKI_LANGS = [
  'typescript', 'javascript', 'tsx', 'jsx',
  'ruby', 'erb', 'elixir', 'python', 'html', 'css', 'bash', 'json', 'text', 'vue',
] as const;

const JSX_TOPICS = new Set(['react', 'nextjs']);
const VUE_TOPICS = new Set(['vue', 'nuxt']);

// Set SITE_URL env var at build time to enable absolute OG URLs and canonical links.
const SITE_URL = (process.env.SITE_URL ?? '').replace(/\/$/, '');

function getLastUpdated(filePath: string): string {
  try {
    return execSync(`git log -1 --format="%as" -- "${filePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

// Pinned CDN versions — update deliberately, never automatically.
const REACT_IMPORT_MAP = `<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime"
  }
}
</script>`;

// Full build includes the template compiler, required for runtime template strings.
const VUE_IMPORT_MAP = `<script type="importmap">
{
  "imports": {
    "vue": "https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.esm-browser.js"
  }
}
</script>`;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractSections(md: string): string[] {
  return md
    .split('\n')
    .filter((line) => /^## /.test(line))
    .map((line) => line.replace(/^## /, '').trim());
}

function buildToc(sections: string[]): string {
  const items = sections
    .map((s) => `<li><a href="#${slugify(s)}" class="text-blue-600 hover:underline text-sm">${s}</a></li>`)
    .join('\n      ');
  return `<nav aria-label="Table of contents" class="not-prose my-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
  <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Contents</p>
  <ol class="list-decimal list-inside space-y-1 pl-0">
    ${items}
  </ol>
</nav>`;
}

function buildDemoFile(slug: string, tsCode: string, index: number): string {
  const isJsx = JSX_TOPICS.has(slug);
  const isVue = VUE_TOPICS.has(slug);

  const result = esbuild.transformSync(tsCode, {
    loader: isJsx ? 'tsx' : 'ts',
    target: 'es2020',
    ...(isJsx ? { jsx: 'automatic' } : {}),
  });

  const demoHtml = isJsx
    ? buildJsxDemoHtml(result.code)
    : isVue
    ? buildVueDemoHtml(result.code)
    : buildConsoleDemoHtml(result.code);

  const demoDir = join(root, 'dist', slug, 'demos');
  mkdirSync(demoDir, { recursive: true });
  writeFileSync(join(demoDir, `demo-${index}.html`), demoHtml, 'utf-8');
  return `demos/demo-${index}.html`;
}

function buildConsoleDemoHtml(js: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; margin: 0; padding: 10px 14px; background: #f8fafc; color: #1e293b; }
  #out { white-space: pre-wrap; line-height: 1.6; }
  .err { color: #dc2626; }
</style>
</head>
<body>
<div id="out"></div>
<script>
const lines = [], el = document.getElementById('out');
console.log = (...args) => {
  lines.push(args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' '));
  el.textContent = lines.join('\\n');
};
window.onerror = (msg) => { el.innerHTML += '<span class="err">Error: ' + msg + '</span>\\n'; return true; };
</script>
<script type="module">
${js}
</script>
</body>
</html>`;
}

function buildVueDemoHtml(js: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
${VUE_IMPORT_MAP}
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 0; padding: 12px 16px; background: #fff; color: #1e293b; }
  .err { color: #dc2626; font-family: monospace; font-size: 12px; }
</style>
</head>
<body>
<div id="app"></div>
<script>
window.onerror = (msg) => {
  document.getElementById('app').innerHTML = '<span class="err">Error: ' + msg + '</span>';
  return true;
};
</script>
<script type="module">
${js}
</script>
</body>
</html>`;
}

function buildJsxDemoHtml(js: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
${REACT_IMPORT_MAP}
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 0; padding: 12px 16px; background: #fff; color: #1e293b; }
  .err { color: #dc2626; font-family: monospace; font-size: 12px; }
</style>
</head>
<body>
<div id="root"></div>
<script>
window.onerror = (msg) => {
  document.getElementById('root').innerHTML = '<span class="err">Error: ' + msg + '</span>';
  return true;
};
</script>
<script type="module">
${js}
</script>
</body>
</html>`;
}

const COPY_SCRIPT = `<script>
document.querySelectorAll('.copy-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var pre = btn.closest('.code-block').querySelector('pre');
    navigator.clipboard.writeText(pre ? pre.textContent : '').then(function() {
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
    });
  });
});
</script>`;

function buildMarked(highlighter: Highlighter, topic: Topic) {
  let demoIndex = 0;

  return new Marked({
    renderer: {
      heading({ text, depth }) {
        const tag = `h${depth}`;
        if (depth === 2) {
          return `<${tag} id="${slugify(text)}">${text}</${tag}>\n`;
        }
        return `<${tag}>${text}</${tag}>\n`;
      },

      code({ text, lang }) {
        const language = (lang ?? '').split(':')[0];

        if (language === 'demo') {
          if (!topic.live) {
            throw new Error(
              `Topic "${topic.slug}" has live:false but contains a demo fence.`
            );
          }
          const isJsx = JSX_TOPICS.has(topic.slug);
          const isVue = VUE_TOPICS.has(topic.slug);
          const demoSrc = buildDemoFile(topic.slug, text, demoIndex++);
          const highlighted = highlighter.codeToHtml(text, {
            lang: isJsx ? 'tsx' : 'typescript',
            theme: 'github-light',
          });
          const iframeHeight = isJsx || isVue ? 160 : 110;
          return `<div class="not-prose code-block group relative my-6 rounded-xl border-2 border-blue-200 overflow-hidden shadow-sm">
  <div class="text-sm leading-relaxed">${highlighted}</div>
  <button class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 hover:text-slate-700" aria-label="Copy code">Copy</button>
  <div>
    <div class="bg-slate-100 border-t border-blue-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Output</div>
    <iframe src="${demoSrc}" sandbox="allow-scripts" loading="lazy" title="Live demo" class="block w-full border-0" style="height:${iframeHeight}px"></iframe>
  </div>
</div>`;
        }

        if (!language || language === 'text') {
          return `<div class="not-prose code-block group relative my-4"><pre class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm overflow-x-auto"><code>${text}</code></pre><button class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 hover:text-slate-700" aria-label="Copy code">Copy</button></div>`;
        }

        try {
          const highlighted = highlighter.codeToHtml(text, {
            lang: language,
            theme: 'github-light',
          });
          return `<div class="not-prose code-block group relative my-4 rounded-lg border border-slate-200 overflow-hidden text-sm leading-relaxed shadow-sm">${highlighted}<button class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 hover:text-slate-700" aria-label="Copy code">Copy</button></div>`;
        } catch {
          return `<div class="not-prose code-block group relative my-4"><pre class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm overflow-x-auto"><code>${text}</code></pre><button class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 hover:text-slate-700" aria-label="Copy code">Copy</button></div>`;
        }
      },
    },
  });
}

interface PageOpts {
  slug?: string;
  lastUpdated?: string;
}

function pageHtml(title: string, content: string, css: string, nav: string, description: string, opts: PageOpts = {}): string {
  const { slug, lastUpdated } = opts;
  const pageUrl = slug && SITE_URL ? `${SITE_URL}/${slug}/` : SITE_URL ? `${SITE_URL}/` : '';

  const ogTags = `
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Developer Cheatsheets">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  ${pageUrl ? `<meta property="og:url" content="${pageUrl}">` : ''}
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">`;

  const metaLine = slug && lastUpdated
    ? `<div class="flex items-center gap-4 mt-2">
        <span class="text-xs text-slate-500">Updated ${lastUpdated}</span>
        <a href="./${slug}-cheatsheet.pdf" download class="text-xs text-blue-600 hover:underline">↓ PDF</a>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  ${pageUrl ? `<link rel="canonical" href="${pageUrl}">` : ''}
  ${ogTags}
  <style>${css}</style>
</head>
<body class="bg-slate-50 min-h-screen">
  <header class="bg-white border-b border-slate-200">
    <div class="max-w-3xl mx-auto px-6 py-8">
      ${nav}
      <h1 class="text-3xl font-bold text-slate-900 mt-1">${title}</h1>
      ${metaLine}
    </div>
  </header>
  <main class="max-w-3xl mx-auto px-6 py-10">
    <div class="prose prose-slate max-w-none">${content}</div>
  </main>
  ${COPY_SCRIPT}
</body>
</html>`;
}

function buildIndexPage(css: string): string {
  const items = topics.map((t) => {
    const badge = t.live
      ? `<span class="mt-2 text-xs font-medium text-blue-600 not-italic">Live demos</span>`
      : `<span class="mt-2 text-xs font-medium text-slate-400 not-italic">Static examples</span>`;
    return `<li class="list-none p-0 m-0">
      <a href="${t.slug}/index.html" class="flex flex-col p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all no-underline text-slate-800 font-semibold">
        ${t.title}
        ${badge}
      </a>
    </li>`;
  }).join('\n    ');

  const content = `<ul class="not-prose grid grid-cols-2 sm:grid-cols-3 gap-4 list-none p-0 m-0">
    ${items}
  </ul>`;

  return pageHtml(
    'Developer Cheatsheets',
    `<p class="lead">Quick-reference guides for programming languages and frameworks.</p>${content}`,
    css,
    '',
    'Quick-reference developer cheatsheets for popular programming languages and frameworks, with live demos and code examples.',
    {},
  );
}

async function main() {
  const highlighter = await createHighlighter({
    themes: ['github-light'],
    langs: [...SHIKI_LANGS],
  });

  const css = readFileSync(join(root, 'assets', 'style.css'), 'utf-8');
  mkdirSync(join(root, 'dist'), { recursive: true });

  for (const topic of topics) {
    const mdPath = join(root, 'src', topic.slug, 'index.md');
    let md: string;
    try {
      md = readFileSync(mdPath, 'utf-8');
    } catch {
      console.warn(`Skipping "${topic.slug}" — src/${topic.slug}/index.md not found.`);
      continue;
    }

    const titleMatch = md.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic.title;
    const mdBody = md.replace(/^# .+\n?/, '');
    const nav = `<nav aria-label="Breadcrumb" class="mb-3"><a href="../index.html" class="text-sm text-blue-600 hover:underline">← All Cheatsheets</a></nav>`;

    const sections = extractSections(mdBody);
    const toc = sections.length >= 5 ? buildToc(sections) : '';

    const marked = buildMarked(highlighter, topic);
    const content = await marked.parse(mdBody);
    const description = `Quick-reference ${topic.title} cheatsheet with syntax examples${topic.live ? ' and live demos' : ''}.`;
    const lastUpdated = getLastUpdated(mdPath);
    const html = pageHtml(title, toc + content, css, nav, description, { slug: topic.slug, lastUpdated });

    const outDir = join(root, 'dist', topic.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
    console.log(`Built: dist/${topic.slug}/index.html`);
  }

  writeFileSync(join(root, 'dist', 'index.html'), buildIndexPage(css), 'utf-8');
  console.log('Built: dist/index.html');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
