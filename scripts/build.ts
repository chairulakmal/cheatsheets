import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
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

const JSX_TOPICS = new Set(['react', 'nextjs', 'react-patterns']);
const VUE_TOPICS = new Set(['vue', 'nuxt', 'vue-patterns']);

// Tier-2 editable playground (CodeMirror). Topics here render demos with a full
// syntax-highlighted editor (CodeMirror 6, lazy-loaded) instead of a plain textarea.
// Sucrase handles in-browser transpilation. Vue uses ['typescript']; React adds 'jsx'.
const PLAYGROUND_TOPICS = new Set(['vue-patterns', 'react-patterns']);

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
    "react": "https://esm.sh/react@19.2.0",
    "react-dom/client": "https://esm.sh/react-dom@19.2.0/client",
    "react/jsx-runtime": "https://esm.sh/react@19.2.0/jsx-runtime"
  }
}
</script>`;

// Full build includes the template compiler, required for runtime template strings.
const VUE_IMPORT_MAP = `<script type="importmap">
{
  "imports": {
    "vue": "https://cdn.jsdelivr.net/npm/vue@3.5.35/dist/vue.esm-browser.js"
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

function tocLabel(raw: string): string {
  return raw
    .replace(/`([^`]*)`/g, '$1')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildToc(sections: string[]): string {
  const items = sections
    .map((s) => `<li><a href="#${slugify(s)}" class="text-blue-600 hover:underline text-sm">${tocLabel(s)}</a></li>`)
    .join('\n      ');
  return `<nav aria-label="Table of contents" class="not-prose my-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
  <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Contents</p>
  <ol class="list-decimal list-inside space-y-1 pl-0">
    ${items}
  </ol>
</nav>`;
}

// Copy the pre-built, committed CodeMirror bundle into dist/assets/ so it is served from
// our own origin. The bundle is vendored (assets/vendor/codemirror.js) rather than rebuilt
// here — the @codemirror/* packages are not devDeps, so CI installs stay lean and deploys
// do no bundling. It's an IIFE (exposes window.CM6), loaded via a classic <script> tag so
// it works from file:// too; the playground injects it lazily on first "Edit". Regenerate
// with `npm run vendor:codemirror` (see scripts/vendor-codemirror.ts).
function copyCodeMirror(): void {
  const outDir = join(root, 'dist', 'assets');
  mkdirSync(outDir, { recursive: true });
  copyFileSync(join(root, 'assets', 'vendor', 'codemirror.js'), join(outDir, 'codemirror.js'));
  console.log('Copied: dist/assets/codemirror.js');
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
  var block = btn.closest('.code-block');
  // Playground blocks wire their own copy handler in PLAYGROUND_SCRIPT.
  if (block && block.classList.contains('playground')) return;
  btn.addEventListener('click', function() {
    var pre = block ? block.querySelector('pre') : null;
    navigator.clipboard.writeText(pre ? pre.textContent : '').then(function() {
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
    });
  });
});
</script>`;

// Tier-2 editable playground. Renders a CodeMirror 6 editor (lazy-loaded from CDN)
// with TypeScript/JSX syntax highlighting. Sucrase handles in-browser transpilation.
// PLAYGROUND_TOPIC is injected as a separate <script> tag just before this constant
// (see pageHtml) — it selects the import map and Sucrase transforms per topic.
// CDN versions are pinned deliberately; keep in sync with REACT_IMPORT_MAP / VUE_IMPORT_MAP.
const PLAYGROUND_SCRIPT = `<script>
(function () {
  var VUE_MAP = '<script type="importmap">{"imports":{"vue":"https://cdn.jsdelivr.net/npm/vue@3.5.35/dist/vue.esm-browser.js"}}<\\/script>';
  var REACT_MAP = '<script type="importmap">{"imports":{"react":"https://esm.sh/react@19.2.0","react-dom/client":"https://esm.sh/react-dom@19.2.0/client","react/jsx-runtime":"https://esm.sh/react@19.2.0/jsx-runtime"}}<\\/script>';
  var STYLE = '<style>body{font-family:system-ui,sans-serif;font-size:13px;margin:0;padding:12px 16px;background:#fff;color:#1e293b}.err{color:#dc2626;font-family:monospace;font-size:12px;white-space:pre-wrap}</style>';

  function isReact() { return typeof PLAYGROUND_TOPIC !== 'undefined' && PLAYGROUND_TOPIC === 'react-patterns'; }

  function previewDoc(code) {
    var react = isReact();
    var importMap = react ? REACT_MAP : VUE_MAP;
    var mountEl = react ? '<div id="root"></div>' : '<div id="app"></div>';
    var errId = react ? '"root"' : '"app"';
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' + importMap + STYLE +
      '</head><body>' + mountEl +
      '<script>window.onerror=function(m){var a=document.getElementById(' + errId + ');if(a)a.innerHTML="<span class=err>Error: "+m+"</span>";return true;};<\\/script>' +
      '<script type="module">' + code + '<\\/script></body></html>';
  }

  function errorDoc(msg) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + STYLE + '</head><body><pre class="err">' + msg + '</pre></body></html>';
  }

  var sucraseP;
  function loadSucrase() {
    if (!sucraseP) sucraseP = import('https://esm.sh/sucrase@3.35.0').then(function (m) { return m.transform || (m.default && m.default.transform); });
    return sucraseP;
  }

  // CodeMirror 6 — self-hosted single bundle (dist/assets/codemirror.js, vendored from
  // assets/vendor/). One bundle guarantees a single copy of @codemirror/state and
  // @codemirror/view, which prevents CodeMirror's "Unrecognized extension value" error.
  // Loaded as a classic IIFE <script> (exposes window.CM6) rather than a module import:
  // dynamic import() of a local ES module is blocked from file:// origins, which breaks
  // local viewing of the built pages. A classic script tag has no such restriction.
  // The src is relative to the topic page (/<slug>/index.html → /assets/codemirror.js).
  var cmP;
  function loadCM() {
    if (!cmP) cmP = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = '../assets/codemirror.js';
      s.onload = function () { resolve(window.CM6); };
      s.onerror = function () { reject(new Error('Failed to load codemirror.js')); };
      document.head.appendChild(s);
    });
    return cmP;
  }

  document.querySelectorAll('.playground').forEach(function (pg) {
    var display  = pg.querySelector('.pg-display');
    var editorEl = pg.querySelector('.pg-editor');
    var srcData  = pg.querySelector('.pg-src-data');
    var preview  = pg.querySelector('.pg-preview');
    var editBtn  = pg.querySelector('.pg-edit');
    var runBtn   = pg.querySelector('.pg-run');
    var resetBtn = pg.querySelector('.pg-reset');
    var copyBtn  = pg.querySelector('.copy-btn');
    var originalSrc = preview.getAttribute('src');
    var editorView  = null;

    // Copy: when editor is active use its value; otherwise fall back to highlighted <pre>.
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = editorView ? editorView.state.doc.toString() : (pg.querySelector('pre') ? pg.querySelector('pre').textContent : '');
        navigator.clipboard.writeText(text || '').then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
        });
      });
    }

    function showEditor() {
      display.classList.add('hidden');
      editorEl.classList.remove('hidden');
      runBtn.classList.remove('hidden');
      resetBtn.classList.remove('hidden');
      editBtn.classList.add('hidden');
    }

    editBtn.addEventListener('click', function () {
      if (editorView) { showEditor(); return; }
      editBtn.textContent = '… loading';
      editBtn.disabled = true;
      loadCM().then(function (mods) {
        var jsLang = mods.javascript({ typescript: true, jsx: isReact() });
        editorView = new mods.EditorView({
          state: mods.EditorState.create({
            doc: srcData.value,
            extensions: [
              mods.basicSetup,
              jsLang,
              mods.EditorView.theme({
                '&': { fontSize: '12.5px', fontFamily: 'ui-monospace,Menlo,Consolas,monospace' },
                '.cm-scroller': { overflow: 'auto', maxHeight: '420px' },
              }),
            ],
          }),
          parent: editorEl,
        });
        editBtn.textContent = '✎ Edit code';
        editBtn.disabled = false;
        showEditor();
      }).catch(function (e) {
        editBtn.textContent = '✎ Edit code';
        editBtn.disabled = false;
        console.error('CodeMirror load failed:', e);
      });
    });

    runBtn.addEventListener('click', function () {
      var src = editorView ? editorView.state.doc.toString() : srcData.value;
      var transforms = isReact() ? ['typescript', 'jsx'] : ['typescript'];
      runBtn.textContent = '… compiling';
      loadSucrase().then(function (transform) {
        var code = transform(src, { transforms: transforms }).code;
        preview.removeAttribute('src');
        preview.srcdoc = previewDoc(code);
      }).catch(function (e) {
        preview.removeAttribute('src');
        preview.srcdoc = errorDoc(String((e && e.message) || e).replace(/</g, '&lt;'));
      }).then(function () { runBtn.textContent = '▶ Run'; });
    });

    resetBtn.addEventListener('click', function () {
      if (editorView) {
        editorView.dispatch({ changes: { from: 0, to: editorView.state.doc.length, insert: srcData.value } });
      }
      preview.removeAttribute('srcdoc');
      preview.setAttribute('src', originalSrc);
    });
  });
})();
</script>`;

function buildMarked(highlighter: Highlighter, topic: Topic) {
  let demoIndex = 0;

  return new Marked({
    renderer: {
      heading({ depth, raw, tokens }) {
        const tag = `h${depth}`;
        const plainRaw = raw.replace(/^#+\s+/, '').trim();
        // text is raw markdown in Marked v14 — parse inline tokens to get HTML
        const inner = this.parser.parseInline(tokens ?? []);
        if (depth === 2) {
          return `<${tag} id="${slugify(plainRaw)}">${inner}</${tag}>\n`;
        }
        return `<${tag}>${inner}</${tag}>\n`;
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

          // Editable playground (prototype topics): static highlighted code +
          // an editable textarea revealed by "Edit", transpiled + re-rendered on "Run".
          if (PLAYGROUND_TOPICS.has(topic.slug)) {
            return `<div class="not-prose code-block group relative my-6 rounded-xl border-2 border-blue-200 overflow-hidden shadow-sm playground">
  <div class="text-sm leading-relaxed pg-display">${highlighted}</div>
  <div class="pg-editor hidden" role="textbox" aria-label="Editable demo source" aria-multiline="true"></div>
  <textarea class="pg-src-data" hidden aria-hidden="true">${escapeHtml(text)}</textarea>
  <button class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 hover:text-slate-700 no-print" aria-label="Copy code">Copy</button>
  <div class="pg-toolbar no-print flex gap-2 bg-slate-100 border-t border-blue-200 px-3 py-2">
    <button type="button" class="pg-edit px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">✎ Edit code</button>
    <button type="button" class="pg-run hidden px-2 py-1 text-xs rounded bg-blue-600 border border-blue-600 text-white hover:bg-blue-700">▶ Run</button>
    <button type="button" class="pg-reset hidden px-2 py-1 text-xs rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">↺ Reset</button>
  </div>
  <div>
    <div class="bg-slate-100 border-t border-blue-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Output</div>
    <iframe src="${demoSrc}" sandbox="allow-scripts" loading="lazy" title="Live demo" class="pg-preview block w-full border-0" style="height:${iframeHeight}px"></iframe>
  </div>
</div>`;
          }

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

  const metaLine = slug
    ? `<div class="flex items-center gap-4 mt-2">
        ${lastUpdated ? `<span class="text-xs text-slate-500">Updated ${lastUpdated}</span>` : ''}
        <button type="button" onclick="window.print()" class="no-print text-xs text-blue-600 hover:underline">↓ Save as PDF</button>
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
  ${slug && PLAYGROUND_TOPICS.has(slug) ? `<script>var PLAYGROUND_TOPIC = ${JSON.stringify(slug)};</script>${PLAYGROUND_SCRIPT}` : ''}
</body>
</html>`;
}

function topicCard(t: Topic): string {
  const badge = t.live
    ? `<span class="mt-2 text-xs font-medium text-blue-600 not-italic">Live demos</span>`
    : `<span class="mt-2 text-xs font-medium text-slate-400 not-italic">Static examples</span>`;
  return `<li class="list-none p-0 m-0">
      <a href="${t.slug}/index.html" class="flex flex-col p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all no-underline text-slate-800 font-semibold">
        ${t.title}
        ${badge}
      </a>
    </li>`;
}

function topicGrid(list: Topic[]): string {
  return `<ul class="not-prose grid grid-cols-2 sm:grid-cols-3 gap-4 list-none p-0 m-0">
    ${list.map(topicCard).join('\n    ')}
  </ul>`;
}

function buildIndexPage(css: string): string {
  const beginner = topics.filter((t) => !t.advanced);
  const advanced = topics.filter((t) => t.advanced);

  const advancedSection = advanced.length
    ? `<h2 class="not-prose mt-12 mb-1 text-xl font-bold text-slate-800">Advanced</h2>
    <p class="not-prose mb-4 text-sm text-slate-500">Senior-level deep dives — patterns, pitfalls, and tradeoffs, in fuller prose than the beginner sheets.</p>
    ${topicGrid(advanced)}`
    : '';

  const content = `${topicGrid(beginner)}
    ${advancedSection}`;

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

  // Self-host the playground editor bundle (CodeMirror) under dist/assets/.
  if (topics.some((t) => PLAYGROUND_TOPICS.has(t.slug))) {
    copyCodeMirror();
  }

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

  // Emit a CNAME so GitHub Pages keeps the custom domain on every deploy.
  // Derived from SITE_URL, so the hostname lives in one place (the workflows).
  if (SITE_URL) {
    const host = SITE_URL.replace(/^https?:\/\//, '');
    writeFileSync(join(root, 'dist', 'CNAME'), `${host}\n`, 'utf-8');
    console.log(`Built: dist/CNAME (${host})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
