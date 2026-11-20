import { useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Phone,
  MapPin,
  NotebookPen,
  Plus,
  User,
} from 'lucide-react';
import { useBK } from '../context/BKContext';
import { statusStyle } from '../lib/statusStyles';
import type { Student } from '../types';

interface MobileStudentSheetProps {
  student: Student | null;
  onClose: () => void;
  onCatat: (student: Student) => void;
}

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function MobileStudentSheet({ student, onClose, onCatat }: MobileStudentSheetProps) {
  const { records } = useBK();

  useEffect(() => {
    if (!student) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [student, onClose]);

  const studentRecords = useMemo(
    () =>
      records
        .filter((r) => r.studentId === student?.id)
        .sort((a, b) => `${b.tanggal}${b.waktu}`.localeCompare(`${a.tanggal}${a.waktu}`)),
    [records, student],
  );

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Buku catatan ${student.nama}`}
        onClick={(e) => e.stopPropagation()}
        className="slide-up flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Grab bar — sama seperti modal PC di layar kecil */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3" />

        <div className="flex items-center gap-2.5 border-b border-border px-4 pb-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Kembali"
            className="p-1.5 -ml-1 text-muted active:text-text rounded-full active:bg-bg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="bk-ini">{inisial(student.nama)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-extrabold text-text leading-tight">
              {student.nama}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-muted">
              Kelas {student.kelas} · NIS {student.nis || '-'}
            </p>
          </div>
          <span
            className={`flex-none rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              student.status === 'Aktif'
                ? 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]'
                : 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
            }`}
          >
            {student.status}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Identitas */}
          <div className="bk-card">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
              <div>
                <dt className="font-bold text-muted">NISN</dt>
                <dd className="mt-0.5 font-semibold text-text">{student.nisn || '-'}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted">Jenis Kelamin</dt>
                <dd className="mt-0.5 font-semibold text-text">
                  {student.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                </dd>
              </div>
              {student.namaWali && (
                <div className="col-span-2 flex items-start gap-1.5">
                  <User size={14} className="mt-0.5 flex-none text-muted" />
                  <div>
                    <dt className="font-bold text-muted">Nama Wali</dt>
                    <dd className="mt-0.5 font-semibold text-text">{student.namaWali}</dd>
                  </div>
                </div>
              )}
              {student.kontakWali && (
                <div className="col-span-2 flex items-start gap-1.5">
                  <Phone size={14} className="mt-0.5 flex-none text-muted" />
                  <div>
                    <dt className="font-bold text-muted">Kontak Wali</dt>
                    <dd className="mt-0.5 font-semibold text-text">{student.kontakWali}</dd>
                  </div>
                </div>
              )}
              {student.alamat && (
                <div className="col-span-2 flex items-start gap-1.5">
                  <MapPin size={14} className="mt-0.5 flex-none text-muted" />
                  <div>
                    <dt className="font-bold text-muted">Alamat</dt>
                    <dd className="mt-0.5 font-semibold leading-snug text-text">
                      {student.alamat}
                    </dd>
                  </div>
                </div>
              )}
              {student.catatanKhusus && (
                <div className="col-span-2 rounded-[12px] border border-[#FCD34D] bg-[#FEF3C7] p-2.5">
                  <dt className="font-bold text-[#92400E]">Catatan Khusus</dt>
                  <dd className="mt-0.5 font-semibold leading-snug text-[#92400E]">
                    {student.catatanKhusus}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Riwayat */}
          <div className="mb-3 mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-[750] text-text">Riwayat Layanan</h2>
              <span className="bk-pill">{studentRecords.length} Catatan</span>
            </div>
          </div>

          {studentRecords.length === 0 ? (
            <div className="bk-card text-center">
              <NotebookPen size={20} className="mx-auto text-muted/50" />
              <p className="mt-2 text-xs text-gray-500 italic">
                Belum ada catatan untuk siswa ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {studentRecords.map((r) => (
                <div key={r.id} className="bk-card !p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-bold text-muted">
                      {r.tanggal} · {r.waktu}
                    </p>
                    <span
                      className={`inline-flex flex-none items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${statusStyle(r.status).soft}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-none ${statusStyle(r.status).dot}`} />
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] font-bold text-text">{r.jenis}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-text/85">{r.masalah}</p>
                  {r.tindakLanjut && (
                    <p className="mt-2 rounded-[12px] bg-primary-tint px-3 py-2 text-[12px] leading-relaxed text-text/85">
                      <span className="font-bold text-accent">Tindak lanjut: </span>
                      {r.tindakLanjut}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted">
            <CalendarDays size={13} /> Data tersinkron dengan versi PC
          </p>
        </div>

        <div className="border-t border-border bg-surface px-4 py-3">
          <button
            type="button"
            onClick={() => onCatat(student)}
            className="min-h-[48px] w-full rounded-[14px] bg-accent text-white font-bold text-sm shadow-[0_6px_16px_rgb(var(--accent-rgb)/0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={17} />
            Catat Layanan untuk Siswa Ini
          </button>
        </div>
      </div>
    </div>
  );
}
