/**
 * generar-pdf-auditoria-codebase.js
 * Genera docs/AUDITORIA_CODEBASE_2026-03-09.pdf desde docs/AUDITORIA_CODEBASE_2026-03-09.md
 * Uso: node scripts/generar-pdf-auditoria-codebase.js
 */
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'AUDITORIA_CODEBASE_2026-03-09.md');
const pdfPath = path.join(docsDir, 'AUDITORIA_CODEBASE_2026-03-09.pdf');

const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Error\n\nNo se encontró el archivo MD de auditoría.';

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

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith('```')) {
      if (!inCode) { inCode = true; codeLines = []; continue; }
      else {
        flushTable(); flushList();
        out.push('<pre><code>' + codeLines.map(esc).join('\n') + '</code></pre>');
        inCode = false; codeLines = []; continue;
      }
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith('|')) {
      if (!inTable) { flushList(); inTable = true; }
      const cols = line.split('|').slice(1, -1);
      if (cols.every(c => /^[-: ]+$/.test(c))) continue;
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push('<tr>' + cols.map(c => `<${tag}>${fmt(c.trim())}</${tag}>`).join('') + '</tr>');
      continue;
    } else {
      flushTable();
    }

    if (line.startsWith('### ')) { flushList(); out.push('<h3>' + fmt(esc(line.slice(4))) + '</h3>'); continue; }
    if (line.startsWith('## ')) { flushList(); out.push('<h2>' + fmt(esc(line.slice(3))) + '</h2>'); continue; }
    if (line.startsWith('# ')) { flushList(); out.push('<h1>' + fmt(esc(line.slice(2))) + '</h1>'); continue; }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + fmt(esc(line.slice(2))) + '</li>');
      continue;
    } else {
      flushList();
    }

    if (line.startsWith('---')) { out.push('<hr>'); continue; }

    if (line.trim() === '') { out.push('<p class="spacer"></p>'); continue; }

    out.push('<p>' + fmt(esc(line)) + '</p>');
  }
  flushTable(); flushList();
  return out.join('\n');
}

const body = mdToHtml(mdContent);

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Auditoría Técnica — Artificial World 2026-03-09</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.55;
    color: #1a1a2e;
    background: #fff;
    padding: 0 18px;
  }
  h1 {
    font-size: 22px;
    color: #0f172a;
    margin: 28px 0 6px;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 8px;
  }
  h2 {
    font-size: 15px;
    color: #1e3a5f;
    margin: 22px 0 6px;
    border-left: 4px solid #3b82f6;
    padding-left: 10px;
    background: #f0f7ff;
    padding: 5px 10px;
    border-radius: 0 4px 4px 0;
  }
  h3 {
    font-size: 12px;
    color: #1e40af;
    margin: 16px 0 5px;
    font-weight: 700;
  }
  p { margin: 4px 0; }
  p.spacer { margin: 6px 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
    font-size: 10px;
    page-break-inside: avoid;
  }
  th {
    background: #1e3a5f;
    color: #fff;
    padding: 5px 8px;
    text-align: left;
    font-weight: 600;
    font-size: 10px;
  }
  td {
    padding: 4px 8px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f8fafc; }
  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 9px;
    margin: 8px 0;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  code {
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 9.5px;
  }
  pre code {
    background: none;
    color: inherit;
    padding: 0;
    font-size: 9px;
  }
  ul { padding-left: 18px; margin: 4px 0; }
  li { margin: 2px 0; }
  hr { border: none; border-top: 1px solid #cbd5e1; margin: 14px 0; }
  strong { color: #0f172a; }

  /* Severity badges inline */
  strong:first-child { }

  /* Cover page */
  .cover {
    text-align: center;
    padding: 60px 20px 40px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 28px;
    border: none;
    color: #0f172a;
    margin-bottom: 10px;
  }
  .cover .subtitle { font-size: 14px; color: #475569; margin-bottom: 30px; }
  .cover .meta { font-size: 11px; color: #64748b; }
  .cover .score-box {
    display: inline-block;
    background: #1e3a5f;
    color: white;
    padding: 18px 40px;
    border-radius: 12px;
    margin: 20px auto;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 2px;
  }
  .cover .badges {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin: 20px 0;
  }
  .badge {
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge.critical { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
  .badge.high { background: #fff7ed; color: #ea580c; border: 1px solid #fdba74; }
  .badge.medium { background: #fffbeb; color: #ca8a04; border: 1px solid #fde68a; }
  .badge.low { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }

  @media print {
    body { padding: 0 10px; }
    .cover { page-break-after: always; }
    h2 { page-break-before: auto; }
    table { page-break-inside: avoid; }
    pre { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="cover">
  <h1>Auditoría Técnica Integral</h1>
  <div class="subtitle">Artificial World — Constructor de Mundos</div>
  <div class="score-box">6.3 / 10</div>
  <div class="badges">
    <span class="badge critical">4 Critical</span>
    <span class="badge high">11 High</span>
    <span class="badge medium">9 Medium</span>
    <span class="badge low">5 Low</span>
  </div>
  <div class="meta">
    <strong>Fecha:</strong> 2026-03-09<br>
    <strong>Auditor:</strong> Cursor AI — 9 agentes especializados<br>
    <strong>Stack:</strong> Node.js/Express · React/Vite · SQLite · WebSocket<br>
    <strong>Archivos auditados:</strong> 50+ (28 backend + 22 frontend)<br>
    <strong>Dominios analizados:</strong> Seguridad · Concurrencia · Arquitectura · Calidad · Dependencias · Observabilidad · Ciclo de Vida
  </div>
</div>

${body}

</body>
</html>`;

const htmlPath = path.join(docsDir, '_tmp_auditoria_codebase.html');
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Lanzando Chromium headless...');
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8px;color:#94a3b8;width:100%;text-align:center;padding-top:4px;">Auditoría Técnica — Artificial World</div>',
  footerTemplate: '<div style="font-size:8px;color:#94a3b8;width:100%;text-align:center;padding-bottom:4px;">Página <span class="pageNumber"></span> de <span class="totalPages"></span> · 2026-03-09</div>',
});

await browser.close();
fs.unlinkSync(htmlPath);

const stat = fs.statSync(pdfPath);
console.log(`✅ PDF generado: ${pdfPath} (${(stat.size / 1024).toFixed(1)} KB)`);
