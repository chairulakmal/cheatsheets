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

  // Print styling lives in the page's own @media print CSS (assets/input.css);
  // emulateMediaType('print') makes Puppeteer apply exactly what a reader gets
  // from the browser's "Save as PDF". This script is an optional local tool —
  // CI no longer generates PDFs.
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
