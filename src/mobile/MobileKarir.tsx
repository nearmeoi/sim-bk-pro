import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useBK } from '../context/BKContext';
import { confirmDialog } from '../components/ui/ConfirmModal';
import { exportToCsv } from '../lib/exportCsv';
import { newId } from '../lib/id';
import type { IndividualKarirAngket } from '../types';
import {
  DetailBar,
  Field,
  PageHeader,
  Sheet,
  TableHint,
  inputCls,
  smallBtnCls,
  textareaCls,
} from './ui';
import { DocPreview, PreviewButton, type DocSpec } from './docPreview';

interface MobileKarirProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const JALUR1 = ['Zonasi', 'Prestasi Rapor/Lomba', 'Afirmasi', 'Tes Mandiri'] as const;
const JALUR2 = ['Zonasi', 'Prestasi', 'Afirmasi', 'Tes Mandiri'] as const;
const STATUS_ORTU = ['Setuju Penuh', 'Orang Tua Beda Pilihan', 'Belum Dibicarakan Mendalam'] as const;
const TINDAK = ['Rekomendasi Aman', 'Konseling Karir Lanjutan', 'Pemanggilan Orang Tua'] as const;

const blank = (kelas: string): IndividualKarirAngket => ({
  id: newId('kp'),
  namaSiswa: '',
  kelas,
  noAbsen: '',
  nis: '',
  nisn: '',
  namaOrtu: '',
  noHpOrtu: '',
  rencanaSetelahSMP: 'SMA',
  alasanRencana: '',
  pilihan1Sekolah: '',
  pilihan1Jurusan: '',
  pilihan1Jalur: 'Zonasi',
  pilihan1Alasan: '',
  pilihan2Sekolah: '',
  pilihan2Jurusan: '',
  pilihan2Jalur: 'Zonasi',
  rencanaCadangan3: '',
  citaCita: '',
  alasanCitaCita: '',
  rencanaSetelahLanjutan: 'Kuliah (Perguruan Tinggi)',
  statusDiskusiOrtu: 'Setuju Penuh',
  aspirasiPilihanOrtu: '',
  kendalaKeluarga: '',
  rataRapor: '',
  rekomendasiBK: '',
  tindakLanjutBK: 'Rekomendasi Aman',
});

