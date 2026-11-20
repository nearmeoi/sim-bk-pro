import { useMemo, useState } from 'react';
import { Download, Edit2, Plus, Trash2 } from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { confirmDialog } from '../../components/ui/ConfirmModal';
import { exportToCsv } from '../../lib/exportCsv';
import type { ProtaItem } from '../../types';
import { DetailBar, Field, PageHeader, Sheet, TableHint, inputCls, smallBtnCls } from '../ui';
import { DocPreview, PreviewButton, type DocSpec } from '../docPreview';

interface MobileProtaProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const MONTH_NAMES = ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
const KOMPONEN = [
  'Layanan Dasar',
  'Layanan Responsif',
  'Peminatan & Perencanaan',
  'Dukungan Sistem',
];
const BIDANG = [
  'Pribadi',
  'Sosial',
  'Belajar',
  'Karir',
  'Pribadi & Sosial',
  'Belajar & Karir',
  'Semua Bidang',
];

const blank = (): ProtaItem => ({
  id: String(Date.now()),
  komponen: 'Layanan Dasar',
  jenis: '',
  bidang: 'Pribadi',
  months: Array(12).fill(false),
  volume: 12,
  sasaran: 'Semua siswa kelas 7, 8, dan 9',
});

export default function MobileProta({ onBack, onToast }: MobileProtaProps) {
  const {
    protaList,
    addProtaItem,
    updateProtaItem,
    deleteProtaItem,
    settings,
    akpdProtaTargets,
    setAkpdProtaTargets,
  } = useBK();
  const [draft, setDraft] = useState<ProtaItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const totalVolume = useMemo(
    () => protaList.reduce((sum, p) => sum + (Number(p.volume) || 0), 0),
    [protaList],
  );

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'PROGRAM TAHUNAN (PROTA)',
      subtitle: 'BIMBINGAN & KONSELING',
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
        `Total alokasi: ${totalVolume} jam · ${protaList.length} program`,
      ],
      landscape: true,
      signature: true,
      sections: [
        {
          columns: [
            { label: 'NO', align: 'center', width: '4%' },
            { label: 'KOMPONEN', align: 'left', width: '13%' },
            { label: 'JENIS LAYANAN', align: 'left' },
            { label: 'BIDANG', align: 'center', width: '10%' },
            ...MONTH_NAMES.map((m) => ({ label: m.toUpperCase(), align: 'center' as const, width: '3.2%' })),
            { label: 'VOL', align: 'center', width: '5%' },
            { label: 'SASARAN', align: 'left', width: '15%' },
          ],
          rows: protaList.map((p, i) => [
            i + 1,
            p.komponen,
            p.jenis,
            p.bidang,
            ...p.months.map((m) => (m ? '✓' : '-')),
            p.volume,
            p.sasaran || '-',
          ]),
        },
      ],
    }),
    [protaList, settings, totalVolume],
  );

  const openAdd = () => {
    setDraft(blank());
    setIsNew(true);
  };

  const openEdit = (item: ProtaItem) => {
    setDraft({ ...item, months: [...item.months] });
    setIsNew(false);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.jenis.trim() || !draft.sasaran.trim()) {
      onToast('Nama kegiatan dan sasaran wajib diisi.');
      return;
    }
    if (isNew) addProtaItem(draft);
    else updateProtaItem(draft.id, draft);
    onToast(isNew ? 'Program tahunan ditambahkan.' : 'Program tahunan diperbarui.');
    setDraft(null);
  };

  const hapus = async (item: ProtaItem) => {
    const ok = await confirmDialog({
      title: `Hapus program "${item.jenis}"?`,
      confirmLabel: 'Ya, Hapus',
      tone: 'danger',
    });
    if (!ok) return;
    deleteProtaItem(item.id);
    onToast('Program tahunan dihapus.');
  };

  const toggleMonth = (item: ProtaItem, index: number) => {
    const months = [...item.months];
    months[index] = !months[index];
    updateProtaItem(item.id, { months });
  };

  const toggleDraftMonth = (index: number) => {
    setDraft((d) => {
      if (!d) return d;
      const months = [...d.months];
      months[index] = !months[index];
      return { ...d, months };
    });
  };

  const exportCsv = () => {
    const headers = ['No', 'Komponen', 'Jenis Layanan', 'Bidang', ...MONTH_NAMES, 'Volume', 'Sasaran'];
    const rows = protaList.map((p, i) => [
      i + 1,
      p.komponen,
      p.jenis,
      p.bidang,
      ...p.months.map((m) => (m ? '✓' : '')),
      p.volume,
      p.sasaran,
    ]);
    exportToCsv(`Prota_${settings.namaSekolah.replace(/\s+/g, '_')}`, headers, rows);
    onToast('Program tahunan berhasil diekspor.');
  };

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

      <PageHeader
        title="Program Tahunan"
        subtitle={`${protaList.length} program · total ${totalVolume} jam`}
      />

      {akpdProtaTargets.length > 0 && (
        <div className="bk-card space-y-2 border-primary/30 !bg-primary-tint">
          <p className="text-xs font-bold text-accent">
            {akpdProtaTargets.length} usulan program dari hasil AKPD
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                akpdProtaTargets.forEach(({ id: _id, ...rest }) => addProtaItem(rest));
                onToast(`${akpdProtaTargets.length} program AKPD ditambahkan.`);
                setAkpdProtaTargets([]);
              }}
              className="bk-btn primary min-h-[44px] flex-1"
            >
              Tambahkan
            </button>
            <button
              type="button"
              onClick={() => setAkpdProtaTargets([])}
              className="bk-btn ghost min-h-[44px]"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* Tabel Prota — kolom & gaya sama persis dengan versi PC */}
      <div className="border border-black bg-white p-3.5 text-black shadow-sm">
        <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
          <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
            PROGRAM TAHUNAN (PROTA) BIMBINGAN & KONSELING
          </h2>
          <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">
            {settings.namaSekolah || 'SIM BK PRO'}, TAHUN AJARAN{' '}
            {settings.tahunAjaran || '2026/2027'} · TOTAL ALOKASI: {totalVolume} JAM
          </p>
        </div>

        {protaList.length === 0 ? (
          <div className="border border-black px-4 py-10 text-center">
            <p className="text-[13px] font-bold text-text">Belum ada program</p>
            <p className="mt-1 text-[11px] text-muted">
              Ketuk Tambah untuk menyusun Program Tahunan.
            </p>
          </div>
        ) : (
          <>
          <TableHint className="!text-black/55" />
          <div className="-mx-3.5 overflow-x-auto border-t border-black">
            <table className="w-full min-w-[980px] border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold uppercase text-black">
                  <th className="w-10 border border-black px-2 py-2 text-center">NO</th>
                  <th className="min-w-[260px] border border-black px-3 py-2 text-left">
                    KOMPONEN & URAIAN JENIS LAYANAN
                  </th>
                  <th className="w-32 border border-black px-2 py-2 text-left">BIDANG</th>
                  {MONTH_NAMES.map((m) => (
                    <th key={m} className="w-9 border border-black px-1 py-2 text-center">
                      {m}
                    </th>
                  ))}
                  <th className="w-14 border border-black px-1.5 py-2 text-center">VOL</th>
                  <th className="min-w-[180px] border border-black px-3 py-2 text-left">SASARAN</th>
                  <th className="w-20 border border-black px-2 py-2 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {protaList.map((row, i) => (
                  <tr key={row.id} className="transition-colors hover:bg-neutral-50/30">
                    <td className="border border-black px-2 py-2 text-center align-top font-bold">
                      {i + 1}
                    </td>
                    <td className="border border-black px-3 py-2 align-top">
                      <span className="mb-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                        {row.komponen}
                      </span>
                      <p className="font-bold leading-snug text-black">{row.jenis}</p>
                    </td>
                    <td className="border border-black px-2 py-2 align-top">
                      <span className="inline-block whitespace-nowrap rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-black">
                        {row.bidang}
                      </span>
                    </td>
                    {row.months.map((checked, mi) => (
                      <td
                        key={mi}
                        className="border border-black px-1 py-2 pt-3 text-center align-top"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMonth(row, mi)}
                          title={`${MONTH_NAMES[mi]}: ${checked ? 'Aktif' : 'Nonaktif'}`}
                          className="h-4 w-4 cursor-pointer rounded accent-black"
                        />
                      </td>
                    ))}
                    <td className="border border-black px-1.5 py-2 text-center align-top">
                      <input
                        type="number"
                        min={0}
                        value={row.volume}
                        onChange={(e) =>
                          updateProtaItem(row.id, {
                            volume: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="min-h-[32px] w-11 rounded border border-black/40 bg-white text-center text-xs font-bold shadow-xs focus:border-black focus:outline-none"
                      />
                    </td>
                    <td className="border border-black px-3 py-2 align-top text-xs font-medium leading-relaxed text-gray-800">
                      {row.sasaran || '-'}
                    </td>
                    <td className="border border-black px-2 py-2 text-center align-top">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          title="Edit program"
                          className="rounded p-1.5 text-muted transition-colors hover:bg-gray-100 hover:text-black"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => hapus(row)}
                          title="Hapus program"
                          className="rounded p-1.5 text-muted transition-colors hover:bg-alert-tint hover:text-alert"
                        >
                          <Trash2 size={15} />
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

        <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
          <p>Total: {protaList.length} Program Kerja Terjadwal</p>
          <p className="font-semibold text-text">{settings.namaSekolah || 'SIM BK PRO'}</p>
        </div>
      </div>

      <button type="button" onClick={exportCsv} className="bk-btn ghost min-h-[48px] w-full">
        <Download size={15} /> Unduh Prota (Excel/CSV)
      </button>

      <Sheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={isNew ? 'Tambah Program' : 'Edit Program'}
        subtitle="Program Tahunan BK"
        footer={
          <button type="button" onClick={save} className="bk-btn primary min-h-[48px] w-full">
            Simpan Program
          </button>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Komponen layanan">
              <select
                value={draft.komponen}
                onChange={(e) => setDraft({ ...draft, komponen: e.target.value })}
                className={inputCls}
              >
                {KOMPONEN.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Jenis / uraian kegiatan *">
              <textarea
                rows={2}
                value={draft.jenis}
                onChange={(e) => setDraft({ ...draft, jenis: e.target.value })}
                placeholder="Contoh: Bimbingan klasikal bidang belajar"
                className={`${inputCls} min-h-[76px] py-3`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Bidang">
                <select
                  value={draft.bidang}
                  onChange={(e) => setDraft({ ...draft, bidang: e.target.value })}
                  className={inputCls}
                >
                  {BIDANG.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Volume (jam)">
                <input
                  type="number"
                  min={1}
                  value={draft.volume}
                  onChange={(e) =>
                    setDraft({ ...draft, volume: Math.max(1, parseInt(e.target.value, 10) || 1) })
                  }
                  className={`${inputCls} text-center font-bold`}
                />
              </Field>
            </div>

            <Field label="Sasaran *">
              <input
                value={draft.sasaran}
                onChange={(e) => setDraft({ ...draft, sasaran: e.target.value })}
                placeholder="Semua siswa kelas 7, 8, dan 9"
                className={inputCls}
              />
            </Field>

            <div>
              <p className="mb-1.5 text-xs font-bold text-text">Bulan pelaksanaan</p>
              <div className="grid grid-cols-6 gap-1.5">
                {MONTH_NAMES.map((m, mi) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleDraftMonth(mi)}
                    aria-pressed={draft.months[mi]}
                    className={`min-h-[40px] rounded-[10px] text-[11px] font-bold transition-all ${
                      draft.months[mi] ? 'bg-accent text-white' : 'bg-black/[0.04] text-muted'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
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
