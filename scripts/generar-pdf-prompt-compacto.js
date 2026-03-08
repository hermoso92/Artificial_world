/**
 * generar-pdf-prompt-compacto.js
 * Genera docs/PROMPT_HORIZONS_COMPACTO.pdf desde docs/PROMPT_HORIZONS_COMPACTO.md
 * Uso: node scripts/generar-pdf-prompt-compacto.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'PROMPT_HORIZONS_COMPACTO.md');
const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Error\n\nNo se encontró el archivo.';

function mdToHtml(md) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = md.split('\n');
  const out = [];
  let inList = false, inCode = false, codeLines = [];

  function flushList() { if (!inList) return; out.push('</ul>'); inList = false; }

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushList();
      if (!inCode) { inCode = true; codeLines = []; continue; }
      out.push('<pre class="code">' + esc(codeLines.join('\n')) + '</pre>');
      inCode = false; codeLines = []; continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith('# '))        { flushList(); out.push('<h1>' + fmt(line.slice(2)) + '</h1>'); }
    else if (line.startsWith('## '))  { flushList(); out.push('<h2>' + fmt(line.slice(3)) + '</h2>'); }
    else if (line.startsWith('### ')) { flushList(); out.push('<h3>' + fmt(line.slice(4)) + '</h3>'); }
    else if (line.match(/^[-*] /))    { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + fmt(line.slice(2)) + '</li>'); }
    else if (line.startsWith('> '))   { flushList(); out.push('<blockquote>' + fmt(line.slice(2)) + '</blockquote>'); }
    else if (line.startsWith('---'))  { flushList(); out.push('<hr>'); }
    else if (line.trim() === '')      { flushList(); }
    else                              { flushList(); out.push('<p>' + fmt(line) + '</p>'); }
  }
  flushList();
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Prompt Horizons Compacto — Cosigein SL</title>
<style>
:root {
  --cyan: #00d4ff;
  --cyan-dark: #0088aa;
  --cyan-bg: #e0f7ff;
  --text: #0f172a;
  --muted: #475569;
  --border: #e2e8f0;
  --bg: #ffffff;
  --bg-alt: #f8fafc;
  --code-bg: #0f172a;
  --code-text: #e2e8f0;
}
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--text);
  line-height: 1.75;
  font-size: 12.5px;
  background: var(--bg-alt);
}
.page {
  max-width: 760px;
  margin: 24px auto;
  background: var(--bg);
  box-shadow: 0 4px 24px rgba(0,0,0,0.09);
  border-radius: 4px;
  overflow: hidden;
}
.cover {
  background: #0a0b0d;
  color: #fff;
  padding: 44px 52px 36px;
  border-bottom: 4px solid var(--cyan);
}
.cover-badge {
  display: inline-block;
  background: rgba(0,212,255,0.15);
  color: var(--cyan);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(0,212,255,0.3);
  margin-bottom: 18px;
}
.cover-title {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin-bottom: 10px;
  color: #fff;
}
.cover-title span { color: var(--cyan); }
.cover-sub {
  font-size: 0.95rem;
  color: rgba(255,255,255,0.6);
  margin-bottom: 18px;
  line-height: 1.5;
}
.cover-meta {
  font-size: 10.5px;
  color: rgba(255,255,255,0.4);
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 14px;
  margin-top: 4px;
}
.body {
  padding: 44px 52px 52px;
}
h1 {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text);
  border-bottom: 3px solid var(--cyan);
  padding-bottom: 8px;
  margin: 36px 0 16px;
  letter-spacing: -0.025em;
}
h1:first-child { margin-top: 0; }
h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 26px 0 10px;
  padding-left: 12px;
  border-left: 4px solid var(--cyan);
}
h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--muted);
  margin: 18px 0 8px;
}
p {
  margin-bottom: 10px;
  line-height: 1.75;
  color: var(--text);
}
ul { margin: 8px 0 12px 22px; }
li { margin-bottom: 5px; }
code {
  background: var(--cyan-bg);
  color: var(--cyan-dark);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10.5px;
  font-family: 'Consolas', monospace;
}
pre.code {
  background: var(--code-bg);
  color: var(--code-text);
  padding: 14px 18px;
  border-radius: 6px;
  font-size: 11px;
  font-family: 'Consolas', monospace;
  margin: 14px 0;
  line-height: 1.6;
  border-left: 3px solid var(--cyan);
}
blockquote {
  border-left: 4px solid var(--cyan);
  padding: 10px 16px;
  margin: 14px 0;
  color: var(--muted);
  font-style: italic;
  background: var(--cyan-bg);
  border-radius: 0 6px 6px 0;
}
hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 28px 0;
}
strong { font-weight: 700; color: var(--text); }
em { font-style: italic; color: var(--muted); }
a { color: var(--cyan-dark); }
.copy-note {
  background: #0a0b0d;
  color: rgba(255,255,255,0.5);
  font-size: 10px;
  text-align: center;
  padding: 14px 20px;
  letter-spacing: 0.03em;
}
.copy-note strong { color: var(--cyan); }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="cover-badge">Hostinger Horizons · Prompt Directo</div>
    <div class="cover-title">Portfolio<br><span>Cosigein SL</span></div>
    <div class="cover-sub">Artificial World · DobackSoft · Paper Científico · CV · Demos · Juegos<br>Copia este texto y pégalo directamente en el builder.</div>
    <div class="cover-meta">Versión compacta · 2026-03-08 · Para copiar y pegar</div>
  </div>
  <div class="body">
    ${bodyHtml}
  </div>
  <div class="copy-note">
    <strong>Listo para pegar en Horizons.</strong> · Cosigein SL · 2026 · "No preguntes a una IA. Convoca un mundo que pueda demostrar su respuesta."
  </div>
</div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'PROMPT_HORIZONS_COMPACTO.html');
const pdfPath  = path.join(docsDir, 'PROMPT_HORIZONS_COMPACTO.pdf');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML generado:', htmlPath);

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 860, height: 1200 } });
await pg.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await pg.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '10mm', right: '10mm', bottom: '14mm', left: '10mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8px;color:#94a3b8;width:100%;padding:0 10mm;text-align:right;font-family:system-ui;">Cosigein SL — Prompt Horizons Compacto · 2026</div>',
  footerTemplate: '<div style="font-size:8px;color:#94a3b8;width:100%;text-align:center;font-family:system-ui;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('✅ PDF generado:', pdfPath);
