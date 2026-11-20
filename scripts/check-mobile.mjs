/**
 * Telusuri SEMUA halaman versi ponsel di beberapa lebar layar.
 * Melaporkan luberan horizontal per elemen + error konsol.
 *
 * Prasyarat: dev server jalan (npm run dev -- --port 5199) dan
 * BKContext sedang dipatch agar langsung masuk (hanya untuk pemeriksaan).
 *
 *   node scripts/check-mobile.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SIM_BK_URL ?? 'http://localhost:5199';
const OUT = 'shots/mobile';
mkdirSync(OUT, { recursive: true });

const SEED = {
  sim_bk_data_version: '2',
  sim_bk_students: JSON.stringify(
    Array.from({ length: 24 }, (_, i) => ({
      id: `s${i + 1}`,
      nis: `24010${i + 1}`,
      nisn: `0061234${i + 1}`,
      nama: `Siswa Contoh ${i + 1}`,
      kelas: ['7A', '8B', '9C'][i % 3],
      jk: i % 2 ? 'P' : 'L',
      status: 'Aktif',
      namaWali: `Wali Siswa ${i + 1}`,
      kontakWali: '081234567890',
      alamat: 'Jl. Pendidikan No. 1',
    })),
  ),
  sim_bk_records: JSON.stringify(
    Array.from({ length: 9 }, (_, i) => ({
      id: `r${i + 1}`,
      studentId: `s${i + 1}`,
      namaSiswa: `Siswa Contoh ${i + 1}`,
      kelas: ['7A', '8B', '9C'][i % 3],
      tanggal: new Date(2026, 8, 2 + i).toISOString().slice(0, 10),
      waktu: '09:00',
      jenis: ['Konseling Individual', 'Bimbingan Klasikal', 'Kunjungan Rumah'][i % 3],
      bidang: ['Pribadi', 'Sosial', 'Belajar', 'Karir'][i % 4],
      masalah: 'Contoh uraian masalah siswa untuk pemeriksaan tata letak.',
      tindakLanjut: 'Pendampingan dan pemantauan lanjutan.',
      status: i % 2 ? 'Selesai' : 'Proses',
    })),
  ),
  sim_bk_cases: JSON.stringify(
    Array.from({ length: 4 }, (_, i) => ({
      id: `c${i + 1}`,
      studentId: `s${i + 1}`,
      namaSiswa: `Siswa Contoh ${i + 1}`,
      kelas: '9C',
      masalah: 'Contoh deskripsi kasus kedisiplinan.',
      status: i % 2 ? 'Selesai' : 'Proses',
      tanggal: '2026-09-10',
    })),
  ),
  sim_bk_prota: JSON.stringify(
    Array.from({ length: 4 }, (_, i) => ({
      id: `p${i + 1}`,
      komponen: ['Layanan Dasar', 'Layanan Responsif', 'Peminatan & Perencanaan', 'Dukungan Sistem'][i],
      jenis: [
        'Bimbingan klasikal bidang belajar untuk seluruh kelas',
        'Konseling individual siswa dengan masalah kedisiplinan',
        'Bimbingan karir pemetaan sekolah lanjutan kelas 9',
        'Rapat koordinasi dengan wali kelas dan kepala sekolah',
      ][i],
      bidang: ['Belajar', 'Pribadi', 'Karir', 'Semua Bidang'][i],
      months: Array.from({ length: 12 }, (_, m) => (m + i) % 3 === 0),
      volume: [24, 12, 18, 8][i],
      sasaran: 'Semua siswa kelas 7, 8, dan 9',
    })),
  ),
  sim_bk_jurnal: JSON.stringify(
    Array.from({ length: 3 }, (_, i) => ({
      id: `j${i + 1}`,
      hariTanggal: `Senin, ${2 + i} September 2026`,
      waktu: '09:00',
      nama: `Siswa Contoh ${i + 1}`,
      kelas: ['7A', '8B', '9C'][i],
      jenis: ['Konseling Individual', 'Kunjungan Rumah', 'Konferensi Kasus'][i],
      topik:
        'Peserta didik mengeluhkan kesulitan mengatur waktu belajar dan sering merasa cemas menjelang ujian.',
      keterangan: 'Dijadwalkan pendampingan lanjutan pekan depan bersama wali kelas.',
    })),
  ),
  sim_bk_karir: JSON.stringify(
    Array.from({ length: 3 }, (_, i) => ({
      id: `k${i + 1}`,
      namaSiswa: `Siswa Contoh ${i + 1}`,
      kelas: ['9A', '9B', '9C'][i],
      noAbsen: String(i + 1),
      nis: `24010${i + 1}`,
      nisn: `0061234${i + 1}`,
      namaOrtu: `Orang Tua ${i + 1}`,
      noHpOrtu: '081234567890',
      rencanaSetelahSMP: 'SMA',
      alasanRencana: 'Ingin melanjutkan ke perguruan tinggi.',
      pilihan1Sekolah: ['SMAN 1 Makassar', 'SMKN 2 Makassar', 'SMAN 5 Makassar'][i],
      pilihan1Jurusan: ['MIPA', 'DKV', 'IPS'][i],
      pilihan1Jalur: 'Zonasi',
      pilihan1Alasan: 'Dekat dengan rumah.',
      pilihan2Sekolah: 'SMAS Muhammadiyah',
      pilihan2Jurusan: 'IPS',
      pilihan2Jalur: 'Prestasi',
      rencanaCadangan3: 'MA Negeri 1',
      citaCita: ['Dokter', 'Desainer Grafis', 'Guru'][i],
      alasanCitaCita: 'Ingin membantu banyak orang.',
      rencanaSetelahLanjutan: 'Kuliah (Perguruan Tinggi)',
      statusDiskusiOrtu: ['Setuju Penuh', 'Orang Tua Beda Pilihan', 'Belum Dibicarakan Mendalam'][i],
      aspirasiPilihanOrtu: 'Orang tua menyarankan sekolah terdekat.',
      kendalaKeluarga: 'Biaya transportasi.',
      rataRapor: '86',
      rekomendasiBK: 'Pilihan sudah realistis, lanjutkan pendampingan.',
      tindakLanjutBK: 'Rekomendasi Aman',
    })),
  ),
};

const VIEWPORTS = [320, 360, 390, 430];

/** Langkah navigasi: [nama, aksi async] */
const browser = await chromium.launch({ channel: 'chrome' });
const problems = [];

