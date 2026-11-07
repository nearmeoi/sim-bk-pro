import React, { useState } from 'react';
import {
  Home, Users, FileText, Settings, Plus,
  FileCheck2, Compass, ChevronDown, ChevronUp, Calendar, BookOpen, LogOut
} from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { NavView } from '../../types';
interface SidebarProps {
  current: NavView;
  onNav: (v: NavView) => void;
  onCatat: () => void;
}

export default function Sidebar({ current, onNav, onCatat }: SidebarProps) {
  const { settings, activeDocTab, setActiveDocTab, logout } = useBK();
  const [dokumenCollapsed, setDokumenCollapsed] = useState(false);
  const isDokumenActive = current === 'dokumen' || current === 'akpd' || current === 'karir' || current === 'shinro';
  const isDokumenExpanded = !dokumenCollapsed;
  const navBtn = (id: NavView, label: string, Icon: React.ElementType, badge?: string) => {
    const active = current === id || (id === 'karir' && current === 'shinro');
    return (
      <button
        key={id}
        onClick={() => onNav(id)}
        className={`w-full min-h-[48px] px-3.5 rounded-[14px] flex items-center gap-3 text-[15px] transition-all text-left ${
          active
            ? 'bg-primary-tint text-primary font-bold shadow-sm'
            : 'text-muted hover:bg-bg hover:text-text font-medium'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.25 : 1.75} className="flex-none" />
        <span className="flex-1 truncate">{label}</span>
        {badge && (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-600 text-white flex-none">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[248px] bg-surface border-r border-border p-5 z-20">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 pb-5">
        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-primary to-primary-2 text-white flex items-center justify-center font-extrabold text-[15px] shadow-sm flex-none">
          BK
        </div>
        <div>
          <span className="font-extrabold text-[19px] tracking-tight text-text block leading-none">
            SIM-BK
          </span>
          <span className="text-[11px] font-medium text-muted mt-1 block">
            Bimbingan Konseling
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onCatat}
        className="w-full min-h-[48px] rounded-[14px] bg-accent text-white font-bold text-[15px] flex items-center justify-center gap-2 mb-4 shadow-[0_6px_16px_rgb(232_106_51/0.25)] hover:brightness-105 active:scale-[0.98] transition-all"
      >
        <Plus size={19} strokeWidth={2.5} />
        <span>Catat Layanan</span>
      </button>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pt-1">
        {navBtn('beranda', 'Beranda', Home)}
        {navBtn('siswa', 'Data Siswa', Users)}
        {/* Dokumen BK (Induk dengan Sub-menu Collapsible: AKPD & Karir) */}
        <div className="space-y-1">
          <div
            className={`w-full min-h-[48px] px-3.5 rounded-[14px] flex items-center gap-3 text-[15px] transition-all text-left cursor-pointer ${
              isDokumenActive
                ? 'bg-primary-tint text-primary font-bold shadow-sm'
                : 'text-muted hover:bg-bg hover:text-text font-medium'
            }`}
            onClick={() => {
              setDokumenCollapsed(false);
              if (!isDokumenActive) onNav('dokumen');
            }}
          >
            <FileText size={20} strokeWidth={isDokumenActive ? 2.25 : 1.75} className="flex-none" />
            <span className="flex-1 truncate">Dokumen BK</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDokumenCollapsed((prev) => !prev);
              }}
              className="p-1 hover:bg-black/5 rounded-md transition-colors text-muted hover:text-text"
              title={isDokumenExpanded ? 'Tutup sub-menu' : 'Buka sub-menu'}
            >
              {isDokumenExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {/* Sub-menu Collapsible */}
          {isDokumenExpanded && (
            <div className="border-l-2 border-primary/20 ml-5 pl-2.5 space-y-1 py-1 fade-up">
              <button
                type="button"
                onClick={() => {
                  setActiveDocTab(null);
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && !activeDocTab
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-muted hover:text-text hover:bg-bg font-medium'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                <span className="flex-1 truncate">Semua Dokumen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('prota');
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && activeDocTab === 'prota'
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-muted hover:text-text hover:bg-bg font-medium'
                }`}
              >
                <Calendar size={15} className="flex-none" />
                <span className="flex-1 truncate">Program Tahunan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('jurnal');
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && activeDocTab === 'jurnal'
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-muted hover:text-text hover:bg-bg font-medium'
                }`}
              >
                <FileText size={15} className="flex-none" />
                <span className="flex-1 truncate">Jurnal Harian</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('rpl');
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && activeDocTab === 'rpl'
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-muted hover:text-text hover:bg-bg font-medium'
                }`}
              >
                <BookOpen size={15} className="flex-none" />
                <span className="flex-1 truncate">RPL 1-Lembar</span>
              </button>

              <button
                type="button"
                onClick={() => onNav('akpd')}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'akpd'
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-muted hover:text-text hover:bg-bg font-medium'
                }`}
              >
                <FileCheck2 size={15} className="flex-none" />
                <span className="flex-1 truncate">Angket AKPD</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-500 text-white flex-none">
                  50
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNav('karir')}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'karir' || current === 'shinro'
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-muted hover:text-text hover:bg-bg font-medium'
                }`}
              >
                <Compass size={15} className="flex-none" />
                <span className="flex-1 truncate">Pilihan Karir</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-500 text-white flex-none">
                  Kls 9
                </span>
              </button>
            </div>
          )}
        </div>
        {navBtn('pengaturan', 'Pengaturan', Settings)}
      </nav>

      {/* User Info Footer & Tombol Logout */}
      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-1 px-1">
        <div
          onClick={() => onNav('profil')}
          className="flex items-center gap-2.5 min-w-0 flex-1 px-1.5 py-1 rounded-xl hover:bg-bg cursor-pointer transition-colors"
          title="Buka Profil Pengguna"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs flex-none">
            {settings.guruBK ? settings.guruBK.split(' ')[0][0] : 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text truncate leading-tight">
              {settings.guruBK ? settings.guruBK.split(',')[0] : 'Guru BK'}
            </p>
            <p className="text-[11px] text-muted truncate mt-0.5">
              {settings.namaSekolah || 'SMP Negeri 1 Bintang'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Keluar dari aplikasi SIM-BK?')) {
              logout();
              onNav('login');
            }
          }}
          className="p-1.5 text-muted hover:text-alert hover:bg-alert-tint/60 rounded-lg transition-colors cursor-pointer flex-none"
          title="Keluar dari Aplikasi (Logout)"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
