import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let listener: ((p: Pending | null) => void) | null = null;

/** Panggil seperti window.confirm, tapi tampil sebagai modal yang aman di HP.
 *  Contoh: if (await confirmDialog({ title: 'Hapus program kerja?', tone: 'danger' })) { ... } */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string' ? { title: options } : options;
  return new Promise((resolve) => listener?.({ ...opts, resolve }));
}

/** Pasang sekali di App: <ConfirmModal /> */
const ConfirmModal: React.FC = () => {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    listener = setPending;
    return () => {
      listener = null;
    };
  }, []);

  const finish = (ok: boolean) => {
    if (pending) pending.resolve(ok);
    setPending(null);
  };

  const danger = pending?.tone === 'danger';

  return (
    <BaseModal open={!!pending} onClose={() => finish(false)} maxWidth="max-w-sm">
      {pending && (
        <div className="space-y-5 text-center pt-2">
          <div
            className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-black text-lg ${
              danger ? 'bg-alert' : 'bg-primary'
            }`}
          >
            !
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-[18px] text-text">{pending.title}</h3>
            {pending.description && (
              <p className="text-xs text-muted leading-relaxed">{pending.description}</p>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => finish(false)}
              className="bk-btn ghost flex-1"
            >
              {pending.cancelLabel || 'Batal'}
            </button>
            <button
              type="button"
              onClick={() => finish(true)}
              className={`bk-btn flex-1 ${danger ? 'danger' : 'primary'}`}
            >
              {pending.confirmLabel || 'Ya, Lanjutkan'}
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default ConfirmModal;
