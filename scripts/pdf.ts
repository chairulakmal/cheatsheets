import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { topics } from '../src/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CHROME_PATHS = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];

function findChrome(): string {
  for (const p of CHROME_PATHS) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'No Chrome or Chromium binary found. Install Chromium with: sudo apt install chromium-browser'
  );
}

async function main() {
  const executablePath = findChrome();
  console.log(`Using browser: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  // Compact styles injected for PDF — smaller than the HTML view
  const pdfCompactCss = `
    html { font-size: 11px; }
    body { background: white !important; }
    nav { display: none !important; }
    header > div { padding-top: 10px !important; padding-bottom: 10px !important; }
    main { padding-top: 10px !important; padding-bottom: 10px !important; }
    .prose h2 { margin-top: 1.1em !important; margin-bottom: 0.4em !important; break-after: avoid; }
    .prose h3 { break-after: avoid; }
    .prose p, .prose li { margin-top: 0.3em !important; margin-bottom: 0.3em !important; }
    .not-prose { margin-top: 0.6rem !important; margin-bottom: 0.6rem !important; break-inside: avoid; }
    pre { break-inside: avoid; }
    iframe { height: 70px !important; }
  `;

  const page = await browser.newPage();
  await page.emulateMediaType('print');

  for (const topic of topics) {
    const htmlPath = join(root, 'dist', topic.slug, 'index.html');

    if (!existsSync(htmlPath)) {
      console.warn(`Skipping "${topic.slug}" — dist/${topic.slug}/index.html not found. Run npm run build first.`);
      continue;
    }

    const fileUrl = `file://${htmlPath}`;
    const pdfName = `${topic.slug}-cheatsheet.pdf`;
    const pdfPath = join(root, 'dist', topic.slug, pdfName);

    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: pdfCompactCss });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
    });

    console.log(`Exported: dist/${topic.slug}/${pdfName}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
