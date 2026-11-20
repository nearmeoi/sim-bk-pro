import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Search, ShieldAlert } from 'lucide-react';
import BaseModal from '../ui/BaseModal';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import StudentPicker from '../ui/StudentPicker';
import { useBK } from '../../context/BKContext';
import { useDiscipline } from '../../context/DisciplineContext';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_STYLES,
  POINT_STATUS_LABELS,
  POINT_STATUS_STYLES,
  previewStatus,
  suggestSanction,
} from '../../lib/discipline';
import type { SpLetter, Student } from '../../types';

interface RecordViolationModalProps {
  open: boolean;
  onClose: () => void;
  defaultStudent?: Student | null;
  onSaved?: (message: string, spDraft: SpLetter | null) => void;
}

const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const nowTime = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function RecordViolationModal({
  open,
  onClose,
  defaultStudent,
  onSaved,
}: RecordViolationModalProps) {
  const { students } = useBK();
  const { rules, pointsByStudent, spThresholds, recordViolation, membership } = useDiscipline();

  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [ruleId, setRuleId] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [location, setLocation] = useState('');
  const [chronology, setChronology] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const canRecord = membership?.role === 'bk';

  useEffect(() => {
    if (!open) return;
    setStudentName(defaultStudent?.nama || '');
    setStudentId(defaultStudent?.id || '');
    setRuleId('');
    setDate(today());
    setTime(nowTime());
    setLocation('');
    setChronology('');
    setQuery('');
    setCategory('');
    setFormError('');
    setSaving(false);
  }, [open, defaultStudent]);

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.isActive),
    [rules]
  );

  const filteredRules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeRules
      .filter((rule) => {
        if (category && rule.category !== category) return false;
        if (!q) return true;
        return (
          rule.name.toLowerCase().includes(q) ||
          rule.code.toLowerCase().includes(q) ||
          CATEGORY_LABELS[rule.category].toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(a.category);
        const catB = CATEGORY_ORDER.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.sortOrder - b.sortOrder;
      });
  }, [activeRules, category, query]);

  const selectedRule = activeRules.find((rule) => rule.id === ruleId) || null;
  const current = studentId ? pointsByStudent[studentId] : null;

  const currentTotal = current?.totalPoints ?? 0;
  const previewTotal = selectedRule ? currentTotal + selectedRule.points : currentTotal;
  const previewBalance = Math.max((current?.pointScale ?? 1000) - previewTotal, 0);
  const nextStatus = selectedRule
    ? previewStatus(previewTotal, spThresholds)
    : current?.status ?? 'aman';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canRecord) {
      setFormError('Hanya guru BK yang boleh mencatat pelanggaran.');
      return;
    }
    if (!studentId) {
      setFormError('Pilih siswa dari daftar terlebih dahulu.');
      return;
    }
    if (!selectedRule) {
      setFormError('Pilih aturan pelanggaran.');
      return;
    }

    const occurred = new Date(`${date}T${time}:00`);
    if (Number.isNaN(occurred.getTime())) {
      setFormError('Tanggal atau jam tidak valid.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const result = await recordViolation({
        studentId,
        ruleId: selectedRule.id,
        occurredAt: occurred.toISOString(),
        location: location.trim(),
        chronology: chronology.trim(),
      });
      const sp = result.spDraft;
      const message = sp
        ? `Pelanggaran dicatat. ${sp.type.toUpperCase()} draft otomatis dibuat untuk ${studentName}.`
        : `Pelanggaran ${studentName} berhasil dicatat.`;
      onSaved?.(message, sp);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan pelanggaran.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Catat Pelanggaran"
      subtitle="Pilih aturan, periksa dampak poin, lalu simpan. SP dibuat sebagai draft."
      maxWidth="max-w-3xl"
    >
      {!canRecord && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 flex-none" />
          <p>Akun ini bukan guru BK, sehingga hanya bisa melihat data tata tertib.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-text">Siswa *</label>
            <StudentPicker
              value={studentName}
              onChange={setStudentName}
              onPick={(student) => {
                setStudentId(student.id);
                setStudentName(student.nama);
              }}
              students={students}
              required
            />
            {studentName && !studentId && (
              <p className="mt-1 text-[11px] font-semibold text-amber-700">
                Pilih nama dari daftar agar siswa terhubung ke data poin.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text">Kelas</label>
            <input
              value={current?.kelas || students.find((s) => s.id === studentId)?.kelas || '-'}
              readOnly
              className="min-h-[48px] w-full rounded-[12px] border border-border bg-bg px-3.5 text-sm font-semibold text-muted"
            />
          </div>
        </div>

        <div className="rounded-[16px] border border-border bg-bg/60 p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-wide text-text">Pilih Aturan</p>
            <div className="relative w-44 sm:w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari aturan..."
                className="min-h-[34px] w-full rounded-[10px] border border-border bg-white pl-8 pr-2.5 text-xs text-text focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`bk-chip !min-h-[30px] !px-2.5 !text-[11px] ${category === '' ? 'on' : ''}`}
            >
              Semua
            </button>
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`bk-chip !min-h-[30px] !px-2.5 !text-[11px] ${category === cat ? 'on' : ''}`}
              >
                {CATEGORY_LABELS[cat].replace('Pelanggaran ', '')}
              </button>
            ))}
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {filteredRules.length === 0 && (
              <p className="py-6 text-center text-xs text-muted">Tidak ada aturan yang cocok.</p>
            )}
            {filteredRules.map((rule) => {
              const active = rule.id === ruleId;
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setRuleId(rule.id)}
                  className={`flex w-full items-start gap-2.5 rounded-[10px] border p-2.5 text-left transition-colors ${
                    active
                      ? 'border-black bg-white shadow-sm'
                      : 'border-transparent bg-white/60 hover:border-border hover:bg-white'
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex flex-none items-center rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[rule.category]}`}
                  >
                    {rule.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold leading-snug text-text">
                      {rule.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {CATEGORY_LABELS[rule.category]}
                      {rule.spOverride ? ` · minimal SP${rule.spOverride}` : ''}
                      {rule.isExpulsion ? ' · sidang pleno' : ''}
                    </span>
                  </span>
                  <span className="flex-none text-right">
                    <span className="block text-sm font-extrabold tabular-nums text-text">
                      +{rule.points}
                    </span>
                    <span className="block text-[10px] text-muted">poin</span>
                  </span>
                  {active && <Check size={15} className="mt-1 flex-none text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text">Tanggal *</label>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text">Jam *</label>
            <TimePicker value={time} onChange={setTime} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Lokasi</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Contoh: Gerbang sekolah / Kelas 8A"
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm text-text focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Kronologi</label>
          <textarea
            value={chronology}
            onChange={(e) => setChronology(e.target.value)}
            rows={3}
            placeholder="Tuliskan kejadian singkat, saksi, dan tindakan awal..."
            className="w-full rounded-[12px] border border-border bg-surface p-3 text-sm leading-relaxed text-text focus:border-black focus:outline-none"
          />
        </div>

        {selectedRule && (
          <div className="rounded-[16px] border border-black/10 bg-white p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert size={16} className="text-text" />
              <p className="text-xs font-extrabold uppercase tracking-wide text-text">
                Pratinjau Dampak
              </p>
            </div>
            <div className="grid gap-2 text-xs sm:grid-cols-4">
              <div>
                <p className="text-muted">Poin sekarang</p>
                <p className="text-sm font-extrabold tabular-nums">{currentTotal}</p>
              </div>
              <div>
                <p className="text-muted">Pelanggaran</p>
                <p className="text-sm font-extrabold tabular-nums text-alert">+{selectedRule.points}</p>
              </div>
              <div>
                <p className="text-muted">Total setelah</p>
                <p className="text-sm font-extrabold tabular-nums">{previewTotal}</p>
              </div>
              <div>
                <p className="text-muted">Sisa poin</p>
                <p className="text-sm font-extrabold tabular-nums">{previewBalance}</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${POINT_STATUS_STYLES[nextStatus]}`}
              >
                {POINT_STATUS_LABELS[nextStatus]}
              </span>
              <p className="text-[11px] leading-snug text-muted">{suggestSanction(nextStatus)}</p>
            </div>
          </div>
        )}

        {formError && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="bk-btn ghost min-h-[44px]">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || !canRecord}
            className="bk-btn primary min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pelanggaran'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
