import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, Copy, IdCard, Printer, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useBK } from '../../context/BKContext';
import { useDiscipline } from '../../context/DisciplineContext';
import { buildStudentPortalUrl } from '../../mobile/portal/portalApi';
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
    void QRCode.toDataURL(buildStudentPortalUrl(credential.token), {
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

  const initials =
    (student.nama || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';

  const nameSize =
    student.nama.length > 28
      ? '7.8pt'
      : student.nama.length > 22
        ? '8.4pt'
        : student.nama.length > 16
          ? '9.2pt'
          : '10pt';

  const printedOn = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return createPortal(
    <div
      className="card-print-overlay fixed inset-0 z-[70] flex flex-col bg-black/55 p-3 backdrop-blur-[3px] sm:p-6"
      onClick={onClose}
    >
      <div
        className="card-print-shell mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-surface shadow-2xl"
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
              <div className="card-print-hide mx-auto w-full max-w-[560px] rounded-[16px] border border-emerald-300 bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-900">
                Kartu berhasil dibuat. Token dan PIN di bawah ini <b>tidak dapat ditampilkan lagi</b>{' '}
                setelah modal ditutup.
              </div>

              <div className="card-print-sheet mx-auto w-full max-w-[560px] overflow-x-auto rounded-[14px] border border-border bg-white p-4 shadow-sm">
                <div className="card-print-only mx-auto text-center" style={{ width: '85.6mm' }}>
                  <p
                    className="font-black uppercase"
                    style={{ fontSize: '7.5pt', letterSpacing: '0.08em' }}
                  >
                    Kartu Akses Tata Tertib Siswa
                  </p>
                  <p style={{ fontSize: '6pt', lineHeight: 1.45, color: '#555' }}>
                    {settings.namaSekolah || 'SIM BK PRO'}
                    {settings.npsn ? ` · NPSN ${settings.npsn}` : ''}
                  </p>
                  <p style={{ fontSize: '5.4pt', color: '#888' }}>
                    Dicetak {printedOn}
                    {settings.tahunAjaran ? ` · T.A. ${settings.tahunAjaran}` : ''}
                  </p>
                  <div style={{ borderTop: '1px dashed #b5b5b5', margin: '2mm 0 3mm' }} />
                </div>

                {/* KARTU SISWA (ukuran ID card 85,6 × 54 mm) */}
                <div
                  className="card-print-card relative mx-auto overflow-hidden rounded-[2.5mm] border border-black bg-white text-black"
                  style={{
                    width: '85.6mm',
                    height: '54mm',
                    WebkitPrintColorAdjust: 'exact',
                  }}
                >
                  {/* Kepala kartu */}
                  <div
                    className="flex items-center"
                    style={{
                      height: '13mm',
                      gap: '2.5mm',
                      padding: '0 3mm',
                      background: '#111111',
                      color: '#ffffff',
                    }}
                  >
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo sekolah"
                        style={{
                          height: '8mm',
                          width: '8mm',
                          flex: 'none',
                          objectFit: 'contain',
                          background: '#ffffff',
                          borderRadius: '1mm',
                          padding: '0.6mm',
                        }}
                      />
                    ) : (
                      <span
                        className="grid place-items-center font-black"
                        style={{
                          height: '8mm',
                          width: '8mm',
                          flex: 'none',
                          border: '0.3mm solid rgba(255,255,255,0.8)',
                          borderRadius: '1mm',
                          fontSize: '6.5pt',
                          letterSpacing: '0.04em',
                        }}
                      >
                        BK
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate uppercase"
                        style={{
                          fontSize: '5pt',
                          letterSpacing: '0.1em',
                          lineHeight: 1.5,
                          color: 'rgba(255,255,255,0.72)',
                        }}
                      >
                        {settings.instansiAtas || 'Pemerintah Daerah'}
                      </p>
                      <p
                        className="truncate font-black uppercase"
                        style={{ fontSize: '8.4pt', lineHeight: 1.05 }}
                      >
                        {settings.namaSekolah || 'SIM BK PRO'}
                      </p>
                    </div>
                  </div>

                  {/* Isi kartu */}
                  <div className="flex" style={{ height: '33mm' }}>
                    <div
                      className="flex min-w-0 flex-1 items-center"
                      style={{ padding: '0 3mm', gap: '2.5mm' }}
                    >
                      <div
                        className="grid shrink-0 place-items-center font-black"
                        style={{
                          width: '13mm',
                          height: '16mm',
                          border: '0.3mm solid #d4d4d4',
                          borderRadius: '1.5mm',
                          background: '#f5f5f5',
                          fontSize: '11pt',
                          color: '#111111',
                        }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="uppercase"
                          style={{ fontSize: '4.6pt', letterSpacing: '0.14em', color: '#8a8a8a' }}
                        >
                          Nama siswa
                        </p>
                        <p
                          className="font-black"
                          style={{
                            fontSize: nameSize,
                            lineHeight: 1.1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {student.nama}
                        </p>
                        <div style={{ display: 'flex', gap: '4mm', marginTop: '2mm' }}>
                          <div>
                            <p
                              className="uppercase"
                              style={{ fontSize: '4.2pt', letterSpacing: '0.12em', color: '#8a8a8a' }}
                            >
                              NIS
                            </p>
                            <p
                              className="font-bold tabular-nums"
                              style={{ fontSize: '7pt', lineHeight: 1.2 }}
                            >
                              {student.nis || '-'}
                            </p>
                          </div>
                          <div>
                            <p
                              className="uppercase"
                              style={{ fontSize: '4.2pt', letterSpacing: '0.12em', color: '#8a8a8a' }}
                            >
                              Kelas
                            </p>
                            <p className="font-bold" style={{ fontSize: '7pt', lineHeight: 1.2 }}>
                              {student.kelas || '-'}
                            </p>
                          </div>
                        </div>
                        <p
                          className="truncate"
                          style={{ fontSize: '4.4pt', color: '#8a8a8a', marginTop: '2mm' }}
                        >
                          Berlaku selama menjadi siswa
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 flex-col items-center justify-center"
                      style={{ width: '25mm', borderLeft: '0.3mm solid #e5e5e5', gap: '1.2mm' }}
                    >
                      {qr ? (
                        <img
                          src={qr}
                          alt="QR kartu siswa"
                          style={{ width: '19mm', height: '19mm' }}
                        />
                      ) : (
                        <div
                          className="grid place-items-center"
                          style={{
                            width: '19mm',
                            height: '19mm',
                            background: '#f2f2f2',
                            fontSize: '5pt',
                            color: '#777777',
                          }}
                        >
                          Memuat QR...
                        </div>
                      )}
                      <p
                        className="font-bold uppercase"
                        style={{ fontSize: '4.2pt', letterSpacing: '0.12em', color: '#666666' }}
                      >
                        Pindai di portal
                      </p>
                    </div>
                  </div>

                  {/* Kaki kartu */}
                  <div
                    className="flex items-center justify-between"
                    style={{
                      height: '8mm',
                      gap: '2mm',
                      padding: '0 3mm',
                      borderTop: '0.3mm solid #e5e5e5',
                      fontSize: '4.8pt',
                      color: '#666666',
                    }}
                  >
                    <span className="truncate">Kartu akses tata tertib siswa</span>
                    <span
                      className="shrink-0 font-bold uppercase"
                      style={{ letterSpacing: '0.08em' }}
                    >
                      {settings.npsn ? `NPSN ${settings.npsn}` : 'SIM BK'}
                    </span>
                  </div>
                </div>

                {/* Slip PIN */}
                <div
                  className="mx-auto flex items-stretch overflow-hidden rounded-[2mm] border border-dashed"
                  style={{ width: '85.6mm', marginTop: '5mm', borderColor: 'rgba(0,0,0,0.45)' }}
                >
                  <div className="min-w-0 flex-1" style={{ padding: '2.5mm 3mm' }}>
                    <p
                      className="uppercase"
                      style={{ fontSize: '4.6pt', letterSpacing: '0.14em', color: '#777777' }}
                    >
                      Slip PIN · simpan terpisah dari kartu
                    </p>
                    <p
                      className="font-mono font-black tabular-nums"
                      style={{ fontSize: '16pt', letterSpacing: '0.3em', lineHeight: 1.25 }}
                    >
                      {credential.pin}
                    </p>
                    <p className="truncate" style={{ fontSize: '4.8pt', color: '#666666' }}>
                      {student.nama} · NIS {student.nis || '-'} · Kelas {student.kelas || '-'}
                    </p>
                  </div>
                  <div
                    className="grid shrink-0 place-items-center"
                    style={{ width: '12mm', borderLeft: '0.3mm dashed rgba(0,0,0,0.4)' }}
                  >
                    <p
                      className="uppercase"
                      style={{
                        fontSize: '4.2pt',
                        letterSpacing: '0.12em',
                        color: '#888888',
                        writingMode: 'vertical-rl',
                      }}
                    >
                      Potong
                    </p>
                  </div>
                </div>

                <p
                  className="card-print-only text-center"
                  style={{ fontSize: '4.8pt', color: '#8a8a8a', marginTop: '2mm' }}
                >
                  Jangan bagikan PIN. Jika kartu hilang, laporkan ke Guru BK untuk dicabut.
                </p>
              </div>

              <div className="card-print-hide mx-auto grid w-full max-w-[560px] gap-2 sm:grid-cols-2">
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

              <div className="card-print-hide flex justify-center">
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
    </div>,
    document.body,
  );
}
