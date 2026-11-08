import React, { useState } from 'react';
import {
  Home, Users, FileText, Settings, Plus,
  FileCheck2, Compass, ChevronDown, ChevronUp, Calendar, BookOpen, LogOut
} from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { confirmDialog } from '../ui/ConfirmModal';
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
        className={`w-full min-h-[48px] px-3.5 rounded-[14px] flex items-center gap-3 text-[15px] transition-all text-left cursor-pointer ${
          active
            ? 'bg-neutral-900 text-white font-bold shadow-sm'
            : 'text-muted hover:bg-neutral-100 hover:text-text font-medium'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.25 : 1.75} className="flex-none" />
        <span className="flex-1 truncate">{label}</span>
        {badge && (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-neutral-800 text-white flex-none">
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
        <div className="w-10 h-10 rounded-[12px] bg-black text-white flex items-center justify-center font-black text-[15px] shadow-sm flex-none">
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
        className="w-full min-h-[48px] rounded-[14px] bg-black hover:bg-neutral-800 text-white font-bold text-[15px] flex items-center justify-center gap-2 mb-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
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
                ? 'bg-neutral-900 text-white font-bold shadow-sm'
                : 'text-muted hover:bg-neutral-100 hover:text-text font-medium'
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
              className={`p-1 rounded-md transition-colors ${
                isDokumenActive ? 'hover:bg-white/10 text-white/80' : 'hover:bg-black/5 text-muted hover:text-text'
              }`}
            >
              {isDokumenExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {/* Sub-menu Collapsible */}
          {isDokumenExpanded && (
            <div className="border-l-2 border-neutral-300 ml-5 pl-2.5 space-y-1 py-1 fade-up">
              <button
                type="button"
                onClick={() => {
                  setActiveDocTab(null);
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && !activeDocTab
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
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
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
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
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
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
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
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
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
                }`}
              >
                <FileCheck2 size={15} className="flex-none" />
                <span className="flex-1 truncate">Angket AKPD</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-neutral-800 text-white flex-none">
                  50
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNav('karir')}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'karir' || current === 'shinro'
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
                }`}
              >
                <Compass size={15} className="flex-none" />
                <span className="flex-1 truncate">Pilihan Karir</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-neutral-800 text-white flex-none">
                  Kls 9
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('prosem');
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && activeDocTab === 'prosem'
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
                }`}
              >
                <Calendar size={15} className="flex-none" />
                <span className="flex-1 truncate">Program Semester</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('lapbul');
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && activeDocTab === 'lapbul'
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
                }`}
              >
                <FileText size={15} className="flex-none" />
                <span className="flex-1 truncate">Laporan Bulanan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('lapsem');
                  onNav('dokumen');
                }}
                className={`w-full min-h-[36px] px-2.5 rounded-[10px] flex items-center gap-2 text-[13px] transition-all text-left cursor-pointer ${
                  current === 'dokumen' && activeDocTab === 'lapsem'
                    ? 'text-neutral-900 font-extrabold bg-neutral-200/80'
                    : 'text-muted hover:text-text hover:bg-neutral-100 font-medium'
                }`}
              >
                <FileText size={15} className="flex-none" />
                <span className="flex-1 truncate">Laporan Semester</span>
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
          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-none">
            {settings.guruBK ? settings.guruBK.split(' ')[0][0] : 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text truncate leading-tight">
              {settings.guruBK ? settings.guruBK.split(',')[0] : 'Guru BK'}
            </p>
            <p className="text-[11px] text-muted truncate mt-0.5">
              {settings.namaSekolah || 'SIM BK PRO'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            const ok = await confirmDialog({
              title: 'Keluar dari aplikasi SIM BK PRO?',
              confirmLabel: 'Keluar',
              tone: 'danger',
            });
            if (ok) {
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

