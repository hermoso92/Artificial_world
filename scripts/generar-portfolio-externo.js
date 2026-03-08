/**
 * generar-portfolio-externo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Orquestador principal: dado acceso a un repositorio (local o URL de GitHub),
 * analiza su estructura y genera automáticamente un PDF de portfolio/dossier
 * usando la plantilla LaTeX profesional de Artificial World.
 *
 * MODOS DE USO:
 *
 *   1. Repo local:
 *      node scripts/generar-portfolio-externo.js --repo /ruta/al/repo
 *
 *   2. Repo GitHub (clona automáticamente):
 *      node scripts/generar-portfolio-externo.js --github https://github.com/usuario/repo
 *
 *   3. Repo GitHub con token (repos privados):
 *      node scripts/generar-portfolio-externo.js --github https://github.com/usuario/repo --token ghp_xxx
 *
 *   4. Este mismo proyecto (autodiagnóstico):
 *      node scripts/generar-portfolio-externo.js --self
 *
 * OUTPUT:
 *   docs/portfolio-<nombre-repo>-<fecha>.pdf
 *   docs/portfolio-<nombre-repo>-<fecha>.tex  (fuente, para editar)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import { analizarRepo } from './analizar-repo.js';
import { compilarLatex, verificarLatex, compilarConPlaywright } from './compilar-latex.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'portfolio-externo.tex.template');
const DOCS_DIR = path.join(ROOT, 'docs');

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parsearArgs() {
  const args = process.argv.slice(2);
  const opts = { repo: null, github: null, token: null, self: false, output: DOCS_DIR };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo')   opts.repo   = args[++i];
    if (args[i] === '--github') opts.github = args[++i];
    if (args[i] === '--token')  opts.token  = args[++i];
    if (args[i] === '--output') opts.output = args[++i];
    if (args[i] === '--self')   opts.self   = true;
  }

  if (!opts.repo && !opts.github && !opts.self) {
    console.error([
      '',
      '  USO:',
      '    node scripts/generar-portfolio-externo.js --repo /ruta/local',
      '    node scripts/generar-portfolio-externo.js --github https://github.com/user/repo',
      '    node scripts/generar-portfolio-externo.js --github https://github.com/user/repo --token ghp_xxx',
      '    node scripts/generar-portfolio-externo.js --self',
      '',
    ].join('\n'));
    process.exit(1);
  }

  return opts;
}

// ─── Clonar repo GitHub ───────────────────────────────────────────────────────

function clonarRepo(githubUrl, token) {
  const tmpDir = path.join(os.tmpdir(), `aw-repo-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  let urlFinal = githubUrl;
  if (token) {
    // Insertar token en la URL: https://token@github.com/...
    urlFinal = githubUrl.replace('https://', `https://${token}@`);
  }

  console.log(`  Clonando ${githubUrl} → ${tmpDir}`);
  try {
    execSync(`git clone --depth 1 "${urlFinal}" "${tmpDir}"`, {
      stdio: 'inherit',
      timeout: 120000,
    });
  } catch (err) {
    throw new Error(`Error clonando el repositorio: ${err.message}\nAsegúrate de que la URL es válida y tienes acceso.`);
  }

  return tmpDir;
}

// ─── Escape LaTeX ────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// ─── Construcción del .tex ───────────────────────────────────────────────────

function construirTex(analisis) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const d = analisis;

  // Stack items → \item ...
  const stackItems = (arr) =>
    arr.length > 0
      ? arr.map(s => `  \\item ${esc(s)}`).join('\n')
      : '  \\item ---';

  // Features → tabularx rows
  const featuresRows = d.features.length > 0
    ? d.features.map(f => `  ${esc(f.icono)} & ${esc(f.nombre)} \\\\`).join('\n')
    : '  \\checkmark & Análisis básico completado \\\\';

  // Lenguajes → tabularx rows con barra proporcional
  const maxLang = Math.max(...Object.values(d.estadisticas.lenguajes));
  const lenguajesRows = Object.entries(d.estadisticas.lenguajes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => {
      const pct = Math.round((count / maxLang) * 20);
      const barra = '▓'.repeat(pct) + '░'.repeat(20 - pct);
      return `  ${esc(lang)} & ${count} & \\texttt{\\small ${barra}} \\\\`;
    })
    .join('\n[2pt]\n');

  // Docs section
  const docsSection = d.docs.tiene_docs
    ? `\\begin{itemize}[leftmargin=1em, itemsep=2pt]\n${
        d.docs.archivos.slice(0, 8).map(f => `  \\item \\texttt{${esc(f)}}`).join('\n')
      }\n\\end{itemize}`
    : '\\textit{\\color{muted}No se encontró carpeta /docs en el repositorio.}';

  // Badges de valoración
  const badge = (cond) => cond ? '\\real' : '\\roadmap';
  const nota = (cond, si, no) => esc(cond ? si : no);

  const tieneCI     = d.features.some(f => f.nombre.includes('CI'));
  const tieneDocker = d.features.some(f => f.nombre.includes('Docker'));
  const tieneEnv    = d.features.some(f => f.nombre.includes('entorno'));
  const tieneFront  = d.features.some(f => f.nombre.includes('Frontend'));
  const tieneBack   = d.features.some(f => f.nombre.includes('Backend'));

  // Recomendaciones automáticas
  const recomendaciones = [];
  if (!d.tiene_tests)    recomendaciones.push('Añadir suite de tests automatizados (vitest, pytest, jest)');
  if (!d.tiene_readme)   recomendaciones.push('Crear README.md con descripción, instrucciones de instalación y uso');
  if (!tieneCI)          recomendaciones.push('Configurar GitHub Actions para CI/CD en cada push');
  if (!tieneDocker)      recomendaciones.push('Dockerizar la aplicación para despliegue reproducible');
  if (!tieneEnv)         recomendaciones.push('Usar .env + .env.example para gestionar configuración por entorno');
  if (d.git.commits < 10) recomendaciones.push('Aumentar frecuencia de commits con mensajes descriptivos');
  if (!d.docs.tiene_docs) recomendaciones.push('Crear carpeta /docs con documentación técnica y de producto');
  if (recomendaciones.length === 0) recomendaciones.push('El repositorio tiene una base técnica sólida — continuar con las mismas prácticas');

  const recomendacionesLatex = recomendaciones
    .map(r => `  \\item ${esc(r)}`)
    .join('\n');

  // Commit limpio para LaTeX
  const commitLimpio = d.git.ultimo_commit
    ? esc(d.git.ultimo_commit.slice(0, 50))
    : 'Sin historial git';

  return template
    .replace(/{{NOMBRE}}/g,           esc(d.nombre))
    .replace(/{{TAGLINE}}/g,          esc(d.tagline || d.descripcion.slice(0, 80)))
    .replace(/{{DESCRIPCION}}/g,      esc(d.descripcion || 'Sin descripción disponible en el repositorio.'))
    .replace(/{{FECHA}}/g,            d.fecha)
    .replace(/{{NOMBRE_REPO}}/g,      esc(path.basename(d.directorio)))
    .replace(/{{LENGUAJE_PRINCIPAL}}/g, esc(d.lenguaje_principal))
    .replace(/{{STACK_RESUMEN}}/g,    esc(d.stack_resumen))
    .replace(/{{STACK_BACKEND}}/g,    stackItems(d.stack.backend))
    .replace(/{{STACK_FRONTEND}}/g,   stackItems(d.stack.frontend))
    .replace(/{{STACK_INFRA}}/g,      stackItems([...d.stack.infra, ...d.stack.ia, ...d.stack.bd]))
    .replace(/{{TOTAL_ARCHIVOS}}/g,   String(d.estadisticas.total_archivos))
    .replace(/{{TESTS_TOTAL}}/g,      String(d.tests.archivos || d.tests.total || '0'))
    .replace(/{{COMMITS_TOTAL}}/g,    String(d.git.commits || '---'))
    .replace(/{{ULTIMO_COMMIT}}/g,    commitLimpio)
    .replace(/{{AUTOR}}/g,            esc(d.git.autor || 'Desconocido'))
    .replace(/{{TIENE_DOCS}}/g,       d.docs.tiene_docs ? 'Sí — carpeta /docs presente' : 'No encontrada')
    .replace(/{{FEATURES_ROWS}}/g,    featuresRows)
    .replace(/{{LENGUAJES_ROWS}}/g,   lenguajesRows)
    .replace(/{{DOCS_SECTION}}/g,     docsSection)
    // Badges valoración
    .replace(/{{BADGE_TESTS}}/g,    badge(d.tiene_tests))
    .replace(/{{BADGE_README}}/g,   badge(d.tiene_readme))
    .replace(/{{BADGE_CI}}/g,       badge(tieneCI))
    .replace(/{{BADGE_DOCKER}}/g,   badge(tieneDocker))
    .replace(/{{BADGE_ENV}}/g,      badge(tieneEnv))
    .replace(/{{BADGE_FRONTEND}}/g, badge(tieneFront))
    .replace(/{{BADGE_BACKEND}}/g,  badge(tieneBack))
    // Notas valoración
    .replace(/{{NOTA_TESTS}}/g,    nota(d.tiene_tests, `${d.tests.archivos} archivos de test (${(d.tests.frameworks || []).join(', ') || 'detectados'})`, 'No se encontraron tests'))
    .replace(/{{NOTA_README}}/g,   nota(d.tiene_readme, 'README.md presente y con contenido', 'No hay README'))
    .replace(/{{NOTA_CI}}/g,       nota(tieneCI, 'GitHub Actions configurado', 'Sin pipeline CI/CD'))
    .replace(/{{NOTA_DOCKER}}/g,   nota(tieneDocker, 'Dockerfile / docker-compose detectado', 'Sin containerización'))
    .replace(/{{NOTA_ENV}}/g,      nota(tieneEnv, '.env / .env.example detectado', 'Sin gestión de variables de entorno'))
    .replace(/{{NOTA_FRONTEND}}/g, nota(tieneFront, 'Frontend moderno detectado', 'Sin frontend identificado'))
    .replace(/{{NOTA_BACKEND}}/g,  nota(tieneBack, 'Backend / API detectado', 'Sin backend identificado'))
    // Recomendaciones
    .replace(/{{RECOMENDACIONES}}/g, recomendacionesLatex);
}

// ─── Fallback HTML para Playwright ───────────────────────────────────────────

function construirHtmlFallback(analisis) {
  const d = analisis;
  const tieneCI     = d.features.some(f => f.nombre.includes('CI'));
  const tieneDocker = d.features.some(f => f.nombre.includes('Docker'));

  return `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8">
<title>${d.nombre} — Portfolio</title>
<style>
:root{--accent:#0d9488;--text:#1a202c;--muted:#4a5568;--border:#e2e8f0;--green:#065f46;--warn:#b45309;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Segoe UI',sans-serif;color:var(--text);line-height:1.6;font-size:13px;background:#f0fdfa;}
.page{max-width:700px;margin:20px auto;padding:36px 44px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.06);}
h1{font-size:1.5rem;color:var(--accent);border-bottom:3px solid var(--accent);padding-bottom:8px;margin-bottom:16px;}
h2{font-size:1.1rem;color:var(--text);margin:20px 0 10px;border-left:3px solid var(--accent);padding-left:10px;}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;}
th,td{border:1px solid var(--border);padding:7px 10px;text-align:left;}
th{background:#ccfbf1;font-weight:600;}
.badge-real{background:#d1fae5;color:var(--green);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;}
.badge-no{background:#f1f5f9;color:var(--muted);padding:2px 8px;border-radius:4px;font-size:11px;}
ul{margin-left:20px;margin-bottom:12px;}li{margin-bottom:4px;}
.footer{font-size:11px;color:var(--muted);margin-top:24px;padding-top:12px;border-top:1px solid var(--border);text-align:center;}
</style></head><body><div class="page">
<h1>${d.nombre}</h1>
<p><em>${d.tagline || d.descripcion}</em></p>
<p style="color:var(--muted);font-size:11px;margin-top:4px">Generado por Artificial World · ${d.fecha}</p>

<h2>Descripción</h2><p>${d.descripcion || 'Sin descripción.'}</p>

<h2>Stack detectado</h2>
<table><tr><th>Área</th><th>Tecnologías</th></tr>
<tr><td>Backend</td><td>${d.stack.backend.join(', ') || '---'}</td></tr>
<tr><td>Frontend</td><td>${d.stack.frontend.join(', ') || '---'}</td></tr>
<tr><td>BD</td><td>${d.stack.bd.join(', ') || '---'}</td></tr>
<tr><td>Infra / IA</td><td>${[...d.stack.infra, ...d.stack.ia].join(', ') || '---'}</td></tr>
</table>

<h2>Estadísticas</h2>
<table><tr><th>Métrica</th><th>Valor</th></tr>
<tr><td>Archivos totales</td><td>${d.estadisticas.total_archivos}</td></tr>
<tr><td>Lenguaje principal</td><td>${d.lenguaje_principal}</td></tr>
<tr><td>Tests</td><td>${d.tests.archivos} archivos</td></tr>
<tr><td>Commits</td><td>${d.git.commits}</td></tr>
<tr><td>Autor</td><td>${d.git.autor}</td></tr>
</table>

<h2>Características</h2>
<ul>${d.features.map(f => `<li>${f.icono} ${f.nombre}</li>`).join('')}</ul>

<h2>Valoración técnica</h2>
<table><tr><th>Área</th><th>Estado</th></tr>
<tr><td>Tests</td><td><span class="${d.tiene_tests ? 'badge-real' : 'badge-no'}">${d.tiene_tests ? 'REAL' : 'PENDIENTE'}</span></td></tr>
<tr><td>README</td><td><span class="${d.tiene_readme ? 'badge-real' : 'badge-no'}">${d.tiene_readme ? 'REAL' : 'PENDIENTE'}</span></td></tr>
<tr><td>CI/CD</td><td><span class="${tieneCI ? 'badge-real' : 'badge-no'}">${tieneCI ? 'REAL' : 'PENDIENTE'}</span></td></tr>
<tr><td>Docker</td><td><span class="${tieneDocker ? 'badge-real' : 'badge-no'}">${tieneDocker ? 'REAL' : 'PENDIENTE'}</span></td></tr>
</table>

<p class="footer">Artificial World · Cosigein SL · ${d.fecha} · Constrúyelo. Habítalo. Haz que crezca.</p>
</div></body></html>`;
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

async function main() {
  const opts = parsearArgs();
  const inicio = Date.now();

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Artificial World — Generador de Portfolio Externo  ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1. Resolver directorio del repo
  let dirRepo;
  let esTemporal = false;

  if (opts.self) {
    dirRepo = ROOT;
    console.log('  Modo: autodiagnóstico del propio repo');
  } else if (opts.repo) {
    dirRepo = path.resolve(opts.repo);
    console.log(`  Modo: repo local → ${dirRepo}`);
  } else if (opts.github) {
    console.log(`  Modo: GitHub → ${opts.github}`);
    dirRepo = clonarRepo(opts.github, opts.token);
    esTemporal = true;
  }

  // 2. Analizar
  console.log('\n  [1/4] Analizando repositorio...');
  const analisis = await analizarRepo(dirRepo);

  console.log(`        Nombre:    ${analisis.nombre}`);
  console.log(`        Lenguaje:  ${analisis.lenguaje_principal}`);
  console.log(`        Archivos:  ${analisis.estadisticas.total_archivos}`);
  console.log(`        Tests:     ${analisis.tests.archivos} archivos`);
  console.log(`        Features:  ${analisis.features.length} detectadas`);
  console.log(`        Git:       ${analisis.git.commits} commits — ${analisis.git.autor}`);

  // 3. Construir .tex
  console.log('\n  [2/4] Construyendo documento LaTeX...');
  const nombreBase = `portfolio-${analisis.nombre.replace(/\s+/g, '-').toLowerCase()}-${analisis.fecha}`;
  fs.mkdirSync(opts.output, { recursive: true });
  const texPath = path.join(opts.output, `${nombreBase}.tex`);
  const pdfPath = path.join(opts.output, `${nombreBase}.pdf`);

  const texContent = construirTex(analisis);
  fs.writeFileSync(texPath, texContent, 'utf8');
  console.log(`        .tex → ${texPath}`);

  // 4. Compilar PDF
  console.log('\n  [3/4] Compilando PDF...');
  const latex = verificarLatex();

  if (latex.disponible) {
    console.log(`        Compilador: ${latex.compilador} (${latex.version.slice(0, 40)})`);
    try {
      await compilarLatex(texPath, opts.output);
      console.log(`        PDF LaTeX → ${pdfPath}`);
    } catch (err) {
      console.warn(`        [WARN] Error LaTeX: ${err.message}`);
      console.warn('        Usando fallback Playwright...');
      const html = construirHtmlFallback(analisis);
      await compilarConPlaywright(html, pdfPath);
      console.log(`        PDF Playwright → ${pdfPath}`);
    }
  } else {
    console.log('        LaTeX no disponible — usando Playwright como fallback');
    const html = construirHtmlFallback(analisis);
    await compilarConPlaywright(html, pdfPath);
    console.log(`        PDF → ${pdfPath}`);
    console.log('\n        [INFO] Para PDFs con formato LaTeX completo, instala:');
    console.log('        Windows: https://miktex.org/download');
    console.log('        Linux:   sudo apt install texlive-latex-base texlive-lang-spanish');
  }

  // 5. Resumen
  const duracion = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log('\n  [4/4] Listo.\n');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log(`  │  PDF:  ${path.basename(pdfPath)}`);
  console.log(`  │  TEX:  ${path.basename(texPath)}`);
  console.log(`  │  Repo: ${analisis.nombre}`);
  console.log(`  │  Tiempo: ${duracion}s`);
  console.log('  └─────────────────────────────────────────────────────┘\n');

  // Limpiar clon temporal
  if (esTemporal && dirRepo) {
    try { fs.rmSync(dirRepo, { recursive: true, force: true }); }
    catch { /* no crítico */ }
  }

  return pdfPath;
}

main().catch(err => {
  console.error('\n  [ERROR]', err.message);
  process.exit(1);
});
