#!/usr/bin/env node

/**
 * HTML → PDF 変換スクリプト
 * puppeteer-core を使用してHTMLファイルをPDFに変換する。
 * Chrome/Chromium バイナリは環境から自動検出する。
 * CDN URL はローカルに node_modules があれば自動的にローカルパスに置換する。
 *
 * Usage:
 *   node html-to-pdf.mjs <input.html> [output.pdf] [--format=A4] [--margin=20mm]
 */

import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Chrome バイナリ自動検出 ---

function findChrome() {
  // 1. 環境変数
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  // 2. よく使われるコマンド名
  for (const cmd of ['chromium-browser', 'chromium', 'google-chrome', 'google-chrome-stable']) {
    try {
      const p = execSync(`which ${cmd} 2>/dev/null`, { encoding: 'utf8' }).trim();
      if (p) return p;
    } catch {}
  }

  // 3. puppeteer キャッシュ内を検索
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const cacheDir = join(home, '.cache', 'puppeteer', 'chrome');
  if (existsSync(cacheDir)) {
    try {
      const result = execSync(
        `find "${cacheDir}" -type f \\( -name "chrome" -o -name "Google Chrome for Testing" \\) 2>/dev/null | head -1`,
        { encoding: 'utf8' },
      ).trim();
      if (result && existsSync(result)) return result;
    } catch {}
  }

  // 4. macOS 固有パス
  for (const p of [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ]) {
    if (existsSync(p)) return p;
  }

  return null;
}

// --- CDN URL をローカルパスに置換 ---

function resolveLocalAssets(html) {
  // Primer CSS: vendor/ → node_modules/ の順で検索
  const primerPaths = [
    join(__dirname, 'vendor', 'primer.css'),
    join(__dirname, 'node_modules', '@primer', 'css', 'dist', 'primer.css'),
  ];
  for (const p of primerPaths) {
    if (existsSync(p)) {
      html = html.replace(
        /https?:\/\/cdn\.jsdelivr\.net\/npm\/@primer\/css@\d+\/dist\/primer\.css/g,
        `file://${p}`,
      );
      break;
    }
  }

  // mermaid.js
  const mermaidLocal = join(__dirname, 'node_modules', 'mermaid', 'dist', 'mermaid.esm.min.mjs');
  if (existsSync(mermaidLocal)) {
    html = html.replace(
      /https?:\/\/cdn\.jsdelivr\.net\/npm\/mermaid@\d+\/dist\/mermaid\.esm\.min\.mjs/g,
      `file://${mermaidLocal}`,
    );
  }

  return html;
}

// --- メイン処理 ---

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
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('Error: Chrome/Chromium が見つかりません。');
    console.error('以下のいずれかを試してください:');
    console.error('  - CHROME_PATH 環境変数で Chrome のパスを指定');
    console.error('  - chromium-browser または google-chrome をインストール');
    process.exit(1);
  }
  console.error(`Using Chrome: ${chromePath}`);

  // HTML を読み込み、CDN URL をローカルパスに置換
  const originalHtml = readFileSync(resolvedHtmlPath, 'utf8');
  const resolvedHtml = resolveLocalAssets(originalHtml);

  let targetPath = resolvedHtmlPath;
  let tempFile = null;

  if (resolvedHtml !== originalHtml) {
    tempFile = join(dirname(resolvedHtmlPath), `.tmp-${basename(resolvedHtmlPath)}`);
    writeFileSync(tempFile, resolvedHtml, 'utf8');
    targetPath = tempFile;
    console.error('CDN URLs resolved to local paths');
  }

  const fileUrl = `file://${targetPath}`;

  try {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
    });
    const page = await browser.newPage();

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // mermaid 等の非同期レンダリングを待つ
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
  } finally {
    if (tempFile && existsSync(tempFile)) {
      unlinkSync(tempFile);
    }
  }
}

convert().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
