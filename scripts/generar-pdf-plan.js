/**
 * Genera docs/PLAN_ACCION.pdf a partir de docs/PLAN_ACCION.md
 * Uso: node scripts/generar-pdf-plan.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'PLAN_ACCION.md');
const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Plan de acción\n\nNo se encontró PLAN_ACCION.md';

// Convertir Markdown básico a HTML
function mdToHtml(md) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = esc(md);
  const lines = html.split('\n');
  const out = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      if (inTable && tableRows.length > 0) {
        const thead = tableRows[0];
        const tbody = tableRows.slice(1).join('');
        out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
        tableRows = [];
        inTable = false;
      }
      out.push('<h1>' + line.slice(2) + '</h1>');
    } else if (line.startsWith('## ')) {
      if (inTable) {
        out.push('</tbody></table>');
        inTable = false;
      }
      out.push('<h2>' + line.slice(3) + '</h2>');
    } else if (line.startsWith('### ')) {
      if (inTable && tableRows.length > 0) {
        const thead = tableRows[0];
        const tbody = tableRows.slice(1).join('');
        out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
        tableRows = [];
        inTable = false;
      }
      out.push('<h3>' + line.slice(4) + '</h3>');
    } else if (line.match(/^\|.+\|$/)) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const isSep = cells.every((c) => /^-+$/.test(c));
      if (isSep) continue; // skip separator row
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push('<tr>' + cells.map((c) => `<${tag}>${c}</${tag}>`).join('') + '</tr>');
    } else if (line.startsWith('```')) {
      if (inTable && tableRows.length > 0) {
        const thead = tableRows[0];
        const tbody = tableRows.slice(1).join('');
        out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
        tableRows = [];
        inTable = false;
      }
      let code = '';
      while (++i < lines.length && !lines[i].startsWith('```')) code += lines[i] + '\n';
      out.push('<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;">' + esc(code) + '</pre>');
    } else if (line.trim() === '') {
      if (inTable && tableRows.length > 0) {
        const thead = tableRows[0];
        const tbody = tableRows.slice(1).join('');
        out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
        tableRows = [];
        inTable = false;
      }
      out.push('<p></p>');
    } else {
      if (inTable && tableRows.length > 0) {
        const thead = tableRows[0];
        const tbody = tableRows.slice(1).join('');
        out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
        tableRows = [];
        inTable = false;
      }
      out.push('<p>' + line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>') + '</p>');
    }
  }
  if (inTable && tableRows.length > 0) {
    const thead = tableRows[0];
    const tbody = tableRows.slice(1).join('');
    out.push('<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>');
  }
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan de acción — Artificial World</title>
  <style>
    :root { --accent: #0088aa; --accent-light: #e0f4f8; --text: #1a1d21; --text-muted: #4a5568; --bg: #fff; --border: #e2e8f0; --radius: 8px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: var(--text); line-height: 1.6; font-size: 14px; background: #f7fafc; }
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
    .footer-note { font-size: 12px; color: var(--text-muted); margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="page">
    <h1>Plan de acción — Artificial World</h1>
    <p><em>Documento maestro con el plan a seguir. Generado a partir del análisis de implementación vs documentación.</em></p>
    <p><strong>Fecha:</strong> ${new Date().toISOString().slice(0, 10)}</p>
    <div style="margin-top: 24px;">
      ${bodyHtml}
    </div>
    <p class="footer-note">Artificial World — Constrúyelo. Habítalo. Haz que crezca.</p>
  </div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'PLAN_ACCION.html');
const pdfPath = path.join(docsDir, 'PLAN_ACCION.pdf');

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
  footerTemplate: '<div style="font-size:9px;color:#64748b;width:100%;text-align:center;"><span>Plan de acción — Artificial World</span> · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', pdfPath);
