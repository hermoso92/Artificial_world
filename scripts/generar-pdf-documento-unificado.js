import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');
const mdPath = path.join(docsDir, 'DOCUMENTO_UNIFICADO_AW.md');
const pdfPath = path.join(docsDir, 'DOCUMENTO_UNIFICADO_AW.pdf');

const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Documento Unificado de Artificial World\n\nNo se encontró DOCUMENTO_UNIFICADO_AW.md';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let inOrderedList = false;

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      const head = tableRows[0];
      const body = tableRows.slice(1).join('');
      out.push(`<table><thead>${head}</thead><tbody>${body}</tbody></table>`);
    }
    inTable = false;
    tableRows = [];
  }

  function flushList() {
    if (inList) {
      out.push(inOrderedList ? '</ol>' : '</ul>');
    }
    inList = false;
    inOrderedList = false;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith('# ')) {
      flushTable();
      flushList();
      out.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushTable();
      flushList();
      out.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('### ')) {
      flushTable();
      flushList();
      out.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      flushList();
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      const isSeparator = cells.every((cell) => /^:?-+:?$/.test(cell));
      if (isSeparator) {
        continue;
      }
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push(`<tr>${cells.map((cell) => `<${tag}>${formatInline(cell)}</${tag}>`).join('')}</tr>`);
      continue;
    }

    if (line.startsWith('- ')) {
      flushTable();
      if (!inList || inOrderedList) {
        flushList();
        out.push('<ul>');
        inList = true;
        inOrderedList = false;
      }
      out.push(`<li>${formatInline(line.slice(2))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushTable();
      if (!inList || !inOrderedList) {
        flushList();
        out.push('<ol>');
        inList = true;
        inOrderedList = true;
      }
      out.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    if (line.startsWith('> ')) {
      flushTable();
      flushList();
      out.push(`<blockquote>${formatInline(line.slice(2))}</blockquote>`);
      continue;
    }

    if (line.startsWith('```')) {
      flushTable();
      flushList();
      let code = '';
      while (++index < lines.length && !lines[index].startsWith('```')) {
        code += `${lines[index]}\n`;
      }
      out.push(`<pre class="code-block">${escapeHtml(code)}</pre>`);
      continue;
    }

    if (line.trim() === '---') {
      flushTable();
      flushList();
      out.push('<hr />');
      continue;
    }

    if (line.trim() === '') {
      flushTable();
      flushList();
      out.push('<div class="spacer"></div>');
      continue;
    }

    flushTable();
    flushList();
    out.push(`<p>${formatInline(line)}</p>`);
  }

  flushTable();
  flushList();
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);
const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Documento Unificado de Artificial World</title>
  <style>
    :root {
      --bg: #f8fafc;
      --page: #ffffff;
      --text: #111827;
      --muted: #4b5563;
      --border: #e5e7eb;
      --accent: #0f766e;
      --accent-soft: #ccfbf1;
      --code-bg: #f3f4f6;
      --code-block-bg: #111827;
      --code-block-text: #e5e7eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Segoe UI", system-ui, sans-serif;
      line-height: 1.6;
      font-size: 14px;
      padding: 24px;
    }
    .page {
      max-width: 840px;
      margin: 0 auto;
      background: var(--page);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 40px 48px;
    }
    h1, h2, h3 { color: var(--text); margin: 0; }
    h1 {
      font-size: 30px;
      line-height: 1.15;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 3px solid var(--accent);
    }
    h2 {
      font-size: 22px;
      margin-top: 28px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 17px;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    p, li, blockquote { margin: 0 0 10px; }
    ul, ol { margin: 0 0 12px 22px; padding: 0; }
    code {
      background: var(--code-bg);
      border-radius: 4px;
      padding: 1px 6px;
      font-family: "Cascadia Code", "Consolas", monospace;
      font-size: 12px;
    }
    .code-block {
      background: var(--code-block-bg);
      color: var(--code-block-text);
      padding: 14px 16px;
      border-radius: 10px;
      overflow-x: auto;
      white-space: pre-wrap;
      font-size: 12px;
      line-height: 1.5;
    }
    blockquote {
      margin: 12px 0;
      padding: 10px 14px;
      border-left: 4px solid var(--accent);
      background: var(--accent-soft);
      color: var(--muted);
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 8px 10px;
      vertical-align: top;
      text-align: left;
    }
    th {
      background: var(--accent-soft);
      font-weight: 700;
    }
    hr {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 24px 0;
    }
    .spacer {
      height: 6px;
    }
    .meta {
      color: var(--muted);
      margin-bottom: 18px;
      font-size: 13px;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .page { border: 0; border-radius: 0; max-width: none; padding: 0; }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="meta">Artificial World · Documento maestro unificado</div>
    ${bodyHtml}
  </main>
</body>
</html>`;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setContent(html, {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});

try {
  await page.evaluateHandle('document.fonts.ready');
} catch {}

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', right: '16mm', bottom: '18mm', left: '16mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:9px;color:#6b7280;text-align:center;padding:0 16mm;">Documento Unificado de Artificial World · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});

await browser.close();

console.log(`PDF generado: ${pdfPath}`);
