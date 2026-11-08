import React, { useState } from 'react';
import {
  School,
  ArrowLeft,
  LogOut,
  Settings,
} from "lucide-react";
import { useBK } from '../../context/BKContext';
import { NavView } from '../../types';
import { confirmDialog } from '../ui/ConfirmModal';

interface ProfilViewProps {
  onNav: (v: NavView) => void;
  onToast: (msg: string) => void;
}

export const ProfilView: React.FC<ProfilViewProps> = ({ onNav, onToast }) => {
  const { settings, students, records, cases, logout } = useBK();

  const handleLogout = async () => {
    const ok = await confirmDialog({
      title: 'Keluar dari aplikasi?',
      description: 'Data yang tersimpan aman di cloud. Anda akan kembali ke halaman masuk.',
      confirmLabel: 'Keluar',
      tone: 'danger',
    });
    if (ok) {
      logout();
      onToast('Ibu telah keluar dari sesi aplikasi.');
      onNav('login');
    }
  };

  const totalSelesai = cases.filter((c) => c.status === 'Selesai').length;
  const displaySetting = (value: string) => value.trim() || 'Belum diisi';

  return (
    <div className="fade-up space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNav('beranda')}
          className="bk-chip !min-h-[44px] text-xs font-bold"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </button>
        <button
          onClick={() => onNav('pengaturan')}
          className="bk-chip !min-h-[44px] text-xs font-bold text-primary"
        >
          <Settings size={15} /> Edit Data di Pengaturan
        </button>
      </div>

      {/* Profil Card Utama */}
      <div className="bk-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-border pb-6">
          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-3xl shadow-md shrink-0">
            {settings.guruBK.trim().charAt(0) || 'G'}
          </div>

          <div className="space-y-1 flex-1">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-tint text-primary mb-1">
              Guru Bimbingan & Konseling
            </span>
            <h1 className="text-[22px] sm:text-[26px] font-black text-text tracking-tight leading-tight">
              {settings.guruBK || 'Belum Diisi di Pengaturan'}
            </h1>
            <p className="text-sm font-semibold text-muted">
              NIP. {displaySetting(settings.nipGuruBK)}
            </p>
            <p className="text-xs text-muted flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <School size={14} className="text-primary" />
              <span>{displaySetting(settings.namaSekolah)}</span>
            </p>
          </div>
        </div>

        {/* Ringkasan Statistik Pelayanan */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
            Ringkasan Pelayanan Konseling
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-[16px] bg-[#FFFFFF] border border-border text-center">
              <span className="block text-2xl font-black text-primary leading-none">
                {students.length}
              </span>
              <span className="text-xs text-muted font-medium mt-1 block">
                Siswa Binaan
              </span>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FFFFFF] border border-border text-center">
              <span className="block text-2xl font-black text-accent leading-none">
                {records.length}
              </span>
              <span className="text-xs text-muted font-medium mt-1 block">
                Sesi Konseling
              </span>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FFFFFF] border border-border text-center">
              <span className="block text-2xl font-black text-accent-700 leading-none">
                {totalSelesai}
              </span>
              <span className="text-xs text-muted font-medium mt-1 block">
                Kasus Tuntas
              </span>
            </div>
          </div>
        </div>

        {/* Identitas Kepegawaian & Kontak */}
        <div className="space-y-2.5 pt-1">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
            Informasi Satuan Pendidikan
          </h2>
          <div className="p-4 rounded-[16px] bg-white border border-border space-y-2.5 text-xs text-text">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-medium">Satuan Pendidikan:</span>
              <span className="font-bold">{displaySetting(settings.namaSekolah)}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-medium">NPSN:</span>
              <span className="font-bold">{displaySetting(settings.npsn)}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-medium">Kepala Sekolah:</span>
              <span className="font-bold">{displaySetting(settings.kepalaSekolah)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted font-medium">Tahun Ajaran:</span>
              <span className="font-bold">{settings.tahunAjaran}</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Keluar */}
        <div className="pt-2 border-t border-border flex justify-between items-center">
          <p className="text-[11px] text-muted">
            Sesi aktif Guru BK · Tersimpan di peramban ini.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[42px] px-4 rounded-[12px] bg-alert-tint text-alert text-xs font-bold hover:bg-red-100 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilView;

