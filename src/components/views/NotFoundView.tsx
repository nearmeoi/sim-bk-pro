import React from 'react';
import { FileQuestion, Home } from "lucide-react";
import { NavView } from '../../types';

interface NotFoundViewProps {
  onNav: (v: NavView) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNav }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-[24px] p-6 sm:p-8 text-center border border-border shadow-card space-y-5 fade-up">
        <div className="w-16 h-16 rounded-full bg-primary-tint text-primary mx-auto flex items-center justify-center">
          <FileQuestion size={32} />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-alert bg-alert-tint px-2.5 py-0.5 rounded-full">
            Kesalahan 404
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight mt-1">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xs mx-auto">
            Halaman yang Ibu tuju tidak tersedia atau tautannya telah dipindahkan.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onNav('beranda')}
            className="w-full min-h-[46px] rounded-[14px] bg-primary text-white text-xs sm:text-sm font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Home size={16} />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundView;
