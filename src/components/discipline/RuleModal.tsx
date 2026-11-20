import { useEffect, useState } from 'react';
import BaseModal from '../ui/BaseModal';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../lib/discipline';
import type { ViolationCategory, ViolationRule } from '../../types';

interface RuleModalProps {
  open: boolean;
  onClose: () => void;
  rule: ViolationRule | null;
  onCreate: (input: {
    code: string;
    category: ViolationCategory;
    name: string;
    points: number;
    guidebookPoints: number;
    defaultSanction?: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<
        ViolationRule,
        'name' | 'description' | 'points' | 'guidebookPoints' | 'defaultSanction' | 'isActive'
      >
    >
  ) => Promise<void>;
  onToast: (message: string) => void;
}

export default function RuleModal({ open, onClose, rule, onCreate, onUpdate, onToast }: RuleModalProps) {
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ViolationCategory>('ringan');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  const [guidebookPoints, setGuidebookPoints] = useState('1');
  const [defaultSanction, setDefaultSanction] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setError('');
    if (rule) {
      setCode(rule.code);
      setCategory(rule.category);
      setName(rule.name);
      setDescription(rule.description);
      setPoints(String(rule.points));
      setGuidebookPoints(String(rule.guidebookPoints));
      setDefaultSanction(rule.defaultSanction);
      setIsActive(rule.isActive);
    } else {
      setCode('');
      setCategory('ringan');
      setName('');
      setDescription('');
      setPoints('10');
      setGuidebookPoints('1');
      setDefaultSanction('');
      setIsActive(true);
    }
  }, [open, rule]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const pointValue = Number(points);
    const guideValue = Number(guidebookPoints);
    if (!name.trim()) {
      setError('Nama aturan wajib diisi.');
      return;
    }
    if (!Number.isFinite(pointValue) || pointValue <= 0) {
      setError('Poin aplikasi harus lebih dari 0.');
      return;
    }
    if (!Number.isFinite(guideValue) || guideValue <= 0) {
      setError('Poin buku panduan harus lebih dari 0.');
      return;
    }
    if (!rule && !code.trim()) {
      setError('Kode aturan wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (rule) {
        await onUpdate(rule.id, {
          name: name.trim(),
          description: description.trim(),
          points: pointValue,
          guidebookPoints: guideValue,
          defaultSanction: defaultSanction.trim(),
          isActive,
        });
        onToast(`Aturan ${name.trim()} berhasil diperbarui. Catatan lama tidak berubah.`);
      } else {
        await onCreate({
          code: code.trim(),
          category,
          name: name.trim(),
          points: pointValue,
          guidebookPoints: guideValue,
          defaultSanction: defaultSanction.trim(),
        });
        onToast(`Aturan ${name.trim()} berhasil ditambahkan.`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan aturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={rule ? 'Ubah Aturan Poin' : 'Tambah Aturan Poin'}
      subtitle="Perubahan hanya berlaku untuk pelanggaran baru. Snapshot lama tetap utuh."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text">Kode *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={Boolean(rule)}
              placeholder="R40"
              className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3 text-sm font-bold uppercase text-text focus:border-black focus:outline-none disabled:bg-bg disabled:text-muted"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text">Kategori *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ViolationCategory)}
              disabled={Boolean(rule)}
              className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3 text-sm font-semibold text-text focus:border-black focus:outline-none disabled:bg-bg disabled:text-muted"
            >
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Nama Aturan *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm font-semibold text-text focus:border-black focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-[12px] border border-border bg-surface p-3 text-sm text-text focus:border-black focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text">Poin Aplikasi *</label>
            <input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm font-bold tabular-nums text-text focus:border-black focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text">Poin Buku Panduan *</label>
            <input
              type="number"
              min={1}
              value={guidebookPoints}
              onChange={(e) => setGuidebookPoints(e.target.value)}
              className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm font-bold tabular-nums text-text focus:border-black focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Sanksi Default</label>
          <input
            value={defaultSanction}
            onChange={(e) => setDefaultSanction(e.target.value)}
            placeholder="Contoh: teguran lisan dan pembinaan wali kelas"
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm text-text focus:border-black focus:outline-none"
          />
        </div>

        {rule && (
          <label className="flex items-center gap-2.5 rounded-[12px] border border-border bg-bg/60 px-3.5 py-2.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            <span className="text-xs font-bold text-text">Aturan aktif dan bisa dipilih</span>
          </label>
        )}

        {error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="bk-btn ghost min-h-[44px]">
            Batal
          </button>
          <button type="submit" disabled={saving} className="bk-btn primary min-h-[44px] disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Aturan'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
