// One-off vendoring step for the live-demo / playground framework runtimes — NOT run
// during a normal build. Produces self-hosted Vue and React bundles, committed under
// assets/vendor/ and copied into dist/assets/ by build.ts. The demo + playground iframes
// load them as ES modules via import maps pointing at /assets/vue.js and /assets/react.js.
//
// Why self-hosted: the previous CDN setup (jsDelivr / esm.sh) is a third-party runtime
// dependency. Serving from our own origin removes it. The tradeoff is that the demos no
// longer render from file:// (a sandboxed, null-origin iframe can fetch a local module
// only when the server sends CORS headers — GitHub Pages does; the filesystem does not).
// Local viewing therefore goes through `npm run serve`. See CLAUDE.md "Live demos".
//
// React is bundled into ONE module that exports react + react-dom/client + jsx-runtime,
// and the import map maps all three specifiers to it. A single bundle = a single copy of
// React internals (avoids the "Invalid hook call" two-copies-of-React failure). Built for
// production (process.env.NODE_ENV = "production").
//
// Run this only when bumping Vue/React. Install the packages on demand first:
//
//   npm i -D --no-save vue@3.5.35 react@19.2.0 react-dom@19.2.0
//   npm run vendor:frameworks
//
// Then commit assets/vendor/vue.js + assets/vendor/react.js. Keep these versions in sync
// with VUE_IMPORT_MAP / REACT_IMPORT_MAP intent and the CDN pins noted in CLAUDE.md.
//
// Pinned versions: vue 3.5.35, react 19.2.0, react-dom 19.2.0.

import { mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'assets', 'vendor');
const require = createRequire(import.meta.url);

// React: one combined ESM bundle re-exporting react + react-dom/client + jsx-runtime.
// `react`'s entry is CommonJS, so `export * from 'react'` produces only a star re-export
// — it satisfies `import * as React` but NOT named imports like `import { useCallback }`
// (those names aren't statically present in the ESM output). So we enumerate react's public
// exports and re-export them by name. The list is derived at runtime from the installed
// react package, so a version bump picks up new/removed exports automatically on regen.
const reactNames = Object.keys(require('react'))
  .filter((k) => /^[A-Za-z$_][\w$]*$/.test(k) && !k.startsWith('__'));
const reactEntry = [
  `export { ${reactNames.join(', ')} } from 'react';`,
  `export { createRoot, hydrateRoot } from 'react-dom/client';`,
  `export { jsx, jsxs } from 'react/jsx-runtime';`,
].join('\n');

async function main() {
  mkdirSync(outDir, { recursive: true });

  // Vue: the published full esm-browser build (includes the template compiler the demos
  // need for runtime template strings) is already self-contained — just copy it.
  copyFileSync(join(root, 'node_modules', 'vue', 'dist', 'vue.esm-browser.prod.js'), join(outDir, 'vue.js'));
  console.log('Wrote: assets/vendor/vue.js');

  await esbuild.build({
    stdin: { contents: reactEntry, resolveDir: root, loader: 'ts' },
    bundle: true,
    format: 'esm',
    target: 'es2020',
    minify: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: '/* React 19 (react + react-dom/client + jsx-runtime) — vendored bundle. Regenerate with: npm run vendor:frameworks. See scripts/vendor-frameworks.ts for pinned versions. */' },
    outfile: join(outDir, 'react.js'),
  });
  console.log('Wrote: assets/vendor/react.js');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
