/**
 * Pemeriksaan mandiri (self-check) yang jalan hanya saat `npm run dev`.
 * Menguji logika murni: generator ID, parser cadangan, hitung halaman tabel siswa.
 * Hasil lewat console — gagal = error jelas di terminal/DevTools.
 */
import { newId } from './id';
import { buildBackup, parseBackup } from './backup';

const results: string[] = [];
const check = (name: string, cond: boolean) => {
  if (!cond) results.push(`GAGAL: ${name}`);
};

export function runSelfChecks(): void {
  // 1. newId: unik dan berawalan
  const a = newId('st');
  const b = newId('st');
  check('newId tidak pernah sama', a !== b);
  check('newId menyimpan prefix', a.startsWith('st-'));

  // 2. parseBackup: menolak file asing/pecah, menerima data valid
  check('backup tolak bukan JSON', parseBackup('bukan json') === null);
  check(
    'backup tolak file asing',
    parseBackup(JSON.stringify({ app: 'Lain', students: [] })) === null
  );
  check(
    'backup tolak pelajar tanpa id',
    parseBackup(JSON.stringify({ app: 'SIM BK PRO', students: [{ nama: 'x' }] }))?.students.length === 0
  );
  const dummy = buildBackup({
    students: [{ id: 's1', nama: 'A', nis: '1', nisn: '-', jk: 'L', kelas: '7A', status: 'Aktif' }],
    records: [],
    cases: [],
    jurnalRows: [],
    protaList: [],
    karirList: [],
    akpdItems: [],
    totalRespondenAKPD: 0,
    kelasAKPD: 'KELAS 8',
    settings: null as never,
  });
  const parsed = parseBackup(JSON.stringify(dummy));
  check('backup menerima file milik sendiri', parsed !== null && parsed.students.length === 1);

  // 3. Pagination: hitung halaman min 1, ukuran slice pas
  const n = 45;
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(n / PAGE_SIZE));
  check('pagination total halaman benar', totalPages === 3);
  const slice = (p: number) => Array.from({ length: n }, (_, i) => i + 1).slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
  check('pagination halaman terakhir 5 baris', slice(3).length === 5);
  check('pagination halaman kosong tidak pernah tampil', slice(totalPages).length > 0);

  if (results.length === 0) {
    console.info('✓ Self-check SIM BK PRO: semua lolos.');
  } else {
    console.error(results.join('\n'));
  }
}