export default function MobileKarir({ onBack, onToast }: MobileKarirProps) {
  const { karirList, addKarirStudent, updateKarirStudent, deleteKarirStudent, settings } = useBK();
  const [kelas, setKelas] = useState('Semua Kelas 9');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<IndividualKarirAngket | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const kelasOptions = useMemo(() => {
    const set = new Set<string>(['9A', '9B', '9C']);
    karirList.forEach((s) => s.kelas && set.add(s.kelas));
    return ['Semua Kelas 9', ...[...set].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))];
  }, [karirList]);

  const filtered = useMemo(() => {
    const lq = q.trim().toLowerCase();
    return karirList.filter((s) => {
      if (kelas !== 'Semua Kelas 9' && s.kelas !== kelas) return false;
      if (!lq) return true;
      return (
        s.namaSiswa.toLowerCase().includes(lq) ||
        s.pilihan1Sekolah.toLowerCase().includes(lq) ||
        s.citaCita.toLowerCase().includes(lq)
      );
    });
  }, [karirList, kelas, q]);

  const tambahBaris = () => {
    addKarirStudent(blank(kelas === 'Semua Kelas 9' ? '9A' : kelas));
    onToast('Baris siswa baru ditambahkan ke tabel.');
  };

  const hapus = async (item: IndividualKarirAngket) => {
    const ok = await confirmDialog({
      title: `Hapus data "${item.namaSiswa || 'siswa ini'}"?`,
      confirmLabel: 'Ya, Hapus',
      tone: 'danger',
    });
    if (!ok) return;
    deleteKarirStudent(item.id);
    onToast('Data karir siswa dihapus.');
  };

  const exportCsv = () => {
    const headers = [
      'No',
      'Nama Siswa',
      'Kelas',
      'Rencana Setelah SMP',
      'Pilihan 1',
      'Jurusan 1',
      'Pilihan 2',
      'Cita-cita',
      'Status Restu Orang Tua',
      'Rekomendasi BK',
      'Tindak Lanjut',
    ];
    const rows = filtered.map((s, i) => [
      i + 1,
      s.namaSiswa,
      s.kelas,
      s.rencanaSetelahSMP,
      s.pilihan1Sekolah,
      s.pilihan1Jurusan,
      s.pilihan2Sekolah,
      s.citaCita,
      s.statusDiskusiOrtu,
      s.rekomendasiBK,
      s.tindakLanjutBK,
    ]);
    exportToCsv(`Rekap_Karir_Kelas_9_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    onToast(`Rekap karir berhasil diekspor (${rows.length} siswa).`);
  };

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'TABULASI PEMETAAN PILIHAN SEKOLAH LANJUTAN',
      subtitle: `( ${kelas.toUpperCase()} )`,
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
        `${filtered.length} siswa terdata`,
      ],
      landscape: true,
      signature: true,
      sections: [
        {
          columns: [
            { label: 'NO', align: 'center', width: '4%' },
            { label: 'NAMA SISWA', align: 'left', width: '16%' },
            { label: 'KELAS', align: 'center', width: '6%' },
            { label: 'RENCANA', align: 'center', width: '8%' },
            { label: 'PILIHAN 1 (UTAMA)', align: 'left' },
            { label: 'JURUSAN 1', align: 'left', width: '12%' },
            { label: 'PILIHAN 2 (CADANGAN)', align: 'left', width: '14%' },
            { label: 'CITA-CITA', align: 'left', width: '12%' },
            { label: 'RESTU ORTU', align: 'center', width: '10%' },
          ],
          rows: filtered.map((s, i) => [
            i + 1,
            s.namaSiswa || '-',
            s.kelas || '-',
            s.rencanaSetelahSMP || '-',
            s.pilihan1Sekolah || '-',
            s.pilihan1Jurusan || '-',
            s.pilihan2Sekolah || '-',
            s.citaCita || '-',
            s.statusDiskusiOrtu || '-',
          ]),
        },
      ],
    }),
    [filtered, kelas, settings],
  );

  const set = <K extends keyof IndividualKarirAngket>(field: K, value: IndividualKarirAngket[K]) => {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
    if (draft) updateKarirStudent(draft.id, field, value);
  };

  return (
    <div className="fade-up space-y-4">
      <DetailBar
        onBack={onBack}
        label="Dokumen"
        right={
          <div className="flex items-center gap-1.5">
            <PreviewButton onClick={() => setPreviewOpen(true)} />
            <button type="button" onClick={tambahBaris} className={smallBtnCls}>
              <Plus size={14} /> Tambah
            </button>
          </div>
        }
      />

      <PageHeader
        title="Bimbingan Karir"
        subtitle={`${filtered.length} siswa kelas 9 · pemetaan sekolah lanjutan`}
      />

      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          strokeWidth={2}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Cari nama, sekolah, atau cita-cita…"
          className={`${inputCls} !min-h-[50px] pl-11`}
        />
      </div>

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 no-scrollbar">
        {kelasOptions.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKelas(k)}
            aria-pressed={kelas === k}
            className={`bk-chip ${kelas === k ? 'on' : ''}`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Tabel tabulasi — kolom & gaya sama persis dengan versi PC */}
      <div className="border border-black bg-white p-3.5 text-black shadow-sm">
        <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
          <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
            TABULASI PEMETAAN PILIHAN SEKOLAH LANJUTAN ( {kelas.toUpperCase()} )
          </h2>
          <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">
            {settings.namaSekolah || 'SIM BK PRO'}, TAHUN AJARAN{' '}
            {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-black px-4 py-10 text-center">
            <Users size={26} className="mx-auto mb-2 text-muted/50" />
            <p className="text-[13px] font-bold text-text">Belum ada data siswa</p>
            <p className="mt-1 text-[11px] text-muted">
              Ketuk Tambah untuk menambah baris baru.
            </p>
          </div>
        ) : (
          <>
          <TableHint className="!text-black/55" />
          <div className="-mx-3.5 overflow-x-auto border-t border-black">
            <table className="w-full min-w-[880px] border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold text-black">
                  <th className="w-10 border border-black px-2 py-2 text-center">NO</th>
                  <th className="w-48 border border-black px-3 py-2 text-left">NAMA SISWA</th>
                  <th className="w-14 border border-black px-2 py-2 text-center">KELAS</th>
                  <th className="w-16 border border-black px-2 py-2 text-center">RENCANA</th>
                  <th className="border border-black px-3 py-2 text-left">PILIHAN 1 (UTAMA)</th>
                  <th className="w-36 border border-black px-3 py-2 text-left">JURUSAN 1</th>
                  <th className="w-40 border border-black px-3 py-2 text-left">
                    PILIHAN 2 (CADANGAN)
                  </th>
                  <th className="w-36 border border-black px-3 py-2 text-left">CITA-CITA</th>
                  <th className="w-24 border border-black px-2 py-2 text-center">RESTU ORTU</th>
                  <th className="w-16 border border-black px-2 py-2 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="transition-colors hover:bg-neutral-50/30">
                    <td className="border border-black px-2 py-1 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-2 py-0.5">
                      <input
                        type="text"
                        value={item.namaSiswa}
                        onChange={(e) => updateKarirStudent(item.id, 'namaSiswa', e.target.value)}
                        placeholder="Nama siswa…"
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      <input
                        type="text"
                        value={item.kelas}
                        onChange={(e) => updateKarirStudent(item.id, 'kelas', e.target.value)}
                        className="w-12 rounded border-none bg-transparent px-1 py-0.5 text-center font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      <select
                        value={item.rencanaSetelahSMP}
                        onChange={(e) =>
                          updateKarirStudent(
                            item.id,
                            'rencanaSetelahSMP',
                            e.target.value as IndividualKarirAngket['rencanaSetelahSMP'],
                          )
                        }
                        className="w-full border-none bg-transparent py-1 text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="SMA">SMA</option>
                        <option value="SMK">SMK</option>
                        <option value="MA">MA</option>
                        <option value="Belum Memutuskan">Belum</option>
                      </select>
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.pilihan1Sekolah}
                        onChange={(e) =>
                          updateKarirStudent(item.id, 'pilihan1Sekolah', e.target.value)
                        }
                        placeholder="SMAN 1 / SMKN..."
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.pilihan1Jurusan}
                        onChange={(e) =>
                          updateKarirStudent(item.id, 'pilihan1Jurusan', e.target.value)
                        }
                        placeholder="MIPA/Otomotif..."
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.pilihan2Sekolah}
                        onChange={(e) =>
                          updateKarirStudent(item.id, 'pilihan2Sekolah', e.target.value)
                        }
                        placeholder="Sekolah cadangan..."
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="border border-black px-1.5 py-0.5">
                      <input
                        type="text"
                        value={item.citaCita}
                        onChange={(e) => updateKarirStudent(item.id, 'citaCita', e.target.value)}
                        placeholder="Profesi..."
                        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      <select
                        value={item.statusDiskusiOrtu}
                        onChange={(e) =>
                          updateKarirStudent(
                            item.id,
                            'statusDiskusiOrtu',
                            e.target.value as IndividualKarirAngket['statusDiskusiOrtu'],
                          )
                        }
                        className={`w-full border-none bg-transparent py-1 text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                          item.statusDiskusiOrtu === 'Setuju Penuh'
                            ? 'text-accent'
                            : item.statusDiskusiOrtu === 'Orang Tua Beda Pilihan'
                              ? 'font-extrabold text-alert underline'
                              : 'text-black'
                        }`}
                      >
                        <option value="Setuju Penuh">Setuju</option>
                        <option value="Orang Tua Beda Pilihan">Beda Ortu</option>
                        <option value="Belum Dibicarakan Mendalam">Belum Pasti</option>
                      </select>
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setDraft({ ...item })}
                          className="p-1 text-muted transition-colors hover:text-black"
                          title="Buka lembar lengkap"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => hapus(item)}
                          className="p-1 text-muted transition-colors hover:text-alert"
                          title="Hapus baris"
                        >
                          <Trash2 size={14} />
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
          <p>Total: {filtered.length} siswa terdata.</p>
          <p className="font-semibold">{settings.namaSekolah || 'SIM BK PRO'}</p>
        </div>
      </div>

      <button type="button" onClick={exportCsv} className="bk-btn ghost min-h-[48px] w-full">
        <Download size={15} /> Unduh Rekap (Excel/CSV)
      </button>

      <Sheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title="Lembar Karir Siswa"
        subtitle={draft ? `${draft.namaSiswa || 'Siswa'} · ${draft.kelas}` : undefined}
        footer={
          <button
            type="button"
            onClick={() => {
              if (!draft) return;
              if (!draft.namaSiswa.trim()) {
                onToast('Nama siswa wajib diisi.');
                return;
              }
              setDraft(null);
              onToast(`Data ${draft.namaSiswa} tersimpan.`);
            }}
            className="bk-btn primary min-h-[48px] w-full"
          >
            Simpan Data
          </button>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama siswa *">
                <input
                  value={draft.namaSiswa}
                  onChange={(e) => set('namaSiswa', e.target.value)}
                  className={inputCls}
                  placeholder="Nama lengkap"
                />
              </Field>
              <Field label="Kelas">
                <input
                  value={draft.kelas}
                  onChange={(e) => set('kelas', e.target.value)}
                  className={inputCls}
                  placeholder="9A"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="NIS">
                <input
                  value={draft.nis}
                  onChange={(e) => set('nis', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="NISN">
                <input
                  value={draft.nisn}
                  onChange={(e) => set('nisn', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="space-y-3 rounded-[14px] border border-border p-3.5">
              <p className="text-[11px] font-black uppercase tracking-wide text-muted">
                Pilihan 1 (utama)
              </p>
              <Field label="Sekolah">
                <input
                  value={draft.pilihan1Sekolah}
                  onChange={(e) => set('pilihan1Sekolah', e.target.value)}
                  className={inputCls}
                  placeholder="SMAN 1 / SMKN 2…"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jurusan">
                  <input
                    value={draft.pilihan1Jurusan}
                    onChange={(e) => set('pilihan1Jurusan', e.target.value)}
                    className={inputCls}
                    placeholder="MIPA / DKV"
                  />
                </Field>
                <Field label="Jalur">
                  <select
                    value={draft.pilihan1Jalur}
                    onChange={(e) =>
                      set('pilihan1Jalur', e.target.value as IndividualKarirAngket['pilihan1Jalur'])
                    }
                    className={inputCls}
                  >
                    {JALUR1.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="space-y-3 rounded-[14px] border border-border p-3.5">
              <p className="text-[11px] font-black uppercase tracking-wide text-muted">
                Pilihan 2 (cadangan)
              </p>
              <Field label="Sekolah">
                <input
                  value={draft.pilihan2Sekolah}
                  onChange={(e) => set('pilihan2Sekolah', e.target.value)}
                  className={inputCls}
                  placeholder="Sekolah cadangan…"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jurusan">
                  <input
                    value={draft.pilihan2Jurusan}
                    onChange={(e) => set('pilihan2Jurusan', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Jalur">
                  <select
                    value={draft.pilihan2Jalur}
                    onChange={(e) =>
                      set('pilihan2Jalur', e.target.value as IndividualKarirAngket['pilihan2Jalur'])
                    }
                    className={inputCls}
                  >
                    {JALUR2.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <Field label="Cita-cita">
              <input
                value={draft.citaCita}
                onChange={(e) => set('citaCita', e.target.value)}
                className={inputCls}
                placeholder="Dokter, guru, teknisi…"
              />
            </Field>

            <Field label="Status diskusi dengan orang tua">
              <select
                value={draft.statusDiskusiOrtu}
                onChange={(e) =>
                  set(
                    'statusDiskusiOrtu',
                    e.target.value as IndividualKarirAngket['statusDiskusiOrtu'],
                  )
                }
                className={inputCls}
              >
                {STATUS_ORTU.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Rekomendasi BK">
              <textarea
                value={draft.rekomendasiBK}
                onChange={(e) => set('rekomendasiBK', e.target.value)}
                className={textareaCls}
                placeholder="Catatan rekomendasi konselor…"
              />
            </Field>

            <Field label="Tindak lanjut BK">
              <select
                value={draft.tindakLanjutBK}
                onChange={(e) =>
                  set('tindakLanjutBK', e.target.value as IndividualKarirAngket['tindakLanjutBK'])
                }
                className={inputCls}
              >
                {TINDAK.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
