import React, { useState } from 'react';
import {
  DoorOpen,
  MessageSquare,
  Folder,
  FileText,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  Compass,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PetunjukIbu from '../ui/PetunjukIbu';
import Skeleton from '../ui/Skeleton';
import { greeting, DOCUMENTS } from '../../data/dummy';
import { useBK } from '../../context/BKContext';
import { NavView } from '../../types';

interface BerandaViewProps {
  onNav: (v: NavView) => void;
  onCatat: () => void;
  onToast: (msg: string) => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({ onNav, onCatat }) => {
  const { students, cases, settings, protaList, jurnalRows, isBooting } = useBK();
  const [showAllDocs, setShowAllDocs] = useState(false);
  const aktif = students.filter((s) => s.status === 'Aktif').length;
  const kasusProses = cases.filter((c) => c.status === 'Proses').length;
  const totalKasus = cases.length;
  const displayedDocs = showAllDocs ? DOCUMENTS : DOCUMENTS.slice(0, 3);
  const quickActions = [
    { label: 'Kunjungan', desc: 'Home Visit', icon: DoorOpen, action: () => onCatat() },
    { label: 'Konseling', desc: 'Tatap Muka', icon: MessageSquare, action: () => onCatat() },
    { label: 'Angket AKPD', desc: '50 Butir', icon: FileCheck2, action: () => onNav('akpd') },
    { label: 'Pilihan Karir', desc: 'SMA / SMK', icon: Compass, action: () => onNav('karir') },
    { label: 'Jurnal BK', desc: 'Buku Harian', icon: FileText, action: () => onNav('dokumen') },
  ];

  return (
    <div className="fade-up space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Sapaan & Profil */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
            {greeting()}, Ibu Guru
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNav('profil')}
          className="bk-me lg:hidden hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          title="Buka Profil Pengguna"
          aria-label="Profil"
        >
          G
        </button>
      </div>

      {/* 2. Hero Banner dengan Tombol CTA Utama yang Pas Kiri-Kanan */}
      <div className="bk-hero">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5 max-w-lg">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full">
              Bimbingan & Konseling
            </span>
            <h2 className="text-[22px] sm:text-[25px] font-bold text-white tracking-tight leading-snug">
              {settings.namaSekolah || 'SIM BK PRO'}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Catatan konseling tersimpan ke buku siswa dan jurnal harian.
            </p>
          </div>

          <button
            onClick={onCatat}
            className="w-full sm:w-auto min-h-[48px] px-6 rounded-[14px] bg-white text-primary font-black text-sm shadow-md hover:bg-white/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} className="text-accent" />
            <span>Catat Layanan</span>
          </button>
        </div>
      </div>

      {/* 3. Panduan Singkat Ramah Ibu */}
      <PetunjukIbu
        tips={[
          'Setiap layanan yang dicatat otomatis masuk ke catatan siswa dan jurnal harian.',
          'Tabel "Perlu Tindak Lanjut" memuat siswa dengan masalah yang belum selesai ditangani.',
          'Klik tombol "Buka" pada baris siswa untuk melihat riwayat atau mencetak surat panggilan orang tua.'
        ]}
      />

      {/* 4. Tombol Aksi Cepat: Ngepas Kiri-Kanan dengan Jarak Rapi & Padat */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text">
            Pintasan Layanan
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full">
          {quickActions.map(({ label, desc, icon: Icon, action }, idx) => (
            <button
              key={label}
              onClick={action}
              className={`min-h-[58px] sm:min-h-[62px] px-3.5 py-2.5 rounded-[16px] bg-surface border border-border/80 hover:border-border shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center gap-3 text-left group cursor-pointer ${
                idx === quickActions.length - 1 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-[12px] bg-gray-100 text-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-text transition-colors truncate leading-tight">
                  {label}
                </span>
                <span className="block text-[11px] text-muted truncate mt-0.5">
                  {desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Statistik Layanan: 3 Kartu Berjejer Penuh Kiri-Kanan */}
      <section className="space-y-2.5">
        <h2 className="text-[17px] font-[750] text-text">
          Statistik Layanan
        </h2>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full">
          {isBooting ? (
            <>
              <Skeleton className="h-[86px]" />
              <Skeleton className="h-[86px]" />
              <Skeleton className="h-[86px]" />
            </>
          ) : (
            <>
          <div className="bk-card p-3.5 sm:p-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
<span className="block text-[26px] sm:text-[30px] font-black text-primary leading-none">
                {aktif}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-muted mt-1 block">
                Siswa Aktif
              </span>
            </div>
<div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary-tint text-primary items-center justify-center font-bold text-xs">
              BK
            </div>
          </div>

          <div className="bk-card p-3.5 sm:p-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
              <span className="block text-[26px] sm:text-[30px] font-black text-alert leading-none">
                {kasusProses}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-muted mt-1 block">
                Kasus Berjalan
              </span>
            </div>
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-alert-tint text-alert items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>

          <div className="bk-card p-3.5 sm:p-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
              <span className="block text-[26px] sm:text-[30px] font-black text-gray-700 leading-none">
                {totalKasus}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-muted mt-1 block">
                Total Kasus
              </span>
            </div>
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gray-100 text-gray-700 items-center justify-center">
              <Folder size={18} />
            </div>
          </div>
            </>
          )}
        </div>
      </section>

      {/* 6. Kasus Perlu Tindak Lanjut (Satu Kolom Mengalir ke Bawah) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-[750] text-text">
              Perlu Tindak Lanjut
            </h2>
            <span className="bk-pill">
              {kasusProses} Kasus Aktif
            </span>
          </div>
          <button
            onClick={() => onNav('siswa')}
            className="text-xs font-bold text-muted hover:text-text hover:underline flex items-center gap-0.5"
          >
            Buka Data Siswa <ChevronRight size={14} />
          </button>
        </div>

        <div className="bg-white border border-black rounded-none p-4 sm:p-5 shadow-sm text-black">
          <div className="overflow-x-auto border-t border-black">
            <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black min-w-[640px]">
              <thead>
                <tr className="bg-gray-100 font-extrabold text-black">
                  <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                  <th className="border border-black px-3 py-2 text-left w-44">NAMA SISWA</th>
                  <th className="border border-black px-2 py-2 text-center w-16">KELAS</th>
                  <th className="border border-black px-3 py-2 text-left">URAIAN MASALAH / KASUS</th>
                  <th className="border border-black px-2 py-2 text-center w-24">TANGGAL</th>
                  <th className="border border-black px-2 py-2 text-center w-20">STATUS</th>
                  <th className="border border-black px-2 py-2 text-center w-20">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {cases.filter((c) => c.status === 'Proses').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-black p-4 text-center text-xs text-gray-500 italic">
                      âœ“ Tidak ada kasus mendesak yang sedang berjalan saat ini. Semua tertangani dengan baik.
                    </td>
                  </tr>
                ) : (
                  cases
                    .filter((c) => c.status === 'Proses')
                    .map((c, idx) => (
<tr key={c.id} className="hover:bg-primary-tint transition-colors">
                        <td className="border border-black px-2 py-2 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-black px-3 py-2 font-bold text-black">
                          {c.namaSiswa}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-bold text-alert">
                          {c.kelas}
                        </td>
                        <td className="border border-black px-3 py-2 text-gray-800 leading-snug">
                          {c.masalah}
                        </td>
                        <td className="border border-black px-2 py-2 text-center text-xs text-gray-700 whitespace-nowrap">
                          {c.tanggal}
                        </td>
                        <td className="border border-black px-2 py-2 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-alert-tint text-alert whitespace-nowrap">
                            {c.status}
                          </span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => onNav('siswa')}
                            className="px-3 py-1 rounded-[8px] bg-primary text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs"
                            title="Buka catatan siswa"
                          >
                            Buka
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. Dokumen Administrasi BK (Semua Dokumen Termasuk AKPD & Karir dengan Collapse / See More) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-[750] text-text">
              Dokumen Administrasi BK
            </h2>
            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {DOCUMENTS.length} Perangkat
            </span>
          </div>
          <button
            onClick={() => onNav('dokumen')}
            className="text-xs font-bold text-muted hover:text-text hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Buka Menu Dokumen <ChevronRight size={14} />
          </button>
        </div>

        <div className="bk-card space-y-3">
          {/* Progress Singkat */}
          <div className="flex items-center justify-between text-xs pb-1 border-b border-border">
            <span className="text-muted font-medium">Status Perangkat BK:</span>
<span className="font-bold text-primary">Tersedia</span>
          </div>

          {/* List Dokumen Terpadu (Top 3 tampil langsung, sisanya collapse / see more) */}
          <div className="space-y-2">
            {displayedDocs.map((doc) => {
              const Icon = doc.id === 'akpd' ? FileCheck2 : doc.id === 'karir' ? Compass : FileText;
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (doc.id === 'akpd') onNav('akpd');
                    else if (doc.id === 'karir') onNav('karir');
                    else onNav('dokumen');
                  }}
                  className="w-full p-3 rounded-[14px] bg-[#FFFFFF] hover:bg-gray-50 border border-border/80 hover:border-border transition-all flex items-center gap-3 text-left group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-border/80 text-muted flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs sm:text-sm font-bold text-text transition-colors truncate">
                      {doc.title}
                    </span>
                    <span className="block text-[11px] text-muted truncate mt-0.5">
                      {doc.desc}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                    {doc.id === 'prota'
                      ? `${protaList.length} Item`
                      : doc.id === 'jurnal'
                      ? `${jurnalRows.length} Entri`
                      : doc.id === 'rpl'
                      ? '1-Lembar'
                      : doc.id === 'akpd'
                      ? '50 Butir'
                      : doc.id === 'karir'
                      ? 'Kelas 9'
                      : doc.status}
                  </span>
                  <ChevronRight size={16} className="text-muted/60 group-hover:text-muted/80 group-hover:translate-x-0.5 transition-all flex-none" />
                </button>
              );
            })}
          </div>

          {/* Tombol See More / Collapse */}
          <button
            type="button"
            onClick={() => setShowAllDocs(!showAllDocs)}
            className="w-full py-2.5 px-4 rounded-[12px] bg-bg hover:bg-gray-200/80 text-xs font-bold text-text flex items-center justify-center gap-1.5 transition-colors border border-border/60 cursor-pointer mt-1"
          >
            <span>
              {showAllDocs
                ? 'Tutup Dokumen Lainnya'
                : `Lihat ${DOCUMENTS.length - 3} Dokumen Lainnya`}
            </span>
            {showAllDocs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </section>

    </div>
  );
};

export default BerandaView;

