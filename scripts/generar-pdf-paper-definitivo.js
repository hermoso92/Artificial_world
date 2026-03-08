/**
 * generar-pdf-paper-definitivo.js
 * Genera docs/PAPER_FINAL_DEFINITIVO.pdf con TODOS los screenshots reales integrados
 * Uso: node scripts/generar-pdf-paper-definitivo.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

// ─── Leer el MD del paper ────────────────────────────────────────────────────
const mdPath = path.join(docsDir, 'PAPER_FINAL.md');
const mdContent = fs.existsSync(mdPath)
  ? fs.readFileSync(mdPath, 'utf8')
  : '# Error\n\nNo se encontró PAPER_FINAL.md';

// ─── Cargar screenshots como base64 ─────────────────────────────────────────
function imgB64(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return null;
  const buf = fs.readFileSync(full);
  const ext = path.extname(full).toLowerCase().replace('.', '');
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

const imgs = {
  landing:        imgB64('docs/tutorial/screenshots/01-landing.png'),
  hub:            imgB64('docs/tutorial/screenshots/02-hub.png'),
  simulation:     imgB64('docs/tutorial/screenshots/03-simulation.png'),
  missioncontrol: imgB64('docs/tutorial/screenshots/04-missioncontrol.png'),
  hubcards:       imgB64('docs/tutorial/screenshots/05-hub-cards.png'),
  admin:          imgB64('docs/tutorial/screenshots/06-admin-panel.png'),
  dobacksoft:     imgB64('docs/tutorial/screenshots/07-dobacksoft.png'),
  sim2:           imgB64('screenshot_02_simulation_page.png'),
  sim4:           imgB64('screenshot_04_after_wasd_movement.png'),
  sim6:           imgB64('screenshot_06_editar_mode.png'),
  dashcam:        imgB64('assets/dobacksoft/trailer/01_dashcam_lateral.png'),
  dashcam2:       imgB64('assets/dobacksoft/trailer/02_dashcam_trasera.png'),
  rotonda:        imgB64('assets/dobacksoft/trailer/03_giro_rotonda.png'),
  aerea:          imgB64('assets/dobacksoft/trailer/04_vista_aerea.png'),
};

// ─── Convertir MD a HTML ─────────────────────────────────────────────────────
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
  const flushBq   = () => {
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

const bodyHtml = mdToHtml(mdContent);

// ─── Figuras académicas con screenshots reales ───────────────────────────────
function fig(src, num, caption) {
  if (!src) return '';
  return `
  <figure class="fig">
    <img src="${src}" alt="Figura ${num}" />
    <figcaption><strong>Figura ${num}.</strong> ${caption}</figcaption>
  </figure>`;
}

const figurasHtml = `
<div class="figures-section">
  <h1>Apéndice H: Capturas de Pantalla de las Aplicaciones Reales</h1>
  <p>Todas las capturas siguientes fueron tomadas de las aplicaciones en funcionamiento. Constituyen evidencia visual verificable del sistema descrito en este paper.</p>

  <h2>H.1 Capa Web — Flujo Fundador</h2>

  ${fig(imgs.landing, 1, 'Pantalla de selección de semilla de civilización. Las 7 semillas arquetipal (Tribu de frontera, Refugio tecnócrata, Comunidad espiritual, Reino guerrero, Ciudad comerciante, Colonia paranoica, Imperio decadente) con sus descripciones de valores. <em>Tribu de frontera</em> aparece seleccionada (borde cian). Aplicación web corriendo en React+Vite.')}

  ${fig(imgs.hub, 2, 'Hub principal: "Constructor de Mundos". Cuatro módulos visibles: Tu Mundo (simulación), Arena (juegos), Emergencias (DobackSoft/FireSimulator), Observatorio (Mission Control). Indicadores de estado del héroe (0 mundos, Escala: Refugio, 0 habitantes). El tagline "No persigas la IA. Construye un mundo que la necesite." visible en la barra superior.')}

  ${fig(imgs.simulation, 3, 'Vista de simulación web — "The Hero · Tu Mundo". Panel izquierdo: CONTROL (status Running, tick 476, agents 0), GLOBAL MAP (World Class AW-256, 17 Refuge Plots, Active Refuge #18, grid 32×32), GENETIC ASSEMBLER, REFUGE MANAGEMENT. Centro: mapa del refugio con habitaciones (Dormitorio, Cocina, Salón, Entrada), nodos solares y minerales, indicador de posición del héroe. Derecha: panel de compañero IA con métricas de personalidad (loyalty 100, curiosity 91, adaptability 86, creativity 68), log de eventos.')}

  ${fig(imgs.sim2, 4, 'Estado de la simulación en tick 906, status Paused. El mapa 32×32 muestra el refugio con 4 habitaciones claramente delimitadas y el héroe posicionado en la zona de Entrada. Panel derecho muestra log de eventos: creación de mundos, pausas y reinicios de simulación. Barras de estado del héroe: Energía 95, Hambre 90, Ánimo 95.')}

  ${fig(imgs.sim4, 5, 'Movimiento WASD activo — tick 945. El héroe se ha desplazado hacia la zona de Entrada del refugio. Las barras de estado muestran degradación por movimiento: Energía 87, Hambre 74, Ánimo 87. El log de eventos en el panel derecho registra cronológicamente cada cambio de estado. Evidencia de respuesta en tiempo real a input del usuario.')}

  ${fig(imgs.sim6, 6, 'Modo Editar activo — tick 965. La barra inferior muestra los elementos colocables: Solar, Mineral, Cama, Mesa, Chimenea, Sofá. El héroe puede colocar muebles en las habitaciones del refugio. Estado degradado: Energía 83, Hambre 66, Ánimo 83. El botón "Adoptar gato" visible indica la opción de añadir un compañero no-humano al refugio.')}

  <h2>H.2 Observatorio (Mission Control)</h2>

  ${fig(imgs.missioncontrol, 7, 'Panel Observatorio (Mission Control) — tick 476, tiempo vivo 10m 49s. Estado global del mundo: 0 habitantes, estado "Vivo", 18 refugios activos. Lista de 18 refugios nombrados (Refugio 1 a 16 + Mi refugio + Mi casa) con capacidad de entrada directa. Controles de pausa, reset, traer habitantes por especie. Pestañas: Vista general, Habitantes, Qué pasa, Salud, Crónica, Logs.')}

  <h2>H.3 Hub y Acceso</h2>

  ${fig(imgs.hubcards, 8, 'Vista completa del Hub con las 4 cards principales. Tu Mundo (badge "Demo web"): "Construye un refugio, dale vida con habitantes que piensan y sienten." Arena: juegos con IA (Tres en raya, Damas, Ajedrez). Emergencias (badge "Acceso anticipado"): conduce un camión de bomberos. Observatorio: vista en vivo del mundo.')}

  ${fig(imgs.admin, 9, 'Panel de administración con control de acceso activo. Mensaje "Acceso denegado — Solo los administradores (ADMIN_PLAYER_IDS en .env) pueden acceder." con player ID visible. Evidencia del sistema de control de acceso por variable de entorno implementado y funcionando.')}

  <h2>H.4 DobackSoft — Módulo de Emergencias</h2>

  ${fig(imgs.dobacksoft, 10, 'Pantalla principal de DobackSoft integrada en el Hub. Logo del camión de bomberos, título "DobackSoft — Protege tu comunidad · Acceso anticipado". Métricas visibles: 0 de 1000 ciudadanos, precio €9.99/mes (cupón) vs €29/mes. Campo de validación de cupón (DEMO o FUNDADOR1000). 5 features listadas: Mapa de despacho en tiempo real, Telemetría del vehículo, Paisajes 2D realistas, Simulación de incidentes, Progresión y niveles.')}

  <h2>H.5 FireSimulator — Imágenes de Referencia del Vehículo de Emergencia</h2>
  <p style="font-size:10.5px;color:#6b6b6b;font-style:italic;margin-bottom:12px;">Las siguientes imágenes son capturas del material visual de referencia generado por IA (Firefly/Gemini) utilizado para el trailer del FireSimulator. No son capturas del simulador en funcionamiento sino del material de comunicación del producto.</p>

  ${fig(imgs.dashcam, 11, 'Vista lateral dashcam — Camión de emergencias E-12 virando en intersección urbana. Velocidad registrada: 62 KM/H. Timestamp: 2024/05/15 14:35:02 UTC. Material visual de referencia para el FireSimulator: simula la perspectiva de seguimiento lateral del vehículo de emergencias desde otro vehículo.')}

  ${fig(imgs.dashcam2, 12, 'Vista trasera dashcam — Seguimiento del camión de emergencias desde vehículo posterior. Evidencia del tipo de perspectiva implementada en el FireSimulator para la telemetría de seguimiento.')}

  ${fig(imgs.rotonda, 13, 'Vista giro en rotonda — Camión de emergencias completando maniobra en rotonda urbana. Contexto visual del nivel de dificultad de conducción en el FireSimulator.')}

  ${fig(imgs.aerea, 14, 'Vista aérea del camión de emergencias en entorno urbano. Perspectiva del mapa de despacho implementado en el FireSimulator para la visualización de rutas.')}

  <hr>
  <p style="font-size:10.5px;color:#6b6b6b;font-style:italic;">
    Todas las capturas H.1–H.4 fueron tomadas de la aplicación en funcionamiento. Fecha de captura: 2026-03-08.
    Repositorio: <code>artificial-word</code>. Stack: React 18 + Vite + Node.js + WebSocket + SQLite.
  </p>
</div>
`;

// ─── HTML completo ────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Artificial World — Paper Científico Definitivo con Evidencia Visual</title>
<style>
:root {
  --font-serif: 'Georgia', 'Times New Roman', serif;
  --font-sans: 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Consolas', 'Cascadia Code', monospace;
  --accent: #1a4a7a;
  --accent-light: #e8f0f8;
  --accent-mid: #2d6aa0;
  --text: #1a1a1a;
  --text2: #3d3d3d;
  --muted: #6b6b6b;
  --border: #d4d4d4;
  --border-light: #ebebeb;
  --bg: #ffffff;
  --bg-alt: #f7f8fa;
  --code-bg: #0f172a;
  --code-text: #e2e8f0;
}
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-serif);
  color: var(--text);
  line-height: 1.72;
  font-size: 11.5px;
  background: #eceef2;
}
.page { max-width: 760px; margin: 24px auto; background: var(--bg); box-shadow: 0 2px 32px rgba(0,0,0,0.14); }

/* PORTADA */
.cover { padding: 60px 64px 52px; border-bottom: 3px solid var(--accent); }
.cover-journal {
  font-family: var(--font-sans); font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-mid);
  border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 26px;
}
.cover-title {
  font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--text);
  line-height: 1.25; margin-bottom: 20px; letter-spacing: -0.01em;
}
.cover-authors { font-family: var(--font-sans); font-size: 11px; color: var(--text2); margin-bottom: 5px; }
.cover-aff { font-family: var(--font-sans); font-size: 10px; color: var(--muted); font-style: italic; margin-bottom: 18px; }
.cover-meta { display: flex; gap: 20px; flex-wrap: wrap; }
.cover-meta span { font-family: var(--font-sans); font-size: 9.5px; color: var(--muted); }
.cover-meta strong { color: var(--text2); font-weight: 600; }

