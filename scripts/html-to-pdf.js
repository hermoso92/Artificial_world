/**
 * Convierte docs/INFOGRAFIA_ARTIFICIAL_WORLD.html a PDF.
 * Requiere: npx playwright install chromium (si no está instalado)
 * Uso: node scripts/html-to-pdf.js
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'docs', 'INFOGRAFIA_ARTIFICIAL_WORLD.html');
const pdfPath = path.join(root, 'docs', 'INFOGRAFIA_ARTIFICIAL_WORLD.pdf');
const htmlUrl = pathToFileURL(htmlPath).href;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 1600 },
});
await page.goto(htmlUrl, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', right: '18mm', bottom: '22mm', left: '18mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-size:10px;color:#6b7280;width:100%;text-align:center;padding:0 20px;"><span>Artificial World</span> · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', pdfPath);
