/**
 * Genera cronica_fundacional.pdf a partir de cronica_fundacional.md
 * Requiere: npx playwright install chromium (si no está instalado)
 * Uso: node scripts/generar-pdf-cronica.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const mdPath = path.join(root, 'cronica_fundacional.md');
const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Crónica Fundacional\n\nEjecuta primero: python cronica_fundacional.py';

function mdToHtml(md) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = esc(md);
  const lines = html.split('\n');
  const out = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<h1>' + line.slice(2) + '</h1>');
    } else if (line.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<h2>' + line.slice(3) + '</h2>');
    } else if (line.startsWith('### ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<h3>' + line.slice(4) + '</h3>');
    } else if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>') + '</li>');
    } else if (line.trim() === '') {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<p></p>');
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<p>' + line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>') + '</p>');
    }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crónica Fundacional — Artificial World</title>
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
    ul { margin-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 4px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .footer-note { font-size: 12px; color: var(--text-muted); margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="page">
    <h1>Crónica Fundacional — Artificial World</h1>
    <p><em>Historia emergente de una sesión fundacional reproducible.</em></p>
    <div style="margin-top: 24px;">
      ${bodyHtml}
    </div>
    <p class="footer-note">Artificial World — Constrúyelo. Habítalo. Haz que crezca.</p>
  </div>
</body>
</html>`;

const htmlPath = path.join(root, 'cronica_fundacional.html');
const pdfPath = path.join(root, 'cronica_fundacional.pdf');

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
  footerTemplate: '<div style="font-size:9px;color:#64748b;width:100%;text-align:center;"><span>Crónica Fundacional — Artificial World</span> · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', pdfPath);
