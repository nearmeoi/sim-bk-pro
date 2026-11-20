/**
 * Cek tampilan portal siswa dengan respons API tiruan.
 * Tidak menulis apa pun ke Supabase.
 *
 * Pakai:
 *   1. jalankan dev server:  npm run dev
 *   2. terminal lain:        npm run shots:portal
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SIM_BK_URL ?? 'http://localhost:5199';
const OUT = 'shots/portal';
mkdirSync(OUT, { recursive: true });

const TOKEN = 'SIMBK1:0123456789abcdef0123456789abcdef';

const MOCK = {
  ok: true,
  student: { nama: 'Nurul Aulia', nis: '2210045', nisn: '0091234567', kelas: '8B' },
  school: { nama: 'SMP Negeri 34 Makassar', npsn: '40312345' },
  points: {
    point_scale: 1000,
    total_points: 340,
    total_guidebook_points: 34,
    balance: 660,
    semester_points: 190,
    year_points: 340,
    status: 'sp1',
    last_violation_at: '2026-11-18T02:00:00.000Z',
  },
  thresholds: [260, 510, 760, 1000],
  next_threshold: 510,
  next_type: 'sp2',
  violations: [
    { id: 'v1', occurred_at: '2026-11-18T02:00:00.000Z', rule_code: 'R05', rule_name: 'Pakaian Tidak Seragam / Atribut Tidak Lengkap', category: 'ringan', points: 100, guidebook_points: 10, location: 'Gerbang sekolah', status: 'recorded' },
    { id: 'v2', occurred_at: '2026-11-11T03:15:00.000Z', rule_code: 'R04', rule_name: 'Keterlambatan Hadir di Sekolah', category: 'ringan', points: 100, guidebook_points: 10, location: 'Kelas 8B', status: 'verified' },
    { id: 'v3', occurred_at: '2026-10-29T01:20:00.000Z', rule_code: 'R08', rule_name: 'Membuang Sampah Bukan Pada Tempatnya', category: 'ringan', points: 100, guidebook_points: 10, location: 'Kantin', status: 'recorded' },
    { id: 'v4', occurred_at: '2026-10-14T04:00:00.000Z', rule_code: 'R02', rule_name: 'Menjaga Kebersihan dan Keindahan Sekolah', category: 'kewajiban', points: 40, guidebook_points: 4, location: 'Koridor', status: 'void' },
  ],
  sp_letters: [
    { id: 'sp1', type: 'sp1', number: 'SP1/004/BK/2026', status: 'issued', total_points: 300, total_guidebook_points: 30, issued_at: '2026-11-12T01:00:00.000Z', meeting_at: '2026-11-15T02:00:00.000Z' },
  ],
  server_time: '2026-11-20T06:00:00.000Z',
};

const browser = await chromium.launch({ channel: 'chrome' });
const problems = [];

async function makePage(width, height, { withSession = false, login = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

  if (withSession) {
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        'sim_bk_portal_session_v1',
        JSON.stringify({
          token: 'a'.repeat(64),
          expiresAt: '2026-11-20T07:00:00.000Z',
        }),
      );
    });
  }

  await context.route('**/functions/v1/student-portal/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith('/login')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          session_token: 'a'.repeat(64),
          expires_at: '2026-11-20T07:00:00.000Z',
        }),
      });
    }
    if (url.endsWith('/logout')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK),
    });
  });

  await page.goto(`${BASE}/m/?card=${encodeURIComponent(TOKEN)}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1200);
  if (login) {
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /Masuk ke portal/i }).click();
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(400);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    problems.push(`${width}px meluber: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
  }

  return { context, page };
}

for (const width of [320, 360, 390, 430]) {
  const height = width <= 360 ? 780 : width === 390 ? 844 : 932;

  const loginView = await makePage(width, height);
  await loginView.page.screenshot({ path: `${OUT}/login-${width}.png`, fullPage: true });
  console.log(`login ${width}px selesai`);
  await loginView.context.close();

  const homeView = await makePage(width, height, { withSession: true });
  const heading = await homeView.page.locator('h1').first().innerText();
  if (!heading.includes('Nurul')) problems.push(`${width}px: nama siswa tidak tampil (${heading})`);
  await homeView.page.screenshot({ path: `${OUT}/home-${width}.png`, fullPage: true });
  console.log(`home ${width}px selesai`);
  await homeView.context.close();
}

const flow = await makePage(390, 844, { login: true });
await flow.page.screenshot({ path: `${OUT}/login-flow-390.png`, fullPage: true });
console.log('alur login selesai');
await flow.context.close();

await browser.close();

if (problems.length) {
  console.log('\nMasalah:');
  problems.forEach((problem) => console.log(' - ' + problem));
  process.exitCode = 1;
} else {
  console.log(`\nSemua ukuran aman. Potret di ${OUT}/.`);
}
