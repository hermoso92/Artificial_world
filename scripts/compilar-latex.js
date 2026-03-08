/**
 * compilar-latex.js
 * Compila un archivo .tex a PDF usando pdflatex (MiKTeX en Windows, TeX Live en Linux/Mac).
 * Intenta automáticamente el compilador disponible en el sistema.
 *
 * Uso:
 *   import { compilarLatex } from './compilar-latex.js'
 *   const pdfPath = await compilarLatex('/ruta/al/archivo.tex', '/ruta/salida/')
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── Detección de compilador ──────────────────────────────────────────────────

function detectarCompilador() {
  const candidatos = ['pdflatex', 'xelatex', 'lualatex'];
  for (const cmd of candidatos) {
    try {
      execSync(`${cmd} --version`, { stdio: 'pipe', timeout: 5000 });
      return cmd;
    } catch { /* no disponible */ }
  }
  return null;
}

// ─── Compilación ─────────────────────────────────────────────────────────────

/**
 * Compila un archivo .tex a PDF.
 * Ejecuta pdflatex dos veces (necesario para referencias cruzadas y ToC).
 *
 * @param {string} texPath    - Ruta absoluta al archivo .tex
 * @param {string} outputDir  - Directorio donde se dejará el PDF
 * @returns {Promise<string>}  - Ruta absoluta al PDF generado
 */
export async function compilarLatex(texPath, outputDir) {
  const compilador = detectarCompilador();
  if (!compilador) {
    throw new Error(
      'No se encontró pdflatex en el sistema.\n' +
      '  • Windows: instala MiKTeX desde https://miktex.org/download\n' +
      '  • Linux:   sudo apt install texlive-latex-base\n' +
      '  • Mac:     brew install --cask mactex-no-gui'
    );
  }

  const texDir  = path.dirname(texPath);
  const texFile = path.basename(texPath);
  const nombre  = texFile.replace('.tex', '');

  fs.mkdirSync(outputDir, { recursive: true });

  const opciones = {
    cwd: texDir,
    stdio: 'pipe',
    timeout: 60000,
    env: { ...process.env, TEXMFOUTPUT: outputDir },
  };

  const args = [
    '-interaction=nonstopmode',
    `-output-directory=${outputDir}`,
    texFile,
  ];

  // Primera pasada
  const r1 = spawnSync(compilador, args, opciones);
  if (r1.status !== 0 && r1.status !== null) {
    const log = r1.stdout?.toString() ?? '';
    const errorLine = log.split('\n').find(l => l.includes('Error') || l.startsWith('!')) ?? 'Error LaTeX';
    throw new Error(`Error en primera compilación LaTeX:\n${errorLine}\n\nLog completo:\n${log.slice(-800)}`);
  }

  // Segunda pasada (referencias, números de página)
  spawnSync(compilador, args, opciones);

  const pdfPath = path.join(outputDir, `${nombre}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`El PDF no se generó en: ${pdfPath}\nRevisa el log en: ${path.join(outputDir, nombre + '.log')}`);
  }

  // Limpieza de archivos auxiliares
  for (const ext of ['.aux', '.log', '.out', '.toc', '.fls', '.fdb_latexmk']) {
    const aux = path.join(outputDir, nombre + ext);
    if (fs.existsSync(aux)) fs.unlinkSync(aux);
  }

  return pdfPath;
}

/**
 * Verifica si LaTeX está disponible en el sistema.
 * @returns {{ disponible: boolean, compilador: string|null, version: string }}
 */
export function verificarLatex() {
  const compilador = detectarCompilador();
  if (!compilador) return { disponible: false, compilador: null, version: '' };
  try {
    const version = execSync(`${compilador} --version`, { stdio: 'pipe', timeout: 5000 })
      .toString().split('\n')[0].trim();
    return { disponible: true, compilador, version };
  } catch {
    return { disponible: false, compilador: null, version: '' };
  }
}

/**
 * Fallback: genera el PDF usando Playwright/Chromium si LaTeX no está disponible.
 * Requiere que Playwright esté instalado (viene con el proyecto).
 *
 * @param {string} htmlContent  - HTML completo del documento
 * @param {string} outputPath   - Ruta donde guardar el PDF
 * @returns {Promise<string>}
 */
export async function compilarConPlaywright(htmlContent, outputPath) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error('Playwright no está instalado. Ejecuta: npm install playwright');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });

  const tmpHtml = outputPath.replace('.pdf', '.html');
  fs.writeFileSync(tmpHtml, htmlContent, 'utf8');
  await page.goto(`file://${tmpHtml.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', right: '18mm', bottom: '22mm', left: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="font-size:9px;color:#64748b;width:100%;text-align:center;">' +
      '<span>Generado por Artificial World / Cosigein SL</span>' +
      ' · <span class="pageNumber"></span> / <span class="totalPages"></span>' +
      '</div>',
  });

  await browser.close();
  if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);

  return outputPath;
}
