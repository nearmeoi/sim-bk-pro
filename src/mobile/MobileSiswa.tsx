import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { useBK } from '../context/BKContext';
import type { CatatPrefill } from './MobileCatatSheet';
import type { Student } from '../types';
import { DocPreview, PreviewButton, type DocSpec } from './docPreview';
import { TableHint } from './ui';

interface MobileSiswaProps {
  onOpenStudent: (student: Student) => void;
  onCatat: (prefill?: CatatPrefill) => void;
}

const PAGE_SIZE = 20;

const normalizeKelas = (kelas: string) => kelas.toUpperCase().replace(/[^0-9A-Z]/g, '');

const statusSiswa = (status: Student['status']) => {
  if (status === 'Aktif') return 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]';
  if (status === 'Pindah') return 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]';
  return 'bg-[#E0E7FF] text-[#3730A3] border-[#A5B4FC]';
};

export default function MobileSiswa({ onOpenStudent, onCatat }: MobileSiswaProps) {
  const { students, records, settings } = useBK();
  const [q, setQ] = useState('');
  const [tingkat, setTingkat] = useState('');
  const [rombel, setRombel] = useState('');
  const [page, setPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);

  const tingkatOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      const n = normalizeKelas(s.kelas);
      if (/^\d/.test(n)) set.add(n.charAt(0));
    });
    return Array.from(set).sort();
  }, [students]);

  const rombelOptions = useMemo(() => {
    if (!tingkat) return [] as string[];
    const set = new Set<string>();
    students.forEach((s) => {
      const m = normalizeKelas(s.kelas).match(/^(\d)([A-Z]+)$/);
      if (m && m[1] === tingkat) set.add(m[2]);
    });
    return Array.from(set).sort();
  }, [students, tingkat]);

  const filtered = useMemo(() => {
    const lq = q.trim().toLowerCase();
    return students
      .filter((s) => {
        const n = normalizeKelas(s.kelas);
        if (tingkat && n.charAt(0) !== tingkat) return false;
        if (rombel && n !== `${tingkat}${rombel}`) return false;
        if (!lq) return true;
        return (
          s.nama.toLowerCase().includes(lq) ||
          s.nis.includes(lq) ||
          s.kelas.toLowerCase().includes(lq)
        );
      })
      .sort(
        (a, b) =>
          normalizeKelas(a.kelas).localeCompare(normalizeKelas(b.kelas), 'id') ||
          a.nama.localeCompare(b.nama, 'id'),
      );
  }, [students, q, tingkat, rombel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, filtered.length);

  // Nomor halaman ringkas — sama dengan versi PC
  const pageNumbers = useMemo(() => {
    const items: (number | 'gap')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    items.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) items.push('gap');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < totalPages - 1) items.push('gap');
    items.push(totalPages);
    return items;
  }, [page, totalPages]);

  // Kembali ke halaman 1 saat pencarian/filter berubah
  useEffect(() => {
    setPage(1);
  }, [q, tingkat, rombel]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'BUKU CATATAN PESERTA DIDIK',
      subtitle: tingkat ? `( KELAS ${tingkat}${rombel || ''} )` : '( SEMUA KELAS )',
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
      ],
      signature: false,
      sections: [
        {
          columns: [
            { label: 'NO', align: 'center', width: '5%' },
            { label: 'NAMA SISWA' },
            { label: 'NIS', align: 'center', width: '11%' },
            { label: 'NISN', align: 'center', width: '13%' },
            { label: 'L/P', align: 'center', width: '6%' },
            { label: 'KELAS', align: 'center', width: '8%' },
            { label: 'STATUS', align: 'center', width: '10%' },
          ],
          rows: filtered.map((s, i) => [
            i + 1,
            s.nama,
            s.nis || '-',
            s.nisn || '-',
            s.jk || '-',
            s.kelas,
            s.status,
          ]),
        },
      ],
    }),
    [filtered, tingkat, rombel, settings],
  );

  return (
    <div className="fade-up space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-[750] text-text tracking-tight leading-tight">
            Data Siswa
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            {filtered.length} siswa
            {rombel ? ` · Kelas ${tingkat}${rombel}` : tingkat ? ` · Kelas ${tingkat}` : ''}
          </p>
        </div>
        <PreviewButton onClick={() => setPreviewOpen(true)} />
      </div>

      {/* Pencarian — gaya sama dengan SiswaView versi PC */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          strokeWidth={2}
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          type="search"
          placeholder="Cari nama siswa, NIS, atau kelas..."
          className="w-full min-h-[50px] pl-11 pr-4 rounded-[16px] bg-surface text-text text-[15px] shadow-[0_1px_2px_rgb(0_0_0/0.03),0_4px_12px_rgb(0_0_0/0.06)] border border-border/80 placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all"
        />
      </div>

      {/* Chips tingkat */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar py-1">
        {[{ key: '', label: 'Semua' }, ...tingkatOptions.map((t) => ({ key: t, label: `Kelas ${t}` }))].map(
          (f) => (
            <button
              key={f.key || 'semua'}
              type="button"
              onClick={() => {
                setTingkat(f.key);
                setRombel('');
                setPage(1);
              }}
              aria-pressed={tingkat === f.key}
              className={`bk-chip m-glass-chip ${tingkat === f.key ? 'on' : ''}`}
            >
              {f.label}
            </button>
          ),
        )}
      </div>

      {/* Chips rombel */}
      {tingkat && rombelOptions.length > 0 && (
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar py-1">
          <span className="flex-none pl-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted">
            Rombel
          </span>
          <button
            type="button"
            onClick={() => {
              setRombel('');
              setPage(1);
            }}
            aria-pressed={rombel === ''}
            className={`bk-chip m-glass-chip ${rombel === '' ? 'on' : ''}`}
          >
            Semua {tingkat}
          </button>
          {rombelOptions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRombel(r);
                setPage(1);
              }}
              aria-pressed={rombel === r}
              className={`bk-chip m-glass-chip !px-5 ${rombel === r ? 'on' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Tabel siswa — struktur & gaya sama persis dengan SiswaView versi PC */}
      <div className="border border-black bg-white p-3.5 text-black shadow-sm">
        <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
          <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
            BUKU CATATAN PESERTA DIDIK{' '}
            {tingkat ? `( KELAS ${tingkat}${rombel || ''} )` : '( SEMUA KELAS )'}
          </h2>
          <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">
            {settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN{' '}
            {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        <TableHint className="!text-black/55" />
        <div className="-mx-3.5 overflow-x-auto border-t border-black">
          <table className="w-full min-w-[760px] border-collapse border border-black text-[12px]">
            <thead>
              <tr className="bg-gray-100 font-extrabold uppercase text-black">
                <th className="w-10 border border-black px-2 py-2 text-center">NO</th>
                <th className="min-w-[200px] border border-black px-3 py-2 text-left">
                  NAMA SISWA
                </th>
                <th className="w-20 border border-black px-2 py-2 text-center">NIS</th>
                <th className="w-28 border border-black px-2 py-2 text-center">NISN</th>
                <th className="w-12 border border-black px-1.5 py-2 text-center">L/P</th>
                <th className="w-16 border border-black px-2 py-2 text-center">KELAS</th>
                <th className="w-28 border border-black px-2 py-2 text-center">
                  RIWAYAT KASUS
                </th>
                <th className="w-20 border border-black px-2 py-2 text-center">STATUS</th>
                <th className="w-20 border border-black px-2 py-2 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black px-4 py-10 text-center">
                    <Users size={28} className="mx-auto mb-2 text-muted/50" />
                    <p className="text-[13px] font-bold text-text">
                      {students.length === 0 ? 'Belum ada data siswa' : 'Siswa tidak ditemukan'}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Coba sesuaikan kata kunci pencarian atau filter kelas.
                    </p>
                  </td>
                </tr>
              ) : (
                shown.map((s, i) => {
                  const sRecords = records.filter((r) => r.studentId === s.id);
                  const hasActiveCase = sRecords.some((r) => r.status === 'Proses');
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onOpenStudent(s)}
                      className="cursor-pointer transition-colors hover:bg-primary-tint group"
                    >
                      <td className="border border-black px-2 py-2 text-center font-bold">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="whitespace-nowrap border border-black px-3 py-2 font-bold text-black">
                        <div className="flex items-center gap-2">
                          <span className="transition-colors group-hover:text-text">{s.nama}</span>
                          {hasActiveCase && (
                            <span
                              className="h-2 w-2 flex-none animate-pulse rounded-full bg-alert"
                              title="Ada kasus berjalan"
                            />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-2 text-center font-medium">
                        {s.nis || '-'}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-2 text-center text-gray-700">
                        {s.nisn || '-'}
                      </td>
                      <td className="whitespace-nowrap border border-black px-1.5 py-2 text-center font-bold">
                        {s.jk || '-'}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-2 text-center font-bold text-gray-700">
                        {s.kelas}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-2 text-center">
                        {sRecords.length > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              hasActiveCase
                                ? 'bg-alert-tint text-alert'
                                : 'bg-neutral-200 text-neutral-800'
                            }`}
                          >
                            {sRecords.length} Catatan
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusSiswa(
                            s.status,
                          )}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStudent(s);
                            }}
                            className="rounded-[8px] bg-accent px-2.5 py-1 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 active:scale-95"
                          >
                            Buka
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCatat({ nama: s.nama, kelas: s.kelas });
                            }}
                            aria-label={`Catat layanan untuk ${s.nama}`}
                            className="rounded-[8px] border border-black/20 p-1 text-muted transition-colors hover:bg-gray-100 hover:text-text"
                            title="Catat layanan baru"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
          <p>
            Menampilkan{' '}
            <span className="font-bold text-text">
              {startIdx}–{endIdx}
            </span>{' '}
            dari <span className="font-bold text-text">{filtered.length}</span> siswa
          </p>
          <p className="font-semibold text-text">{settings.namaSekolah || 'SIM BK PRO'}</p>
        </div>
      </div>

      {/* Pagination — sama dengan versi PC */}
      {totalPages > 1 && (
        <nav
          className="flex flex-wrap items-center justify-center gap-1.5"
          aria-label="Navigasi halaman"
        >
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            aria-label="Halaman pertama"
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-black/15 bg-white text-text transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-black/15 bg-white text-text transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers.map((p, i) =>
            p === 'gap' ? (
              <span
                key={`gap-${i}`}
                className="select-none px-1 text-xs font-bold text-muted"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`h-9 min-w-9 rounded-[10px] border px-2 text-[12px] font-bold tabular-nums transition-colors ${
                  p === page
                    ? 'border-accent bg-accent text-white shadow-sm'
                    : 'border-black/15 bg-white text-text hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Halaman berikutnya"
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-black/15 bg-white text-text transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            aria-label="Halaman terakhir"
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-black/15 bg-white text-text transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white"
          >
            <ChevronsRight size={16} />
          </button>
        </nav>
      )}

      <DocPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        spec={docSpec}
        settings={settings}
      />
    </div>
  );
}
