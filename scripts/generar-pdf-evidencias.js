/**
 * Genera docs/EVIDENCIAS_ARTIFICIAL_WORLD.pdf con documento único + evidencias.
 * Evidencias: log producción, verificación JSON, descripción Admin Panel.
 * Opcional: --screenshots (requiere app en localhost:5173)
 *
 * Uso: node scripts/generar-pdf-evidencias.js
 *      node scripts/generar-pdf-evidencias.js --screenshots
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');
const pruebasDir = path.join(root, 'pruebas');

const reporteLog = fs.existsSync(path.join(pruebasDir, 'reporte_produccion.log'))
  ? fs.readFileSync(path.join(pruebasDir, 'reporte_produccion.log'), 'utf8')
  : '(Ejecuta: python pruebas/run_tests_produccion.py)';

const verificacionJson = fs.existsSync(path.join(root, 'verificacion_completa.json'))
  ? fs.readFileSync(path.join(root, 'verificacion_completa.json'), 'utf8')
  : '(Ejecuta: python pruebas/verificar_todo.py)';

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artificial World — Documento único con evidencias</title>
  <style>
    :root { --accent: #0088aa; --accent-light: #e0f4f8; --text: #1a1d21; --text-muted: #4a5568; --bg: #fff; --border: #e2e8f0; --radius: 8px; }
    @media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: var(--text); line-height: 1.6; font-size: 14px; background: #f7fafc; }
    .page { max-width: 700px; margin: 20px auto; padding: 36px 44px; background: var(--bg); border-radius: var(--radius); page-break-after: always; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .page:last-of-type { page-break-after: auto; }
    h1 { font-size: 1.6rem; margin-bottom: 8px; color: var(--accent); border-bottom: 3px solid var(--accent); padding-bottom: 8px; }
    h2 { font-size: 1.2rem; margin: 24px 0 12px; color: var(--text); }
    h3 { font-size: 1rem; margin: 16px 0 8px; }
    p, li { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { background: var(--accent-light); font-weight: 600; }
    pre, .evidencia { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: var(--radius); overflow-x: auto; font-size: 11px; line-height: 1.5; margin: 12px 0; }
    .evidencia-title { font-weight: 600; color: var(--accent); margin-bottom: 8px; font-size: 13px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-demo { background: #fef3c7; color: #92400e; }
    .badge-roadmap { background: #e0e7ff; color: #3730a3; }
    ul { margin-left: 20px; margin-bottom: 12px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .footer-note { font-size: 12px; color: var(--text-muted); margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="page">
    <h1>Artificial World — Documento único con evidencias</h1>
    <p><em>Un solo documento para entender, ejecutar, verificar y trabajar en el proyecto.</em></p>
    <p><strong>Generado:</strong> ${new Date().toISOString().slice(0, 19).replace('T', ' ')}</p>

    <h2>1. Qué es Artificial World</h2>
    <p><strong>Artificial World</strong> es una base para crear civilizaciones vivas con memoria, héroes, refugios y comunidades. La verdad estratégica vive en 2D; la encarnación 3D es capa futura.</p>
    <p><strong>Mensaje corto:</strong> <em>Empieza con un refugio. Elige una semilla. Mira nacer tu civilización.</em></p>

    <h3>Qué existe hoy (verificado)</h3>
    <table>
      <tr><th>Capa</th><th>Estado</th><th>Evidencia</th></tr>
      <tr><td>Motor Python</td><td><span class="badge badge-ok">Real</span></td><td>principal.py, 13 acciones, persistencia SQLite, Modo Sombra</td></tr>
      <tr><td>Web fullstack</td><td><span class="badge badge-demo">Demo</span></td><td>Backend 3001, Frontend 5173, motor JS propio</td></tr>
      <tr><td>HeroRefuge</td><td><span class="badge badge-demo">Parcial</span></td><td>Refugios jugables, semillas, mundos ligeros</td></tr>
      <tr><td>Panel Administrador</td><td><span class="badge badge-ok">Real</span></td><td>AdminPanel.jsx, ruta #admin, modo dios</td></tr>
      <tr><td>DobackSoft</td><td><span class="badge badge-demo">Demo</span></td><td>UI en hub; producto completo fuera del repo</td></tr>
      <tr><td>3D</td><td><span class="badge badge-roadmap">Roadmap</span></td><td>No implementado</td></tr>
    </table>

    <h2>2. Panel Administrador</h2>
    <p>El <strong>Panel Administrador</strong> está implementado y operativo. Acceso: <code>#admin</code> en el Hub (requiere <code>ADMIN_PLAYER_IDS</code> en .env).</p>
    <ul>
      <li>Reset simulación</li>
      <li>Destruir mundos Hero</li>
      <li>Reset DobackSoft ciudadanos</li>
      <li>Vista de eventos de auditoría</li>
    </ul>
    <p><em>Ubicación:</em> frontend/src/components/AdminPanel.jsx</p>
  </div>

  <div class="page">
    <h2>3. Evidencia — Log de tests de producción</h2>
    <p class="evidencia-title">pruebas/reporte_produccion.log</p>
    <pre>${reporteLog.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>

  <div class="page">
    <h2>4. Evidencia — Verificación completa (JSON)</h2>
    <p class="evidencia-title">verificacion_completa.json</p>
    <pre>${verificacionJson.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>

  <div class="page">
    <h2>5. Cómo ejecutar</h2>
    <table>
      <tr><th>Modo</th><th>Comando</th><th>Resultado</th></tr>
      <tr><td>Python</td><td><code>python principal.py</code></td><td>Ventana pygame, motor completo</td></tr>
      <tr><td>Web</td><td><code>.\scripts\iniciar_fullstack.ps1</code></td><td>Backend 3001, Frontend 5173</td></tr>
      <tr><td>Tests</td><td><code>python pruebas/run_tests_produccion.py</code></td><td>11 suites</td></tr>
    </table>

    <h2>6. Tabla real / demo / roadmap</h2>
    <table>
      <tr><th>Componente</th><th>Estado</th><th>Dónde</th></tr>
      <tr><td>Motor Python</td><td>Real</td><td>principal.py, nucleo/, agentes/</td></tr>
      <tr><td>Persistencia</td><td>Real</td><td>mundo_artificial.db</td></tr>
      <tr><td>Modo Sombra</td><td>Real</td><td>gestor_modo_sombra.py</td></tr>
      <tr><td>Web fullstack</td><td>Demo</td><td>scripts/iniciar_fullstack.ps1</td></tr>
      <tr><td>Admin Panel</td><td>Real</td><td>AdminPanel.jsx, #admin</td></tr>
      <tr><td>HeroRefuge</td><td>Parcial</td><td>backend/src/simulation/heroRefuge.js</td></tr>
      <tr><td>3D</td><td>Roadmap</td><td>—</td></tr>
    </table>

    <p class="footer-note">Artificial World — Constrúyelo. Habítalo. Haz que crezca.</p>
  </div>
  {{SCREENSHOTS}}
</body>
</html>`;

// Incluir screenshots si existen
const screenshotsDir = path.join(docsDir, 'tutorial', 'screenshots');
let screenshotsHtml = '';
if (fs.existsSync(screenshotsDir)) {
  const imgs = fs.readdirSync(screenshotsDir).filter((f) => f.endsWith('.png')).sort();
  if (imgs.length > 0) {
    screenshotsHtml = imgs.map((f) => {
      const rel = 'tutorial/screenshots/' + f;
      const label = f.replace(/\d+-/, '').replace('.png', '').replace(/-/g, ' ');
      return `<div class="page"><h2>Captura: ${label}</h2><img src="${rel}" style="max-width:100%;height:auto;border-radius:8px;" alt="${label}"/></div>`;
    }).join('\n');
    console.log('Screenshots incluidos:', imgs.length);
  }
}
const htmlContentFinal = htmlContent.replace('{{SCREENSHOTS}}', screenshotsHtml);

const htmlPath = path.join(docsDir, 'EVIDENCIAS_ARTIFICIAL_WORLD.html');
const pdfPath = path.join(docsDir, 'EVIDENCIAS_ARTIFICIAL_WORLD.pdf');

fs.writeFileSync(htmlPath, htmlContentFinal, 'utf8');
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
  footerTemplate: '<div style="font-size:9px;color:#64748b;width:100%;text-align:center;"><span>Artificial World — Evidencias</span> · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', pdfPath);
