/**
 * generar-pdf-compacto-unico.js
 * Compacta todos los documentos del proyecto en UN solo PDF con screenshots.
 * Fuentes: ARTIFICIAL_WORLD_COMPLETO, PAPER_FINAL (abstract), ESENCIAL.
 * Uso: node scripts/generar-pdf-compacto-unico.js
 */
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

// ─── Cargar contenido MD ───────────────────────────────────────────────────
function loadMd(relPath) {
  const full = path.join(root, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

const completoMd = loadMd('docs/ARTIFICIAL_WORLD_COMPLETO.md');
const paperMd = loadMd('docs/PAPER_FINAL.md');
const esencialMd = loadMd('docs/ESENCIAL.md');

// ─── Screenshots como base64 ─────────────────────────────────────────────────
function imgB64(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return null;
  const buf = fs.readFileSync(full);
  const ext = path.extname(full).toLowerCase().replace('.', '');
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

const screenshots = [
  { id: 'landing', path: 'docs/tutorial/screenshots/01-landing.png', caption: 'Selección de semilla de civilización. 7 arquetipos: Tribu de frontera, Refugio tecnócrata, Comunidad espiritual, Reino guerrero, Ciudad comerciante, Colonia paranoica, Imperio decadente.' },
  { id: 'hub', path: 'docs/tutorial/screenshots/02-hub.png', caption: 'Hub principal "Constructor de Mundos". Módulos: Tu Mundo, Arena, Emergencias (DobackSoft), Observatorio.' },
  { id: 'simulation', path: 'docs/tutorial/screenshots/03-simulation.png', caption: 'Vista de simulación web — Tu Mundo. Panel de control, mapa del refugio, compañero IA con métricas.' },
  { id: 'missioncontrol', path: 'docs/tutorial/screenshots/04-missioncontrol.png', caption: 'Observatorio (Mission Control). Estado global, lista de refugios, controles de simulación.' },
  { id: 'hubcards', path: 'docs/tutorial/screenshots/05-hub-cards.png', caption: 'Hub con las 4 cards: Tu Mundo, Arena, Emergencias, Observatorio.' },
  { id: 'admin', path: 'docs/tutorial/screenshots/06-admin-panel.png', caption: 'Panel de administración con control de acceso.' },
  { id: 'dobacksoft', path: 'docs/tutorial/screenshots/07-dobacksoft.png', caption: 'DobackSoft — Módulo de Emergencias integrado en el Hub.' },
];

// ─── MD a HTML (conversión básica) ───────────────────────────────────────────
function mdToHtml(md) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = md.split('\n');
  const out = [];
  let inTable = false, tableRows = [], inList = false, inCode = false, codeLines = [], inBq = false, bqLines = [];

  const flushTable = () => {
    if (!inTable || !tableRows.length) return;
    const thead = tableRows[0], tbody = tableRows.slice(1).join('');
    out.push(`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`);
    tableRows = []; inTable = false;
  };
  const flushList = () => { if (!inList) return; out.push('</ul>'); inList = false; };
  const flushBq = () => {
    if (!inBq || !bqLines.length) return;
    out.push('<blockquote>' + bqLines.map(l => `<p>${fmt(l)}</p>`).join('') + '</blockquote>');
    bqLines = []; inBq = false;
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushTable(); flushList(); flushBq();
      if (!inCode) { inCode = true; codeLines = []; continue; }
      out.push('<pre><code>' + esc(codeLines.join('\n')) + '</code></pre>');
      inCode = false; codeLines = []; continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith('> ')) { flushTable(); flushList(); inBq = true; bqLines.push(line.slice(2)); continue; }
    if (inBq && line.trim() === '') { flushBq(); continue; }
    if (inBq) { bqLines.push(line); continue; }

    if (line.startsWith('# '))         { flushTable(); flushList(); flushBq(); out.push(`<h1>${fmt(line.slice(2))}</h1>`); }
    else if (line.startsWith('## '))   { flushTable(); flushList(); flushBq(); out.push(`<h2>${fmt(line.slice(3))}</h2>`); }
    else if (line.startsWith('### '))  { flushTable(); flushList(); flushBq(); out.push(`<h3>${fmt(line.slice(4))}</h3>`); }
    else if (line.startsWith('#### ')) { flushTable(); flushList(); flushBq(); out.push(`<h4>${fmt(line.slice(5))}</h4>`); }
    else if (line.match(/^\|.+\|$/)) {
      flushList(); flushBq();
      if (!inTable) { inTable = true; tableRows = []; }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:\s]+$/.test(c))) continue;
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push('<tr>' + cells.map(c => `<${tag}>${fmt(c)}</${tag}>`).join('') + '</tr>');
    }
    else if (line.match(/^[-*] /))    { flushTable(); flushBq(); if (!inList) { out.push('<ul>'); inList = true; } out.push(`<li>${fmt(line.slice(2))}</li>`); }
    else if (line.startsWith('---'))  { flushTable(); flushList(); flushBq(); out.push('<hr>'); }
    else if (line.trim() === '')      { flushTable(); flushList(); }
    else                              { flushTable(); flushList(); flushBq(); out.push(`<p>${fmt(line)}</p>`); }
  }
  flushTable(); flushList(); flushBq();
  return out.join('\n');
}

