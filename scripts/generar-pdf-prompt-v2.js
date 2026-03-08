/**
 * generar-pdf-prompt-v2.js
 * Genera docs/PROMPT_HORIZONS_V2.pdf desde docs/PROMPT_HORIZONS_V2.md
 * Uso: node scripts/generar-pdf-prompt-v2.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'PROMPT_HORIZONS_V2.md');
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

    if (line.startsWith('# '))         { flushList(); out.push('<h1>' + fmt(line.slice(2)) + '</h1>'); }
    else if (line.startsWith('## '))   { flushList(); out.push('<h2>' + fmt(line.slice(3)) + '</h2>'); }
    else if (line.startsWith('### '))  { flushList(); out.push('<h3>' + fmt(line.slice(4)) + '</h3>'); }
    else if (line.startsWith('#### ')) { flushList(); out.push('<h4>' + fmt(line.slice(5)) + '</h4>'); }
    else if (line.match(/^[-*] /))     { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + fmt(line.slice(2)) + '</li>'); }
    else if (line.startsWith('> '))    { flushList(); out.push('<blockquote>' + fmt(line.slice(2)) + '</blockquote>'); }
    else if (line.startsWith('---'))   { flushList(); out.push('<hr>'); }
    else if (line.trim() === '')       { flushList(); }
    else                               { flushList(); out.push('<p>' + fmt(line) + '</p>'); }
  }
  flushList();
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Prompt Horizons V2 — Cosigein SL · Magnitud Real</title>
<style>
:root {
  --cyan: #00d4ff;
  --cyan-dark: #007a99;
  --cyan-bg: #e0f9ff;
  --green: #00c853;
  --green-bg: #e8f5e9;
  --orange: #ff9800;
  --orange-bg: #fff3e0;
  --text: #0f172a;
  --muted: #475569;
  --border: #e2e8f0;
  --bg: #ffffff;
  --bg-dark: #0a0b0d;
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
  background: #f1f5f9;
}
.page {
  max-width: 800px;
  margin: 20px auto;
  background: var(--bg);
  box-shadow: 0 4px 32px rgba(0,0,0,0.12);
  border-radius: 4px;
  overflow: hidden;
}

/* PORTADA */
.cover {
  background: var(--bg-dark);
  color: #fff;
  padding: 48px 52px 40px;
  position: relative;
  overflow: hidden;
}
.cover::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
  border-radius: 50%;
}
.cover-badge {
  display: inline-block;
  background: rgba(0,212,255,0.12);
  color: var(--cyan);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid rgba(0,212,255,0.25);
  margin-bottom: 20px;
}
.cover-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.cover-title {
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin-bottom: 8px;
}
.cover-title .cyan { color: var(--cyan); }
.cover-sub {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.55);
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 520px;
}
.cover-products {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.product-badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 4px;
  letter-spacing: 0.04em;
}
.product-badge.main {
  background: rgba(0,212,255,0.2);
  color: var(--cyan);
  border: 1px solid rgba(0,212,255,0.3);
}
.product-badge.lab {
  background: rgba(0,200,83,0.15);
  color: #00e676;
  border: 1px solid rgba(0,200,83,0.25);
}
.product-badge.demo {
  background: rgba(255,152,0,0.15);
  color: #ffb74d;
  border: 1px solid rgba(255,152,0,0.25);
}
.cover-quote {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  font-style: italic;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 16px;
}

/* CUERPO */
.body { padding: 44px 52px 52px; }

h1 {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text);
  border-bottom: 3px solid var(--cyan);
  padding-bottom: 8px;
  margin: 40px 0 16px;
  letter-spacing: -0.025em;
}
h1:first-child { margin-top: 0; }
h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 28px 0 10px;
  padding-left: 12px;
  border-left: 4px solid var(--cyan);
}
h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--muted);
  margin: 20px 0 8px;
}
h4 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--cyan-dark);
  margin: 16px 0 6px;
  padding: 4px 10px;
  background: var(--cyan-bg);
  border-radius: 4px;
  display: inline-block;
}
p { margin-bottom: 10px; line-height: 1.75; }
ul { margin: 8px 0 12px 22px; }
li { margin-bottom: 5px; line-height: 1.65; }
code {
  background: var(--cyan-bg);
  color: var(--cyan-dark);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10.5px;
  font-family: 'Consolas', 'Cascadia Code', monospace;
}
pre.code {
  background: var(--code-bg);
  color: var(--code-text);
  padding: 14px 18px;
  border-radius: 6px;
  font-size: 11px;
  font-family: 'Consolas', monospace;
  margin: 12px 0 16px;
  line-height: 1.6;
  border-left: 3px solid var(--cyan);
}
blockquote {
  border-left: 4px solid var(--cyan);
  padding: 12px 18px;
  margin: 16px 0;
  color: var(--muted);
  font-style: italic;
  background: var(--cyan-bg);
  border-radius: 0 6px 6px 0;
  font-size: 12.5px;
}
hr { border: none; border-top: 1px solid var(--border); margin: 30px 0; }
strong { font-weight: 700; }
em { font-style: italic; color: var(--muted); }
a { color: var(--cyan-dark); }

/* FOOTER */
.footer {
  background: var(--bg-dark);
  color: rgba(255,255,255,0.4);
  font-size: 10px;
  text-align: center;
  padding: 16px 20px;
  letter-spacing: 0.04em;
}
.footer strong { color: var(--cyan); }
</style>
</head>
<body>
<div class="page">

  <div class="cover">
    <div class="cover-badge">Hostinger Horizons · Prompt V2 · Magnitud Real</div>
    <div class="cover-label">Portfolio completo</div>
    <div class="cover-title">Ecosistema<br><span class="cyan">Cosigein SL</span></div>
    <div class="cover-sub">
      Panel operativo + puntos negros + conductores + training platform + FireSimulator.<br>
      Motor de civilizaciones. Paper científico. 68+ tests. Todo verificable.
    </div>
    <div class="cover-products">
      <span class="product-badge main">DobackSoft StabilSafe V3 — Producto principal</span>
      <span class="product-badge lab">Artificial World — Laboratorio</span>
      <span class="product-badge demo">FireSimulator — Demo y training</span>
    </div>
    <div class="cover-quote">"No preguntes a una IA. Convoca un mundo que pueda demostrar su respuesta." — Cosigein SL · 2026</div>
  </div>

  <div class="body">
    ${bodyHtml}
  </div>

  <div class="footer">
    <strong>Listo para pegar en Hostinger Horizons.</strong> ·
    Cosigein SL · Artificial World · DobackSoft · 2026 ·
    "Construyelo. Habítalo. Haz que crezca."
  </div>

</div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'PROMPT_HORIZONS_V2.html');
const pdfPath  = path.join(docsDir, 'PROMPT_HORIZONS_V2.pdf');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML generado:', htmlPath);

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 880, height: 1200 } });
await pg.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await pg.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '10mm', right: '10mm', bottom: '14mm', left: '10mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8px;color:#94a3b8;width:100%;padding:0 10mm;text-align:right;font-family:system-ui;">Cosigein SL — Prompt Horizons V2 · Magnitud Real · 2026</div>',
  footerTemplate: '<div style="font-size:8px;color:#94a3b8;width:100%;text-align:center;font-family:system-ui;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('✅ PDF generado:', pdfPath);
