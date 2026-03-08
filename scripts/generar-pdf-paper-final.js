/**
 * generar-pdf-paper-final.js
 * Genera docs/PAPER_FINAL.pdf desde docs/PAPER_FINAL.md
 * Uso: node scripts/generar-pdf-paper-final.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'PAPER_FINAL.md');
const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Error\n\nNo se encontró PAPER_FINAL.md';

function mdToHtml(md) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = md.split('\n');
  const out = [];
  let inTable = false, tableRows = [], inList = false, inCode = false, codeLines = [];

  function flushTable() {
    if (!inTable || tableRows.length === 0) return;
    const thead = tableRows[0];
    const tbody = tableRows.slice(1).join('');
    out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
    tableRows = []; inTable = false;
  }
  function flushList() {
    if (!inList) return;
    out.push('</ul>'); inList = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      flushTable(); flushList();
      if (!inCode) { inCode = true; codeLines = []; continue; }
      out.push('<pre class="code">' + esc(codeLines.join('\n')) + '</pre>');
      inCode = false; codeLines = []; continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith('# '))        { flushTable(); flushList(); out.push('<h1>' + fmt(line.slice(2)) + '</h1>'); }
    else if (line.startsWith('## '))  { flushTable(); flushList(); out.push('<h2>' + fmt(line.slice(3)) + '</h2>'); }
    else if (line.startsWith('### ')) { flushTable(); flushList(); out.push('<h3>' + fmt(line.slice(4)) + '</h3>'); }
    else if (line.startsWith('#### ')){ flushTable(); flushList(); out.push('<h4>' + fmt(line.slice(5)) + '</h4>'); }
    else if (line.match(/^\|.+\|$/)) {
      flushList();
      if (!inTable) { inTable = true; tableRows = []; }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:\s]+$/.test(c))) continue;
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push('<tr>' + cells.map(c => `<${tag}>${fmt(c)}</${tag}>`).join('') + '</tr>');
    }
    else if (line.match(/^[-*] /)) {
      flushTable();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + fmt(line.slice(2)) + '</li>');
    }
    else if (line.match(/^\d+\. /)) {
      flushTable(); flushList();
      out.push('<p class="numbered">' + fmt(line) + '</p>');
    }
    else if (line.startsWith('> '))   { flushTable(); flushList(); out.push('<blockquote>' + fmt(line.slice(2)) + '</blockquote>'); }
    else if (line.startsWith('---'))  { flushTable(); flushList(); out.push('<hr>'); }
    else if (line.trim() === '')      { flushTable(); flushList(); }
    else                              { flushTable(); flushList(); out.push('<p>' + fmt(line) + '</p>'); }
  }
  flushTable(); flushList();
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Artificial World — Paper Final</title>
<style>
:root {
  --accent: #0d9488;
  --accent-light: #ccfbf1;
  --text: #1a202c;
  --muted: #4a5568;
  --bg: #fff;
  --border: #e2e8f0;
  --code-bg: #1e293b;
  --code-text: #e2e8f0;
}
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Georgia', 'Times New Roman', serif;
  color: var(--text);
  line-height: 1.75;
  font-size: 12.5px;
  background: #f8fafc;
}
.page {
  max-width: 720px;
  margin: 20px auto;
  padding: 52px 56px;
  background: var(--bg);
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
h1 {
  font-size: 1.55rem;
  font-weight: 700;
  color: var(--accent);
  border-bottom: 3px solid var(--accent);
  padding-bottom: 10px;
  margin: 28px 0 18px;
  line-height: 1.3;
  font-family: system-ui, sans-serif;
}
h1:first-child { margin-top: 0; }
h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  margin: 28px 0 12px;
  padding-left: 12px;
  border-left: 4px solid var(--accent);
  font-family: system-ui, sans-serif;
}
h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--muted);
  margin: 20px 0 8px;
  font-family: system-ui, sans-serif;
}
h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
  margin: 14px 0 6px;
  font-family: system-ui, sans-serif;
}
p {
  margin-bottom: 10px;
  text-align: justify;
  hyphens: auto;
}
p.numbered { margin-bottom: 6px; padding-left: 16px; }
ul { margin: 8px 0 12px 22px; }
li { margin-bottom: 4px; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 11.5px;
  font-family: system-ui, sans-serif;
}
th, td {
  border: 1px solid var(--border);
  padding: 7px 11px;
  text-align: left;
  vertical-align: top;
}
th {
  background: var(--accent-light);
  font-weight: 700;
  color: #0f766e;
}
tr:nth-child(even) td { background: #f8fffe; }
code {
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #0f766e;
}
pre.code {
  background: var(--code-bg);
  color: var(--code-text);
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  overflow-x: auto;
  margin: 14px 0;
  line-height: 1.6;
}
blockquote {
  border-left: 4px solid var(--accent);
  padding: 10px 16px;
  margin: 14px 0;
  color: var(--muted);
  font-style: italic;
  background: var(--accent-light);
  border-radius: 0 6px 6px 0;
}
hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 28px 0;
}
a { color: var(--accent); text-decoration: none; }
.header-meta {
  font-family: system-ui, sans-serif;
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 28px;
  background: #f8fffe;
}
</style>
</head>
<body>
<div class="page">
  <div class="header-meta">
    <strong>Artificial World</strong> — Paper Fundacional · 2026-03-08 ·
    Repositorio: <code>artificial-word</code> · Autor: Cosigein SL
  </div>
  ${bodyHtml}
  <hr>
  <p style="font-size:11px;color:#64748b;text-align:center;margin-top:16px;">
    Artificial World · Cosigein SL · 2026 ·
    Constrúyelo. Habítalo. Haz que crezca.
  </p>
</div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'PAPER_FINAL.html');
const pdfPath  = path.join(docsDir, 'PAPER_FINAL.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML generado:', htmlPath);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 820, height: 1200 } });
await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', right: '14mm', bottom: '18mm', left: '14mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:9px;color:#64748b;width:100%;padding:0 14mm;text-align:right;">Artificial World — Paper Fundacional 2026</div>',
  footerTemplate: '<div style="font-size:9px;color:#64748b;width:100%;text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', pdfPath);
