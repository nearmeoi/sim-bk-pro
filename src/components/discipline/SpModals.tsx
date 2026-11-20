import { useEffect, useState } from 'react';
import BaseModal from '../ui/BaseModal';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import StudentPicker from '../ui/StudentPicker';
import { SP_TYPE_LABELS, formatDateTime } from '../../lib/discipline';
import type { SpLetter, SpType, Student } from '../../types';

const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const defaultTime = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function suggestedNumber(letter: SpLetter): string {
  const tier = letter.type === 'pleno' ? 'PLENO' : letter.type.toUpperCase();
  const seq = String(letter.sequence || 1).padStart(3, '0');
  const year = new Date().getFullYear();
  return `${tier}/${seq}/BK/${year}`;
}

interface IssueSpModalProps {
  open: boolean;
  onClose: () => void;
  letter: SpLetter | null;
  onIssue: (id: string, number: string, meetingAt: string | null) => Promise<void>;
  onToast: (message: string) => void;
}

export function IssueSpModal({ open, onClose, letter, onIssue, onToast }: IssueSpModalProps) {
  const [number, setNumber] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(defaultTime());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !letter) return;
    setNumber(suggestedNumber(letter));
    setDate(today());
    setTime(defaultTime());
    setSaving(false);
    setError('');
  }, [open, letter]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!letter) return;
    if (!number.trim()) {
      setError('Nomor surat wajib diisi.');
      return;
    }
    const meeting = new Date(`${date}T${time}:00`);
    if (Number.isNaN(meeting.getTime())) {
      setError('Tanggal pertemuan tidak valid.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onIssue(letter.id, number.trim(), meeting.toISOString());
      onToast(`${letter.type.toUpperCase()} ${letter.nama} berhasil diterbitkan.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menerbitkan SP.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Terbitkan Surat Peringatan"
      subtitle="Nomor surat ditetapkan saat terbit. Data siswa dikunci sebagai snapshot."
    >
      {letter && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-border bg-bg/60 p-3.5 text-xs">
            <p className="font-extrabold text-text">{letter.nama} · Kelas {letter.kelas}</p>
            <p className="mt-1 text-muted">
              {SP_TYPE_LABELS[letter.type]} · {letter.totalPoints} poin (ambang{' '}
              {letter.thresholdPoints})
            </p>
            <p className="mt-1 text-muted">Dibuat {formatDateTime(letter.createdAt)}</p>
            {letter.isOverride && (
              <p className="mt-1.5 font-semibold text-amber-700">
                Draft override: boleh terbit walau poin di bawah ambang jenis SP.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-text">Nomor Surat *</label>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm font-semibold text-text focus:border-black focus:outline-none"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-text">Tanggal Pertemuan</label>
                <DatePicker value={date} onChange={setDate} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-text">Jam Pertemuan</label>
                <TimePicker value={time} onChange={setTime} />
              </div>
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
                className="bk-btn primary min-h-[44px] disabled:opacity-50"
              >
                {saving ? 'Menerbitkan...' : 'Terbitkan SP'}
              </button>
            </div>
          </form>
        </div>
      )}
    </BaseModal>
  );
}

interface ManualSpModalProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  onCreate: (studentId: string, type: SpType, reason: string) => Promise<string>;
  onToast: (message: string) => void;
}

export function ManualSpModal({ open, onClose, students, onCreate, onToast }: ManualSpModalProps) {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState<SpType>('sp1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStudentName('');
    setStudentId('');
    setType('sp1');
    setReason('');
    setSaving(false);
    setError('');
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId) {
      setError('Pilih siswa dari daftar.');
      return;
    }
    if (!reason.trim()) {
      setError('Alasan pembuatan SP manual wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreate(studentId, type, reason.trim());
      onToast(`Draft ${type.toUpperCase()} untuk ${studentName} berhasil dibuat.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat SP manual.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Buat SP Manual"
      subtitle="Dipakai bila BK perlu menerbitkan SP di luar hitungan otomatis."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
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
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Jenis SP *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SpType)}
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm font-semibold text-text focus:border-black focus:outline-none"
          >
            <option value="sp1">SP1 — Panggilan Orang Tua I</option>
            <option value="sp2">SP2 — Panggilan Orang Tua II</option>
            <option value="sp3">SP3 — Peringatan Terakhir</option>
            <option value="pleno">Sidang Pleno</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Alasan *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Contoh: pertimbangan BK setelah pembinaan dan rapat wali kelas..."
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
          <button type="submit" disabled={saving} className="bk-btn primary min-h-[44px] disabled:opacity-50">
            {saving ? 'Membuat...' : 'Buat Draft SP'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
