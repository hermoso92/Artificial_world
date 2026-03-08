/**
 * Genera docs/ARTIFICIAL_WORLD_COMPLETO.pdf y docs/ARTIFICIAL_WORLD_COMPLETO.html
 * a partir de docs/ARTIFICIAL_WORLD_COMPLETO.md
 * Uso: node scripts/generar-pdf-completo.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'ARTIFICIAL_WORLD_COMPLETO.md');
const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Artificial World — Documento completo\n\nNo se encontró ARTIFICIAL_WORLD_COMPLETO.md';

function mdToHtml(md) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const lines = md.split('\n');
  const out = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      const thead = tableRows[0];
      const tbody = tableRows.slice(1).join('');
      out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
      tableRows = [];
      inTable = false;
    }
  }

  function flushList() {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      flushTable();
      flushList();
      out.push('<h1>' + fmt(line.slice(2)) + '</h1>');
    } else if (line.startsWith('## ')) {
      flushTable();
      flushList();
      out.push('<h2>' + fmt(line.slice(3)) + '</h2>');
    } else if (line.startsWith('### ')) {
      flushTable();
      flushList();
      out.push('<h3>' + fmt(line.slice(4)) + '</h3>');
    } else if (line.match(/^\|.+\|$/)) {
      flushList();
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const isSep = cells.every((c) => /^-+$/.test(c));
      if (isSep) continue;
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push('<tr>' + cells.map((c) => `<${tag}>${fmt(c)}</${tag}>`).join('') + '</tr>');
    } else if (line.startsWith('- ')) {
      flushTable();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push('<li>' + fmt(line.slice(2)) + '</li>');
    } else if (line.startsWith('> ')) {
      flushTable();
      flushList();
      out.push('<blockquote>' + fmt(line.slice(2)) + '</blockquote>');
    } else if (line.startsWith('```')) {
      flushTable();
      flushList();
      let code = '';
      while (++i < lines.length && !lines[i].startsWith('```')) code += lines[i] + '\n';
      out.push('<pre class="code-block">' + esc(code) + '</pre>');
    } else if (line.match(/^<div/)) {
      flushTable();
      flushList();
      out.push(line);
    } else if (line.trim() === '') {
      flushTable();
      flushList();
      out.push('<p></p>');
    } else {
      flushTable();
      flushList();
      out.push('<p>' + fmt(line) + '</p>');
    }
  }
  flushTable();
  flushList();
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artificial World — Documento completo</title>
  <style>
    :root { --accent: #0d9488; --accent-light: #ccfbf1; --text: #1a1d21; --text-muted: #4a5568; --bg: #fff; --border: #e2e8f0; --radius: 8px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: var(--text); line-height: 1.6; font-size: 14px; background: #f0fdfa; }
    .page { max-width: 700px; margin: 20px auto; padding: 36px 44px; background: var(--bg); border-radius: var(--radius); page-break-after: always; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .page:last-of-type { page-break-after: auto; }
    h1 { font-size: 1.6rem; margin-bottom: 16px; color: var(--accent); border-bottom: 3px solid var(--accent); padding-bottom: 8px; }
    h2 { font-size: 1.2rem; margin: 24px 0 12px; color: var(--text); }
    h3 { font-size: 1rem; margin: 16px 0 8px; }
    p, li { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { background: var(--accent-light); font-weight: 600; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    ul { margin-left: 20px; margin-bottom: 12px; }
    blockquote { border-left: 4px solid var(--accent); padding-left: 16px; margin: 12px 0; color: var(--text-muted); font-style: italic; }
    pre.code-block { background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin: 12px 0; }
    .footer-note { font-size: 12px; color: var(--text-muted); margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); }
    div[align="center"] { text-align: center; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="page">
    <h1>Artificial World — Documento completo</h1>
    <p><em>Un solo documento que integra todo: idea, ejecución, relato inversores, guía técnica y crónica fundacional. Para colgar en la web.</em></p>
    <p><strong>Fecha:</strong> ${new Date().toISOString().slice(0, 10)}</p>
    <div style="margin-top: 24px;">
      ${bodyHtml}
    </div>
    <p class="footer-note">Artificial World — Constrúyelo. Habítalo. Haz que crezca.</p>
  </div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'ARTIFICIAL_WORLD_COMPLETO.html');
const pdfPath = path.join(docsDir, 'ARTIFICIAL_WORLD_COMPLETO.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML generado:', htmlPath);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 1200 } });
await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', right: '16mm', bottom: '20mm', left: '16mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-size:9px;color:#64748b;width:100%;text-align:center;"><span>Artificial World — Documento completo</span> · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', pdfPath);
