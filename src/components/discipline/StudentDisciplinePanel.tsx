import { useState } from 'react';
import { FileText, Plus, ShieldAlert, X, Eye } from 'lucide-react';
import { useDiscipline } from '../../context/DisciplineContext';
import SpDocumentModal from './SpDocumentModal';
import {
  CATEGORY_STYLES,
  POINT_STATUS_LABELS,
  POINT_STATUS_STYLES,
  SP_STATUS_LABELS,
  SP_STATUS_STYLES,
  SP_TYPE_SHORT,
  formatDateTime,
  suggestSanction,
} from '../../lib/discipline';
import type { SpLetter, Student } from '../../types';

interface StudentDisciplinePanelProps {
  student: Student;
  onRecord: () => void;
  onToast: (message: string) => void;
}

export default function StudentDisciplinePanel({
  student,
  onRecord,
  onToast,
}: StudentDisciplinePanelProps) {
  const { membership, pointScale, pointsByStudent, feed, spLetters, voidViolation } = useDiscipline();
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewLetter, setPreviewLetter] = useState<SpLetter | null>(null);

  const summary = pointsByStudent[student.id];
  const scale = summary?.pointScale ?? pointScale;
  const total = summary?.totalPoints ?? 0;
  const balance = summary?.balance ?? scale;
  const status = summary?.status ?? 'aman';

  const history = feed.filter((row) => row.studentId === student.id);
  const letters = spLetters.filter((row) => row.studentId === student.id);
  const canRecord = membership?.role === 'bk';

  const handleVoid = async (recordId: string) => {
    if (!voidReason.trim()) return;
    setSaving(true);
    try {
      await voidViolation(recordId, voidReason.trim());
      setVoidingId(null);
      setVoidReason('');
      onToast('Pelanggaran dibatalkan. Koreksi dicatat di ledger, riwayat lama tetap ada.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal membatalkan pelanggaran.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div>
          <h4 className="text-[15px] font-extrabold text-text">Tata Tertib &amp; Poin</h4>
          <p className="mt-0.5 text-[11px] text-muted">
            Poin tidak pernah di-reset. SP dihitung dari total kumulatif.
          </p>
        </div>
        {canRecord && (
          <button
            type="button"
            onClick={onRecord}
            className="bk-chip !min-h-[38px] !text-xs font-bold text-alert hover:bg-alert-tint"
          >
            <Plus size={14} /> Catat Pelanggaran
          </button>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-4">
        <div className="rounded-[16px] border border-black/10 bg-black p-3.5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Sisa Poin</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums leading-none">{balance}</p>
          <p className="mt-1 text-[10px] text-white/60">dari {scale}</p>
        </div>
        <div className="rounded-[16px] border border-border bg-white p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Semester Ini</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums leading-none">
            {summary?.semesterPoints ?? 0}
          </p>
          <p className="mt-1 text-[10px] text-muted">poin pelanggaran</p>
        </div>
        <div className="rounded-[16px] border border-border bg-white p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Tahun Ajaran</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums leading-none">
            {summary?.yearPoints ?? 0}
          </p>
          <p className="mt-1 text-[10px] text-muted">poin pelanggaran</p>
        </div>
        <div className="rounded-[16px] border border-border bg-white p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Kumulatif</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums leading-none">{total}</p>
          <p className="mt-1 text-[10px] text-muted">sejak kelas 7</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${POINT_STATUS_STYLES[status]}`}
        >
          {POINT_STATUS_LABELS[status]}
        </span>
        <p className="text-[11px] leading-snug text-muted">{suggestSanction(status)}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 rounded-[16px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-text">
              Riwayat Pelanggaran
            </p>
            <span className="text-[11px] font-bold text-muted">{history.length} catatan</span>
          </div>
          <div className="max-h-[340px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <ShieldAlert size={26} className="mx-auto mb-2 text-muted/40" />
                <p className="text-xs font-semibold text-muted">Belum ada pelanggaran tercatat.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {history.map((row) => (
                  <li key={row.id} className="px-3.5 py-2.5">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 inline-flex flex-none rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[row.ruleCategory]}`}
                      >
                        {row.ruleCode}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12.5px] font-bold leading-snug ${row.status === 'void' ? 'text-muted line-through' : 'text-text'}`}>
                          {row.ruleName}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted">
                          {formatDateTime(row.occurredAt)}
                          {row.location ? ` · ${row.location}` : ''}
                          {row.status === 'void' ? ' · Dibatalkan' : ''}
                        </p>
                        {row.chronology && (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-600">
                            {row.chronology}
                          </p>
                        )}
                        {voidingId === row.id && (
                          <div className="mt-2 rounded-[10px] border border-red-200 bg-red-50 p-2">
                            <textarea
                              value={voidReason}
                              onChange={(e) => setVoidReason(e.target.value)}
                              rows={2}
                              placeholder="Alasan pembatalan (wajib)..."
                              className="w-full rounded-[8px] border border-red-200 bg-white p-2 text-[11px] text-text focus:outline-none"
                            />
                            <div className="mt-1.5 flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setVoidingId(null);
                                  setVoidReason('');
                                }}
                                className="rounded-md px-2 py-1 text-[10px] font-bold text-muted hover:bg-white"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={saving || !voidReason.trim()}
                                onClick={() => handleVoid(row.id)}
                                className="rounded-md bg-red-700 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
                              >
                                {saving ? 'Menyimpan...' : 'Batalkan'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-none flex-col items-end gap-1">
                        <span className="text-[12px] font-extrabold tabular-nums text-alert">
                          +{row.rulePoints}
                        </span>
                        {canRecord && row.status !== 'void' && voidingId !== row.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setVoidingId(row.id);
                              setVoidReason('');
                            }}
                            className="rounded-md p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-700"
                            title="Batalkan pelanggaran ini"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-[16px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-text">Surat Peringatan</p>
            <span className="text-[11px] font-bold text-muted">{letters.length}</span>
          </div>
          {letters.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <FileText size={26} className="mx-auto mb-2 text-muted/40" />
              <p className="text-xs font-semibold text-muted">Belum ada SP.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {letters.map((letter) => (
                <li key={letter.id} className="px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-extrabold text-text">
                      {SP_TYPE_SHORT[letter.type]}
                      {letter.isOverride ? ' · override' : ''}
                    </p>
                    <div className="flex flex-none items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${SP_STATUS_STYLES[letter.status]}`}
                      >
                        {SP_STATUS_LABELS[letter.status]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewLetter(letter)}
                        className="rounded-md p-1 text-muted transition-colors hover:bg-bg hover:text-text"
                        title="Pratinjau / cetak surat"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    {letter.number || 'Nomor belum ditetapkan'}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    {letter.totalPoints} poin · ambang {letter.thresholdPoints}
                  </p>
                  {letter.meetingAt && (
                    <p className="mt-1 text-[10.5px] font-semibold text-text">
                      Pertemuan: {formatDateTime(letter.meetingAt)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {history.some((row) => row.status !== 'void') && (
        <p className="text-[10px] leading-relaxed text-muted">
          Pembatalan tidak menghapus catatan; sistem menambahkan baris koreksi dan membatalkan draft
          SP yang belum terbit.
        </p>
      )}

      <SpDocumentModal letter={previewLetter} onClose={() => setPreviewLetter(null)} />
    </div>
  );
}
