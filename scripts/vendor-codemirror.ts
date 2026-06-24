// One-off vendoring step for the playground editor — NOT run during a normal build.
//
// Bundles CodeMirror 6 (+ TypeScript/JSX language support) into a single self-hosted
// script, committed at assets/vendor/codemirror.js and copied into dist/assets/ by
// build.ts. A *single* esbuild bundle is deliberate: it emits exactly one copy of
// @codemirror/state and @codemirror/view, which is what prevents CodeMirror's
// "Unrecognized extension value" multi-copy error (esm.sh's floating caret resolution
// could hand back differing copies — the bug that motivated self-hosting).
//
// Output format is IIFE exposing a `CM6` global, NOT an ES module. The playground loads
// it by injecting a classic <script> tag, which works from file:// (how the built pages
// are usually opened locally). Dynamic import() of a local ES module is blocked from
// file:// origins by the browser's CORS policy — that breaks local viewing.
//
// Run this only when bumping CodeMirror. It needs the @codemirror/* packages installed,
// which are NOT kept as devDeps (to keep CI installs lean). Install them on demand:
//
//   npm i -D --no-save codemirror@6.0.1 @codemirror/state@6.7.0 \
//     @codemirror/view@6.43.2 @codemirror/lang-javascript@6.2.2
//   npm run vendor:codemirror
//
// Then commit the regenerated assets/vendor/codemirror.js and update the versions in
// the header comment below + the CLAUDE.md playground section.
//
// Pinned versions: codemirror 6.0.1, @codemirror/state 6.7.0, @codemirror/view 6.43.2,
// @codemirror/lang-javascript 6.2.2.

import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const entry = [
  `export { EditorView, basicSetup } from 'codemirror';`,
  `export { EditorState } from '@codemirror/state';`,
  `export { javascript } from '@codemirror/lang-javascript';`,
].join('\n');

async function main() {
  const outDir = join(root, 'assets', 'vendor');
  mkdirSync(outDir, { recursive: true });
  await esbuild.build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true,
    format: 'iife',
    globalName: 'CM6',
    target: 'es2020',
    minify: true,
    banner: { js: '/* CodeMirror 6 — vendored bundle (IIFE, exposes window.CM6). Regenerate with: npm run vendor:codemirror. See scripts/vendor-codemirror.ts for pinned versions. */' },
    outfile: join(outDir, 'codemirror.js'),
  });
  console.log('Wrote: assets/vendor/codemirror.js');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