const measure = async (page, label, shot) => {
  await page.waitForTimeout(450);
  const res = await page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const offenders = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const right = r.right + window.scrollX;
      if (right > vw + 1 || r.left + window.scrollX < -1) {
        offenders.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} w=${Math.round(
            r.width,
          )} left=${Math.round(r.left)} right=${Math.round(right)}`,
        );
      }
    });
    return { scrollWidth: de.scrollWidth, vw, offenders: offenders.slice(0, 4) };
  });

  const bad = res.scrollWidth > res.vw + 1;
  console.log(`${bad ? 'GAGAL' : 'OK   '} ${label.padEnd(34)} ${res.scrollWidth}/${res.vw}`);
  if (bad) {
    problems.push(`${label}: meluber ${res.scrollWidth} > ${res.vw}`);
    res.offenders.forEach((o) => console.log(`        ↳ ${o}`));
  }
  if (shot) await page.screenshot({ path: `${OUT}/${shot}.png`, fullPage: true });
};

for (const width of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width, height: 780 },
    deviceScaleFactor: 2,
  });
  await context.addInitScript((seed) => {
    for (const [k, v] of Object.entries(seed)) window.localStorage.setItem(k, v);
  }, SEED);

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto(`${BASE}/m/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);

  const nav = (name) => page.locator('nav[aria-label="Navigasi utama"]').getByText(name, { exact: true });
  const openMenu = async () => {
    await nav('Menu').click();
    await page.waitForTimeout(400);
  };
  const menuItem = (name) => page.getByRole('dialog').getByText(name, { exact: true });

  await measure(page, `${width} beranda`, `${width}-beranda`);

  await nav('Siswa').click();
  await measure(page, `${width} siswa`, `${width}-siswa`);

  await nav('Dokumen').click();
  await measure(page, `${width} dokumen`, `${width}-dokumen`);

  const docs = [
    ['Program Tahunan (Prota)', 'prota'],
    ['Jurnal Harian BK', 'jurnal'],
    ['RPL 1-Lembar (Kurikulum Merdeka)', 'rpl'],
    ['Program Semester (Prosem)', 'prosem'],
    ['Laporan Bulanan BK', 'lapbul'],
    ['Laporan Semester BK', 'lapsem'],
  ];
  for (const [title, slug] of docs) {
    await page.getByText(title, { exact: true }).first().click();
    await measure(page, `${width} ${slug}`, `${width}-${slug}`);
    await page.getByRole('button', { name: /Kembali/ }).first().click();
    await page.waitForTimeout(250);
  }

  // AKPD & Karir dari daftar dokumen
  await page.getByText('Angket Kebutuhan (AKPD 50 Butir)', { exact: true }).first().click();
  await measure(page, `${width} akpd`, `${width}-akpd`);
  await page.getByRole('button', { name: /Kembali/ }).first().click();
  await page.waitForTimeout(250);

  await page.getByText('Bimbingan Karir (Pilihan SMA/SMK)', { exact: true }).first().click();
  await measure(page, `${width} karir`, `${width}-karir`);
  await page.getByRole('button', { name: /Kembali/ }).first().click();
  await page.waitForTimeout(250);

  await openMenu();
  await measure(page, `${width} menu`, `${width}-menu`);
  await menuItem('Pengaturan').click();
  await measure(page, `${width} pengaturan`, `${width}-pengaturan`);

  await openMenu();
  await menuItem('Profil').click();
  await measure(page, `${width} profil`, `${width}-profil`);

  if (errors.length) problems.push(`${width}px error konsol: ${errors.slice(0, 3).join(' | ')}`);
  await context.close();
}

await browser.close();

console.log('');
if (problems.length) {
  console.log('Masalah:');
  problems.forEach((p) => console.log(' - ' + p));
  process.exitCode = 1;
} else {
  console.log('Semua halaman ponsel aman di 320–430px.');
}
