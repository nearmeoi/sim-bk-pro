import { useEffect, useState } from 'react';
import BaseModal from '../ui/BaseModal';

interface ReasonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  label: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: (reason: string) => Promise<void>;
}

export default function ReasonModal({
  open,
  onClose,
  title,
  description,
  label,
  confirmLabel = 'Simpan',
  tone = 'primary',
  onConfirm,
}: ReasonModalProps) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setSaving(false);
    setError('');
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Alasan wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} title={title} subtitle={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">{label}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-[12px] border border-border bg-surface p-3 text-sm leading-relaxed text-text focus:border-black focus:outline-none"
            required
          />
        </div>
        {error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="bk-btn ghost min-h-[44px]">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`bk-btn min-h-[44px] disabled:opacity-50 ${tone === 'danger' ? 'danger' : 'primary'}`}
          >
            {saving ? 'Menyimpan...' : confirmLabel}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
