import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, IdCard, Printer, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useBK } from '../../context/BKContext';
import { useDiscipline } from '../../context/DisciplineContext';
import type { Student } from '../../types';

interface StudentCardModalProps {
  student: Student | null;
  onClose: () => void;
  onToast: (message: string) => void;
}

export default function StudentCardModal({ student, onClose, onToast }: StudentCardModalProps) {
  const { settings } = useBK();
  const { createStudentCard } = useDiscipline();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [credential, setCredential] = useState<{
    token: string;
    pin: string;
    cardId: string;
  } | null>(null);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState<'token' | 'pin' | null>(null);

  useEffect(() => {
    if (!student) return;
    document.body.classList.add('card-print-open');
    return () => document.body.classList.remove('card-print-open');
  }, [student]);

  useEffect(() => {
    if (!credential) {
      setQr('');
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(credential.token, {
      margin: 1,
      width: 640,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr('');
      });
    return () => {
      cancelled = true;
    };
  }, [credential]);

  if (!student) return null;

  const issue = async () => {
    setCreating(true);
    setError('');
    try {
      const next = await createStudentCard(student.id);
      setCredential(next);
      onToast(`Kartu ${student.nama} berhasil dibuat. Cetak sekarang — token tidak bisa dilihat lagi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat kartu siswa.');
    } finally {
      setCreating(false);
    }
  };

  const copy = async (kind: 'token' | 'pin', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      onToast('Browser menolak akses clipboard. Salin manual dari layar.');
    }
  };

  return (
    <div
      className="card-print-overlay fixed inset-0 z-[70] flex flex-col bg-black/55 p-3 backdrop-blur-[3px] sm:p-6"
      onClick={onClose}
    >
      <div
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-print-toolbar flex flex-none items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-text">Kartu QR Siswa</p>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {student.nama} · Kelas {student.kelas}
            </p>
          </div>
          <div className="flex flex-none items-center gap-2">
            {credential && (
              <button
                type="button"
                onClick={() => window.print()}
                className="flex min-h-[40px] items-center gap-1.5 rounded-[10px] bg-black px-3 text-[11px] font-bold text-white hover:bg-neutral-800"
              >
                <Printer size={14} /> Cetak Kartu
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-muted hover:text-text"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="card-print-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          {!credential ? (
            <div className="mx-auto max-w-xl space-y-4">
              <div className="rounded-[16px] border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <p className="flex items-center gap-1.5 font-extrabold">
                  <AlertTriangle size={15} /> Perhatian
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 leading-relaxed">
                  <li>Token QR dan PIN hanya ditampilkan satu kali. Cetak atau catat sekarang.</li>
                  <li>Jika siswa sudah punya kartu aktif, kartu lama otomatis dicabut.</li>
                  <li>Kartu hilang harus dicabut, lalu diterbitkan ulang oleh BK.</li>
                </ul>
              </div>

              <div className="rounded-[16px] border border-border bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-black text-white">
                    <IdCard size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-text">{student.nama}</p>
                    <p className="text-[11px] text-muted">
                      NIS {student.nis || '-'} · Kelas {student.kelas}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={issue}
                  disabled={creating}
                  className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[12px] bg-black text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  <IdCard size={16} />
                  {creating ? 'Membuat kartu...' : 'Buat Kartu Baru'}
                </button>
              </div>

              {error && (
                <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-full max-w-[560px] rounded-[16px] border border-emerald-300 bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-900">
                Kartu berhasil dibuat. Token dan PIN di bawah ini <b>tidak dapat ditampilkan lagi</b>{' '}
                setelah modal ditutup.
              </div>

              <div className="card-print-sheet mx-auto w-full max-w-[560px] bg-white p-4 shadow-sm">
                <div
                  className="relative mx-auto flex overflow-hidden rounded-[10px] border-2 border-black bg-white text-black"
                  style={{ width: '85.6mm', minHeight: '54mm' }}
                >
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5">
                    <div>
                      <p className="text-[6.5pt] font-bold uppercase tracking-wide">
                        {settings.instansiAtas || 'PEMERINTAH DAERAH'}
                      </p>
                      <p className="text-[9pt] font-black uppercase leading-tight">
                        {settings.namaSekolah || 'SIM BK PRO'}
                      </p>
                      <p className="mt-0.5 text-[6pt] uppercase tracking-[0.14em] text-black/60">
                        Kartu Akses Tata Tertib Siswa
                      </p>
                    </div>
                    <div className="mt-1">
                      <p className="truncate text-[11pt] font-black leading-tight">{student.nama}</p>
                      <p className="text-[7pt] font-semibold">
                        NIS {student.nis || '-'} · Kelas {student.kelas}
                      </p>
                      <p className="text-[6pt] text-black/60">
                        Pindai QR, lalu masukkan 6 digit PIN.
                      </p>
                    </div>
                  </div>
                  <div className="flex w-[27mm] flex-none flex-col items-center justify-center border-l-2 border-black p-1.5">
                    {qr ? (
                      <img src={qr} alt="QR kartu siswa" className="h-[22mm] w-[22mm]" />
                    ) : (
                      <div className="grid h-[22mm] w-[22mm] place-items-center bg-black/5 text-[6pt]">
                        Memuat QR...
                      </div>
                    )}
                    <p className="mt-1 text-[5.5pt] font-bold uppercase tracking-wider">SIM-BK</p>
                  </div>
                </div>

                <div className="mx-auto mt-4 w-full max-w-[85.6mm] border-t border-dashed border-black/40 pt-2">
                  <p className="text-[7pt] font-bold uppercase tracking-wide text-black/70">
                    Slip PIN — simpan terpisah dari kartu
                  </p>
                  <p className="mt-1 font-mono text-[18pt] font-black tracking-[0.3em] text-black">
                    {credential.pin}
                  </p>
                  <p className="mt-0.5 text-[6pt] leading-snug text-black/60">
                    Jangan bagikan PIN. Jika kartu hilang, segera laporkan ke Guru BK untuk dicabut.
                  </p>
                </div>
              </div>

              <div className="mx-auto grid w-full max-w-[560px] gap-2 sm:grid-cols-2">
                <div className="rounded-[12px] border border-border bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">PIN</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-mono text-lg font-extrabold tracking-[0.25em]">
                      {credential.pin}
                    </p>
                    <button
                      type="button"
                      onClick={() => copy('pin', credential.pin)}
                      className="rounded-md border border-border p-1.5 text-muted hover:text-text"
                      title="Salin PIN"
                    >
                      {copied === 'pin' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="rounded-[12px] border border-border bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Token QR</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate font-mono text-[11px] font-semibold">{credential.token}</p>
                    <button
                      type="button"
                      onClick={() => copy('token', credential.token)}
                      className="rounded-md border border-border p-1.5 text-muted hover:text-text"
                      title="Salin token"
                    >
                      {copied === 'token' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[10px] border border-border bg-white px-4 py-2 text-xs font-bold text-text hover:bg-bg"
                >
                  Selesai &amp; tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
