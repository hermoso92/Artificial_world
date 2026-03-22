/**
 * generar-pdf-prompt-fundacional.js
 * Genera docs/PROMPT_FUNDACIONAL_DEFINITIVO.pdf desde docs/PROMPT_FUNDACIONAL_DEFINITIVO.md
 * Uso: node scripts/generar-pdf-prompt-fundacional.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'PROMPT_FUNDACIONAL_DEFINITIVO.md');
const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Error\n\nNo se encontró PROMPT_FUNDACIONAL_DEFINITIVO.md';

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
<title>Prompt Fundacional Definitivo — Cosigein SL · Artificial World</title>
<style>
:root {
  --accent: #00d4ff;
  --accent-dark: #0088aa;
  --accent-light: #e0f7ff;
  --green: #00c853;
  --text: #1a202c;
  --muted: #4a5568;
  --bg: #fff;
  --bg-alt: #f8fafc;
  --border: #e2e8f0;
  --code-bg: #0f172a;
  --code-text: #e2e8f0;
}
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: var(--text);
  line-height: 1.75;
  font-size: 12px;
  background: var(--bg-alt);
}
.page {
  max-width: 800px;
  margin: 20px auto;
  padding: 48px 56px;
  background: var(--bg);
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
}
.cover {
  text-align: center;
  padding: 32px 0 40px;
  border-bottom: 3px solid var(--accent);
  margin-bottom: 36px;
}
.cover-badge {
  display: inline-block;
  background: var(--accent-light);
  color: var(--accent-dark);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
}
.cover-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 8px;
}
.cover-subtitle {
  font-size: 1rem;
  color: var(--muted);
  margin-bottom: 16px;
}
.cover-meta {
  font-size: 11px;
  color: #94a3b8;
}
h1 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  border-bottom: 3px solid var(--accent);
  padding-bottom: 8px;
  margin: 36px 0 16px;
  line-height: 1.3;
  letter-spacing: -0.02em;
}
h1:first-child { margin-top: 0; }
h2 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 28px 0 10px;
  padding-left: 12px;
  border-left: 4px solid var(--accent);
}
h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--muted);
  margin: 20px 0 8px;
}
h4 {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--muted);
  margin: 14px 0 6px;
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
  margin: 14px 0 18px;
  font-size: 11px;
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
  color: var(--accent-dark);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
tr:nth-child(even) td { background: #fafeff; }
code {
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10.5px;
  font-family: 'Consolas', 'Cascadia Code', monospace;
  color: var(--accent-dark);
}
pre.code {
  background: var(--code-bg);
  color: var(--code-text);
  padding: 14px 18px;
  border-radius: 8px;
  font-size: 11px;
  font-family: 'Consolas', 'Cascadia Code', monospace;
  overflow-x: auto;
  margin: 14px 0 18px;
  line-height: 1.6;
  border-left: 3px solid var(--accent);
}
blockquote {
  border-left: 4px solid var(--accent);
  padding: 12px 18px;
  margin: 16px 0;
  color: var(--muted);
  font-style: italic;
  background: var(--accent-light);
  border-radius: 0 6px 6px 0;
  font-size: 12.5px;
}
hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 28px 0;
}
a { color: var(--accent-dark); text-decoration: none; }
strong { font-weight: 700; }
em { font-style: italic; }
.section-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-dark);
  background: var(--accent-light);
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 8px;
}
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="cover-badge">Hostinger Horizons · Prompt Fundacional Definitivo</div>
    <div class="cover-title">Ecosistema Cosigein SL</div>
    <div class="cover-subtitle">Artificial World · DobackSoft · Paper Científico · CV · Demos · Juegos</div>
    <div class="cover-meta">Versión 1.0 Final · 2026-03-08 · Preparado por Cosigein SL</div>
  </div>
  ${bodyHtml}
  <hr>
  <p style="font-size:10.5px;color:#94a3b8;text-align:center;margin-top:16px;">
    Cosigein SL · Artificial World · DobackSoft · 2026 ·
    <em>"No preguntes a una IA. Convoca un mundo que pueda demostrar su respuesta."</em>
  </p>
</div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'PROMPT_FUNDACIONAL_DEFINITIVO.html');
const pdfPath  = path.join(docsDir, 'PROMPT_FUNDACIONAL_DEFINITIVO.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML generado:', htmlPath);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8.5px;color:#94a3b8;width:100%;padding:0 12mm;text-align:right;font-family:system-ui;">Cosigein SL — Prompt Fundacional Definitivo · Hostinger Horizons 2026</div>',
  footerTemplate: '<div style="font-size:8.5px;color:#94a3b8;width:100%;text-align:center;font-family:system-ui;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('✅ PDF generado:', pdfPath);