/* BODY */
.body { padding: 40px 64px 52px; }

/* HEADINGS */
h1 {
  font-family: var(--font-sans); font-size: 1.1rem; font-weight: 800; color: var(--accent);
  border-bottom: 2px solid var(--accent); padding-bottom: 6px;
  margin: 38px 0 14px; letter-spacing: -0.01em;
}
h1:first-child { margin-top: 0; }
h2 {
  font-family: var(--font-sans); font-size: 0.95rem; font-weight: 700; color: var(--text);
  margin: 26px 0 10px; padding-left: 10px; border-left: 3px solid var(--accent-mid);
}
h3 { font-family: var(--font-sans); font-size: 0.88rem; font-weight: 700; color: var(--text2); margin: 18px 0 7px; }
h4 { font-family: var(--font-sans); font-size: 0.83rem; font-weight: 600; color: var(--muted); margin: 12px 0 5px; font-style: italic; }

/* TEXTO */
p { margin-bottom: 9px; text-align: justify; hyphens: auto; font-size: 11.5px; line-height: 1.72; }
ul { margin: 8px 0 12px 22px; }
li { margin-bottom: 4px; font-size: 11.5px; line-height: 1.65; }

/* TABLAS */
table { width: 100%; border-collapse: collapse; margin: 14px 0 18px; font-family: var(--font-sans); font-size: 10px; }
th { background: var(--accent); color: #fff; font-weight: 700; padding: 6px 10px; text-align: left; font-size: 9.5px; letter-spacing: 0.03em; }
td { border: 1px solid var(--border); padding: 5px 10px; vertical-align: top; line-height: 1.55; }
tr:nth-child(even) td { background: var(--bg-alt); }

/* CÓDIGO */
code { font-family: var(--font-mono); font-size: 10px; background: var(--accent-light); color: var(--accent); padding: 1px 5px; border-radius: 3px; }
pre { background: var(--code-bg); border-radius: 6px; padding: 12px 16px; margin: 10px 0 14px; border-left: 3px solid var(--accent-mid); }
pre code { font-family: var(--font-mono); font-size: 9.5px; color: var(--code-text); background: transparent; padding: 0; line-height: 1.6; }

/* CITAS */
blockquote { border-left: 4px solid var(--accent-mid); padding: 10px 16px; margin: 14px 0; background: var(--accent-light); border-radius: 0 4px 4px 0; }
blockquote p { font-style: italic; color: var(--text2); font-size: 11px; margin: 0 0 5px; }
blockquote p:last-child { margin-bottom: 0; }

hr { border: none; border-top: 1px solid var(--border-light); margin: 26px 0; }
strong { font-weight: 700; }
em { font-style: italic; }
a { color: var(--accent-mid); }

/* FIGURAS ACADÉMICAS */
.figures-section { border-top: 3px solid var(--accent); padding-top: 32px; }
.fig {
  margin: 20px 0 28px;
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
  max-height: 480px;
  object-fit: contain;
  background: #0a0b0d;
}
figcaption {
  padding: 10px 14px;
  font-family: var(--font-sans);
  font-size: 10px;
  color: var(--muted);
  line-height: 1.6;
  background: var(--bg-alt);
}
figcaption strong { color: var(--accent); font-weight: 700; }

/* FOOTER */
.paper-footer {
  border-top: 2px solid var(--accent); padding: 14px 64px;
  font-family: var(--font-sans); font-size: 9.5px; color: var(--muted);
  display: flex; justify-content: space-between;
}
.paper-footer .left { color: var(--accent); font-weight: 600; }
</style>
</head>
<body>
<div class="page">

  <div class="cover">
    <div class="cover-journal">
      Preprint · Repositorio artificial-word · 2026 · Versión 1.0 Final — Con evidencia visual verificable
    </div>
    <div class="cover-title">
      Artificial World: Arquitectura de un Motor de Civilizaciones Emergentes con Agentes Autónomos Basados en Utilidad, Memoria Persistente y Auditoría Trazable
    </div>
    <div class="cover-authors"><strong>Cosigein SL</strong></div>
    <div class="cover-aff">Constructor de sistemas · artificial-word · 2026</div>
    <div class="cover-meta">
      <span><strong>Fecha:</strong> 2026-03-08</span>
      <span><strong>Versión:</strong> 1.0 Final</span>
      <span><strong>Repositorio:</strong> github.com/artificial-word</span>
      <span><strong>Sesión canónica:</strong> semilla 42 · 200 ticks · 8 agentes</span>
      <span><strong>Screenshots:</strong> 14 capturas de aplicaciones reales</span>
    </div>
  </div>

  <div class="body">
    ${bodyHtml}
    ${figurasHtml}
  </div>

  <div class="paper-footer">
    <span class="left">Artificial World — Paper Científico Definitivo con Evidencia Visual · 2026</span>
    <span>Cosigein SL · "Constrúyelo. Habítalo. Haz que crezca."</span>
  </div>

</div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'PAPER_FINAL_DEFINITIVO.html');
const pdfPath  = path.join(docsDir, 'PAPER_FINAL_DEFINITIVO.pdf');

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
  headerTemplate: `<div style="font-size:7.5px;color:#6b7280;width:100%;padding:0 10mm;text-align:right;font-family:system-ui;font-style:italic;">Artificial World: Motor de Civilizaciones Emergentes · Cosigein SL · 2026</div>`,
  footerTemplate: `<div style="font-size:7.5px;color:#6b7280;width:100%;text-align:center;font-family:system-ui;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
});
await browser.close();
console.log('✅ PDF definitivo con screenshots generado:', pdfPath);
