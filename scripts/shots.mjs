/**
 * Cek tampilan sekali jalan: potret versi PC dan versi ponsel
 * di beberapa ukuran layar, lalu laporkan overflow horizontal + error konsol.
 *
 * Pakai:
 *   1. jalankan dev server:  npm run dev
 *   2. terminal lain:        npm run shots
 *
 * Login otomatis (opsional) lewat variabel lingkungan:
 *   SIM_BK_EMAIL=... SIM_BK_PASSWORD=... npm run shots
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SIM_BK_URL ?? 'http://localhost:5199';
const OUT = 'shots';
const EMAIL = process.env.SIM_BK_EMAIL;
const PASSWORD = process.env.SIM_BK_PASSWORD;

const SIZES = [
  { name: 'm-360', path: '/m/', width: 360, height: 800 },
  { name: 'm-390', path: '/m/', width: 390, height: 844 },
  { name: 'm-430', path: '/m/', width: 430, height: 932 },
  { name: 'tablet-768', path: '/', width: 768, height: 1024 },
  { name: 'pc-1280', path: '/', width: 1280, height: 900 },
  { name: 'pc-1440', path: '/', width: 1440, height: 900 },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const problems = [];

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(BASE + size.path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  // Login sekali per ukuran bila kredensial tersedia
  if (EMAIL && PASSWORD) {
    const email = page.locator('input[type="email"]');
    if (await email.count()) {
      await email.first().fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.getByRole('button', { name: /^Masuk/ }).first().click();
      await page.waitForTimeout(2500);
    }
  }

  await page.screenshot({ path: `${OUT}/${size.name}.png`, fullPage: true });

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    problems.push(
      `${size.name}: meluber ke samping (${overflow.scrollWidth}px > ${overflow.clientWidth}px)`,
    );
  }
  if (errors.length) {
    problems.push(`${size.name}: error — ${errors.join(' | ')}`);
  }

  console.log(
    `${overflow.scrollWidth > overflow.clientWidth + 1 ? 'GAGAL' : 'OK   '} ${size.name.padEnd(12)} ${size.path}`,
  );

  await context.close();
}

await browser.close();

if (problems.length) {
  console.log('\nMasalah yang ditemukan:');
  problems.forEach((p) => console.log(' - ' + p));
  process.exitCode = 1;
} else {
  console.log(`\nSemua ukuran aman. Potret tersimpan di folder ${OUT}/.`);
}
