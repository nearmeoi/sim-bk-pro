import {
  CheckCircle2,
  ChevronRight,
  Compass,
  Download,
  FileCheck2,
  FileText,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useBK } from '../context/BKContext';
import { DOCUMENTS } from '../data/dummy';
import { exportToCsv } from '../lib/exportCsv';
import type { MobileRoute } from './MobileApp';
import { PageHeader } from './ui';
import { DocPreview, type DocSpec } from './docPreview';

interface MobileDokumenProps {
  onOpen: (route: MobileRoute) => void;
}

const ROUTE_MAP: Record<string, MobileRoute> = {
  prota: 'prota',
  jurnal: 'jurnal',
  rpl: 'rpl',
  akpd: 'akpd',
  karir: 'karir',
  prosem: 'prosem',
  lapbul: 'lapbul',
  lapsem: 'lapsem',
};

export default function MobileDokumen({ onOpen }: MobileDokumenProps) {
  const { protaList, jurnalRows, settings } = useBK();
  const [previewOpen, setPreviewOpen] = useState(false);

  const docSpec: DocSpec = useMemo(
    () => ({
      title: 'REKAP ADMINISTRASI BIMBINGAN & KONSELING',
      meta: [
        `${settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN ${
          settings.tahunAjaran || '2026/2027'
        }`,
      ],
      landscape: true,
      signature: true,
      sections: [
        {
          heading: 'I. Program Tahunan (Prota)',
          columns: [
            { label: 'NO', align: 'center', width: '5%' },
            { label: 'KOMPONEN', align: 'left', width: '18%' },
            { label: 'JENIS LAYANAN', align: 'left' },
            { label: 'BIDANG', align: 'center', width: '14%' },
            { label: 'VOL', align: 'center', width: '7%' },
            { label: 'SASARAN', align: 'left', width: '22%' },
          ],
          rows: protaList.map((p, i) => [
            i + 1,
            p.komponen,
            p.jenis,
            p.bidang,
            `${p.volume} jam`,
            p.sasaran || '-',
          ]),
        },
        {
          heading: 'II. Jurnal Harian BK',
          columns: [
            { label: 'NO', align: 'center', width: '5%' },
            { label: 'HARI & TANGGAL', align: 'left', width: '16%' },
            { label: 'WAKTU', align: 'center', width: '8%' },
            { label: 'NAMA SISWA / SASARAN', align: 'left', width: '16%' },
            { label: 'KELAS', align: 'center', width: '7%' },
            { label: 'JENIS LAYANAN', align: 'left', width: '14%' },
            { label: 'URAIAN KEGIATAN', align: 'left' },
          ],
          rows: jurnalRows.map((r, i) => [
            i + 1,
            r.hariTanggal || '-',
            r.waktu || '-',
            r.nama || '-',
            r.kelas || '-',
            r.jenis || '-',
            r.topik || '-',
          ]),
        },
      ],
    }),
    [protaList, jurnalRows, settings],
  );

  const badgeFor = (id: string) => {
    if (id === 'prota') return `${protaList.length} item`;
    if (id === 'jurnal') return `${jurnalRows.length} entri`;
    if (id === 'prosem') return '12 bulan';
    if (id === 'lapbul') return 'Otomatis';
    if (id === 'lapsem') return 'Evaluasi';
    return 'Siap';
  };

  const exportAll = () => {
    const headers = [
      'Kategori Dokumen',
      'ID / No',
      'Judul / Uraian Kegiatan',
      'Sasaran',
      'Alokasi / Waktu',
      'Keterangan',
    ];
    const protaRows = protaList.map((p, idx) => [
      'Program Tahunan (Prota)',
      idx + 1,
      `${p.komponen}: ${p.jenis} (${p.bidang})`,
      p.sasaran,
      `${p.volume} Jam/Kegiatan`,
      'Aktif Terjadwal',
    ]);
    const jurnalRowsCsv = jurnalRows.map((j, idx) => [
      'Jurnal Harian BK',
      idx + 1,
      `${j.jenis} - ${j.nama} (${j.kelas})`,
      j.nama,
      `${j.hariTanggal} ${j.waktu}`,
      j.keterangan || j.topik,
    ]);
    exportToCsv(
      `Arsip_Administrasi_BK_${settings.namaSekolah.replace(/\s+/g, '_')}_${new Date()
        .toISOString()
        .slice(0, 10)}`,
      headers,
      [...protaRows, ...jurnalRowsCsv],
    );
  };

  return (
    <div className="fade-up space-y-5">
      <PageHeader
        title="Dokumen BK"
        subtitle="Administrasi bimbingan & konseling siap cetak"
      />

      <div className="space-y-2.5">
        {DOCUMENTS.map((doc) => {
          const Icon =
            doc.id === 'akpd' ? FileCheck2 : doc.id === 'karir' ? Compass : FileText;
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onOpen(ROUTE_MAP[doc.id] ?? 'dokumen')}
              className="bk-row group !items-start !p-3.5"
            >
              <span className="bk-tile s mt-0.5 flex-none">
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[14px] font-bold leading-snug text-text transition-colors group-hover:text-primary">
                  {doc.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted">
                  {doc.desc}
                </span>
                <span className="mt-1.5 inline-block rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-bold text-accent">
                  {badgeFor(doc.id)}
                </span>
              </span>
              <ChevronRight size={16} className="mt-1 flex-none text-muted/60" />
            </button>
          );
        })}
      </div>

      <section className="bk-card space-y-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-primary-tint text-primary">
            <CheckCircle2 size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-text">Unduh Rekap Administrasi</h2>
            <p className="mt-0.5 text-xs text-muted">
              Rangkuman Prota & Jurnal dalam satu berkas Excel.
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={exportAll}
            className="bk-btn primary min-h-[46px] w-full"
          >
            <Download size={15} /> Unduh Rekap (Excel/CSV)
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="bk-btn ghost min-h-[46px] w-full"
          >
            <FileText size={15} /> Pratinjau &amp; Cetak Rekap
          </button>
        </div>
      </section>

      <DocPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        spec={docSpec}
        settings={settings}
      />
    </div>
  );
}
