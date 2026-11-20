import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  IdCard,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  CATEGORY_SHORT_LABELS,
  CATEGORY_STYLES,
  POINT_STATUS_LABELS,
  POINT_STATUS_STYLES,
  SP_TYPE_LABELS,
  SP_TYPE_SHORT,
  formatDate,
  formatDateTime,
} from '../../lib/discipline';
import type { StudentPortalData } from '../../types';
import {
  PortalApiError,
  clearPortalSession,
  extractCardToken,
  fetchPortalData,
  isValidCardToken,
  loadPortalSession,
  loginToPortal,
  logoutFromPortal,
  savePortalSession,
  type PortalSession,
} from './portalApi';

interface StudentPortalProps {
  initialToken: string;
}

const HISTORY_PAGE = 20;

function maskToken(token: string): string {
  if (token.length <= 12) return token;
  return `${token.slice(0, 7)}••••${token.slice(-4)}`;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function StudentPortal({ initialToken }: StudentPortalProps) {
  const [session, setSession] = useState<PortalSession | null>(() => loadPortalSession());
  const [data, setData] = useState<StudentPortalData | null>(null);
  const [token, setToken] = useState(() => extractCardToken(initialToken));
  const [manualToken, setManualToken] = useState('');
  const [pin, setPin] = useState('');
  const [booting, setBooting] = useState(Boolean(session));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const activeToken = useMemo(
    () => token || extractCardToken(manualToken),
    [token, manualToken],
  );

  const signOutLocally = useCallback(() => {
    clearPortalSession();
    setSession(null);
    setData(null);
    setPin('');
  }, []);

  // Pulihkan sesi setelah halaman dimuat ulang / kartu dipindai lagi.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setBooting(true);
    fetchPortalData(session.token)
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof PortalApiError && err.status === 401) {
          signOutLocally();
          setError('Sesi sudah berakhir. Masukkan PIN lagi.');
        } else {
          setError(err instanceof Error ? err.message : 'Gagal memuat data.');
        }
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
    // Hanya saat mount: login berikutnya mengisi data langsung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const nextToken = extractCardToken(activeToken);
    if (!isValidCardToken(nextToken)) {
      setError('Token kartu tidak valid. Pindai QR di kartu siswa atau tempel token dengan benar.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN harus 6 digit angka.');
      return;
    }

    setLoading(true);
    setError('');
    setLockedUntil(null);
    try {
      const result = await loginToPortal(nextToken, pin);
      savePortalSession(result.session);
      setSession(result.session);
      setData(result.data);
      setPin('');
      setToken(nextToken);
    } catch (err) {
      if (err instanceof PortalApiError) {
        setError(err.message);
        setLockedUntil(err.lockedUntil);
      } else {
        setError(err instanceof Error ? err.message : 'Gagal masuk.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!session || refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      const next = await fetchPortalData(session.token);
      setData(next);
    } catch (err) {
      if (err instanceof PortalApiError && err.status === 401) {
        signOutLocally();
        setError('Sesi sudah berakhir. Masukkan PIN lagi.');
      } else {
        setError(err instanceof Error ? err.message : 'Gagal memperbarui data.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    const current = session;
    signOutLocally();
    setError('');
    if (current) await logoutFromPortal(current.token);
  };

  if (booting) {
    return (
      <div className="m-app grid min-h-screen place-items-center bg-bg px-8">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Loader2 size={26} className="animate-spin" />
          <p className="text-[12px] font-bold uppercase tracking-wider">Membuka portal…</p>
        </div>
      </div>
    );
  }

  if (!session || !data) {
    return (
      <div className="m-app min-h-screen bg-bg">
        <div className="relative overflow-hidden bg-[#0B1220] px-5 pb-20 pt-9 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/20 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-[#2563EB]/20 blur-2xl"
          />
          <div className="relative mx-auto max-w-md">
            <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-white/15 bg-white/10">
              <ShieldCheck size={26} />
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
              Portal Tata Tertib Siswa
            </p>
            <h1 className="mt-1 text-[28px] font-[800] leading-tight tracking-tight">
              Lihat poin &amp; riwayatmu
            </h1>
            <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-white/70">
              Pindai QR pada kartu siswa, lalu masukkan PIN 6 digit. Data yang tampil hanya milikmu.
            </p>
          </div>
        </div>

        <main className="relative z-10 mx-auto -mt-12 w-full max-w-md px-4 pb-10">
          <form
            onSubmit={handleLogin}
            className="rounded-[22px] border border-border bg-surface p-4 shadow-card"
          >
            {token ? (
              <div className="flex items-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-900">
                <CheckCircle2 size={17} className="flex-none" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide">Kartu terdeteksi</p>
                  <p className="truncate font-mono text-[10.5px]">{maskToken(token)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToken('');
                    setManualToken('');
                    setError('');
                  }}
                  className="flex-none text-[10px] font-bold underline underline-offset-2"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
                  Token kartu
                </span>
                <div className="relative">
                  <ScanLine
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    placeholder="SIMBK1:…"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    className="min-h-[46px] w-full rounded-[11px] border border-border bg-white pl-10 pr-3 font-mono text-[12px] text-text focus:border-black focus:outline-none"
                  />
                </div>
                <span className="mt-1 block text-[10.5px] leading-relaxed text-muted">
                  Buka lewat QR di kartu, atau tempel token/tautan kartu di sini.
                </span>
              </label>
            )}

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
                PIN 6 digit
              </span>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  autoFocus={Boolean(token)}
                  className="min-h-[46px] w-full rounded-[11px] border border-border bg-white pl-10 pr-3 text-center font-mono text-[20px] font-extrabold tracking-[0.4em] text-text focus:border-black focus:outline-none"
                />
              </div>
            </label>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-[11px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-red-700">
                <AlertCircle size={15} className="mt-0.5 flex-none" />
                <p>
                  {error}
                  {lockedUntil && (
                    <span className="mt-1 block font-normal">
                      Coba lagi setelah {formatDateTime(lockedUntil)}.
                    </span>
                  )}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !activeToken}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-black text-sm font-extrabold text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
              {loading ? 'Memeriksa kartu…' : 'Masuk ke portal'}
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
              <LockKeyhole size={12} className="mt-0.5 flex-none" />
              PIN tidak boleh dibagikan. Salah PIN 5 kali membuat kartu terkunci 15 menit. Hubungi
              Guru BK jika kartu hilang.
            </p>
          </form>

          {!token && (
            <div className="mt-4 flex items-start gap-2.5 rounded-[14px] border border-border bg-white/70 px-3.5 py-3 text-[10.5px] leading-relaxed text-muted">
              <IdCard size={16} className="mt-0.5 flex-none text-text" />
              <p>
                Kartu siswa diterbitkan oleh Guru BK. Setiap kartu berisi QR dan PIN sekali tampil —
                simpan PIN terpisah dari kartu.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <PortalDashboard
      data={data}
      error={error}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onLogout={handleLogout}
    />
  );
}

function PortalDashboard({
  data,
  error,
  refreshing,
  onRefresh,
  onLogout,
}: {
  data: StudentPortalData;
  error: string;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { points } = data;

  const consumedPercent = clampPercent((points.totalPoints / Math.max(points.pointScale, 1)) * 100);
  const nextTypeLabel = data.nextType ? SP_TYPE_SHORT[data.nextType] : null;
  const remainingToNext =
    data.nextThreshold != null ? Math.max(data.nextThreshold - points.totalPoints, 0) : 0;

  const previousThreshold = useMemo(() => {
    if (!data.nextType || !data.nextThreshold) return 0;
    const index = data.thresholds.indexOf(data.nextThreshold);
    return index > 0 ? data.thresholds[index - 1] : 0;
  }, [data.nextType, data.nextThreshold, data.thresholds]);

  const stagePercent = useMemo(() => {
    if (!data.nextThreshold) return 100;
    const span = data.nextThreshold - previousThreshold;
    if (span <= 0) return 100;
    return clampPercent(((points.totalPoints - previousThreshold) / span) * 100);
  }, [data.nextThreshold, previousThreshold, points.totalPoints]);

  const visibleViolations = showAllHistory
    ? data.violations
    : data.violations.slice(0, HISTORY_PAGE);

  return (
    <div className="m-app min-h-screen bg-bg">
      <header className="relative overflow-hidden bg-[#0B1220] px-4 pb-20 pt-6 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#2563EB]/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.2em] text-white/55">
                {data.school.nama || 'Portal Tata Tertib'}
              </p>
              <h1 className="mt-1 truncate text-[24px] font-[800] leading-tight tracking-tight">
                {data.student.nama}
              </h1>
              <p className="mt-0.5 text-[11px] font-semibold text-white/65">
                NIS {data.student.nis || '-'} · Kelas {data.student.kelas || '-'}
              </p>
            </div>
            <div className="flex flex-none items-center gap-1.5">
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Muat ulang data"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Keluar dari portal"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white active:scale-95"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-14 w-full max-w-md space-y-3 px-4 pb-10">
        {error && (
          <div className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-700">
            <AlertCircle size={15} className="mt-0.5 flex-none" />
            <p>{error}</p>
          </div>
        )}

        <section className="rounded-[22px] border border-border bg-surface p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Sisa poin
              </p>
              <p className="mt-1 flex items-end gap-1.5">
                <span className="text-[42px] font-[800] leading-none tracking-tight text-text">
                  {points.balance}
                </span>
                <span className="pb-1 text-[11px] font-bold text-muted">
                  / {points.pointScale}
                </span>
              </p>
            </div>
            <span
              className={`flex-none rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${POINT_STATUS_STYLES[points.status]}`}
            >
              {POINT_STATUS_LABELS[points.status]}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-[width] duration-500"
              style={{ width: `${consumedPercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-muted">
            <span>{points.totalGuidebookPoints} poin buku panduan</span>
            <span>{points.totalPoints} poin tercatat</span>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-[11px] bg-bg px-3 py-2 text-[10px] leading-relaxed text-muted">
            <BookOpen size={13} className="mt-0.5 flex-none" />
            <p>Poin pelanggaran bersifat kumulatif dan tidak dihapus. Pembinaan tetap menjadi fokus.</p>
          </div>
        </section>

        {data.nextType && data.nextThreshold ? (
          <section className="rounded-[16px] border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted">
                  Tahap berikutnya
                </p>
                <p className="mt-1 text-[15px] font-extrabold text-text">
                  {nextTypeLabel} · {data.nextThreshold} poin
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-extrabold text-amber-800">
                {remainingToNext} poin lagi
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-[width] duration-500"
                style={{ width: `${stagePercent}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Ambang ini adalah pengingat, bukan vonis. Guru BK akan mengajak musyawarah sebelum
              surat peringatan diterbitkan.
            </p>
          </section>
        ) : (
          <section className="flex items-start gap-2.5 rounded-[16px] border border-red-200 bg-red-50 p-4 text-red-900">
            <XCircle size={18} className="mt-0.5 flex-none" />
            <div>
              <p className="text-[12px] font-extrabold">Sudah mencapai tahap Sidang Pleno</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed">
                Segera temui Guru BK bersama orang tua/wali. Portal tetap menampilkan seluruh
                riwayat agar semuanya transparan.
              </p>
            </div>
          </section>
        )}

        <section className="grid grid-cols-3 gap-2">
          <StatCard label="Semester" value={points.semesterPoints} icon={<CalendarDays size={14} />} />
          <StatCard label="Tahun ini" value={points.yearPoints} icon={<History size={14} />} />
          <StatCard label="Buku" value={points.totalGuidebookPoints} suffix="/100" icon={<BookOpen size={14} />} />
        </section>

        {data.spLetters.length > 0 && (
          <section className="rounded-[16px] border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-[13px] font-extrabold text-text">
                <FileText size={15} /> Surat Peringatan
              </h2>
              <span className="text-[10px] font-bold text-muted">{data.spLetters.length} terbit</span>
            </div>
            <ul className="mt-2.5 space-y-2">
              {data.spLetters.map((letter) => (
                <li key={letter.id} className="rounded-[12px] border border-border bg-bg/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-extrabold text-text">
                        {SP_TYPE_LABELS[letter.type]}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted">
                        {letter.number || 'Nomor belum tersedia'}
                      </p>
                    </div>
                    <span className="flex-none rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                      Terbit
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                    <span>Diterbitkan {formatDate(letter.issuedAt)}</span>
                    {letter.meetingAt && <span>Pertemuan {formatDateTime(letter.meetingAt)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-[16px] border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-[13px] font-extrabold text-text">
              <History size={15} /> Riwayat pelanggaran
            </h2>
            <span className="text-[10px] font-bold text-muted">{data.violations.length} catatan</span>
          </div>

          {data.violations.length === 0 ? (
            <div className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-4 text-center">
              <CheckCircle2 size={22} className="mx-auto text-emerald-600" />
              <p className="mt-1.5 text-[11.5px] font-extrabold text-emerald-900">
                Belum ada pelanggaran tercatat
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-800/80">
                Pertahankan kebiasaan baik dan fokus belajar.
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-2.5 divide-y divide-border/70">
                {visibleViolations.map((row) => {
                  const voided = row.status === 'void';
                  return (
                    <li key={row.id} className="flex items-start gap-2.5 py-2.5">
                      <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-neutral-100 text-[10px] font-extrabold text-neutral-600">
                        {row.points}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[11.5px] font-bold leading-snug ${
                            voided ? 'text-muted line-through' : 'text-text'
                          }`}
                        >
                          {row.ruleName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[9.5px] text-muted">{formatDate(row.occurredAt)}</span>
                          <span
                            className={`rounded-full border px-1 py-0.5 text-[8.5px] font-extrabold uppercase ${CATEGORY_STYLES[row.category]}`}
                          >
                            {CATEGORY_SHORT_LABELS[row.category]}
                          </span>
                          {voided && (
                            <span className="rounded-full border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[8.5px] font-extrabold uppercase text-neutral-600">
                              Dibatalkan
                            </span>
                          )}
                        </div>
                        {row.location && (
                          <p className="mt-0.5 truncate text-[9.5px] text-muted">{row.location}</p>
                        )}
                      </div>
                      <span
                        className={`flex-none text-[11px] font-extrabold ${
                          voided ? 'text-muted line-through' : 'text-red-600'
                        }`}
                      >
                        +{row.points}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {data.violations.length > HISTORY_PAGE && (
                <button
                  type="button"
                  onClick={() => setShowAllHistory((value) => !value)}
                  className="mt-2 flex min-h-[38px] w-full items-center justify-center gap-1 rounded-[10px] border border-border bg-white text-[10.5px] font-bold text-text"
                >
                  {showAllHistory ? (
                    <>
                      <ChevronUp size={14} /> Tampilkan lebih sedikit
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Tampilkan {data.violations.length - HISTORY_PAGE}{' '}
                      catatan lagi
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </section>

        <div className="flex items-start gap-2 rounded-[12px] border border-border bg-white/70 px-3.5 py-3 text-[10px] leading-relaxed text-muted">
          <ShieldCheck size={14} className="mt-0.5 flex-none text-text" />
          <p>
            Portal ini hanya menampilkan data milikmu. Jika ada catatan yang keliru, sampaikan
            kepada Guru BK — koreksi dicatat sebagai riwayat, bukan penghapusan.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[12px] border border-border bg-surface text-[11px] font-bold text-muted hover:text-text"
        >
          <LogOut size={14} /> Keluar dari portal
        </button>

        <p className="pb-2 text-center text-[9px] text-muted/70">
          SIM-BK · Sesi berlaku 45 menit · Jangan bagikan PIN
        </p>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-surface p-2.5">
      <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted">
        <span className="text-muted/80">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-[17px] font-extrabold leading-none text-text">
        {value}
        {suffix && <span className="text-[9px] font-bold text-muted">{suffix}</span>}
      </p>
    </div>
  );
}
