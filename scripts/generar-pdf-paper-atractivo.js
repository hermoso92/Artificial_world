import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'PAPER_FINAL.md');
const htmlPath = path.join(docsDir, 'PAPER_FINAL_VISUAL.html');
const pdfPath = path.join(docsDir, 'PAPER_FINAL_VISUAL.pdf');

const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Error\n\nNo se encontro docs/PAPER_FINAL.md';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const toc = [];
  let title = 'Artificial World';
  let inCode = false;
  let codeLines = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableRows = [];
  let inBlockquote = false;
  let blockquoteLines = [];
  let titleConsumed = false;

  const flushUl = () => {
    if (!inUl) return;
    out.push('</ul>');
    inUl = false;
  };

  const flushOl = () => {
    if (!inOl) return;
    out.push('</ol>');
    inOl = false;
  };

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    const head = tableRows[0];
    const body = tableRows.slice(1).join('');
    out.push(`<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`);
    inTable = false;
    tableRows = [];
  };

  const flushBlockquote = () => {
    if (!inBlockquote || blockquoteLines.length === 0) return;
    out.push(`<blockquote>${blockquoteLines.map((line) => `<p>${formatInline(line)}</p>`).join('')}</blockquote>`);
    inBlockquote = false;
    blockquoteLines = [];
  };

  const closeOpenBlocks = () => {
    flushUl();
    flushOl();
    flushTable();
    flushBlockquote();
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      closeOpenBlocks();
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('> ')) {
      flushUl();
      flushOl();
      flushTable();
      inBlockquote = true;
      blockquoteLines.push(line.slice(2));
      continue;
    }

    if (inBlockquote && line.trim() === '') {
      flushBlockquote();
      continue;
    }

    if (inBlockquote) {
      blockquoteLines.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      closeOpenBlocks();
      const text = line.slice(2).trim();
      if (!titleConsumed) {
        title = text;
        titleConsumed = true;
      } else {
        const id = slugify(text);
        toc.push({ level: 1, text, id });
        out.push(`<h1 id="${id}">${formatInline(text)}</h1>`);
      }
      continue;
    }

    if (line.startsWith('## ')) {
      closeOpenBlocks();
      const text = line.slice(3).trim();
      const id = slugify(text);
      toc.push({ level: 2, text, id });
      out.push(`<h2 id="${id}">${formatInline(text)}</h2>`);
      continue;
    }

    if (line.startsWith('### ')) {
      closeOpenBlocks();
      const text = line.slice(4).trim();
      const id = slugify(text);
      toc.push({ level: 3, text, id });
      out.push(`<h3 id="${id}">${formatInline(text)}</h3>`);
      continue;
    }

    if (line.startsWith('#### ')) {
      closeOpenBlocks();
      const text = line.slice(5).trim();
      const id = slugify(text);
      toc.push({ level: 4, text, id });
      out.push(`<h4 id="${id}">${formatInline(text)}</h4>`);
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      flushUl();
      flushOl();
      flushBlockquote();
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      if (cells.every((cell) => /^[-:\s]+$/.test(cell))) {
        continue;
      }
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push(`<tr>${cells.map((cell) => `<${tag}>${formatInline(cell)}</${tag}>`).join('')}</tr>`);
      continue;
    }

    const unorderedMatch = line.match(/^[-*] (.+)$/);
    if (unorderedMatch) {
      flushOl();
      flushTable();
      flushBlockquote();
      if (!inUl) {
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${formatInline(unorderedMatch[1])}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\. (.+)$/);
    if (orderedMatch) {
      flushUl();
      flushTable();
      flushBlockquote();
      if (!inOl) {
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${formatInline(orderedMatch[1])}</li>`);
      continue;
    }

    if (line.startsWith('---')) {
      closeOpenBlocks();
      out.push('<hr>');
      continue;
    }

    if (line.trim() === '') {
      closeOpenBlocks();
      continue;
    }

    closeOpenBlocks();
    out.push(`<p>${formatInline(line)}</p>`);
  }

  closeOpenBlocks();

  return {
    title,
    toc,
    bodyHtml: out.join('\n'),
  };
}

const { title, toc, bodyHtml } = parseMarkdown(mdContent);

const tocHtml = toc
  .filter((item) => item.level <= 3)
  .map((item) => `<a class="toc-item level-${item.level}" href="#${item.id}">${formatInline(item.text)}</a>`)
  .join('');

const metaCards = [
  ['Formato', 'Preprint tecnico'],
  ['Baseline', 'Semilla 42 · 200 ticks · 8 agentes'],
  ['Motor real', 'Python + SQLite + Modo Sombra'],
  ['Aporte fuerte', 'Trazabilidad y reproducibilidad'],
];

const metaHtml = metaCards
  .map(([label, value]) => `<div class="meta-card"><span>${label}</span><strong>${value}</strong></div>`)
  .join('');

const summaryHtml = `
<section class="summary-grid">
  <div class="summary-card">
    <span class="kicker">Posicionamiento</span>
    <h3>Arquitectura verificable antes que narrativa inflada</h3>
    <p>Este documento presenta <strong>Artificial World</strong> como un sistema multiagente trazable y reproducible, con una baseline experimental inicial y una frontera explicita entre lo real, lo parcial, lo demo y lo futuro.</p>
  </div>
  <div class="summary-card accent">
    <span class="kicker">Tesis</span>
    <h3>No vender mas de lo que el sistema puede demostrar</h3>
    <p>La contribucion central no es solo la simulacion, sino una disciplina documental donde cada claim debe poder enlazarse con codigo, tests, logs o artefactos observables.</p>
  </div>
</section>`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Visual</title>
  <style>
    :root {
      --bg: #eef2f7;
      --paper: #ffffff;
      --ink: #162033;
      --ink-soft: #4a5874;
      --muted: #73809a;
      --line: #d9e1ee;
      --line-strong: #b9c7de;
      --brand: #315efb;
      --brand-2: #7c3aed;
      --brand-soft: #edf2ff;
      --code-bg: #0f172a;
      --code-fg: #e5eefc;
      --success: #0f766e;
      --shadow: 0 20px 60px rgba(25, 40, 72, 0.16);
      --font-sans: "Segoe UI", Inter, Arial, sans-serif;
      --font-serif: "Georgia", "Times New Roman", serif;
      --font-mono: "Cascadia Code", Consolas, monospace;
    }

    @page {
      size: A4;
      margin: 12mm 12mm 16mm 12mm;
    }

    @media print {
      body {
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .sheet {
        margin: 0;
        box-shadow: none;
      }
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      background: radial-gradient(circle at top, #f8faff 0%, var(--bg) 55%, #e8edf6 100%);
      color: var(--ink);
      font-family: var(--font-serif);
    }

    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      background: var(--paper);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .cover {
      position: relative;
      padding: 28mm 20mm 22mm;
      background:
        radial-gradient(circle at top right, rgba(124, 58, 237, 0.18), transparent 30%),
        radial-gradient(circle at top left, rgba(49, 94, 251, 0.16), transparent 28%),
        linear-gradient(135deg, #101827 0%, #14213d 42%, #1e3a8a 100%);
      color: #f8fbff;
    }

    .cover::after {
      content: "";
      position: absolute;
      inset: auto 0 0 0;
      height: 8px;
      background: linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa);
      opacity: 0.95;
    }

    .eyebrow {
      font-family: var(--font-sans);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 10px;
      font-weight: 700;
      color: rgba(255,255,255,0.78);
      margin-bottom: 16px;
    }

    .cover h1 {
      margin: 0 0 18px;
      font-family: var(--font-serif);
      font-size: 30px;
      line-height: 1.16;
      letter-spacing: -0.03em;
      max-width: 88%;
    }

    .subtitle {
      max-width: 78%;
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.6;
      color: rgba(255,255,255,0.86);
      margin-bottom: 24px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      max-width: 88%;
    }

    .meta-card {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
      padding: 12px 14px;
      backdrop-filter: blur(6px);
    }

    .meta-card span {
      display: block;
      font-family: var(--font-sans);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(255,255,255,0.66);
      margin-bottom: 6px;
    }

    .meta-card strong {
      display: block;
      font-family: var(--font-sans);
      font-size: 12px;
      line-height: 1.45;
      color: #fff;
      font-weight: 700;
    }

    .content {
      padding: 18mm 18mm 18mm;
    }

    .intro-band {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 18px;
      margin: -8mm 0 18px;
      align-items: start;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 8px;
    }

    .summary-card,
    .toc-card {
      border: 1px solid var(--line);
      border-radius: 18px;
      background: linear-gradient(180deg, #fff, #fbfcff);
      padding: 16px 18px;
      box-shadow: 0 8px 24px rgba(49, 94, 251, 0.06);
    }

    .summary-card.accent {
      background: linear-gradient(180deg, #f7f5ff, #ffffff);
      border-color: #ddd6fe;
    }

    .kicker {
      display: inline-block;
      margin-bottom: 8px;
      font-family: var(--font-sans);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--brand);
      font-weight: 700;
    }

    .summary-card h3,
    .toc-card h3 {
      margin: 0 0 8px;
      font-family: var(--font-sans);
      font-size: 17px;
      line-height: 1.3;
      color: var(--ink);
    }

    .summary-card p,
    .toc-card p {
      margin: 0;
    }

    .toc-card {
      position: relative;
    }

    .toc-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }

    .toc-item {
      text-decoration: none;
      color: var(--ink-soft);
      font-family: var(--font-sans);
      font-size: 12px;
      line-height: 1.45;
    }

    .toc-item.level-2 {
      font-weight: 700;
      color: var(--ink);
    }

    .toc-item.level-3 {
      padding-left: 12px;
    }

    h1, h2, h3, h4 {
      break-after: avoid-page;
    }

    h1 {
      margin: 34px 0 14px;
      padding-bottom: 8px;
      border-bottom: 2px solid #dbe7ff;
      font-family: var(--font-sans);
      font-size: 25px;
      line-height: 1.2;
      color: var(--ink);
      letter-spacing: -0.03em;
    }

    h2 {
      margin: 24px 0 10px;
      font-family: var(--font-sans);
      font-size: 18px;
      line-height: 1.25;
      color: var(--brand);
      letter-spacing: -0.02em;
    }

    h3 {
      margin: 18px 0 8px;
      font-family: var(--font-sans);
      font-size: 15px;
      color: var(--ink);
    }

    h4 {
      margin: 12px 0 6px;
      font-family: var(--font-sans);
      font-size: 13px;
      color: var(--ink-soft);
    }

    p, li {
      font-size: 12.4px;
      line-height: 1.72;
      color: var(--ink);
    }

    p {
      margin: 0 0 11px;
      text-align: justify;
      hyphens: auto;
    }

    ul, ol {
      margin: 8px 0 14px 20px;
      padding: 0;
    }

    li {
      margin: 0 0 5px;
    }

    hr {
      border: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--line-strong), transparent);
      margin: 28px 0;
    }

    .table-wrap {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 16px;
      margin: 14px 0 18px;
      box-shadow: 0 6px 18px rgba(22, 32, 51, 0.05);
      break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-sans);
      font-size: 11px;
    }

    th {
      background: linear-gradient(90deg, #eff4ff, #f6f1ff);
      color: #24324f;
      text-align: left;
      font-weight: 800;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
    }

    td {
      padding: 9px 12px;
      border-top: 1px solid var(--line);
      color: var(--ink-soft);
      vertical-align: top;
    }

    tbody tr:nth-child(even) td {
      background: #fcfdff;
    }

    code {
      font-family: var(--font-mono);
      font-size: 10.5px;
      background: var(--brand-soft);
      color: #2743b5;
      border-radius: 6px;
      padding: 2px 6px;
    }

    pre {
      margin: 12px 0 16px;
      padding: 14px 16px;
      border-radius: 16px;
      background: linear-gradient(180deg, #101827, #0f172a);
      color: var(--code-fg);
      overflow-x: auto;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
      break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: 10.5px;
      line-height: 1.62;
    }

    blockquote {
      margin: 16px 0;
      padding: 14px 16px;
      border-left: 4px solid var(--brand);
      background: linear-gradient(180deg, #f7faff, #f3f6fd);
      border-radius: 0 14px 14px 0;
      color: var(--ink-soft);
      break-inside: avoid;
    }

    blockquote p {
      margin-bottom: 6px;
      font-style: italic;
    }

    a {
      color: var(--brand);
      text-decoration: none;
    }

    .footer-note {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
      font-family: var(--font-sans);
      font-size: 10.5px;
      color: var(--muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <section class="cover">
      <div class="eyebrow">Artificial World · 2026 · Documento visual</div>
      <h1>${formatInline(title)}</h1>
      <p class="subtitle">Preprint tecnico orientado a presentacion seria y legible: arquitectura verificable, baseline experimental reproducible y una frontera explicita entre sistema real, demo funcional y roadmap.</p>
      <div class="cover-meta-grid">${metaHtml}</div>
    </section>

    <main class="content">
      <section class="intro-band">
        <div>${summaryHtml}</div>
        <aside class="toc-card">
          <span class="kicker">Mapa del documento</span>
          <h3>Indice rapido</h3>
          <div class="toc-items">${tocHtml}</div>
        </aside>
      </section>

      ${bodyHtml}

      <div class="footer-note">
        Artificial World · Cosigein SL · PDF visual generado desde <code>docs/PAPER_FINAL.md</code>
      </div>
    </main>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`HTML visual generado: ${htmlPath}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '10mm', right: '10mm', bottom: '14mm', left: '10mm' },
  headerTemplate:
    '<div style="width:100%;font-size:7px;color:#64748b;padding:0 10mm;text-align:right;font-family:Segoe UI,Arial,sans-serif;">Artificial World · Preprint tecnico visual</div>',
  footerTemplate:
    '<div style="width:100%;font-size:7px;color:#64748b;padding:0 10mm;text-align:center;font-family:Segoe UI,Arial,sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();

console.log(`PDF visual generado: ${pdfPath}`);
