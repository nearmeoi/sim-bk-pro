import { useMemo, useState } from 'react';
import { ClipboardPaste, Download, Printer, RotateCcw, Save, TrendingUp } from 'lucide-react';
import { useBK } from '../context/BKContext';
import { confirmDialog } from '../components/ui/ConfirmModal';
import { exportToCsv } from '../lib/exportCsv';
import { DetailBar, Field, PageHeader, TableHint, inputCls, smallBtnCls } from './ui';
import { DocPreview, PreviewButton, type DocSpec } from './docPreview';

interface MobileAKPDProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

type Mode = 'lembar' | 'rekap' | 'analisis';

const TABS: { id: Mode; label: string }[] = [
  { id: 'lembar', label: '1. Input Lembar' },
  { id: 'rekap', label: '2. Rekap Hitungan' },
  { id: 'analisis', label: '3. Hasil Analisis' },
];

/** Judul dokumen di dalam kertas — sama dengan kop tabel versi PC. */
function DocHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3 border-b-2 border-black pb-2.5 text-center">
      <h2 className="text-[13px] font-extrabold uppercase leading-snug tracking-wide text-black">
        {title}
      </h2>
      <p className="mt-0.5 text-[10px] font-bold leading-snug text-black/80">{subtitle}</p>
    </div>
  );
}