// ─── Extraer abstract del paper ───────────────────────────────────────────────
function extractPaperAbstract(md) {
  const match = md.match(/## Abstract\s+([\s\S]*?)(?=\n## |\n---\n|$)/);
  return match ? match[1].trim() : '';
}

const paperAbstract = extractPaperAbstract(paperMd);
const bodyCompleto = mdToHtml(completoMd);
const bodyPaper = mdToHtml(`## Resumen técnico (Paper)\n\n${paperAbstract}`);
const bodyEsencial = mdToHtml(esencialMd);

// ─── Figuras con screenshots ─────────────────────────────────────────────────
function fig(src, num, caption) {
  if (!src) return '';
  return `
  <figure class="fig">
    <img src="${src}" alt="Figura ${num}" />
    <figcaption><strong>Figura ${num}.</strong> ${caption}</figcaption>
  </figure>`;
}

let figNum = 1;
const figurasHtml = screenshots.map((s) => {
  const src = imgB64(s.path);
  const html = fig(src, figNum, s.caption);
  if (src) figNum++;
  return html;
}).filter(Boolean).join('\n');

// ─── HTML completo ───────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Artificial World — Documento compacto único con screenshots</title>
<style>
:root {
  --font-serif: 'Georgia', 'Times New Roman', serif;
  --font-sans: 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Consolas', 'Cascadia Code', monospace;
  --accent: #0d9488;
  --accent-light: #ccfbf1;
  --accent-mid: #0f766e;
  --text: #1a1a1a;
  --text2: #3d3d3d;
  --muted: #6b6b6b;
  --border: #d4d4d4;
  --border-light: #ebebeb;
  --bg: #ffffff;
  --bg-alt: #f0fdfa;
  --code-bg: #0f172a;
  --code-text: #e2e8f0;
}
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-serif);
  color: var(--text);
  line-height: 1.6;
  font-size: 11px;
  background: #eceef2;
}
.page { max-width: 760px; margin: 24px auto; background: var(--bg); box-shadow: 0 2px 32px rgba(0,0,0,0.14); }

.cover { padding: 48px 56px 40px; border-bottom: 3px solid var(--accent); }
.cover-title {
  font-family: var(--font-sans); font-size: 1.4rem; font-weight: 700; color: var(--text);
  line-height: 1.25; margin-bottom: 16px; letter-spacing: -0.01em;
}
.cover-sub { font-family: var(--font-sans); font-size: 10px; color: var(--muted); margin-bottom: 20px; }
.cover-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 9.5px; color: var(--muted); }

.body { padding: 32px 56px 40px; }

h1 {
  font-family: var(--font-sans); font-size: 1.05rem; font-weight: 800; color: var(--accent);
  border-bottom: 2px solid var(--accent); padding-bottom: 5px;
  margin: 28px 0 10px; letter-spacing: -0.01em;
}
h1:first-child { margin-top: 0; }
h2 {
  font-family: var(--font-sans); font-size: 0.95rem; font-weight: 700; color: var(--text);
  margin: 20px 0 8px; padding-left: 8px; border-left: 3px solid var(--accent-mid);
}
h3 { font-family: var(--font-sans); font-size: 0.85rem; font-weight: 700; color: var(--text2); margin: 14px 0 6px; }
h4 { font-family: var(--font-sans); font-size: 0.8rem; font-weight: 600; color: var(--muted); margin: 10px 0 4px; font-style: italic; }

p { margin-bottom: 7px; text-align: justify; hyphens: auto; font-size: 11px; line-height: 1.6; }
ul { margin: 6px 0 10px 18px; }
li { margin-bottom: 3px; font-size: 11px; line-height: 1.55; }

