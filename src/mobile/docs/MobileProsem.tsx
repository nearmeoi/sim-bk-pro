import { useMemo, useState } from 'react';
import { CalendarRange, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { confirmDialog } from '../../components/ui/ConfirmModal';
import { exportToCsv } from '../../lib/exportCsv';
import type { ProsemItem } from '../../types';
import { DetailBar, Field, PageHeader, Sheet, TableHint, inputCls, smallBtnCls } from '../ui';
import { DocPreview, PreviewButton, type DocSpec } from '../docPreview';

interface MobileProsemProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const MONTHS: { key: keyof ProsemItem['bulan']; label: string }[] = [
  { key: 'jul', label: 'Jul' },
  { key: 'agu', label: 'Agu' },
  { key: 'sep', label: 'Sep' },
  { key: 'okt', label: 'Okt' },
  { key: 'nov', label: 'Nov' },
  { key: 'des', label: 'Des' },
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Feb' },
  { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' },
  { key: 'mei', label: 'Mei' },
  { key: 'jun', label: 'Jun' },
];

const emptyMonths = (): ProsemItem['bulan'] => ({
  jul: false,
  agu: false,
  sep: false,
  okt: false,
  nov: false,
  des: false,
  jan: false,
  feb: false,
  mar: false,
  apr: false,
  mei: false,
  jun: false,
});

const withMonths = (keys: Array<keyof ProsemItem['bulan']>): ProsemItem['bulan'] => {
  const base = emptyMonths();
  keys.forEach((k) => {
    base[k] = true;
  });
  return base;
};

const DEFAULT_ITEMS: ProsemItem[] = [
  {
    id: '1',
    no: 1,
    kegiatan: 'Penyusunan Program Semester',
    semester: '1',
    bulan: withMonths(['jul', 'agu']),
    keterangan: 'Persiapan rencana kerja',
  },
  {
    id: '2',
    no: 2,
    kegiatan: 'Pelaksanaan Asesmen Kebutuhan (AKPD)',
    semester: '1',
    bulan: withMonths(['sep', 'okt', 'nov']),
    keterangan: 'Masa persiapan angket',
  },
  {
    id: '3',
    no: 3,
    kegiatan: 'Bimbingan Klasikal Bidang Karir Kelas 9',
    semester: '1',
    bulan: withMonths(['sep', 'okt', 'nov', 'des']),
    keterangan: 'Sesi klasikal per kelas',
  },
  {
    id: '4',
    no: 4,
    kegiatan: 'Penyusunan Laporan Bulanan',
    semester: '1',
    bulan: withMonths(['jul', 'agu', 'sep', 'okt', 'nov', 'des']),
    keterangan: 'Rekap tiap akhir bulan',
  },
  {
    id: '5',
    no: 5,
    kegiatan: 'Evaluasi Program Semester Ganjil',
    semester: '1',
    bulan: withMonths(['des']),
    keterangan: 'Laporan evaluasi',
  },
];

const blank = (no: number): ProsemItem => ({
  id: String(Date.now()),
  no,
  kegiatan: '',
  semester: '1',
  bulan: withMonths(['jul']),
  keterangan: '',
});

export default function MobileProsem({ onBack, onToast }: MobileProsemProps) {
  const { settings } = useBK();
  const [items, setItems] = useState<ProsemItem[]>(DEFAULT_ITEMS);
  const [draft, setDraft] = useState<ProsemItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'PROGRAM SEMESTER (PROSEM)',
      subtitle: 'BIMBINGAN & KONSELING',
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
        `${items.length} kegiatan bimbingan`,
      ],
      landscape: true,
      signature: true,
      sections: [
        {
          columns: [
            { label: 'NO', align: 'center', width: '4%' },
            { label: 'URAIAN KEGIATAN PROGRAM SEMESTER', align: 'left' },
            { label: 'SEMESTER', align: 'center', width: '9%' },
            ...MONTHS.map((m) => ({ label: m.label.toUpperCase(), align: 'center' as const, width: '3.2%' })),
            { label: 'KETERANGAN', align: 'left', width: '18%' },
          ],
          rows: items.map((it, i) => [
            it.no || i + 1,
            it.kegiatan,
            it.semester === '1' ? 'GANJIL' : 'GENAP',
            ...MONTHS.map((m) => (it.bulan[m.key] ? '✓' : '-')),
            it.keterangan || '-',
          ]),
        },
      ],
    }),
    [items, settings],
  );

  const openAdd = () => {
    setDraft(blank(items.length + 1));
    setIsNew(true);
  };

  const openEdit = (item: ProsemItem) => {
    setDraft({ ...item, bulan: { ...item.bulan } });
    setIsNew(false);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.kegiatan.trim()) {
      onToast('Nama kegiatan wajib diisi.');
      return;
    }
    if (isNew) setItems((prev) => [...prev, draft]);
    else setItems((prev) => prev.map((it) => (it.id === draft.id ? draft : it)));
    onToast(isNew ? 'Kegiatan semester ditambahkan.' : 'Kegiatan semester diperbarui.');
    setDraft(null);
  };

  const hapus = async (item: ProsemItem) => {
    const ok = await confirmDialog({
      title: `Hapus kegiatan "${item.kegiatan}"?`,
      confirmLabel: 'Ya, Hapus',
      tone: 'danger',
    });
    if (!ok) return;
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    onToast('Kegiatan semester dihapus.');
  };

  const toggleMonth = (item: ProsemItem, key: keyof ProsemItem['bulan']) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, bulan: { ...it.bulan, [key]: !it.bulan[key] } } : it,
      ),
    );
  };

  const toggleDraftMonth = (key: keyof ProsemItem['bulan']) => {
    setDraft((d) => (d ? { ...d, bulan: { ...d.bulan, [key]: !d.bulan[key] } } : d));
  };

  const exportCsv = () => {
    const headers = ['No', 'Kegiatan', 'Semester', ...MONTHS.map((m) => m.label), 'Keterangan'];
    const rows = items.map((it, i) => [
      i + 1,
      it.kegiatan,
      it.semester,
      ...MONTHS.map((m) => (it.bulan[m.key] ? '✓' : '')),
      it.keterangan,
    ]);
    exportToCsv(`Prosem_${settings.namaSekolah.replace(/\s+/g, '_')}`, headers, rows);
    onToast('Program semester berhasil diekspor.');
  };

  const semesterLabel = (s: ProsemItem['semester']) => (s === '1' ? 'Ganjil' : 'Genap');

  return (
    <div className="fade-up space-y-4">
      <DetailBar
        onBack={onBack}
        label="Dokumen"
        right={
          <div className="flex items-center gap-1.5">
            <PreviewButton onClick={() => setPreviewOpen(true)} />
            <button type="button" onClick={openAdd} className={smallBtnCls}>
              <Plus size={14} /> Tambah
            </button>
          </div>
        }
      />

      <PageHeader title="Program Semester" subtitle={`${items.length} kegiatan bimbingan`} />

      {/* Tabel Prosem — kolom & gaya sama persis dengan ProsemForm versi PC */}
      <div className="border border-black bg-white p-3.5 text-black shadow-sm">
        <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
          <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
            PROGRAM SEMESTER (PROSEM) BIMBINGAN & KONSELING
          </h2>
          <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">
            {settings.namaSekolah || 'SMP NEGERI 1 BINTANG'}, TAHUN AJARAN{' '}
            {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="border border-black px-4 py-10 text-center">
            <CalendarRange size={26} className="mx-auto mb-2 text-muted/50" />
            <p className="text-[13px] font-bold text-text">Belum ada kegiatan semester</p>
            <p className="mt-1 text-[11px] text-muted">
              Ketuk Tambah untuk menyusun Program Semester.
            </p>
          </div>
        ) : (
          <>
          <TableHint className="!text-black/55" />
          <div className="-mx-3.5 overflow-x-auto border-t border-black">
            <table className="w-full min-w-[600px] border-collapse border border-black text-[10px] sm:min-w-[760px] sm:text-[12px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold uppercase text-black">
                  <th className="w-10 border border-black px-2 py-2 text-center">NO</th>
                  <th className="min-w-[240px] border border-black px-3 py-2 text-left">
                    URAIAN KEGIATAN PROGRAM SEMESTER
                  </th>
                  <th className="w-24 border border-black px-2 py-2 text-center">SEMESTER</th>
                  {MONTHS.map((m) => (
                    <th key={m.key} className="w-8 border border-black px-1 py-2 text-center">
                      {m.label}
                    </th>
                  ))}
                  <th className="min-w-[180px] border border-black px-3 py-2 text-left">
                    KETERANGAN
                  </th>
                  <th className="w-20 border border-black px-2 py-2 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-gray-50/30">
                    <td className="border border-black px-2 py-2 text-center align-top font-bold">
                      {row.no}
                    </td>
                    <td className="border border-black px-3 py-2 align-top">
                      <p className="font-bold leading-snug text-black">{row.kegiatan}</p>
                    </td>
                    <td className="border border-black px-2 py-2 text-center align-top">
                      <span
                        className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-bold ${
                          row.semester === '1'
                            ? 'bg-neutral-200 text-neutral-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {semesterLabel(row.semester).toUpperCase()}
                      </span>
                    </td>
                    {MONTHS.map((m) => (
                      <td
                        key={m.key}
                        className="border border-black px-1 py-2 pt-3 text-center align-top"
                      >
                        <input
                          type="checkbox"
                          checked={row.bulan[m.key]}
                          onChange={() => toggleMonth(row, m.key)}
                          title={`${m.label}: ${row.bulan[m.key] ? 'Aktif' : 'Nonaktif'}`}
                          className="h-4 w-4 cursor-pointer rounded accent-black"
                        />
                      </td>
                    ))}
                    <td className="border border-black px-3 py-2 align-top">
                      <p className="text-xs leading-snug text-black">{row.keterangan}</p>
                    </td>
                    <td className="border border-black px-2 py-2 align-top">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="flex items-center justify-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-bold text-white transition-all hover:brightness-110"
                        >
                          <Pencil size={10} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => hapus(row)}
                          className="flex items-center justify-center gap-1 rounded bg-alert-tint px-2 py-1 text-[10px] font-bold text-alert transition-all hover:bg-alert-tint"
                        >
                          <Trash2 size={10} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-black pt-2.5 text-[10px] text-black">
          <p>Dokumen Program Semester BK – {settings.tahunAjaran || '2026/2027'}</p>
          <p className="font-bold">
            {settings.guruBK || 'Guru Bimbingan & Konseling'} –{' '}
            {settings.namaSekolah || 'SMP Negeri 1 Bintang'}
          </p>
        </div>
      </div>

      <button type="button" onClick={exportCsv} className="bk-btn ghost min-h-[48px] w-full">
        <Download size={15} /> Unduh Prosem (Excel/CSV)
      </button>

      <Sheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={isNew ? 'Tambah Kegiatan' : 'Edit Kegiatan'}
        subtitle="Program semester BK"
        footer={
          <button type="button" onClick={save} className="bk-btn primary min-h-[48px] w-full">
            Simpan Kegiatan
          </button>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Nama kegiatan *">
              <textarea
                rows={2}
                value={draft.kegiatan}
                onChange={(e) => setDraft({ ...draft, kegiatan: e.target.value })}
                placeholder="Contoh: Bimbingan klasikal bidang belajar"
                className={`${inputCls} min-h-[76px] py-3`}
              />
            </Field>

            <Field label="Semester">
              <select
                value={draft.semester}
                onChange={(e) =>
                  setDraft({ ...draft, semester: e.target.value as ProsemItem['semester'] })
                }
                className={inputCls}
              >
                <option value="1">Ganjil</option>
                <option value="2">Genap</option>
              </select>
            </Field>

            <div>
              <p className="mb-1.5 text-xs font-bold text-text">Bulan pelaksanaan</p>
              <div className="grid grid-cols-6 gap-1.5">
                {MONTHS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleDraftMonth(m.key)}
                    aria-pressed={draft.bulan[m.key]}
                    className={`min-h-[40px] rounded-[10px] text-[11px] font-bold transition-all ${
                      draft.bulan[m.key] ? 'bg-accent text-white' : 'bg-black/[0.04] text-muted'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Keterangan">
              <input
                value={draft.keterangan}
                onChange={(e) => setDraft({ ...draft, keterangan: e.target.value })}
                placeholder="Catatan pelaksanaan"
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </Sheet>

      <DocPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        spec={docSpec}
        settings={settings}
      />
    </div>
  );
}