export default function MobileAKPD({ onBack, onToast }: MobileAKPDProps) {
  const {
    akpdItems: items,
    updateAKPDItem,
    incrementAKPDTally,
    applyQuickAKPDNumbers,
    applyPasteAKPDTally,
    resetAKPD,
    totalRespondenAKPD,
    setTotalRespondenAKPD,
    kelasAKPD: kelas,
    setKelasAKPD: setKelas,
    settings,
  } = useBK();

  const [mode, setMode] = useState<Mode>('lembar');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [quickNumbers, setQuickNumbers] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const bidangPct = useMemo(() => {
    const calc = (from: number, to: number) => {
      const list = items.filter((it) => it.no >= from && it.no <= to);
      if (list.length === 0 || totalRespondenAKPD === 0) return 0;
      const votes = list.reduce((s, it) => s + it.jumlahPemilih, 0);
      return Math.round((votes / (list.length * totalRespondenAKPD)) * 100);
    };
    return {
      pribadi: calc(1, 15),
      sosial: calc(16, 30),
      belajar: calc(31, 45),
      karir: calc(46, 50),
    };
  }, [items, totalRespondenAKPD]);

  const top5 = useMemo(
    () => [...items].sort((a, b) => b.jumlahPemilih - a.jumlahPemilih).slice(0, 5),
    [items],
  );

  const docSpec: DocSpec = useMemo(() => {
    const bidangDari = (no: number) =>
      no <= 15 ? 'Pribadi' : no <= 30 ? 'Sosial' : no <= 45 ? 'Belajar' : 'Karir';
    const pctOf = (value: number) =>
      totalRespondenAKPD > 0 ? Math.round((value / totalRespondenAKPD) * 100) : 0;
    const prioritas = (pct: number) =>
      pct >= 60 ? 'Prioritas Tinggi' : pct >= 40 ? 'Prioritas Sedang' : 'Cukup Baik';

    if (mode === 'lembar') {
      return {
        title: 'ANGKET KEBUTUHAN PESERTA DIDIK (AKPD)',
        subtitle: `${kelas} · TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`,
        meta: [
          `Nama: ${namaSiswa || '...........................................'}`,
          `${settings.namaSekolah || 'SIM BK PRO'}`,
        ],
        signature: false,
        sections: [
          {
            columns: [
              { label: 'NO', align: 'center', width: '6%' },
              { label: 'PERNYATAAN BUTIR KEBUTUHAN', align: 'left' },
              { label: 'YA', align: 'center', width: '9%' },
              { label: 'TIDAK', align: 'center', width: '9%' },
            ],
            rows: items.map((item) => [
              item.no,
              item.pernyataan,
              item.jawaban === 'ya' ? '✓' : '',
              item.jawaban === 'tidak' ? '✓' : '',
            ]),
          },
        ],
      };
    }

    if (mode === 'rekap') {
      return {
        title: 'TABEL TABULASI MASAL KEBUTUHAN PESERTA DIDIK',
        subtitle: `${kelas} · TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`,
        meta: [`Total ${totalRespondenAKPD} siswa per kelas`],
        signature: true,
        sections: [
          {
            columns: [
              { label: 'NO', align: 'center', width: '6%' },
              { label: 'PERNYATAAN KEBUTUHAN', align: 'left' },
              { label: 'JUMLAH CENTANG (YA)', align: 'center', width: '18%' },
              { label: 'PERSENTASE', align: 'center', width: '14%' },
            ],
            rows: items.map((item) => [
              item.no,
              item.pernyataan,
              item.jumlahPemilih,
              `${pctOf(item.jumlahPemilih)}%`,
            ]),
          },
        ],
      };
    }

    return {
      title: 'HASIL ANALISIS KEBUTUHAN PESERTA DIDIK',
      subtitle: `${kelas} · TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`,
      meta: [settings.namaSekolah || 'SIM BK PRO'],
      signature: true,
      sections: [
        {
          heading: 'I. Rekapitulasi Per Bidang Bimbingan',
          columns: [
            { label: 'NO', align: 'center', width: '6%' },
            { label: 'BIDANG BIMBINGAN', align: 'left' },
            { label: 'JUMLAH BUTIR', align: 'center', width: '16%' },
            { label: 'RATA-RATA (%)', align: 'center', width: '16%' },
            { label: 'DERAJAT KEBUTUHAN', align: 'center', width: '22%' },
          ],
          rows: [
            ['1', 'Bidang Pribadi (Butir 1 - 15)', '15 Butir', `${bidangPct.pribadi}%`, prioritas(bidangPct.pribadi)],
            ['2', 'Bidang Sosial (Butir 16 - 30)', '15 Butir', `${bidangPct.sosial}%`, prioritas(bidangPct.sosial)],
            ['3', 'Bidang Belajar (Butir 31 - 45)', '15 Butir', `${bidangPct.belajar}%`, prioritas(bidangPct.belajar)],
            ['4', 'Bidang Karir (Butir 46 - 50)', '5 Butir', `${bidangPct.karir}%`, prioritas(bidangPct.karir)],
          ],
        },
        {
          heading: `II. 5 Kebutuhan / Masalah Tertinggi di ${kelas}`,
          intro: 'Rujukan materi layanan (RPL).',
          columns: [
            { label: 'PERINGKAT', align: 'center', width: '10%' },
            { label: 'NO BUTIR', align: 'center', width: '9%' },
            { label: 'BIDANG', align: 'center', width: '11%' },
            { label: 'URAIAN PERNYATAAN MASALAH', align: 'left' },
            { label: 'JUMLAH PEMILIH', align: 'center', width: '15%' },
            { label: 'HASIL (%)', align: 'center', width: '10%' },
          ],
          rows: top5.map((item, idx) => [
            `#${idx + 1}`,
            `Butir ${item.no}`,
            bidangDari(item.no),
            item.pernyataan,
            `${item.jumlahPemilih} dari ${totalRespondenAKPD} siswa`,
            `${pctOf(item.jumlahPemilih)}%`,
          ]),
        },
      ],
    };
  }, [mode, items, kelas, namaSiswa, top5, bidangPct, totalRespondenAKPD, settings]);

  const reset = async () => {
    const ok = await confirmDialog({
      title: 'Reset data AKPD ke format standar 50 butir?',
      description: 'Semua jawaban dan hitungan akan dikembalikan ke setelan awal.',
      confirmLabel: 'Ya, Reset',
      tone: 'danger',
    });
    if (!ok) return;
    resetAKPD();
    onToast('Data AKPD dikembalikan ke setelan awal.');
  };

  const exportCsv = () => {
    const headers = [
      'Nomor Butir',
      'Pernyataan Kebutuhan',
      'Jumlah Pemilih',
      'Total Responden',
      'Persentase (%)',
      'Prioritas',
    ];
    const rows = items.map((item) => {
      const pct =
        totalRespondenAKPD > 0 ? ((item.jumlahPemilih / totalRespondenAKPD) * 100).toFixed(1) : '0';
      const prioritas = Number(pct) >= 60 ? 'Tinggi' : Number(pct) >= 40 ? 'Sedang' : 'Rendah';
      return [item.no, item.pernyataan, item.jumlahPemilih, totalRespondenAKPD, `${pct}%`, prioritas];
    });
    exportToCsv(
      `Rekap_AKPD_${kelas.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
    );
    onToast(`Rekap AKPD ${kelas} berhasil diekspor.`);
  };

  const submitQuick = () => {
    if (!quickNumbers.trim()) return;
    const numbers = quickNumbers
      .split(/[\s,;]+/)
      .map((n) => parseInt(n, 10))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= items.length);
    if (numbers.length === 0) {
      onToast('Nomor butir tidak valid. Masukkan angka 1 sampai 50.');
      return;
    }
    applyQuickAKPDNumbers(numbers);
    setQuickNumbers('');
    onToast(`${numbers.length} nomor butir berhasil dicentang.`);
  };

  const submitPaste = () => {
    if (!pasteText.trim()) return;
    const nums = pasteText
      .split(/[\s,;]+/)
      .map((n) => parseInt(n, 10))
      .filter((n) => !Number.isNaN(n));
    if (nums.length === 0) {
      onToast('Tidak ada angka yang terbaca.');
      return;
    }
    applyPasteAKPDTally(nums);
    setPasteText('');
    setShowPaste(false);
    onToast(`${nums.length} nilai butir berhasil diperbarui.`);
  };

  const prioritasBidang = (pct: number) =>
    pct >= 60 ? 'Prioritas Tinggi' : pct >= 40 ? 'Prioritas Sedang' : 'Cukup Baik';

  return (
    <div className="fade-up space-y-4">
      <DetailBar
        onBack={onBack}
        label="Dokumen"
        right={
          <div className="flex items-center gap-1.5">
            <PreviewButton onClick={() => setPreviewOpen(true)} />
            <button
              type="button"
              onClick={() => onToast(`Data AKPD ${kelas} berhasil disimpan.`)}
              className={smallBtnCls}
            >
              <Save size={14} /> Simpan
            </button>
          </div>
        }
      />

      <PageHeader
        title="Angket AKPD"
        subtitle={`${kelas} · ${totalRespondenAKPD} siswa responden`}
      />

      {/* Kontrol kelas & responden */}
      <div className="bk-card space-y-3 !p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pilih tingkat">
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className={`${inputCls} !min-h-[44px]`}
            >
              <option value="KELAS 7">KELAS 7</option>
              <option value="KELAS 8">KELAS 8</option>
              <option value="KELAS 9">KELAS 9</option>
            </select>
          </Field>
          <Field label="Siswa / kelas">
            <input
              type="number"
              min={1}
              value={totalRespondenAKPD}
              onChange={(e) => setTotalRespondenAKPD(parseInt(e.target.value, 10) || 1)}
              className={`${inputCls} !min-h-[44px] text-center font-bold`}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-muted">
            {items.filter((i) => i.jawaban).length} dari {items.length} butir dijawab
          </span>
          <button type="button" onClick={reset} className={smallBtnCls}>
            <RotateCcw size={14} /> Setelan Awal
          </button>
        </div>
      </div>

      {/* Tab mode — sama dengan tab versi PC */}
      <div className="flex overflow-x-auto rounded-[12px] border border-border bg-surface no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            aria-pressed={mode === t.id}
            className={`min-h-[44px] flex-1 whitespace-nowrap border-b-2 px-2 text-[11px] font-bold transition-all ${
              mode === t.id
                ? 'rounded-t-[10px] border-black bg-neutral-100 text-black'
                : 'border-transparent text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MODE 1 — Lembar angket (tabel NO / PERNYATAAN / YA / TIDAK) */}
      {mode === 'lembar' && (
        <div className="border border-black bg-white p-3.5 text-black shadow-sm">
          <DocHead
            title={`ANGKET KEBUTUHAN PESERTA DIDIK (AKPD) · ${kelas}`}
            subtitle={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
          />

          <div className="mb-3 flex flex-col gap-2 text-[11px] font-bold text-black">
            <label className="flex items-center gap-2">
              <span className="flex-none">NAMA :</span>
              <input
                type="text"
                value={namaSiswa}
                onChange={(e) => setNamaSiswa(e.target.value)}
                placeholder="__________________________"
                className="min-w-0 flex-1 border-b border-black/50 bg-transparent px-1 text-[12px] font-normal focus:border-black focus:outline-none"
              />
            </label>
          </div>

          <div className="mb-3 text-[10.5px] leading-relaxed text-black/90">
            <p className="mb-1 font-bold underline">Petunjuk :</p>
            <ol className="list-outside list-decimal space-y-0.5 pl-4">
              <li>
                Dibawah ini bukan alat tes, tetapi angket kebutuhan untuk membuat program layanan
                bimbingan dan konseling.
              </li>
              <li>
                Jawaban Anda sangat bermanfaat untuk pembuatan program layanan BK di sekolah.
              </li>
              <li>
                Pilihlah jawaban yang paling sesuai dengan kondisi Anda saat ini, dengan cara
                memberikan tanda (V) pada kolom Ya/Tidak.
              </li>
              <li>
                Jawaban Anda akan kami rahasiakan, untuk itu jawablah dengan benar dan
                sungguh-sungguh.
              </li>
            </ol>
          </div>

          <TableHint className="!text-black/55" />
          <div className="-mx-3.5 overflow-x-auto border-t border-black">
            <table className="w-full min-w-[500px] border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold text-black">
                  <th className="w-8 border border-black px-1.5 py-1 text-center">NO</th>
                  <th className="border border-black px-2 py-1 text-center">
                    PERNYATAAN BUTIR KEBUTUHAN
                  </th>
                  <th className="w-12 border border-black px-1 py-1 text-center">YA</th>
                  <th className="w-12 border border-black px-1 py-1 text-center">TIDAK</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.no}>
                    <td className="border border-black px-1.5 py-1 text-center">{item.no}</td>
                    <td className="border border-black px-2 py-1">{item.pernyataan}</td>
                    <td
                      onClick={() =>
                        updateAKPDItem(item.no - 1, {
                          jawaban: item.jawaban === 'ya' ? null : 'ya',
                        })
                      }
                      className={`cursor-pointer border border-black px-1 py-1 text-center font-bold ${
                        item.jawaban === 'ya' ? 'bg-[#DCFCE7] text-[#15803D]' : ''
                      }`}
                    >
                      {item.jawaban === 'ya' ? '✓' : ''}
                    </td>
                    <td
                      onClick={() =>
                        updateAKPDItem(item.no - 1, {
                          jawaban: item.jawaban === 'tidak' ? null : 'tidak',
                        })
                      }
                      className={`cursor-pointer border border-black px-1 py-1 text-center font-bold ${
                        item.jawaban === 'tidak' ? 'bg-[#FEE2E2] text-[#991B1B]' : ''
                      }`}
                    >
                      {item.jawaban === 'tidak' ? '✓' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
            <p>Angket Kebutuhan Peserta Didik (50 Butir)</p>
            <p className="font-semibold">
              {kelas}, {settings.namaSekolah || 'SIM BK PRO'}
            </p>
          </div>
        </div>
      )}

      {/* MODE 2 — Rekap hitungan (tabel tabulasi masal) */}
      {mode === 'rekap' && (
        <div className="space-y-3">
          <div className="bk-card space-y-2 !p-4">
            <Field label="Input cepat nomor centang" hint="Contoh: 1, 3, 5, 15, 16, 24, 40">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={quickNumbers}
                  onChange={(e) => setQuickNumbers(e.target.value)}
                  placeholder="1, 3, 5, 15…"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={submitQuick}
                  className={`${smallBtnCls} !min-h-[48px]`}
                >
                  Tambah
                </button>
              </div>
            </Field>
            <button
              type="button"
              onClick={() => setShowPaste((v) => !v)}
              className="bk-btn ghost min-h-[44px] w-full"
            >
              <ClipboardPaste size={15} /> Tempel 50 angka dari Excel
            </button>
            {showPaste && (
              <div className="fade-up space-y-2">
                <textarea
                  rows={3}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Tempel deretan angka: 18, 14, 22, 19, 21, 8, 15…"
                  className={`${inputCls} !min-h-[88px] py-3 font-mono`}
                />
                <button
                  type="button"
                  onClick={submitPaste}
                  className="bk-btn primary min-h-[44px] w-full"
                >
                  Terapkan ke 50 Butir
                </button>
              </div>
            )}
          </div>

          <div className="border border-black bg-white p-3.5 text-black shadow-sm">
            <DocHead
              title="TABEL TABULASI MASAL KEBUTUHAN PESERTA DIDIK"
              subtitle={`${kelas} · TAHUN AJARAN ${
                settings.tahunAjaran || '2026/2027'
              } · TOTAL ${totalRespondenAKPD} SISWA PER KELAS`}
            />

            <TableHint className="!text-black/55" />
            <div className="-mx-3.5 overflow-x-auto border-t border-black">
              <table className="w-full min-w-[760px] border-collapse border border-black text-[12px]">
                <thead>
                  <tr className="bg-gray-100 font-extrabold text-black">
                    <th className="w-12 border border-black px-2 py-2 text-center">NO</th>
                    <th className="min-w-[340px] border border-black px-3 py-2 text-left">
                      P E R N Y A T A A N &nbsp; K E B U T U H A N
                    </th>
                    <th className="w-36 border border-black px-2 py-2 text-center">
                      JUMLAH CENTANG (YA)
                    </th>
                    <th className="w-24 border border-black px-2 py-2 text-center">PERSENTASE</th>
                    <th className="w-24 border border-black px-2 py-2 text-center">AKSI CEPAT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const percent =
                      totalRespondenAKPD > 0
                        ? Math.round((item.jumlahPemilih / totalRespondenAKPD) * 100)
                        : 0;
                    return (
                      <tr key={item.no} className="transition-colors hover:bg-gray-50/40">
                        <td className="border border-black px-2 py-1.5 text-center font-bold">
                          {item.no}
                        </td>
                        <td className="border border-black px-3 py-1.5">
                          <input
                            type="text"
                            value={item.pernyataan}
                            onChange={(e) => updateAKPDItem(idx, { pernyataan: e.target.value })}
                            className="w-full rounded border-none bg-transparent px-1 py-0.5 font-normal text-black focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={totalRespondenAKPD}
                            value={item.jumlahPemilih}
                            onChange={(e) =>
                              updateAKPDItem(idx, {
                                jumlahPemilih: Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            className="min-h-[34px] w-16 rounded border border-gray-300 bg-white text-center font-extrabold text-black shadow-sm focus:border-black focus:outline-none"
                          />
                          <span className="ml-1 text-xs text-muted">/ {totalRespondenAKPD}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center text-xs font-extrabold">
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              percent >= 70
                                ? 'bg-alert-tint text-alert'
                                : percent >= 50
                                  ? 'bg-neutral-200 text-neutral-800'
                                  : 'bg-primary-tint text-primary'
                            }`}
                          >
                            {percent}%
                          </span>
                        </td>
                        <td className="border border-black px-1.5 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => incrementAKPDTally(idx, totalRespondenAKPD)}
                            title="Klik +1 setiap melihat centang di kertas"
                            className="rounded bg-accent px-3 py-1 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-90"
                          >
                            +1
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
              <p>Rekap Tabulasi ({settings.namaSekolah || 'SIM BK PRO'})</p>
              <p className="font-semibold">{kelas} (50 Butir)</p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3 — Hasil analisis (dua tabel seperti versi PC) */}
      {mode === 'analisis' && (
        <div className="space-y-3">
          <div className="border border-black bg-white p-3.5 text-black shadow-sm">
            <DocHead
              title={`HASIL ANALISIS KEBUTUHAN PESERTA DIDIK · ${kelas}`}
              subtitle={`${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
                settings.tahunAjaran || '2026/2027'
              }`}
            />

            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-black">
              I. Rekapitulasi Per Bidang Bimbingan
            </p>

            <TableHint className="!text-black/55" />
            <div className="-mx-3.5 overflow-x-auto border-t border-black">
              <table className="w-full min-w-[560px] border-collapse border border-black text-[12px]">
                <thead>
                  <tr className="bg-gray-100 font-extrabold uppercase text-black">
                    <th className="w-10 border border-black px-2 py-2 text-center">NO</th>
                    <th className="border border-black px-3 py-2 text-left">BIDANG BIMBINGAN</th>
                    <th className="w-28 border border-black px-2 py-2 text-center">JUMLAH BUTIR</th>
                    <th className="w-36 border border-black px-2 py-2 text-center">RATA-RATA (%)</th>
                    <th className="w-40 border border-black px-2 py-2 text-center">
                      DERAJAT KEBUTUHAN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { no: 1, nama: 'Bidang Pribadi', range: 'Butir 1 - 15', butir: 15, pct: bidangPct.pribadi },
                    { no: 2, nama: 'Bidang Sosial', range: 'Butir 16 - 30', butir: 15, pct: bidangPct.sosial },
                    { no: 3, nama: 'Bidang Belajar', range: 'Butir 31 - 45', butir: 15, pct: bidangPct.belajar },
                    { no: 4, nama: 'Bidang Karir', range: 'Butir 46 - 50', butir: 5, pct: bidangPct.karir },
                  ].map((row) => (
                    <tr key={row.no} className="transition-colors hover:bg-gray-50/30">
                      <td className="border border-black px-2 py-2 text-center font-bold">
                        {row.no}
                      </td>
                      <td className="border border-black px-3 py-2 font-bold text-black">
                        <span>{row.nama}</span>
                        <span className="ml-2 text-[11px] font-normal text-gray-500">
                          ({row.range})
                        </span>
                      </td>
                      <td className="border border-black px-2 py-2 text-center font-medium">
                        {row.butir} Butir
                      </td>
                      <td className="border border-black px-2 py-2 text-center text-sm font-black">
                        {row.pct}%
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        <span
                          className={`whitespace-nowrap rounded px-2.5 py-0.5 text-[11px] font-bold ${
                            row.pct >= 60
                              ? 'bg-alert-tint text-alert'
                              : row.pct >= 40
                                ? 'bg-neutral-200 text-neutral-800'
                                : 'bg-primary-tint text-primary'
                          }`}
                        >
                          {prioritasBidang(row.pct)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-black" />
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-black">
                II. 5 Kebutuhan / Masalah Tertinggi di {kelas} (Rujukan Materi RPL)
              </p>
            </div>

            <TableHint className="mt-1.5 !text-black/55" />
            <div className="-mx-3.5 overflow-x-auto border-t border-black">
              <table className="w-full min-w-[720px] border-collapse border border-black text-[12px]">
                <thead>
                  <tr className="bg-gray-100 font-extrabold uppercase text-black">
                    <th className="w-14 border border-black px-2 py-2 text-center">PERINGKAT</th>
                    <th className="w-20 border border-black px-2 py-2 text-center">NO BUTIR</th>
                    <th className="w-24 border border-black px-2 py-2 text-center">BIDANG</th>
                    <th className="border border-black px-3 py-2 text-left">
                      URAIAN PERNYATAAN MASALAH
                    </th>
                    <th className="w-28 border border-black px-2 py-2 text-center">JUMLAH PEMILIH</th>
                    <th className="w-24 border border-black px-2 py-2 text-center">HASIL (%)</th>
                    <th className="w-28 border border-black px-2 py-2 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.map((item, idx) => {
                    const pct =
                      totalRespondenAKPD > 0
                        ? Math.round((item.jumlahPemilih / totalRespondenAKPD) * 100)
                        : 0;
                    const bidang =
                      item.no <= 15
                        ? 'Pribadi'
                        : item.no <= 30
                          ? 'Sosial'
                          : item.no <= 45
                            ? 'Belajar'
                            : 'Karir';
                    return (
                      <tr key={item.no} className="transition-colors hover:bg-gray-50/30">
                        <td className="border border-black px-2 py-2 text-center text-sm font-black">
                          #{idx + 1}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-bold">
                          Butir {item.no}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-bold text-neutral-800">
                          {bidang}
                        </td>
                        <td className="border border-black px-3 py-2 font-medium leading-snug text-black">
                          {item.pernyataan}
                        </td>
                        <td className="whitespace-nowrap border border-black px-2 py-2 text-center text-xs">
                          {item.jumlahPemilih} dari {totalRespondenAKPD} siswa
                        </td>
                        <td className="border border-black px-2 py-2 text-center text-sm font-black text-alert">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-black/30 pt-2.5 text-[10px] text-muted">
              <p>Angket Kebutuhan Peserta Didik (50 Butir)</p>
              <p className="font-semibold">
                {kelas}, {settings.namaSekolah || 'SIM BK PRO'}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <button type="button" onClick={exportCsv} className="bk-btn primary min-h-[48px] w-full">
              <Download size={15} /> Unduh Rekap (Excel/CSV)
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="bk-btn ghost min-h-[48px] w-full"
            >
              <Printer size={15} /> Pratinjau &amp; Cetak Lembar Analisis
            </button>
          </div>
        </div>
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