table { width: 100%; border-collapse: collapse; margin: 10px 0 14px; font-family: var(--font-sans); font-size: 10px; }
th { background: var(--accent); color: #fff; font-weight: 700; padding: 5px 8px; text-align: left; font-size: 9.5px; }
td { border: 1px solid var(--border); padding: 4px 8px; vertical-align: top; line-height: 1.5; }
tr:nth-child(even) td { background: var(--bg-alt); }

code { font-family: var(--font-mono); font-size: 9.5px; background: var(--accent-light); color: var(--accent); padding: 1px 4px; border-radius: 3px; }
pre { background: var(--code-bg); border-radius: 6px; padding: 10px 14px; margin: 8px 0 12px; border-left: 3px solid var(--accent-mid); }
pre code { font-family: var(--font-mono); font-size: 9px; color: var(--code-text); background: transparent; padding: 0; line-height: 1.5; }

blockquote { border-left: 4px solid var(--accent-mid); padding: 8px 14px; margin: 10px 0; background: var(--accent-light); border-radius: 0 4px 4px 0; }
blockquote p { font-style: italic; color: var(--text2); font-size: 10.5px; margin: 0 0 4px; }
blockquote p:last-child { margin-bottom: 0; }

hr { border: none; border-top: 1px solid var(--border-light); margin: 20px 0; }
strong { font-weight: 700; }
em { font-style: italic; }
a { color: var(--accent-mid); }

.figures-section { border-top: 3px solid var(--accent); padding-top: 28px; }
.fig {
  margin: 16px 0 22px;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg);
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  page-break-inside: avoid;
}
.fig img {
  width: 100%;
  height: auto;
  display: block;
  border-bottom: 1px solid var(--border-light);
  max-height: 420px;
  object-fit: contain;
  background: #0a0b0d;
}
figcaption {
  padding: 8px 12px;
  font-family: var(--font-sans);
  font-size: 9.5px;
  color: var(--muted);
  line-height: 1.5;
  background: var(--bg-alt);
}
figcaption strong { color: var(--accent); font-weight: 700; }

.paper-footer {
  border-top: 2px solid var(--accent); padding: 12px 56px;
  font-family: var(--font-sans); font-size: 9px; color: var(--muted);
  display: flex; justify-content: space-between;
}
.paper-footer .left { color: var(--accent); font-weight: 600; }
</style>
</head>
<body>
<div class="page">

  <div class="cover">
    <div class="cover-title">Artificial World — Documento compacto único</div>
    <div class="cover-sub">Idea, ejecución, relato inversores, guía técnica, paper y screenshots en un solo PDF</div>
    <div class="cover-meta">
      <span><strong>Fecha:</strong> 2026-03-08</span>
      <span><strong>Repositorio:</strong> artificial-word</span>
      <span><strong>Screenshots:</strong> ${screenshots.filter(s => fs.existsSync(path.join(root, s.path))).length} capturas</span>
    </div>
  </div>

  <div class="body">
    ${bodyCompleto}
    ${figurasHtml ? `
    <div class="figures-section">
      <h1>Apéndice — Capturas de pantalla</h1>
      <p>Todas las capturas fueron tomadas de las aplicaciones en funcionamiento. Evidencia visual verificable del sistema.</p>
      ${figurasHtml}
    </div>
    ` : ''}
  </div>

  <div class="paper-footer">
    <span class="left">Artificial World — Documento compacto único · 2026</span>
    <span>Cosigein SL · "Constrúyelo. Habítalo. Haz que crezca."</span>
  </div>

</div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'ARTIFICIAL_WORLD_COMPACTO_UNICO.html');
const pdfPath = path.join(docsDir, 'ARTIFICIAL_WORLD_COMPACTO_UNICO.pdf');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML generado:', htmlPath);

try {
  const browser = await puppeteer.launch();
  const pg = await browser.newPage();
  await pg.setViewport({ width: 880, height: 1200 });
  await pg.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await pg.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '14mm', left: '10mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7.5px;color:#6b7280;width:100%;padding:0 10mm;text-align:right;font-family:system-ui;font-style:italic;">Artificial World — Documento compacto único · Cosigein SL · 2026</div>`,
    footerTemplate: `<div style="font-size:7.5px;color:#6b7280;width:100%;text-align:center;font-family:system-ui;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
  });
  await browser.close();
  console.log('PDF generado:', pdfPath);
} catch (err) {
  console.error('Error al generar PDF:', err.message);
  process.exit(1);
}
