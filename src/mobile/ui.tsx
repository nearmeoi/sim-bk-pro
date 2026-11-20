import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Gaya input seragam — sama dengan input versi PC. */
export const inputCls =
  'w-full min-h-[48px] px-3.5 rounded-[12px] border border-border bg-surface text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm';

export const textareaCls = `${inputCls} min-h-[96px] py-3 leading-relaxed resize-y`;

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[24px] font-[750] leading-tight tracking-tight text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-xs font-semibold text-muted">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-none items-center gap-2">{right}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[17px] font-[750] text-text">{children}</h2>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-text">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

/** Petunjuk kecil di atas tabel lebar: geser ke samping untuk kolom lain. */
export function TableHint({ className = '' }: { className?: string }) {
  return (
    <p
      className={`mb-1.5 text-[10px] font-semibold text-muted sm:hidden ${className}`.trim()}
      aria-hidden="true"
    >
      ↔ Geser tabel ke samping untuk melihat kolom lainnya.
    </p>
  );
}

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="bk-card text-center">
      {icon && <div className="mb-1.5 flex justify-center text-muted/50">{icon}</div>}
      <p className="text-xs italic text-gray-500">{children}</p>
    </div>
  );
}

/**
 * Lembar bawah (bottom sheet) — struktur visual sama dengan CatatModal versi PC:
 * grab bar, judul tebal, isi bisa digulir, footer aksi menempel di bawah.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="slide-up flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />

        <div className="flex items-center gap-2.5 border-b border-border px-4 pb-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-ml-1 rounded-full p-1.5 text-muted transition-colors active:bg-bg active:text-text"
          >
            <X size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[17px] font-extrabold leading-tight text-text">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && <div className="border-t border-border bg-surface px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Bar aksi atas untuk halaman detail dokumen. */
export function DetailBar({
  onBack,
  label = 'Kembali',
  right,
}: {
  onBack: () => void;
  label?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Kembali"
        className="bk-chip !min-h-[44px] text-xs font-bold"
      >
        <span aria-hidden="true">←</span> {label}
      </button>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

/** Tombol kecil untuk aksi baris (ikon + label). */
export const smallBtnCls =
  'min-h-[40px] px-3 rounded-[12px] border border-border bg-surface text-text text-xs font-bold shadow-sm active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed';
