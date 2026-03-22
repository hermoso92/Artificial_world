import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const htmlPath = resolve(projectRoot, 'docs', 'artificial_world_book.html');
const outPath  = resolve(projectRoot, 'docs', 'ARTIFICIAL_WORLD_BOOK.pdf');

const html = readFileSync(htmlPath, 'utf-8');

console.log('Lanzando Chromium...');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();

// Carga el HTML — sin esperar red (fuentes del sistema)
await page.setContent(html, {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});
// Deja tiempo para que el JS de los grids se ejecute
await new Promise(r => setTimeout(r, 1500));

// Espera a que las fuentes carguen si están disponibles
try { await page.evaluateHandle('document.fonts.ready'); } catch(e) {}

console.log('Generando PDF...');
await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="
      width:100%; font-size:7pt; font-family:'JetBrains Mono',monospace;
      color:#9ca3af; display:flex; justify-content:space-between;
      padding: 0 16mm;
    ">
      <span>Artificial World · Motor de Civilizaciones Emergentes · Cosigein SL · 2026</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`,
});

await browser.close();
console.log('PDF generado en: ' + outPath);
