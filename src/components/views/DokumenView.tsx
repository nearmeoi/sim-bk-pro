import React from "react";
import {
  FileText, Download, ChevronRight, CheckCircle2, FileCheck2, Compass
} from 'lucide-react';
import PetunjukIbu from '../ui/PetunjukIbu';
import { useBK } from '../../context/BKContext';
import { DOCUMENTS } from '../../data/dummy';
import { exportToCsv } from '../../lib/exportCsv';
import type { DocumentMeta, NavView } from '../../types';
import ProtaForm from './dokumen/ProtaForm';
import JurnalForm from './dokumen/JurnalForm';
import RplForm from './dokumen/RplForm';

interface DokumenViewProps {
  onNav?: (v: NavView) => void;
  onToast: (msg: string) => void;
}

const STATUS_STYLE: Record<DocumentMeta['status'], string> = {
  Draf: 'bg-gray-100 text-gray-600',
  Siap: 'bg-primary-tint text-primary font-bold',
  Final: 'bg-accent-50 text-accent-700 font-bold',
};

export const DokumenView: React.FC<DokumenViewProps> = ({ onNav, onToast }) => {
  const { protaList, jurnalRows, settings, activeDocTab, setActiveDocTab } = useBK();

  if (activeDocTab === 'prota') return <ProtaForm onBack={() => setActiveDocTab(null)} onToast={onToast} />;
  if (activeDocTab === 'jurnal') return <JurnalForm onBack={() => setActiveDocTab(null)} onToast={onToast} />;
  if (activeDocTab === 'rpl') return <RplForm onBack={() => setActiveDocTab(null)} onToast={onToast} />;

  const handleExportAllCsv = () => {
    // Export combined summary of Prota and Jurnal
    const headers = ['Kategori Dokumen', 'ID / No', 'Judul / Uraian Kegiatan', 'Sasaran', 'Alokasi / Waktu', 'Keterangan'];
    const protaRows = protaList.map((p, idx) => [
      'Program Tahunan (Prota)',
      idx + 1,
      `${p.komponen}: ${p.jenis} (${p.bidang})`,
      p.sasaran,
      `${p.volume} Jam/Kegiatan`,
      'Aktif Terjadwal',
    ]);
    const jurnalSummaryRows = jurnalRows.map((j, idx) => [
      'Jurnal Harian BK',
      idx + 1,
      `${j.jenis} - ${j.nama} (${j.kelas})`,
      j.nama,
      `${j.hariTanggal} ${j.waktu}`,
      j.keterangan || j.topik,
    ]);

    exportToCsv(
      `Arsip_Administrasi_BK_${settings.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      [...protaRows, ...jurnalSummaryRows]
    );
    onToast(`✓ Berhasil mengekspor bundel rekapitulasi administrasi BK ke format CSV/Excel!`);
  };

  return (
    <div className="fade-up space-y-6">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
          Dokumen Administrasi BK
        </h1>
      </div>

      <PetunjukIbu
        tips={[
          'Klik "Program Tahunan BK (Prota)" untuk mengatur matriks jadwal layanan 12 bulan (Juli–Juni) dan alokasi jam kerja.',
          'Klik "Jurnal Harian BK" untuk memeriksa rekapitulasi kegiatan bimbingan harian. Data jurnal terisi otomatis setiap Ibu mencatat layanan.',
          'Klik "RPL (Rencana Pelaksanaan Layanan)" untuk membuat modul bimbingan klasikal 1-lembar Kurikulum Merdeka siap cetak.',
          'Gunakan tombol hijau di bagian bawah untuk mengekspor bundel rekapitulasi seluruh administrasi ke Excel.'
        ]}
      />
      {/* List of Documents as Elevated Rows */}
      <div className="space-y-3">
        {DOCUMENTS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => {
              if (doc.id === 'prota' || doc.id === 'jurnal' || doc.id === 'rpl') {
                setActiveDocTab(doc.id);
              } else if (doc.id === 'akpd') {
                onNav?.('akpd');
              } else if (doc.id === 'karir') {
                onNav?.('karir');
              } else {
                onToast(`Formulir ${doc.title} siap diedit`);
              }
            }}
            className="bk-row group"
          >
            <div className="bk-tile s flex-none">
              {doc.id === 'akpd' ? (
                <FileCheck2 size={20} strokeWidth={2} />
              ) : doc.id === 'karir' ? (
                <Compass size={20} strokeWidth={2} />
              ) : (
                <FileText size={20} strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block font-bold text-[15px] text-text group-hover:text-primary transition-colors truncate">
                {doc.title}
              </span>
              <span className="block text-xs text-muted truncate mt-0.5">
                {doc.desc}
              </span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[doc.status]}`}>
              {doc.id === 'prota' ? `${protaList.length} Item` : doc.id === 'jurnal' ? `${jurnalRows.length} Entri` : doc.id === 'rpl' ? 'Siap Cetak' : doc.status}
            </span>
            <ChevronRight
              size={18}
              className="text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-none"
            />
          </button>
        ))}
      </div>

      {/* Batch Export Card */}
      <div className="bk-card bg-gradient-to-br from-white to-[#FFF5ED] p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-primary-tint text-primary flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-text">Unduh Rekap Administrasi</h3>
            <p className="text-xs text-muted mt-0.5">
              Unduh rangkuman seluruh berkas ke format Excel atau cetak langsung.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={() => {
              window.print();
            }}
            className="min-h-[46px] px-5 rounded-[12px] bg-primary text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] flex items-center gap-2 transition-all shadow-sm"
          >
            <Download size={14} /> Cetak / Simpan Ringkasan (PDF)
          </button>
          <button
            onClick={handleExportAllCsv}
            className="min-h-[46px] px-5 rounded-[12px] bg-accent-700 text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] flex items-center gap-2 transition-all shadow-sm"
          >
            <Download size={14} /> Unduh Format Rekap (Excel/CSV)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DokumenView;
