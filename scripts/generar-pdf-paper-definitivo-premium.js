import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const sourceMdPath = path.join(docsDir, 'PAPER_FINAL.md');
const outputHtmlPath = path.join(docsDir, 'PAPER_FINAL_DEFINITIVO_PREMIUM.html');
const outputPdfPath = path.join(docsDir, 'PAPER_FINAL_DEFINITIVO_PREMIUM.pdf');

const sourceMarkdown = fs.existsSync(sourceMdPath)
  ? fs.readFileSync(sourceMdPath, 'utf8')
  : '# Error\n\nNo se encontro `docs/PAPER_FINAL.md`.';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormat(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractSection(markdown, headingText) {
  const escaped = headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`## ${escaped}\\n([\\s\\S]*?)(?:\\n## |$)`, 'm');
  const match = markdown.match(regex);
  return match ? match[1].trim() : '';
}

function extractParagraphs(sectionContent) {
  return sectionContent
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith('**Palabras clave:**') && !part.startsWith('- ') && !part.match(/^\d+\./));
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const toc = [];
  const headings = [];
  let documentTitle = 'Artificial World';
  let titleConsumed = false;

  let inCode = false;
  let codeLines = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableRows = [];
  let inBlockquote = false;
  let blockquoteLines = [];

  const flushUl = () => {
    if (!inUl) return;
    html.push('</ul>');
    inUl = false;
  };

  const flushOl = () => {
    if (!inOl) return;
    html.push('</ol>');
    inOl = false;
  };

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    const head = tableRows[0];
    const body = tableRows.slice(1).join('');
    html.push(`<div class="table-shell"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`);
    inTable = false;
    tableRows = [];
  };

  const flushBlockquote = () => {
    if (!inBlockquote || blockquoteLines.length === 0) return;
    html.push(`<blockquote>${blockquoteLines.map((line) => `<p>${inlineFormat(line)}</p>`).join('')}</blockquote>`);
    inBlockquote = false;
    blockquoteLines = [];
  };

  const flushAll = () => {
    flushUl();
    flushOl();
    flushTable();
    flushBlockquote();
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushAll();
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
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
      flushAll();
      const text = line.slice(2).trim();
      if (!titleConsumed) {
        documentTitle = text;
        titleConsumed = true;
      } else {
        const id = slugify(text);
        toc.push({ level: 1, text, id });
        headings.push({ level: 1, text, id });
        html.push(`<h1 id="${id}">${inlineFormat(text)}</h1>`);
      }
      continue;
    }

    if (line.startsWith('## ')) {
      flushAll();
      const text = line.slice(3).trim();
      const id = slugify(text);
      toc.push({ level: 2, text, id });
      headings.push({ level: 2, text, id });
      html.push(`<h2 id="${id}">${inlineFormat(text)}</h2>`);
      continue;
    }

    if (line.startsWith('### ')) {
      flushAll();
      const text = line.slice(4).trim();
      const id = slugify(text);
      toc.push({ level: 3, text, id });
      headings.push({ level: 3, text, id });
      html.push(`<h3 id="${id}">${inlineFormat(text)}</h3>`);
      continue;
    }

    if (line.startsWith('#### ')) {
      flushAll();
      const text = line.slice(5).trim();
      const id = slugify(text);
      toc.push({ level: 4, text, id });
      headings.push({ level: 4, text, id });
      html.push(`<h4 id="${id}">${inlineFormat(text)}</h4>`);
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
      if (cells.every((cell) => /^[-:\s]+$/.test(cell))) continue;
      const tag = tableRows.length === 0 ? 'th' : 'td';
      tableRows.push(`<tr>${cells.map((cell) => `<${tag}>${inlineFormat(cell)}</${tag}>`).join('')}</tr>`);
      continue;
    }

    const unorderedMatch = line.match(/^[-*] (.+)$/);
    if (unorderedMatch) {
      flushOl();
      flushTable();
      flushBlockquote();
      if (!inUl) {
        html.push('<ul>');
        inUl = true;
      }
      html.push(`<li>${inlineFormat(unorderedMatch[1])}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\. (.+)$/);
    if (orderedMatch) {
      flushUl();
      flushTable();
      flushBlockquote();
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li>${inlineFormat(orderedMatch[1])}</li>`);
      continue;
    }

    if (line.startsWith('---')) {
      flushAll();
      html.push('<hr>');
      continue;
    }

    if (line.trim() === '') {
      flushAll();
      continue;
    }

    flushAll();
    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  flushAll();

  return {
    documentTitle,
    toc,
    headings,
    bodyHtml: html.join('\n'),
  };
}

