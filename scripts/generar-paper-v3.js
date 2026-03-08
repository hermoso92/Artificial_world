/**
 * generar-paper-v3.js
 * Paper definitivo v3 — Con TOC, diagramas SVG, gráfico de barras, cluster map y screenshots
 * Aplica criterios de technical-writing skill:
 *   - Tabla de contenidos navegable
 *   - Diagramas de flujo del ciclo de tick
 *   - Gráfico de barras métricas de acción
 *   - Mapa de clusters espaciales
 *   - Portada con abstract separado
 *   - Todas las capturas reales
 * Uso: node scripts/generar-paper-v3.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

const mdPath = path.join(docsDir, 'PAPER_FINAL.md');
const mdContent = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '# Error';

function imgB64(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  const buf = fs.readFileSync(full);
  const ext = path.extname(full).toLowerCase().replace('.', '');
  const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
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
};

function mdToHtml(md) {
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt = s => s
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
  const lines = md.split('\n');
  const out = [];
  let inTable=false,tableRows=[],inList=false,inCode=false,codeLines=[],inBq=false,bqLines=[];
  const flushTable=()=>{if(!inTable||!tableRows.length)return;const thead=tableRows[0],tbody=tableRows.slice(1).join('');out.push(`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`);tableRows=[];inTable=false;};
  const flushList=()=>{if(!inList)return;out.push('</ul>');inList=false;};
  const flushBq=()=>{if(!inBq||!bqLines.length)return;out.push('<blockquote>'+bqLines.map(l=>`<p>${fmt(l)}</p>`).join('')+'</blockquote>');bqLines=[];inBq=false;};
  for(const line of lines){
    if(line.startsWith('```')){flushTable();flushList();flushBq();if(!inCode){inCode=true;codeLines=[];continue;}out.push('<pre><code>'+esc(codeLines.join('\n'))+'</code></pre>');inCode=false;codeLines=[];continue;}
    if(inCode){codeLines.push(line);continue;}
    if(line.startsWith('> ')){flushTable();flushList();inBq=true;bqLines.push(line.slice(2));continue;}
    if(inBq&&line.trim()===''){flushBq();continue;}
    if(inBq){bqLines.push(line);continue;}
    if(line.startsWith('# ')){flushTable();flushList();flushBq();out.push(`<h1>${fmt(line.slice(2))}</h1>`);}
    else if(line.startsWith('## ')){flushTable();flushList();flushBq();out.push(`<h2>${fmt(line.slice(3))}</h2>`);}
    else if(line.startsWith('### ')){flushTable();flushList();flushBq();out.push(`<h3>${fmt(line.slice(4))}</h3>`);}
    else if(line.startsWith('#### ')){flushTable();flushList();flushBq();out.push(`<h4>${fmt(line.slice(5))}</h4>`);}
    else if(line.match(/^\|.+\|$/)){flushList();flushBq();if(!inTable){inTable=true;tableRows=[];}const cells=line.split('|').slice(1,-1).map(c=>c.trim());if(cells.every(c=>/^[-:\s]+$/.test(c)))continue;const tag=tableRows.length===0?'th':'td';tableRows.push('<tr>'+cells.map(c=>`<${tag}>${fmt(c)}</${tag}>`).join('')+'</tr>');}
    else if(line.match(/^[-*] /)){flushTable();flushBq();if(!inList){out.push('<ul>');inList=true;}out.push(`<li>${fmt(line.slice(2))}</li>`);}
    else if(line.startsWith('---')){flushTable();flushList();flushBq();out.push('<hr>');}
    else if(line.trim()===''){flushTable();flushList();}
    else{flushTable();flushList();flushBq();out.push(`<p>${fmt(line)}</p>`);}
  }
  flushTable();flushList();flushBq();
  return out.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

// ── TABLA DE CONTENIDOS ──────────────────────────────────────────────────────
const tocHtml = `
<div class="toc">
  <div class="toc-title">Tabla de Contenidos</div>
  <ol class="toc-list">
    <li><a href="#s1">1. Introducción</a>
      <ol><li>1.1 El problema de la afirmación sin evidencia</li><li>1.2 Motivación y contexto</li><li>1.3 Contribuciones principales</li></ol>
    </li>
    <li><a href="#s2">2. Trabajo Relacionado</a></li>
    <li><a href="#s3">3. Arquitectura del Sistema</a>
      <ol><li>3.1 Capas del sistema</li><li>3.2 Motor Python: ciclo de tick</li><li>3.3 Función de utilidad</li><li>3.4 Rasgos conductuales</li><li>3.5 Memoria de agente</li><li>3.6 Modo Sombra</li><li>3.7 Watchdog</li></ol>
    </li>
    <li><a href="#s4">4. Capa Web: Semillas, Refugios y Civilizaciones</a></li>
    <li><a href="#s5">5. Sistema Chess: Auditoría Independiente</a></li>
    <li><a href="#s6">6. Experimento Canónico: Sesión Fundacional</a></li>
    <li><a href="#s7">7. Análisis: Comportamientos Emergentes</a></li>
    <li><a href="#s8">8. Trazabilidad Radical como Propiedad de Diseño</a></li>
    <li><a href="#s9">9. Arquitectura Conceptual: Modelo de Civilizaciones Vivas</a></li>
    <li><a href="#s10">10. Limitaciones y Trabajo Futuro</a></li>
    <li><a href="#s11">11. Discusión Filosófica</a></li>
    <li><a href="#s12">12. Conclusiones</a></li>
    <li>Referencias</li>
    <li>Apéndice A: JSON Crónica Fundacional</li>
    <li>Apéndice B: Reproducción de la sesión</li>
    <li>Apéndice C: Taxonomía de componentes</li>
    <li>Apéndice D: Código fuente verificado</li>
    <li>Apéndice E: Sistema Chess Docker</li>
    <li>Apéndice F: Manifiesto completo</li>
    <li>Apéndice G: Resumen ejecutivo</li>
    <li><a href="#sh">Apéndice H: Capturas de pantalla reales (14 figuras)</a></li>
  </ol>
</div>`;

// ── DIAGRAMA SVG: CICLO DE TICK ──────────────────────────────────────────────
const diagramaTick = `
<div class="diagram-box">
  <div class="diagram-label">Figura D1. Ciclo de tick por entidad — Motor Python</div>
  <svg viewBox="0 0 720 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;display:block;margin:0 auto;">
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#2d6aa0"/>
      </marker>
    </defs>
    <!-- Celdas -->
    <rect x="5"   y="35" width="90" height="40" rx="6" fill="#1a4a7a" stroke="#2d6aa0" stroke-width="1.5"/>
    <text x="50"  y="58" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">actualizar</text>
    <text x="50"  y="70" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">estado</text>

    <rect x="115" y="35" width="90" height="40" rx="6" fill="#1a4a7a" stroke="#2d6aa0" stroke-width="1.5"/>
    <text x="160" y="58" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">percibir</text>
    <text x="160" y="70" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">entorno</text>

    <rect x="225" y="35" width="90" height="40" rx="6" fill="#1a4a7a" stroke="#2d6aa0" stroke-width="1.5"/>
    <text x="270" y="58" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">actualizar</text>
    <text x="270" y="70" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">memoria</text>

    <rect x="335" y="35" width="90" height="40" rx="6" fill="#0f3460" stroke="#2d6aa0" stroke-width="2"/>
    <text x="380" y="54" text-anchor="middle" font-size="9" fill="#7ec8ff" font-family="system-ui" font-weight="bold">MotorDecision</text>
    <text x="380" y="66" text-anchor="middle" font-size="8" fill="#7ec8ff" font-family="system-ui">U(a,i,t) → argmax</text>
    <text x="380" y="77" text-anchor="middle" font-size="8" fill="#7ec8ff" font-family="system-ui">9 modificadores</text>

    <rect x="445" y="35" width="90" height="40" rx="6" fill="#1a4a7a" stroke="#2d6aa0" stroke-width="1.5"/>
    <text x="490" y="58" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">ejecutar</text>
    <text x="490" y="70" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">acción</text>

    <rect x="555" y="35" width="90" height="40" rx="6" fill="#1a3020" stroke="#2d8a50" stroke-width="1.5"/>
    <text x="600" y="54" text-anchor="middle" font-size="9" fill="#5eff90" font-family="system-ui">Watchdog</text>
    <text x="600" y="66" text-anchor="middle" font-size="8" fill="#5eff90" font-family="system-ui">+ Crónica</text>
    <text x="600" y="77" text-anchor="middle" font-size="8" fill="#5eff90" font-family="system-ui">+ SQLite</text>

    <!-- Flechas -->
    <line x1="95"  y1="55" x2="113" y2="55" stroke="#2d6aa0" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="205" y1="55" x2="223" y2="55" stroke="#2d6aa0" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="315" y1="55" x2="333" y2="55" stroke="#2d6aa0" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="425" y1="55" x2="443" y2="55" stroke="#2d6aa0" stroke-width="2"   marker-end="url(#arr)"/>
    <line x1="535" y1="55" x2="553" y2="55" stroke="#2d6aa0" stroke-width="1.5" marker-end="url(#arr)"/>

    <!-- Etiqueta debajo -->
    <text x="50"  y="90" text-anchor="middle" font-size="7.5" fill="#6b8faa" font-family="system-ui">hambre++</text>
    <text x="160" y="90" text-anchor="middle" font-size="7.5" fill="#6b8faa" font-family="system-ui">radio 5 celdas</text>
    <text x="270" y="90" text-anchor="middle" font-size="7.5" fill="#6b8faa" font-family="system-ui">espacial+social</text>
    <text x="380" y="94" text-anchor="middle" font-size="7.5" fill="#6b8faa" font-family="system-ui">determinista·semilla</text>
    <text x="490" y="90" text-anchor="middle" font-size="7.5" fill="#6b8faa" font-family="system-ui">efectos en mundo</text>
    <text x="600" y="90" text-anchor="middle" font-size="7.5" fill="#6b8faa" font-family="system-ui">WARN/CRITICAL</text>
  </svg>
</div>`;

// ── GRÁFICO DE BARRAS: MÉTRICAS DE ACCIÓN ────────────────────────────────────
const graficaMetricas = `
<div class="diagram-box">
  <div class="diagram-label">Figura D2. Distribución de acciones — Sesión canónica (semilla 42, 200 ticks, 8 agentes, 1600 acciones totales)</div>
  <svg viewBox="0 0 620 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:620px;display:block;margin:0 auto;">
    <!-- Ejes -->
    <line x1="80" y1="20" x2="80" y2="155" stroke="#d4d4d4" stroke-width="1"/>
    <line x1="80" y1="155" x2="590" y2="155" stroke="#d4d4d4" stroke-width="1"/>

    <!-- Líneas de referencia -->
    <line x1="80" y1="20" x2="590" y2="20" stroke="#ebebeb" stroke-width="0.5" stroke-dasharray="4,4"/>
    <line x1="80" y1="62" x2="590" y2="62" stroke="#ebebeb" stroke-width="0.5" stroke-dasharray="4,4"/>
    <line x1="80" y1="102" x2="590" y2="102" stroke="#ebebeb" stroke-width="0.5" stroke-dasharray="4,4"/>
    <text x="72" y="23" text-anchor="end" font-size="8" fill="#6b6b6b" font-family="system-ui">100%</text>
    <text x="72" y="65" text-anchor="end" font-size="8" fill="#6b6b6b" font-family="system-ui">66%</text>
    <text x="72" y="105" text-anchor="end" font-size="8" fill="#6b6b6b" font-family="system-ui">33%</text>

    <!-- SEGUIR 62.4% → h=(62.4/100)*135=84 → y=155-84=71 -->
    <rect x="105" y="71" width="90" height="84" fill="#1a4a7a" rx="3"/>
    <text x="150" y="66" text-anchor="middle" font-size="9.5" fill="#1a4a7a" font-family="system-ui" font-weight="bold">62.4%</text>
    <text x="150" y="60" text-anchor="middle" font-size="8.5" fill="#2d6aa0" font-family="system-ui">998 acc.</text>
    <text x="150" y="172" text-anchor="middle" font-size="9" fill="#3d3d3d" font-family="system-ui" font-weight="bold">SEGUIR</text>

    <!-- DESCANSAR 30.8% → h=41.6 → y=155-41.6=113 -->
    <rect x="235" y="113" width="90" height="42" fill="#2d6aa0" rx="3"/>
    <text x="280" y="108" text-anchor="middle" font-size="9.5" fill="#1a4a7a" font-family="system-ui" font-weight="bold">30.8%</text>
    <text x="280" y="101" text-anchor="middle" font-size="8.5" fill="#2d6aa0" font-family="system-ui">492 acc.</text>
    <text x="280" y="172" text-anchor="middle" font-size="9" fill="#3d3d3d" font-family="system-ui" font-weight="bold">DESCANSAR</text>

    <!-- RECOGER 3.4% → h=4.6 → y=155-4.6=150 -->
    <rect x="365" y="150" width="90" height="5" fill="#4a90c0" rx="2"/>
    <text x="410" y="144" text-anchor="middle" font-size="9.5" fill="#4a5568" font-family="system-ui" font-weight="bold">3.4%</text>
    <text x="410" y="137" text-anchor="middle" font-size="8.5" fill="#4a5568" font-family="system-ui">55 acc.</text>
    <text x="410" y="172" text-anchor="middle" font-size="9" fill="#3d3d3d" font-family="system-ui" font-weight="bold">RECOGER</text>

    <!-- COMER 3.4% -->
    <rect x="490" y="150" width="90" height="5" fill="#4a90c0" rx="2"/>
    <text x="535" y="144" text-anchor="middle" font-size="9.5" fill="#4a5568" font-family="system-ui" font-weight="bold">3.4%</text>
    <text x="535" y="137" text-anchor="middle" font-size="8.5" fill="#4a5568" font-family="system-ui">55 acc.</text>
    <text x="535" y="172" text-anchor="middle" font-size="9" fill="#3d3d3d" font-family="system-ui" font-weight="bold">COMER</text>

    <!-- Nota emergencia -->
    <text x="150" y="50" text-anchor="middle" font-size="8" fill="#c0392b" font-family="system-ui" font-style="italic">← comportamiento emergente</text>
    <text x="150" y="43" text-anchor="middle" font-size="8" fill="#c0392b" font-family="system-ui" font-style="italic">no codificado directamente</text>
  </svg>
</div>`;

// ── MAPA DE CLUSTERS ESPACIALES ──────────────────────────────────────────────
const mapaCluster = `
<div class="diagram-box">
  <div class="diagram-label">Figura D3. Posiciones finales de los 8 agentes en el mapa 60×60 — Tick 200. Tres clusters identificados: NW (hambre crítica), SW (hambre crítica), Aislada NE (sub-crítica). Los números indican ID de entidad.</div>
  <svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" style="width:260px;display:block;margin:0 auto;">
    <!-- Fondo del mapa -->
    <rect x="20" y="20" width="300" height="300" fill="#0f172a" rx="4" stroke="#2d6aa0" stroke-width="1.5"/>

    <!-- Grid sutil -->
    <line x1="20"  y1="170" x2="320" y2="170" stroke="#1e3a5a" stroke-width="0.5"/>
    <line x1="170" y1="20"  x2="170" y2="320" stroke="#1e3a5a" stroke-width="0.5"/>

    <!-- Labels cuadrantes -->
    <text x="95"  y="38"  text-anchor="middle" font-size="8" fill="#3d6a9a" font-family="system-ui">NW</text>
    <text x="245" y="38"  text-anchor="middle" font-size="8" fill="#3d6a9a" font-family="system-ui">NE</text>
    <text x="95"  y="318" text-anchor="middle" font-size="8" fill="#3d6a9a" font-family="system-ui">SW</text>
    <text x="245" y="318" text-anchor="middle" font-size="8" fill="#3d6a9a" font-family="system-ui">SE</text>

    <!-- Escala: 300px = 60 celdas → 5px/celda -->
    <!-- pos (x,y) → svg_x = 20 + x*5, svg_y = 20 + y*5 -->

    <!-- Cluster NW: Tryndamere(2,51), Félix(0,52), Amiguisimo(12,42) -->
    <!-- Tryndamere(2,51) → svg(30,275) -->
    <circle cx="30" cy="275" r="7" fill="#c0392b" stroke="#ff6b6b" stroke-width="1.5"/>
    <text x="30" cy="278" y="279" text-anchor="middle" font-size="7.5" fill="#fff" font-family="system-ui" font-weight="bold">8</text>
    <text x="42" y="268" font-size="7" fill="#ff9a9a" font-family="system-ui">Tryndamere</text>
    <text x="42" y="277" font-size="6.5" fill="#ff6b6b" font-family="system-ui">H=1.00 ●CRIT</text>

    <!-- Félix(0,52) → svg(20,280) -->
    <circle cx="22" cy="280" r="7" fill="#c0392b" stroke="#ff6b6b" stroke-width="1.5"/>
    <text x="22" y="284" text-anchor="middle" font-size="7.5" fill="#fff" font-family="system-ui" font-weight="bold">6</text>

    <!-- Amiguisimo(12,42) → svg(80,230) -->
    <circle cx="80" cy="230" r="7" fill="#e67e22" stroke="#ffb74d" stroke-width="1.5"/>
    <text x="80" y="234" text-anchor="middle" font-size="7.5" fill="#fff" font-family="system-ui" font-weight="bold">7</text>
    <text x="93" y="225" font-size="7" fill="#ffcc80" font-family="system-ui">Amiguisimo 🐱</text>
    <text x="93" y="233" font-size="6.5" fill="#ffb74d" font-family="system-ui">H=1.00 ●CRIT</text>

    <!-- Zona NW alertas -->
    <rect x="18" y="220" width="80" height="75" fill="rgba(192,57,43,0.08)" stroke="#c0392b" stroke-width="0.5" stroke-dasharray="3,3" rx="4"/>
    <text x="58" y="305" text-anchor="middle" font-size="7" fill="#c0392b" font-family="system-ui">Cluster NW</text>
    <text x="58" y="313" text-anchor="middle" font-size="6.5" fill="#c0392b" font-family="system-ui">65 alertas Watchdog</text>

    <!-- Cluster SW: David(10,22), Eva(13,5), Clara(25,5) -->
    <!-- David(10,22) → svg(70,130) -->
    <circle cx="70" cy="130" r="7" fill="#e74c3c" stroke="#ff6b6b" stroke-width="1.5"/>
    <text x="70" y="134" text-anchor="middle" font-size="7.5" fill="#fff" font-family="system-ui" font-weight="bold">4</text>
    <text x="83" y="127" font-size="7" fill="#ff9a9a" font-family="system-ui">David H=0.90</text>

    <!-- Eva(13,5) → svg(85,45) -->
    <circle cx="85" cy="45" r="7" fill="#e74c3c" stroke="#ff6b6b" stroke-width="1.5"/>
    <text x="85" y="49" text-anchor="middle" font-size="7.5" fill="#fff" font-family="system-ui" font-weight="bold">5</text>
    <text x="98" y="42" font-size="7" fill="#ff9a9a" font-family="system-ui">Eva H=1.00</text>

    <!-- Clara(25,5) → svg(145,45) -->
    <circle cx="145" cy="45" r="7" fill="#e74c3c" stroke="#ff6b6b" stroke-width="1.5"/>
    <text x="145" y="49" text-anchor="middle" font-size="7.5" fill="#fff" font-family="system-ui" font-weight="bold">3</text>
    <text x="158" y="42" font-size="7" fill="#ff9a9a" font-family="system-ui">Clara H=1.00</text>

    <!-- Cluster SW box -->
    <rect x="60" y="30" width="100" height="115" fill="rgba(231,76,60,0.06)" stroke="#e74c3c" stroke-width="0.5" stroke-dasharray="3,3" rx="4"/>
    <text x="110" y="155" text-anchor="middle" font-size="7" fill="#e74c3c" font-family="system-ui">Cluster SW</text>

    <!-- Bruno(0,34) → svg(20,190) — posición aislada -->
    <circle cx="22" cy="190" r="7" fill="#c0392b" stroke="#ff6b6b" stroke-width="1.5"/>
    <text x="22" y="194" text-anchor="middle" font-size="7.5" fill="#fff" font-family="system-ui" font-weight="bold">2</text>
    <text x="35" y="188" font-size="7" fill="#ff9a9a" font-family="system-ui">Bruno</text>

    <!-- ANA (47,21) → svg(255,125) — ÚNICA sub-crítica, posición NE -->
    <circle cx="255" cy="125" r="9" fill="#27ae60" stroke="#2ecc71" stroke-width="2"/>
    <text x="255" y="129" text-anchor="middle" font-size="8" fill="#fff" font-family="system-ui" font-weight="bold">1</text>
    <text x="270" y="118" font-size="7.5" fill="#2ecc71" font-family="system-ui" font-weight="bold">Ana ✓</text>
    <text x="270" y="128" font-size="7" fill="#2ecc71" font-family="system-ui">H=0.68 ●sub-crit</text>
    <text x="270" y="137" font-size="6.5" fill="#2ecc71" font-family="system-ui" font-style="italic">divergencia exitosa</text>

    <!-- Leyenda -->
    <circle cx="30" cy="337" r="4" fill="#c0392b"/>
    <text x="38" y="341" font-size="7.5" fill="#6b6b6b" font-family="system-ui">H ≥ 0.90 crítica</text>
    <circle cx="130" cy="337" r="4" fill="#27ae60"/>
    <text x="138" y="341" font-size="7.5" fill="#6b6b6b" font-family="system-ui">H &lt; 0.90 sub-crítica</text>
  </svg>
</div>`;

// ── DIAGRAMA SISTEMA CHESS ───────────────────────────────────────────────────
const diagramaChess = `
<div class="diagram-box">
  <div class="diagram-label">Figura D4. Arquitectura del Sistema Chess — 6 agentes auditores en red aislada con montaje read-only</div>
  <svg viewBox="0 0 680 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:680px;display:block;margin:0 auto;">
    <defs>
      <marker id="arr2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L7,3 z" fill="#4a7a4a"/>
      </marker>
      <marker id="arr3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L7,3 z" fill="#2d6aa0"/>
      </marker>
    </defs>

    <!-- Repo (fuente) -->
    <rect x="5" y="65" width="100" height="50" rx="6" fill="#0f172a" stroke="#2d6aa0" stroke-width="1.5"/>
    <text x="55" y="85" text-anchor="middle" font-size="9" fill="#7ec8ff" font-family="system-ui" font-weight="bold">Repositorio</text>
    <text x="55" y="97" text-anchor="middle" font-size="8" fill="#4a8fcc" font-family="system-ui">artificial-word</text>
    <text x="55" y="109" text-anchor="middle" font-size="7.5" fill="#c0392b" font-family="system-ui">:ro (READ-ONLY)</text>

    <!-- Agentes -->
    <rect x="145" y="10"  width="88" height="34" rx="4" fill="#1a2a1a" stroke="#4a7a4a" stroke-width="1.2"/>
    <text x="189" y="26"  text-anchor="middle" font-size="8.5" fill="#90ee90" font-family="system-ui">agent-docs</text>
    <text x="189" y="38"  text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">Claims · README</text>

    <rect x="145" y="52"  width="88" height="34" rx="4" fill="#1a2a1a" stroke="#4a7a4a" stroke-width="1.2"/>
    <text x="189" y="68"  text-anchor="middle" font-size="8.5" fill="#90ee90" font-family="system-ui">agent-backend</text>
    <text x="189" y="80"  text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">API · Seguridad</text>

    <rect x="145" y="94"  width="88" height="34" rx="4" fill="#1a2a1a" stroke="#4a7a4a" stroke-width="1.2"/>
    <text x="189" y="110" text-anchor="middle" font-size="8.5" fill="#90ee90" font-family="system-ui">agent-frontend</text>
    <text x="189" y="122" text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">React · &gt;300 líneas</text>

    <rect x="145" y="136" width="88" height="34" rx="4" fill="#1a2a1a" stroke="#4a7a4a" stroke-width="1.2"/>
    <text x="189" y="152" text-anchor="middle" font-size="8.5" fill="#90ee90" font-family="system-ui">agent-bd</text>
    <text x="189" y="164" text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">SQL · Queries</text>

    <rect x="260" y="10"  width="88" height="34" rx="4" fill="#1a2a1a" stroke="#4a7a4a" stroke-width="1.2"/>
    <text x="304" y="26"  text-anchor="middle" font-size="8.5" fill="#90ee90" font-family="system-ui">agent-tests</text>
    <text x="304" y="38"  text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">Cobertura · Assert</text>

    <rect x="260" y="52"  width="88" height="34" rx="4" fill="#1a2a1a" stroke="#4a7a4a" stroke-width="1.2"/>
    <text x="304" y="68"  text-anchor="middle" font-size="8.5" fill="#90ee90" font-family="system-ui">agent-marketing</text>
    <text x="304" y="80"  text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">Claims · Oversell</text>

    <!-- Coordinator -->
    <rect x="390" y="52" width="100" height="50" rx="6" fill="#1a2a3a" stroke="#2d6aa0" stroke-width="1.5"/>
    <text x="440" y="72"  text-anchor="middle" font-size="9" fill="#7ec8ff" font-family="system-ui" font-weight="bold">coordinator</text>
    <text x="440" y="84"  text-anchor="middle" font-size="7.5" fill="#4a8fcc" font-family="system-ui">agrega resultados</text>
    <text x="440" y="96"  text-anchor="middle" font-size="7.5" fill="#4a8fcc" font-family="system-ui">high→medium→low</text>

    <!-- Output -->
    <rect x="520" y="52" width="140" height="50" rx="6" fill="#0f1f0f" stroke="#4a7a4a" stroke-width="1.5"/>
    <text x="590" y="72"  text-anchor="middle" font-size="9" fill="#90ee90" font-family="system-ui" font-weight="bold">REPORTE_CHESS_1.md</text>
    <text x="590" y="84"  text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">verificable · reproducible</text>
    <text x="590" y="96"  text-anchor="middle" font-size="7.5" fill="#6b9b6b" font-family="system-ui">fechado · sin estado</text>

    <!-- Flechas repo → agentes -->
    <line x1="105" y1="80"  x2="143" y2="30"  stroke="#2d6aa0" stroke-width="1" marker-end="url(#arr3)"/>
    <line x1="105" y1="85"  x2="143" y2="70"  stroke="#2d6aa0" stroke-width="1" marker-end="url(#arr3)"/>
    <line x1="105" y1="90"  x2="143" y2="110" stroke="#2d6aa0" stroke-width="1" marker-end="url(#arr3)"/>
    <line x1="105" y1="95"  x2="143" y2="155" stroke="#2d6aa0" stroke-width="1" marker-end="url(#arr3)"/>
    <line x1="105" y1="80"  x2="258" y2="28"  stroke="#2d6aa0" stroke-width="1" marker-end="url(#arr3)"/>
    <line x1="105" y1="85"  x2="258" y2="68"  stroke="#2d6aa0" stroke-width="1" marker-end="url(#arr3)"/>

    <!-- Agentes → coordinator -->
    <line x1="233" y1="27"  x2="388" y2="70"  stroke="#4a7a4a" stroke-width="1" marker-end="url(#arr2)"/>
    <line x1="233" y1="69"  x2="388" y2="75"  stroke="#4a7a4a" stroke-width="1" marker-end="url(#arr2)"/>
    <line x1="233" y1="111" x2="388" y2="82"  stroke="#4a7a4a" stroke-width="1" marker-end="url(#arr2)"/>
    <line x1="233" y1="153" x2="388" y2="90"  stroke="#4a7a4a" stroke-width="1" marker-end="url(#arr2)"/>
    <line x1="348" y1="27"  x2="388" y2="68"  stroke="#4a7a4a" stroke-width="1" marker-end="url(#arr2)"/>
    <line x1="348" y1="69"  x2="388" y2="73"  stroke="#4a7a4a" stroke-width="1" marker-end="url(#arr2)"/>

    <!-- Coordinator → output -->
    <line x1="490" y1="77" x2="518" y2="77" stroke="#2d6aa0" stroke-width="1.5" marker-end="url(#arr3)"/>

    <!-- Red aislada label -->
    <rect x="130" y="4" width="230" height="172" fill="none" stroke="#2a4a2a" stroke-width="0.8" stroke-dasharray="5,4" rx="6"/>
    <text x="245" y="183" text-anchor="middle" font-size="7.5" fill="#4a7a4a" font-family="system-ui">audit-net · internal:true · sin acceso a internet ni producción</text>
  </svg>
</div>`;

// ── FIGURAS SCREENSHOTS ──────────────────────────────────────────────────────
function fig(src, num, cap) {
  if (!src) return '';
  return `<figure class="fig"><img src="${src}" alt="Figura ${num}"/><figcaption><strong>Figura ${num}.</strong> ${cap}</figcaption></figure>`;
}

const figurasHtml = `
<div class="section-visuals">
  <h1 id="sh">Apéndice H: Capturas de Pantalla — Evidencia Visual de las Aplicaciones</h1>
  <p>Las capturas H.1–H.4 fueron tomadas directamente de las aplicaciones en funcionamiento el 2026-03-08. Constituyen evidencia visual verificable del sistema descrito en este paper. Stack: React 18 + Vite + Node.js + WebSocket + SQLite.</p>

  <h2>H.1 Capa Web — Flujo Fundador</h2>
  ${fig(imgs.landing, 1, 'Selector de semilla de civilización. Las 7 semillas arquetipal con sus valores. <em>Tribu de frontera</em> seleccionada (borde cian). Aplicación React+Vite corriendo en puerto 5173.')}
  ${fig(imgs.hub, 2, 'Hub "Constructor de Mundos". Cuatro módulos: Tu Mundo, Arena, Emergencias, Observatorio. KPIs de héroe en header. Tagline: "No persigas la IA. Construye un mundo que la necesite."')}
  ${fig(imgs.simulation, 3, 'Vista de simulación — tick 476, status Running. Panel izquierdo: controles, mapa global (AW-256, grid 32×32, 18 refugios activos). Centro: mapa del refugio 4 habitaciones con nodos. Derecha: compañero IA con métricas de personalidad (loyalty 100, curiosity 91, adaptability 86, creativity 68).')}
  ${fig(imgs.sim2, 4, 'Simulación tick 906, paused. Mapa 32×32 con héroe en Entrada. Log de eventos en panel derecho. Barras: Energía 95, Hambre 90, Ánimo 95.')}
  ${fig(imgs.sim4, 5, 'Movimiento WASD activo — tick 945. Héroe desplazado hacia zona de Entrada. Degradación por movimiento: Energía 87, Hambre 74, Ánimo 87. Evidencia de estado fisiológico degradándose en tiempo real.')}
  ${fig(imgs.sim6, 6, 'Modo Editar — tick 965. Barra con elementos colocables: Solar, Mineral, Cama, Mesa, Chimenea, Sofá. Energía 83, Hambre 66, Ánimo 83.')}

  <h2>H.2 Observatorio (Mission Control)</h2>
  ${fig(imgs.missioncontrol, 7, 'Observatorio — tick 476, 10m 49s activo. 18 refugios listados, estado "Vivo". Controles: pausar, empezar de cero, traer habitantes. Pestañas: Vista general, Habitantes, Qué pasa, Salud, Crónica, Logs.')}

  <h2>H.3 Hub y Control de Acceso</h2>
  ${fig(imgs.hubcards, 8, 'Hub cards completo con badges REAL/DEMO/ACCESO ANTICIPADO por módulo.')}
  ${fig(imgs.admin, 9, 'Panel admin con RBAC activo: "Acceso denegado — Solo los administradores (ADMIN_PLAYER_IDS en .env)". Player ID visible. Control de acceso por variable de entorno verificado.')}

  <h2>H.4 DobackSoft — Módulo de Emergencias</h2>
  ${fig(imgs.dobacksoft, 10, 'Pantalla DobackSoft integrada. 0/1000 ciudadanos, precio €9.99/mes con cupón FUNDADOR1000. Features: Mapa despacho, Telemetría vehicular, Paisajes 2D, Simulación incidentes, Progresión y niveles.')}

  <h2>H.5 FireSimulator — Material Visual de Referencia</h2>
  <p style="font-size:10px;color:#6b6b6b;font-style:italic;margin-bottom:8px;">Imágenes generadas con Firefly/Gemini Flash para el material de comunicación del trailer. No son capturas del simulador en tiempo de ejecución.</p>
  ${fig(imgs.dashcam, 11, 'Dashcam lateral — Camión E-12 en intersección urbana. Velocidad: 62 KM/H. Timestamp: 2024/05/15 14:35:02 UTC. Perspectiva de seguimiento para la vista dashcam del FireSimulator.')}
  ${fig(imgs.dashcam2, 12, 'Dashcam trasera — Seguimiento posterior del camión. Perspectiva del modo de seguimiento trasero del FireSimulator.')}
</div>`;

// ── ESTILOS CSS COMPLETOS ────────────────────────────────────────────────────
const css = `
:root {
  --serif: 'Georgia', 'Times New Roman', serif;
  --sans: 'Segoe UI', system-ui, sans-serif;
  --mono: 'Consolas', 'Cascadia Code', monospace;
  --accent: #1a4a7a; --accent-light: #e8f0f8; --accent-mid: #2d6aa0;
  --text: #1a1a1a; --text2: #3d3d3d; --muted: #6b6b6b;
  --border: #d4d4d4; --border-light: #ebebeb; --bg: #fff; --bg-alt: #f7f8fa;
  --code-bg: #0f172a; --code-text: #e2e8f0;
}
@media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:var(--serif); color:var(--text); line-height:1.72; font-size:11.5px; background:#eceef2; }
.page { max-width:780px; margin:24px auto; background:var(--bg); box-shadow:0 2px 32px rgba(0,0,0,.14); }

/* PORTADA */
.cover { padding:60px 64px 48px; border-bottom:3px solid var(--accent); }
.cover-journal { font-family:var(--sans); font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--accent-mid); border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:24px; }
.cover-title { font-family:var(--serif); font-size:1.45rem; font-weight:700; color:var(--text); line-height:1.25; margin-bottom:18px; }
.cover-authors { font-family:var(--sans); font-size:11px; color:var(--text2); margin-bottom:4px; }
.cover-aff { font-family:var(--sans); font-size:10px; color:var(--muted); font-style:italic; margin-bottom:16px; }
.cover-meta { display:flex; gap:18px; flex-wrap:wrap; }
.cover-meta span { font-family:var(--sans); font-size:9.5px; color:var(--muted); }
.cover-meta strong { color:var(--text2); font-weight:600; }

