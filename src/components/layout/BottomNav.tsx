import React from 'react';
import { Home, Users, FileCheck2, FileText, Plus } from 'lucide-react';
import { NavView } from '../../types';
import { AppGlassButton } from '../ui/glass';

interface BottomNavProps {
  current: NavView;
  onNav: (v: NavView) => void;
  onCatat: () => void;
}

export default function BottomNav({ current, onNav, onCatat }: BottomNavProps) {
  const tab = (id: NavView, label: string, Icon: React.ElementType) => {
    const active = current === id;
    return (
      <button
        key={id}
        onClick={() => onNav(id)}
        className={`flex-1 min-h-[68px] flex flex-col items-center justify-center gap-1 text-[11px] transition-all select-none ${
          active ? 'text-neutral-900 font-bold' : 'text-muted font-medium hover:text-text'
        }`}
      >
        <span
          className={`w-12 h-7 rounded-[15px] flex items-center justify-center transition-all ${
            active ? 'bg-neutral-900/90 backdrop-blur-md text-white ring-1 ring-white/40' : 'text-muted'
          }`}
        >
          <Icon size={19} strokeWidth={active ? 2.25 : 1.75} />
        </span>
        <span className="leading-none">{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 glass-panel border-t border-border flex items-center shadow-[0_-6px_20px_rgb(0_0_0/0.04)] lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tab('beranda', 'Beranda', Home)}
      {tab('siswa', 'Siswa', Users)}

      {/* Elevated FAB Center */}
      <div className="flex-1 flex flex-col items-center justify-center select-none">
        <AppGlassButton
          variant="neutral"
          size="lg"
          icon={<Plus size={24} strokeWidth={2.75} />}
          aria-label="Catat Layanan"
          onClick={onCatat}
          className="!w-14 !h-14 -mt-6 shadow-lg"
        />
        <span className="text-[12px] font-bold text-neutral-900 mt-1 leading-none">
          Catat
        </span>
      </div>

      {tab('akpd', 'AKPD', FileCheck2)}
      {tab('dokumen', 'Dokumen', FileText)}
    </nav>
  );
}