const { documentTitle, toc, headings, bodyHtml } = parseMarkdown(sourceMarkdown);
const abstractSection = extractSection(sourceMarkdown, 'Abstract');
const abstractParagraphs = extractParagraphs(abstractSection);
const abstractLead = abstractParagraphs[0] || 'Artificial World presenta una arquitectura multiagente trazable, reproducible y defendible.';
const abstractSupport = abstractParagraphs[1] || 'La baseline experimental se presenta como linea base verificable para futuras comparaciones controladas.';
const keywordsMatch = sourceMarkdown.match(/\*\*Palabras clave:\*\*\s*(.+)/);
const keywords = keywordsMatch ? keywordsMatch[1] : 'vida artificial, simulacion 2D, trazabilidad, reproducibilidad';

const coverBadges = [
  'Documento definitivo',
  'Preprint tecnico premium',
  'Baseline reproducible',
  'Arquitectura verificable',
];

const coverBadgesHtml = coverBadges
  .map((item) => `<span class="cover-badge">${inlineFormat(item)}</span>`)
  .join('');

const tocHtml = toc
  .filter((item) => item.level <= 3)
  .map((item) => `<a class="toc-item level-${item.level}" href="#${item.id}">${inlineFormat(item.text)}</a>`)
  .join('');

const sectionCards = [
  {
    title: 'Tesis central',
    text: 'El valor del sistema no esta solo en lo que simula, sino en que obliga a que cada claim pueda rastrearse hasta evidencia verificable.',
  },
  {
    title: 'Base experimental',
    text: 'La sesion canonica es una baseline reproducible, no una validacion estadistica cerrada. Su fuerza esta en que puede repetirse y contrastarse.',
  },
  {
    title: 'Posicionamiento correcto',
    text: 'Este documento debe leerse como pieza fundacional de alto nivel: ambiciosa, tecnica y defendible, sin vender mas evidencia de la que hoy existe.',
  },
];

const sectionCardsHtml = sectionCards
  .map(
    (card) => `
      <div class="insight-card">
        <span class="insight-kicker">${card.title}</span>
        <p>${inlineFormat(card.text)}</p>
      </div>
    `,
  )
  .join('');

const sectionListHtml = headings
  .filter((item) => item.level === 2)
  .map((item, index) => `<div class="section-line"><span>${String(index + 1).padStart(2, '0')}</span><strong>${inlineFormat(item.text)}</strong></div>`)
  .join('');

const topMetrics = [
  ['Motor base', 'Python + SQLite'],
  ['Sesion canonica', 'Seed 42'],
  ['Agentes', '8'],
  ['Ticks', '200'],
  ['Marco', 'Preprint tecnico'],
];

