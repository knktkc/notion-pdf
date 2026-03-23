#!/usr/bin/env node

/**
 * HTML → PDF 変換スクリプト
 * Puppeteerを使用してHTMLファイルをPDFに変換する。
 *
 * Usage:
 *   node html-to-pdf.mjs <input.html> [output.pdf] [--format=A4] [--margin=20mm]
 */

import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { resolve, basename } from 'path';

const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    flags[key] = value;
  } else {
    positional.push(arg);
  }
}

const htmlPath = positional[0];
if (!htmlPath) {
  console.error('Usage: node html-to-pdf.mjs <input.html> [output.pdf] [--format=A4] [--margin=20mm]');
  process.exit(1);
}

const resolvedHtmlPath = resolve(htmlPath);
const pdfPath = positional[1]
  ? resolve(positional[1])
  : resolvedHtmlPath.replace(/\.html$/, '.pdf');

const format = flags.format || 'A4';
const marginSize = flags.margin || '20mm';
const margin = {
  top: marginSize,
  right: marginSize,
  bottom: marginSize,
  left: marginSize,
};

async function convert() {
  const fileUrl = `file://${resolvedHtmlPath}`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // mermaid等の非同期レンダリングを待つ
  await page.evaluate(() => new Promise((resolve) => {
    const svgs = document.querySelectorAll('.mermaid svg');
    if (svgs.length > 0) return resolve();
    const observer = new MutationObserver(() => {
      if (document.querySelectorAll('.mermaid svg').length > 0) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(resolve, 5000);
  }));

  await page.pdf({
    path: pdfPath,
    format,
    margin,
    printBackground: true,
  });

  await browser.close();

  console.log(`PDF saved: ${pdfPath}`);
}

convert().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
