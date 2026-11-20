import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Save, Search, ShieldAlert, X } from 'lucide-react';
import { useBK } from '../context/BKContext';
import { useDiscipline } from '../context/DisciplineContext';
import StudentPicker from '../components/ui/StudentPicker';
import DatePicker from '../components/ui/DatePicker';
import TimePicker from '../components/ui/TimePicker';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_STYLES,
  POINT_STATUS_LABELS,
  POINT_STATUS_STYLES,
  previewStatus,
  suggestSanction,
} from '../lib/discipline';
import type { Student } from '../types';

interface MobileViolationSheetProps {
  student?: Student | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function MobileViolationSheet({
  student,
  onClose,
  onSaved,
}: MobileViolationSheetProps) {
  const { students } = useBK();
  const {
    rules,
    pointsByStudent,
    spThresholds,
    recordViolation,
    membership,
  } = useDiscipline();

  const [studentName, setStudentName] = useState(student?.nama ?? '');
  const [studentId, setStudentId] = useState(student?.id ?? '');
  const [ruleId, setRuleId] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tanggal, setTanggal] = useState(todayISO);
  const [waktu, setWaktu] = useState(nowTime);
  const [lokasi, setLokasi] = useState('');
  const [kronologi, setKronologi] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const activeRules = useMemo(() => rules.filter((rule) => rule.isActive), [rules]);
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

  const canRecord = membership?.role === 'bk';
  const bisaSimpan = Boolean(canRecord && studentId && selectedRule);

  const simpan = async () => {
    if (!selectedRule || !studentId) {
      setError('Pilih siswa dan aturan pelanggaran.');
      return;
    }
    const occurred = new Date(`${tanggal}T${waktu}:00`);
    if (Number.isNaN(occurred.getTime())) {
      setError('Tanggal atau jam tidak valid.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await recordViolation({
        studentId,
        ruleId: selectedRule.id,
        occurredAt: occurred.toISOString(),
        location: lokasi.trim(),
        chronology: kronologi.trim(),
      });
      const sp = result.spDraft;
      onSaved(
        sp
          ? `Pelanggaran dicatat. Draft ${sp.type.toUpperCase()} dibuat untuk ${studentName}.`
          : `Pelanggaran ${studentName} berhasil dicatat.`,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pelanggaran.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Catat pelanggaran"
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
            <h3 className="truncate text-[18px] font-extrabold leading-tight text-text">
              Catat Pelanggaran
            </h3>
            <p className="mt-0.5 text-xs text-muted">Poin langsung masuk ke ledger permanen</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!canRecord ? (
            <div className="flex items-start gap-2.5 rounded-[14px] border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
              <ShieldAlert size={16} className="mt-0.5 flex-none" />
              <p>Hanya guru BK yang boleh mencatat pelanggaran. Akun wali kelas bersifat baca saja.</p>
            </div>
          ) : (
            <form
              className="fade-up space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void simpan();
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold text-text">Siswa *</label>
                <StudentPicker
                  value={studentName}
                  onChange={setStudentName}
                  onPick={(s) => {
                    setStudentId(s.id);
                    setStudentName(s.nama);
                  }}
                  students={students}
                  required
                />
                {studentName && !studentId && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-700">
                    Pilih nama dari daftar agar poin terhubung ke siswa.
                  </p>
                )}
              </div>

              <div className="rounded-[16px] border border-border bg-bg/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-text">
                    Aturan
                  </p>
                  <div className="relative w-36">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cari..."
                      className="min-h-[32px] w-full rounded-[9px] border border-border bg-white pl-7 pr-2 text-[11px] text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setCategory('')}
                    className={`bk-chip !min-h-[28px] !px-2.5 !text-[10.5px] ${category === '' ? 'on' : ''}`}
                  >
                    Semua
                  </button>
                  {CATEGORY_ORDER.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`bk-chip !min-h-[28px] !px-2.5 !text-[10.5px] ${category === cat ? 'on' : ''}`}
                    >
                      {CATEGORY_LABELS[cat].replace('Pelanggaran ', '')}
                    </button>
                  ))}
                </div>

                <div className="max-h-52 space-y-1 overflow-y-auto pr-0.5">
                  {filteredRules.length === 0 && (
                    <p className="py-5 text-center text-[11px] text-muted">Tidak ada aturan cocok.</p>
                  )}
                  {filteredRules.map((rule) => {
                    const active = rule.id === ruleId;
                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => setRuleId(rule.id)}
                        className={`flex w-full items-start gap-2 rounded-[10px] border p-2 text-left transition-colors ${
                          active ? 'border-primary bg-white shadow-sm' : 'border-transparent bg-white/70'
                        }`}
                      >
                        <span
                          className={`mt-0.5 inline-flex flex-none rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[rule.category]}`}
                        >
                          {rule.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-bold leading-snug text-text">
                            {rule.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted">
                            {CATEGORY_LABELS[rule.category]}
                            {rule.spOverride ? ` · SP${rule.spOverride}` : ''}
                          </span>
                        </span>
                        <span className="flex-none text-right">
                          <span className="block text-[13px] font-extrabold tabular-nums text-text">
                            +{rule.points}
                          </span>
                        </span>
                        {active && <Check size={14} className="mt-1 flex-none text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text">Tanggal</label>
                  <DatePicker value={tanggal} onChange={setTanggal} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text">Jam</label>
                  <TimePicker value={waktu} onChange={setWaktu} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-text">Lokasi</label>
                <input
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: Gerbang sekolah"
                  className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-text">Kronologi</label>
                <textarea
                  rows={3}
                  value={kronologi}
                  onChange={(e) => setKronologi(e.target.value)}
                  placeholder="Kejadian singkat, saksi, dan tindakan awal..."
                  className="w-full rounded-[12px] border border-border bg-surface p-3 text-sm leading-relaxed text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {selectedRule && (
                <div className="rounded-[16px] border border-black/10 bg-white p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">
                    Pratinjau Dampak
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
                    <div>
                      <p className="text-[9.5px] text-muted">Sekarang</p>
                      <p className="text-[13px] font-extrabold tabular-nums">{currentTotal}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-muted">Tambah</p>
                      <p className="text-[13px] font-extrabold tabular-nums text-alert">
                        +{selectedRule.points}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-muted">Total</p>
                      <p className="text-[13px] font-extrabold tabular-nums">{previewTotal}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-muted">Sisa</p>
                      <p className="text-[13px] font-extrabold tabular-nums">{previewBalance}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[9.5px] font-extrabold ${POINT_STATUS_STYLES[nextStatus]}`}
                    >
                      {POINT_STATUS_LABELS[nextStatus]}
                    </span>
                    <p className="text-[10.5px] leading-snug text-muted">{suggestSanction(nextStatus)}</p>
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}

              <div className="space-y-2 border-t border-border pt-3">
                <button
                  type="submit"
                  disabled={!bisaSimpan || saving}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-accent text-sm font-bold text-white shadow-[0_6px_16px_rgb(var(--accent-rgb)/0.3)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-black/20 disabled:shadow-none"
                >
                  <Save size={17} />
                  {saving ? 'Menyimpan...' : 'Simpan Pelanggaran'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bk-btn ghost min-h-[46px] w-full"
                >
                  <ArrowLeft size={15} /> Batal
                </button>
                {!bisaSimpan && (
                  <p className="text-center text-[11px] text-muted">
                    Pilih siswa dari daftar dan satu aturan untuk menyimpan.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
