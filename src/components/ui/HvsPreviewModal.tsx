import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Eye } from 'lucide-react';

interface HvsPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const HvsPreviewModal: React.FC<HvsPreviewModalProps> = ({
  open,
  onClose,
  title = 'Pratinjau Kertas HVS',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('hvs-modal-open');
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('hvs-modal-open');
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-[3px] p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto"
      onClick={onClose}
    >
      {/* Top Floating Toolbar */}
      <div
        className="w-full max-w-4xl mx-auto mb-3 bg-surface rounded-[16px] p-3 sm:px-5 flex items-center justify-between shadow-xl border border-border print:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center">
            <Eye size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-text">{title}</h3>
            <p className="text-[11px] text-muted">Format Kertas A4 / Folio Standar Dinas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[38px] px-4 rounded-[10px] bg-primary text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak Kertas Ini</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup Pratinjau"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Sheet Simulation Container */}
      <div className="flex-1 overflow-y-auto flex justify-center pb-8 print:p-0 print:overflow-visible print:block">
        <div
          className="hvs-sheet-print w-full max-w-[820px] bg-white text-black shadow-2xl border border-black rounded-none p-6 sm:p-12 print:border-none print:shadow-none print:p-0 my-auto min-h-[900px] text-xs leading-relaxed font-sans print:max-w-none print:min-h-0 print:m-0"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HvsPreviewModal;
