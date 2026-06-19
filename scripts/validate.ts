import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { topics } from '../src/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SHIKI_LANGS = new Set([
  'typescript', 'javascript', 'tsx', 'jsx',
  'ruby', 'erb', 'elixir', 'python', 'html', 'css', 'bash', 'json', 'text', 'vue',
]);

// Matches opening ``` fences with optional language tag and info string
const FENCE_OPEN = /^```(\S*)/;
const FENCE_CLOSE = /^```\s*$/;

interface Violation {
  slug: string;
  line: number;
  message: string;
}

function validateTopic(slug: string, live: boolean, mdPath: string): Violation[] {
  const violations: Violation[] = [];
  const src = readFileSync(mdPath, 'utf-8');
  const lines = src.split('\n');

  let h1Count = 0;
  let inFence = false;
  let fenceLineNo = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (!inFence) {
      if (/^# /.test(line)) h1Count++;

      const m = line.match(FENCE_OPEN);
      if (m !== null && line.startsWith('```')) {
        const lang = m[1];
        inFence = true;
        fenceLineNo = lineNo;

        if (lang === '') {
          violations.push({ slug, line: lineNo, message: 'Untagged code fence (no language specified)' });
        } else if (lang === 'demo') {
          if (!live) {
            violations.push({ slug, line: lineNo, message: '`demo` fence in a live:false topic' });
          }
        } else if (!SHIKI_LANGS.has(lang.split(':')[0])) {
          violations.push({ slug, line: lineNo, message: `Unknown language \`${lang}\` (not in SHIKI_LANGS)` });
        }
      }
    } else {
      if (FENCE_CLOSE.test(line)) {
        inFence = false;
      }
    }
  }

  if (inFence) {
    violations.push({ slug, line: fenceLineNo, message: 'Unclosed code fence' });
  }

  if (h1Count === 0) {
    violations.push({ slug, line: 0, message: 'Missing # H1 title' });
  } else if (h1Count > 1) {
    violations.push({ slug, line: 0, message: `Duplicate # H1 (found ${h1Count})` });
  }

  return violations;
}

function main() {
  const allViolations: Violation[] = [];

  for (const { slug, live } of topics) {
    const mdPath = join(root, 'src', slug, 'index.md');
    if (!existsSync(mdPath)) {
      console.warn(`WARN  ${slug}: src/${slug}/index.md not found — skipping`);
      continue;
    }
    const violations = validateTopic(slug, live, mdPath);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log(`validate: all ${topics.length} topics OK`);
    process.exit(0);
  }

  for (const v of allViolations) {
    const loc = v.line > 0 ? `:${v.line}` : '';
    console.error(`ERROR  src/${v.slug}/index.md${loc}: ${v.message}`);
  }
  console.error(`\nvalidate: ${allViolations.length} error(s) found`);
  process.exit(1);
}

main();