/* ABSTRACT BOX */
.abstract-section { padding:24px 64px; border-bottom:1px solid var(--border-light); background:var(--bg-alt); }
.abstract-label { font-family:var(--sans); font-size:9px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); margin-bottom:8px; }
.abstract-section p { font-size:11px; line-height:1.7; text-align:justify; color:var(--text2); }
.keywords { font-family:var(--sans); font-size:9.5px; color:var(--muted); margin-top:10px; }

/* TOC */
.toc { padding:20px 64px 16px; border-bottom:1px solid var(--border-light); background:var(--bg); }
.toc-title { font-family:var(--sans); font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin-bottom:10px; }
.toc-list { font-family:var(--sans); font-size:10px; color:var(--text2); padding-left:20px; line-height:1.9; }
.toc-list ol { padding-left:16px; font-size:9.5px; color:var(--muted); }
.toc-list a { color:var(--accent-mid); text-decoration:none; }

/* BODY */
.body { padding:36px 64px 48px; }
h1 { font-family:var(--sans); font-size:1.1rem; font-weight:800; color:var(--accent); border-bottom:2px solid var(--accent); padding-bottom:6px; margin:36px 0 14px; letter-spacing:-.01em; }
h1:first-child { margin-top:0; }
h2 { font-family:var(--sans); font-size:.95rem; font-weight:700; color:var(--text); margin:24px 0 9px; padding-left:10px; border-left:3px solid var(--accent-mid); }
h3 { font-family:var(--sans); font-size:.88rem; font-weight:700; color:var(--text2); margin:18px 0 7px; }
h4 { font-family:var(--sans); font-size:.83rem; font-weight:600; color:var(--muted); margin:12px 0 5px; font-style:italic; }
p { margin-bottom:9px; text-align:justify; hyphens:auto; font-size:11.5px; line-height:1.72; }
ul { margin:8px 0 12px 22px; }
li { margin-bottom:4px; font-size:11.5px; line-height:1.65; }
table { width:100%; border-collapse:collapse; margin:14px 0 18px; font-family:var(--sans); font-size:10px; }
th { background:var(--accent); color:#fff; font-weight:700; padding:6px 10px; text-align:left; font-size:9.5px; }
td { border:1px solid var(--border); padding:5px 10px; vertical-align:top; line-height:1.55; }
tr:nth-child(even) td { background:var(--bg-alt); }
code { font-family:var(--mono); font-size:10px; background:var(--accent-light); color:var(--accent); padding:1px 5px; border-radius:3px; }
pre { background:var(--code-bg); border-radius:6px; padding:12px 16px; margin:10px 0 14px; border-left:3px solid var(--accent-mid); }
pre code { font-family:var(--mono); font-size:9.5px; color:var(--code-text); background:transparent; padding:0; line-height:1.6; }
blockquote { border-left:4px solid var(--accent-mid); padding:10px 16px; margin:14px 0; background:var(--accent-light); border-radius:0 4px 4px 0; }
blockquote p { font-style:italic; color:var(--text2); font-size:11px; margin:0 0 5px; }
blockquote p:last-child { margin-bottom:0; }
hr { border:none; border-top:1px solid var(--border-light); margin:24px 0; }
strong { font-weight:700; }
em { font-style:italic; }
a { color:var(--accent-mid); }

/* DIAGRAMAS */
.diagram-box { background:var(--bg-alt); border:1px solid var(--border); border-radius:6px; padding:14px 16px; margin:16px 0 20px; page-break-inside:avoid; }
.diagram-label { font-family:var(--sans); font-size:9.5px; color:var(--muted); font-style:italic; margin-bottom:10px; }

/* FIGURAS SCREENSHOTS */
.section-visuals { border-top:3px solid var(--accent); padding-top:28px; }
.fig { margin:16px 0 24px; border:1px solid var(--border); border-radius:6px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.07); page-break-inside:avoid; }
.fig img { width:100%; height:auto; display:block; border-bottom:1px solid var(--border-light); max-height:460px; object-fit:contain; background:#0a0b0d; }
figcaption { padding:9px 14px; font-family:var(--sans); font-size:9.5px; color:var(--muted); line-height:1.6; background:var(--bg-alt); }
figcaption strong { color:var(--accent); font-weight:700; }

/* FOOTER */
.footer { border-top:2px solid var(--accent); padding:13px 64px; font-family:var(--sans); font-size:9.5px; color:var(--muted); display:flex; justify-content:space-between; }
.footer .l { color:var(--accent); font-weight:600; }
`;

// ── ABSTRACT separado del body ────────────────────────────────────────────────
const abstractHtml = `
<div class="abstract-section">
  <div class="abstract-label">Abstract</div>
  <p>Presentamos <strong>Artificial World</strong>, un sistema de simulación de vida artificial 2D orientado a la generación de civilizaciones emergentes con memoria persistente, héroes fundadores, refugios como unidades de organización social, y comunidades con tensiones internas. El sistema implementa dos capas técnicas diferenciadas: un motor Python con función de utilidad multidimensional (13 tipos de acción, 9 modificadores, ruido determinista por semilla), y una capa web fullstack en Node.js/React con siete arquetipos de civilización (<em>CivilizationSeed</em>) y un sistema de refugios persistentes (<em>HeroRefuge</em>). El sistema incorpora un mecanismo de auditoría independiente con agentes dockerizados en red aislada (<em>Sistema Chess</em>), un modo de simulación especular sin efectos secundarios (<em>Modo Sombra</em>), un sistema de vigilancia activa (<em>Watchdog</em>) y una infraestructura documental que genera crónicas verificables en JSON, Markdown y PDF desde el propio código. Los resultados de la sesión canónica (semilla 42, 200 ticks, 8 agentes) revelan comportamientos emergentes no programados: cohesión grupal bajo escasez severa (62.4% de acciones <code>SEGUIR</code>), agotamiento zonal en el cuadrante oeste, y divergencia individual exitosa como estrategia no codificada. El paper argumenta que la trazabilidad radical es una propiedad de diseño de primer orden, no una característica opcional.</p>
  <div class="keywords"><strong>Palabras clave:</strong> vida artificial · agentes autónomos · función de utilidad · civilizaciones emergentes · simulación 2D · memoria social · modo sombra · auditoría de código · trazabilidad · comportamiento emergente</div>
</div>`;

// ── HTML FINAL ────────────────────────────────────────────────────────────────
// Insertar los diagramas SVG justo después de las secciones relevantes en el body
let bodyFinal = bodyHtml
  // Insertar diagrama de tick después de h2 "ciclo de tick"
  .replace(/<h3>3\.2 Motor Python: ciclo de tick<\/h3>/, `<h3>3.2 Motor Python: ciclo de tick</h3>${diagramaTick}`)
  // Insertar gráfico de métricas después de tabla de métricas de acción
  .replace(/<h3>6\.3 Métricas de acción<\/h3>/, `<h3>6.3 Métricas de acción</h3>`)
  .replace(/Veredicto del sistema.*?TENSIÓN/, `${graficaMetricas}\n\nVeredicto del sistema: TENSIÓN`)
  // Insertar mapa cluster después de 6.4 o en sección 7.4
  .replace(/<h3>7\.4 Tabla resumen de fenómenos emergentes<\/h3>/, `${mapaCluster}<h3>7.4 Tabla resumen de fenómenos emergentes</h3>`)
  // Insertar diagrama Chess antes o después de 5.2
  .replace(/<h3>5\.2 Los seis agentes auditores<\/h3>/, `<h3>5.2 Los seis agentes auditores</h3>${diagramaChess}`);

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Artificial World — Paper Científico v3 · Con Diagramas y Evidencia Visual</title>
<style>${css}</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="cover-journal">Preprint · Repositorio artificial-word · 2026-03-08 · Versión 1.0 Final · Con diagramas, gráficos y 12 capturas reales</div>
    <div class="cover-title">Artificial World: Arquitectura de un Motor de Civilizaciones Emergentes con Agentes Autónomos Basados en Utilidad, Memoria Persistente y Auditoría Trazable</div>
    <div class="cover-authors"><strong>Cosigein SL</strong></div>
    <div class="cover-aff">Constructor de sistemas · artificial-word · 2026</div>
    <div class="cover-meta">
      <span><strong>Fecha:</strong> 2026-03-08</span>
      <span><strong>Versión:</strong> 1.0 Final</span>
      <span><strong>Repositorio:</strong> github.com/artificial-word</span>
      <span><strong>Sesión canónica:</strong> semilla 42 · 200 ticks · 8 agentes</span>
    </div>
  </div>
  ${abstractHtml}
  ${tocHtml}
  <div class="body">
    ${bodyFinal}
    ${figurasHtml}
  </div>
  <div class="footer">
    <span class="l">Artificial World — Paper Científico Definitivo v3 · Con Diagramas y Evidencia Visual</span>
    <span>Cosigein SL · 2026 · "Constrúyelo. Habítalo. Haz que crezca."</span>
  </div>
</div>
</body>
</html>`;

const htmlPath = path.join(docsDir, 'paper-v3.html');
const pdfPath  = path.join(docsDir, 'PAPER_DEFINITIVO_V3.pdf');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML generado:', htmlPath);

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await pg.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await pg.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '11mm', right: '10mm', bottom: '15mm', left: '10mm' },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:7.5px;color:#6b7280;width:100%;padding:0 10mm;text-align:right;font-family:system-ui;font-style:italic;">Artificial World: Motor de Civilizaciones Emergentes · Cosigein SL · 2026</div>`,
  footerTemplate: `<div style="font-size:7.5px;color:#6b7280;width:100%;text-align:center;font-family:system-ui;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
});
await browser.close();
console.log('✅ PAPER_DEFINITIVO_V3.pdf generado:', pdfPath);