const topMetricsHtml = topMetrics
  .map(
    ([label, value]) => `
      <div class="metric-pill">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `,
  )
  .join('');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(documentTitle)} — Documento Definitivo Premium</title>
  <style>
    :root {
      --bg: #edf2f8;
      --paper: #ffffff;
      --ink: #162034;
      --ink-soft: #475571;
      --muted: #77839a;
      --line: #dde5f2;
      --line-strong: #c3d0e4;
      --brand: #254edb;
      --brand-deep: #0f1b3d;
      --brand-soft: #eef3ff;
      --violet: #6d28d9;
      --violet-soft: #f4efff;
      --gold: #b8891d;
      --code-bg: #0d152b;
      --code-fg: #e6eefc;
      --font-sans: "Segoe UI", Inter, Arial, sans-serif;
      --font-serif: "Iowan Old Style", "Georgia", "Times New Roman", serif;
      --font-mono: "Cascadia Code", Consolas, monospace;
      --shadow: 0 24px 80px rgba(17, 29, 58, 0.18);
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

      .page {
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
      background:
        radial-gradient(circle at top left, #ffffff 0%, #f7f9fd 18%, var(--bg) 52%, #e8eef7 100%);
      color: var(--ink);
      font-family: var(--font-serif);
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      background: var(--paper);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .cover {
      position: relative;
      overflow: hidden;
      padding: 26mm 20mm 18mm;
      color: #ffffff;
      background:
        radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.35), transparent 28%),
        radial-gradient(circle at 100% 0%, rgba(96, 165, 250, 0.28), transparent 26%),
        linear-gradient(140deg, #071021 0%, #0f1b3d 38%, #193b92 74%, #2447c6 100%);
    }

    .cover-grid {
      display: grid;
      grid-template-columns: 1.35fr 0.65fr;
      gap: 20px;
      align-items: start;
    }

    .cover::before {
      content: "";
      position: absolute;
      width: 360px;
      height: 360px;
      right: -120px;
      top: -80px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.12);
      opacity: 0.8;
    }

    .cover::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 9px;
      background: linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.8), rgba(255,255,255,0.15));
    }

    .cover-topline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 26px;
      font-family: var(--font-sans);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: rgba(255,255,255,0.76);
    }

    .cover-brand {
      font-weight: 800;
    }

    .cover-status {
      font-weight: 700;
      color: rgba(255,255,255,0.62);
    }

    .cover-title {
      max-width: 100%;
      margin: 0 0 16px;
      padding: 0;
      border: 0;
      font-family: var(--font-serif);
      font-size: 38px;
      line-height: 1.08;
      letter-spacing: -0.035em;
      font-weight: 700;
      color: #ffffff;
      page-break-before: auto;
    }

    .cover-subtitle {
      max-width: 82%;
      margin: 0 0 20px;
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.65;
      color: rgba(255,255,255,0.86);
    }

    .cover-quote {
      max-width: 78%;
      margin: 0 0 22px;
      padding-left: 16px;
      border-left: 3px solid rgba(255,255,255,0.4);
      font-style: italic;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255,255,255,0.9);
    }

    .cover-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 22px;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      padding: 7px 11px;
      border-radius: 999px;
      font-family: var(--font-sans);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.08);
      color: #fff;
      backdrop-filter: blur(6px);
    }

    .cover-side {
      display: grid;
      gap: 12px;
      align-content: start;
      grid-auto-rows: min-content;
    }

    .cover-abstract,
    .cover-thesis {
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.08);
      padding: 13px 14px;
      backdrop-filter: blur(8px);
    }

    .cover-panel-kicker {
      display: inline-block;
      margin-bottom: 8px;
      font-family: var(--font-sans);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.7);
    }

    .cover-abstract p,
    .cover-thesis p {
      margin: 0;
      text-align: left;
      font-family: var(--font-sans);
      font-size: 11px;
      line-height: 1.58;
      color: rgba(255,255,255,0.9);
    }

    .cover-abstract p + p,
    .cover-thesis p + p {
      margin-top: 8px;
    }

    .cover-meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      max-width: 100%;
    }

    .cover-meta-box {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 16px;
      padding: 12px 14px;
      backdrop-filter: blur(6px);
    }

    .cover-meta-box span {
      display: block;
      margin-bottom: 5px;
      font-family: var(--font-sans);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.65);
    }

    .cover-meta-box strong {
      display: block;
      font-family: var(--font-sans);
      font-size: 12px;
      line-height: 1.45;
      color: #ffffff;
    }

    .metrics-strip {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
      padding: 0 16mm 0;
      transform: translateY(-14px);
    }

    .metric-pill {
      border-radius: 18px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, #ffffff, #f8fbff);
      box-shadow: 0 10px 26px rgba(37, 78, 219, 0.08);
      padding: 12px 12px 10px;
    }

    .metric-pill span {
      display: block;
      margin-bottom: 5px;
      font-family: var(--font-sans);
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
    }

    .metric-pill strong {
      display: block;
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.35;
      color: var(--brand-deep);
    }

    .prelude {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 16px;
      padding: 16mm 16mm 6mm;
    }

    .insight-panel,
    .toc-panel,
    .sections-panel {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: linear-gradient(180deg, #ffffff, #fbfcff);
      box-shadow: 0 10px 28px rgba(37, 78, 219, 0.06);
    }

    .insight-panel {
      padding: 16px;
    }

    .panel-kicker {
      display: inline-block;
      margin-bottom: 10px;
      font-family: var(--font-sans);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--brand);
    }

    .insight-panel h2,
    .toc-panel h2,
    .sections-panel h2 {
      margin: 0 0 10px;
      padding: 0;
      border: 0;
      font-family: var(--font-sans);
      font-size: 19px;
      line-height: 1.25;
      color: var(--ink);
    }

    .insight-grid {
      display: grid;
      gap: 12px;
    }

    .insight-card {
      padding: 14px 14px 12px;
      border-radius: 16px;
      background: linear-gradient(180deg, #f7faff, #ffffff);
      border: 1px solid var(--line);
    }

    .insight-kicker {
      display: block;
      margin-bottom: 7px;
      font-family: var(--font-sans);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--violet);
    }

    .insight-card p {
      margin: 0;
      text-align: left;
      color: var(--ink-soft);
    }

    .right-stack {
      display: grid;
      gap: 16px;
    }

    .toc-panel,
    .sections-panel {
      padding: 16px;
    }

    .toc-links {
      display: grid;
      gap: 6px;
      margin-top: 6px;
    }

    .toc-item {
      text-decoration: none;
      color: var(--ink-soft);
      font-family: var(--font-sans);
      font-size: 12px;
      line-height: 1.4;
    }

    .toc-item.level-2 {
      font-weight: 800;
      color: var(--ink);
    }

    .toc-item.level-3 {
      padding-left: 12px;
    }

    .section-line {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 10px;
      align-items: start;
      padding: 8px 0;
      border-top: 1px solid var(--line);
      font-family: var(--font-sans);
      font-size: 12px;
      color: var(--ink-soft);
    }

    .section-line:first-of-type {
      border-top: 0;
      padding-top: 0;
    }

    .section-line span {
      color: var(--gold);
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .section-line strong {
      color: var(--ink);
      font-weight: 700;
      line-height: 1.45;
    }

    .content {
      padding: 6mm 16mm 18mm;
    }

    .content h1, .content h2, .content h3, .content h4 {
      break-after: avoid-page;
    }

    .content h1 {
      margin: 34px 0 14px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--line-strong);
      font-family: var(--font-sans);
      font-size: 26px;
      line-height: 1.18;
      letter-spacing: -0.03em;
      color: var(--brand-deep);
      page-break-before: always;
      position: relative;
    }

    .content h1:first-child {
      page-break-before: auto;
      margin-top: 0;
    }

    .content h1::before {
      content: "";
      display: inline-block;
      width: 56px;
      height: 4px;
      margin-right: 12px;
      vertical-align: middle;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--brand), var(--violet));
      transform: translateY(-2px);
    }

    .content h2 {
      margin: 26px 0 10px;
      font-family: var(--font-sans);
      font-size: 19px;
      line-height: 1.25;
      color: var(--brand);
      letter-spacing: -0.02em;
      position: relative;
    }

    .content h2::before {
      content: "";
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 10px;
      border-radius: 50%;
      background: linear-gradient(180deg, var(--brand), var(--violet));
      transform: translateY(-1px);
    }

    .content h3 {
      margin: 18px 0 8px;
      font-family: var(--font-sans);
      font-size: 15px;
      color: var(--ink);
    }

    .content h4 {
      margin: 12px 0 6px;
      font-family: var(--font-sans);
      font-size: 13px;
      color: var(--ink-soft);
    }

    p, li {
      font-size: 12.5px;
      line-height: 1.74;
      color: var(--ink);
    }

    p {
      margin: 0 0 11px;
      text-align: justify;
      hyphens: auto;
    }

    .content h1 + p {
      font-size: 13.2px;
      line-height: 1.82;
      color: var(--ink-soft);
    }

    .content h2 + p {
      font-size: 12.8px;
      color: var(--ink-soft);
    }

    ul, ol {
      margin: 8px 0 14px 20px;
      padding: 0;
    }

    li {
      margin-bottom: 5px;
    }

    hr {
      border: 0;
      height: 1px;
      margin: 30px 0;
      background: linear-gradient(90deg, transparent, var(--line-strong), transparent);
    }

    .table-shell {
      overflow: hidden;
      margin: 14px 0 20px;
      border-radius: 18px;
      border: 1px solid var(--line);
      box-shadow: 0 10px 28px rgba(22, 32, 52, 0.05);
      break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-sans);
      font-size: 11px;
    }

    th {
      padding: 11px 12px;
      text-align: left;
      font-weight: 800;
      color: var(--brand-deep);
      background: linear-gradient(90deg, #eef4ff, #f7f2ff);
      border-bottom: 1px solid var(--line);
    }

    td {
      padding: 10px 12px;
      vertical-align: top;
      color: var(--ink-soft);
      border-top: 1px solid var(--line);
    }

    tbody tr:nth-child(even) td {
      background: #fcfdff;
    }

    code {
      padding: 2px 6px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--brand);
      background: var(--brand-soft);
    }

    pre {
      margin: 12px 0 18px;
      padding: 15px 16px;
      border-radius: 18px;
      background: linear-gradient(180deg, #0c1327, #101b35);
      color: var(--code-fg);
      overflow-x: auto;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
      break-inside: avoid;
    }

    pre code {
      padding: 0;
      background: transparent;
      color: inherit;
      font-size: 10.5px;
      line-height: 1.62;
    }

    blockquote {
      margin: 16px 0;
      padding: 14px 16px;
      border-left: 4px solid var(--violet);
      border-radius: 0 18px 18px 0;
      background: linear-gradient(180deg, #f9f6ff, #fdfcff);
      color: var(--ink-soft);
      break-inside: avoid;
      box-shadow: 0 8px 20px rgba(109, 40, 217, 0.06);
    }

    blockquote p {
      margin-bottom: 6px;
      font-style: italic;
      text-align: left;
    }

    a {
      color: var(--brand);
      text-decoration: none;
    }

    .closing-band {
      margin-top: 34px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
      font-family: var(--font-sans);
      font-size: 10.5px;
      color: var(--muted);
      text-align: center;
    }

    .keywords-ribbon {
      margin: 18px 0 26px;
      padding: 11px 14px;
      border-radius: 16px;
      background: linear-gradient(90deg, #eef4ff, #f8f4ff);
      border: 1px solid var(--line);
      font-family: var(--font-sans);
      font-size: 10.5px;
      line-height: 1.6;
      color: var(--ink-soft);
      break-inside: avoid;
    }

    .keywords-ribbon strong {
      color: var(--brand-deep);
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="cover">
      <div class="cover-grid">
        <div>
          <div class="cover-topline">
            <span class="cover-brand">Artificial World</span>
            <span class="cover-status">Documento definitivo premium · 2026</span>
          </div>

          <h1 class="cover-title">${inlineFormat(documentTitle)}</h1>
          <p class="cover-subtitle">Version editorial elevada del documento largo: misma ambicion conceptual, mejor jerarquia visual, maquetacion mas solemne y una presentacion a la altura de un texto fundacional serio.</p>
          <p class="cover-quote">“No persigas una apariencia de inteligencia. Construye un sistema que pueda rendir cuentas de lo que afirma.”</p>
          <div class="cover-badges">${coverBadgesHtml}</div>

          <div class="cover-meta">
            <div class="cover-meta-box">
              <span>Autor</span>
              <strong>Cosigein SL</strong>
            </div>
            <div class="cover-meta-box">
              <span>Base textual</span>
              <strong><code>docs/PAPER_FINAL.md</code></strong>
            </div>
            <div class="cover-meta-box">
              <span>Salida</span>
              <strong>Documento largo, no resumido</strong>
            </div>
          </div>
        </div>

        <div class="cover-side">
          <div class="cover-abstract">
            <span class="cover-panel-kicker">Abstract de portada</span>
            <p>${inlineFormat(abstractLead)}</p>
            <p>${inlineFormat(abstractSupport)}</p>
          </div>
          <div class="cover-thesis">
            <span class="cover-panel-kicker">Clave editorial</span>
            <p>El documento no intenta aparentar mas ciencia de la que hoy puede defender, pero si elevar al maximo la fuerza de su arquitectura, su trazabilidad y su propuesta metodologica.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="metrics-strip">
      ${topMetricsHtml}
    </section>

    <section class="prelude">
      <div class="insight-panel">
        <span class="panel-kicker">Lectura correcta</span>
        <h2>Documento definitivo con elevacion editorial</h2>
        <div class="insight-grid">${sectionCardsHtml}</div>
      </div>

      <div class="right-stack">
        <aside class="toc-panel">
          <span class="panel-kicker">Indice navegable</span>
          <h2>Mapa del documento</h2>
          <div class="toc-links">${tocHtml}</div>
        </aside>

        <aside class="sections-panel">
          <span class="panel-kicker">Bloques principales</span>
          <h2>Estructura larga</h2>
          ${sectionListHtml}
        </aside>
      </div>
    </section>

    <main class="content">
      <div class="keywords-ribbon">
        <strong>Palabras clave:</strong> ${inlineFormat(keywords)}
      </div>
      ${bodyHtml}
      <div class="closing-band">
        Artificial World · Documento definitivo premium generado desde <code>docs/PAPER_FINAL.md</code>
      </div>
    </main>
  </div>
</body>
</html>`;

fs.writeFileSync(outputHtmlPath, html, 'utf8');
console.log(`HTML premium generado: ${outputHtmlPath}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
await page.goto(`file://${outputHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.pdf({
  path: outputPdfPath,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '10mm', right: '10mm', bottom: '14mm', left: '10mm' },
  headerTemplate:
    '<div style="width:100%;font-size:7px;color:#6b7280;padding:0 10mm;text-align:right;font-family:Segoe UI,Arial,sans-serif;">Artificial World · Documento definitivo premium</div>',
  footerTemplate:
    '<div style="width:100%;font-size:7px;color:#6b7280;padding:0 10mm;text-align:center;font-family:Segoe UI,Arial,sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();

console.log(`PDF premium generado: ${outputPdfPath}`);
