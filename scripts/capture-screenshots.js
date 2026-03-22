/**
 * Captura screenshots de la aplicación Artificial World.
 * Requiere: app corriendo en http://localhost:5173 (ejecuta iniciar_fullstack.ps1 primero)
 * Uso: node scripts/capture-screenshots.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'tutorial', 'screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const BASE = 'http://localhost:5173';
const VIEWPORT = { width: 1280, height: 800 };

async function waitForApp(page, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 8000 });
      if (res && res.status() < 500) return true;
    } catch {
      if (i === maxAttempts - 1) throw new Error('La app no responde. Ejecuta: .\\scripts\\iniciar_fullstack.ps1');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('La app no responde en http://localhost:5173. Ejecuta: .\\scripts\\iniciar_fullstack.ps1');
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT });
const page = await context.newPage();

try {
  await waitForApp(page);
  console.log('App conectada. Capturando screenshots...');

  // 1. Landing
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('aw_onboarded'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, '01-landing.png'), fullPage: true });
  console.log('  ✓ 01-landing.png');

  // 2. Hub (skip onboarding)
  await page.click('button.landing-skip').catch(() => page.click('text=Ya tengo un mundo'));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '02-hub.png'), fullPage: true });
  console.log('  ✓ 02-hub.png');

  // 3. Tu Mundo (simulation)
  await page.goto(`${BASE}#simulation`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '03-simulation.png'), fullPage: true });
  console.log('  ✓ 03-simulation.png');

  // 4. Mission Control
  await page.goto(`${BASE}#missioncontrol`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '04-missioncontrol.png'), fullPage: true });
  console.log('  ✓ 04-missioncontrol.png');

  // 5. Hub de nuevo (vista general)
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '05-hub-cards.png'), fullPage: true });
  console.log('  ✓ 05-hub-cards.png');

  // 6. Panel Administrador (si existe enlace #admin)
  try {
    await page.goto(`${BASE}#admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '06-admin-panel.png'), fullPage: true });
    console.log('  ✓ 06-admin-panel.png');
  } catch {
    console.log('  ⚠ 06-admin-panel.png omitido (requiere ADMIN_PLAYER_IDS en .env)');
  }

  // 7. DobackSoft (si existe)
  try {
    await page.goto(`${BASE}#dobacksoft`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '07-dobacksoft.png'), fullPage: true });
    console.log('  ✓ 07-dobacksoft.png');
  } catch {
    console.log('  ⚠ 07-dobacksoft.png omitido');
  }

  console.log('\nScreenshots guardados en docs/tutorial/screenshots/');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await browser.close();
}
