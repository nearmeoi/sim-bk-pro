import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  BadgeCheck,
  BookUser,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { useDiscipline } from '../../context/DisciplineContext';
import { confirmDialog } from '../ui/ConfirmModal';
import { staffService } from '../../services/staffService';
import type {
  CreatedStaffAccount,
  SchoolClassOption,
  StaffMember,
} from '../../types';

interface GuruViewProps {
  onToast: (message: string) => void;
}

type Tab = 'akun' | 'kelas';
type StaffRole = StaffMember['role'];

const ROLE_LABEL: Record<StaffRole, string> = {
  bk: 'Guru BK',
  wali_kelas: 'Wali Kelas',
};

const roleBadge = (role: StaffRole) =>
  role === 'bk'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-sky-200 bg-sky-50 text-sky-800';

const normalizeClass = (value: string) => value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

const initialOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'G';

export default function GuruView({ onToast }: GuruViewProps) {
  const { students } = useBK();
  const { available, membership, academicYears } = useDiscipline();
  const isBk = membership?.role === 'bk';

  const [tab, setTab] = useState<Tab>('akun');
  const [yearId, setYearId] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [classes, setClasses] = useState<SchoolClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingClassId, setSavingClassId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; member: StaffMember | null } | null>(
    null,
  );
  const [credential, setCredential] = useState<{
    account: CreatedStaffAccount;
    title: string;
  } | null>(null);

  const activeYear = academicYears.find((row) => row.isActive) || academicYears[0] || null;

  useEffect(() => {
    if (!yearId && activeYear) setYearId(activeYear.id);
  }, [activeYear, yearId]);

  const load = useCallback(async () => {
    if (!available || !membership?.schoolId || !isBk) {
      setStaff([]);
      setClasses([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextStaff, nextClasses] = await Promise.all([
        staffService.getStaff(),
        yearId ? staffService.getClasses(yearId) : Promise.resolve([]),
      ]);
      setStaff(nextStaff);
      setClasses(nextClasses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data guru.');
      setStaff([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [available, membership?.schoolId, isBk, yearId]);

  useEffect(() => {
    void load();
  }, [load]);

  const staffById = useMemo(() => {
    const map: Record<string, StaffMember> = {};
    staff.forEach((row) => {
      map[row.memberId] = row;
    });
    return map;
  }, [staff]);

  const activeStaff = useMemo(() => staff.filter((row) => row.isActive), [staff]);
  const bkCount = activeStaff.filter((row) => row.role === 'bk').length;
  const waliCount = activeStaff.filter((row) => row.role === 'wali_kelas').length;
  const classesWithout = classes.filter((row) => !row.homeroomMemberId).length;

  const classCountByMember = useMemo(() => {
    const map: Record<string, number> = {};
    classes.forEach((row) => {
      if (row.homeroomMemberId) {
        map[row.homeroomMemberId] = (map[row.homeroomMemberId] || 0) + 1;
      }
    });
    return map;
  }, [classes]);

  const studentCountByClass = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((student) => {
      const key = normalizeClass(student.kelas);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [students]);

  const visibleStaff = useMemo(
    () => (showInactive ? staff : staff.filter((row) => row.isActive)),
    [staff, showInactive],
  );

  const assign = async (classId: string, memberId: string) => {
    if (!memberId) return;
    setSavingClassId(classId);
    try {
      await staffService.assignHomeroom(classId, memberId);
      onToast('Wali kelas berhasil ditugaskan.');
      await load();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal menugaskan wali kelas.');
      await load();
    } finally {
      setSavingClassId(null);
    }
  };

  const clear = async (row: SchoolClassOption) => {
    const ok = await confirmDialog({
      title: `Lepas wali kelas ${row.name}?`,
      description: 'Akun guru tetap ada. Kelas ini akan tampil tanpa wali kelas.',
      confirmLabel: 'Lepas',
      tone: 'danger',
    });
    if (!ok) return;
    setSavingClassId(row.id);
    try {
      await staffService.clearHomeroom(row.id);
      onToast('Wali kelas dilepas dari kelas.');
      await load();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal melepas wali kelas.');
    } finally {
      setSavingClassId(null);
    }
  };

  const toggleActive = async (member: StaffMember) => {
    if (member.isActive) {
      const ok = await confirmDialog({
        title: `Nonaktifkan ${member.displayName}?`,
        description:
          'Akun tidak bisa membuka data sekolah lagi. Semua penugasan wali kelasnya dilepas. Akun bisa diaktifkan kembali kapan saja.',
        confirmLabel: 'Nonaktifkan',
        tone: 'danger',
      });
      if (!ok) return;
    }
    try {
      await staffService.setActive(member.memberId, !member.isActive);
      onToast(member.isActive ? 'Akun guru dinonaktifkan.' : 'Akun guru diaktifkan kembali.');
      await load();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal mengubah status akun.');
    }
  };

  const resetPassword = async (member: StaffMember) => {
    const ok = await confirmDialog({
      title: `Reset kata sandi ${member.displayName}?`,
      description:
        'Kata sandi lama langsung tidak berlaku. Kata sandi sementara hanya ditampilkan sekali.',
      confirmLabel: 'Reset Sandi',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const password = await staffService.resetPassword(member.memberId);
      setCredential({
        title: 'Kata Sandi Sementara',
        account: {
          memberId: member.memberId,
          userId: member.userId,
          displayName: member.displayName,
          role: member.role,
          email: member.email || '',
          temporaryPassword: password,
          linked: false,
        },
      });
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal mereset kata sandi.');
    }
  };

  if (!available) {
    return (
      <div className="rounded-[18px] border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
        Manajemen guru membutuhkan koneksi Supabase. Periksa konfigurasi cloud sekolah.
      </div>
    );
  }

  if (!isBk) {
    return (
      <div className="rounded-[18px] border border-border bg-white p-6 text-sm text-muted">
        Hanya guru BK yang dapat membuka manajemen guru dan wali kelas.
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-[750] leading-tight tracking-tight text-text sm:text-[28px]">
            Guru &amp; Wali Kelas
          </h1>
          <p className="mt-1 text-xs text-muted">
            Kelola akun staf dan tentukan wali kelas untuk setiap kelas. Satu guru satu kelas per
            tahun ajaran.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex min-h-[40px] items-center gap-1.5 rounded-[12px] border border-border bg-white px-3.5 text-xs font-bold text-text shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Muat ulang
          </button>
          <button
            type="button"
            onClick={() => setForm({ mode: 'create', member: null })}
            className="flex min-h-[40px] items-center gap-1.5 rounded-[12px] bg-black px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98]"
          >
            <UserPlus size={15} /> Tambah Guru
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-[16px] border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          <ShieldCheck size={16} className="mt-0.5 flex-none" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard icon={<Users size={16} />} label="Staf aktif" value={activeStaff.length} />
        <StatCard icon={<BadgeCheck size={16} />} label="Guru BK" value={bkCount} />
        <StatCard icon={<BookUser size={16} />} label="Wali kelas" value={waliCount} />
        <StatCard
          icon={<ShieldCheck size={16} />}
          label="Kelas tanpa wali"
          value={classesWithout}
          tone={classesWithout > 0 ? 'warn' : 'ok'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <TabButton active={tab === 'akun'} onClick={() => setTab('akun')}>
            Akun Staf
          </TabButton>
          <TabButton active={tab === 'kelas'} onClick={() => setTab('kelas')}>
            Penugasan Wali Kelas
          </TabButton>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <ShieldCheck size={13} /> Data hanya terlihat oleh guru BK sekolah ini.
        </span>
      </div>

      {loading && staff.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-[18px] border border-border bg-white p-10 text-sm text-muted">
          <Loader2 size={18} className="animate-spin" /> Memuat data guru…
        </div>
      ) : tab === 'akun' ? (
        <section className="overflow-hidden rounded-[18px] border border-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold text-text">Akun Staf Sekolah</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                {visibleStaff.length} akun ditampilkan. Email login tidak pernah dibaca langsung
                dari auth.users.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-muted">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Tampilkan nonaktif
            </label>
          </div>

          {visibleStaff.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted">
              Belum ada akun staf. Klik “Tambah Guru” untuk membuat akun pertama.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-[12px] xl:min-w-[860px]">
                <thead>
                  <tr className="border-b border-border bg-bg/60 text-left text-[10px] font-extrabold uppercase tracking-wide text-muted">
                    <th className="px-4 py-2.5">Guru</th>
                    <th className="px-3 py-2.5">Peran</th>
                    <th className="lg:hidden px-3 py-2.5 xl:table-cell">Email</th>
                    <th className="px-3 py-2.5">Kelas diampu</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStaff.map((member) => (
                    <tr
                      key={member.memberId}
                      className={`border-b border-border/70 last:border-0 ${
                        member.isActive ? '' : 'bg-bg/40 text-muted'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-neutral-900 text-[11px] font-extrabold text-white">
                            {initialOf(member.displayName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-text">{member.displayName}</p>
                            <p className="mt-0.5 text-[10px] text-muted">
                              {member.email || 'Email belum dicatat'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${roleBadge(
                            member.role,
                          )}`}
                        >
                          {ROLE_LABEL[member.role]}
                        </span>
                      </td>
                      <td className="lg:hidden max-w-[200px] px-3 py-3 xl:table-cell">
                        <span className="block truncate text-[11px] text-muted">
                          {member.email || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {classCountByMember[member.memberId] ? (
                          <span className="text-[11px] font-semibold text-text">
                            {classCountByMember[member.memberId]} kelas
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">Belum ditugaskan</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
                            member.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-border bg-bg text-muted'
                          }`}
                        >
                          {member.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setForm({ mode: 'edit', member })}
                            title="Edit akun"
                            aria-label="Edit akun"
                            className="inline-flex min-h-[32px] items-center gap-1 rounded-[9px] border border-border bg-white px-2.5 text-[10px] font-bold text-text hover:bg-gray-50"
                          >
                            <Pencil size={12} /> <span className="hidden xl:inline">Edit</span>
                          </button>
                          {member.isActive && (
                            <button
                              type="button"
                              onClick={() => void resetPassword(member)}
                              title="Reset sandi"
                              aria-label="Reset sandi"
                              className="inline-flex min-h-[32px] items-center gap-1 rounded-[9px] border border-border bg-white px-2.5 text-[10px] font-bold text-text hover:bg-gray-50"
                            >
                              <KeyRound size={12} />{' '}
                              <span className="hidden xl:inline">Reset sandi</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void toggleActive(member)}
                            title={member.isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                            aria-label={member.isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                            className={`inline-flex min-h-[32px] items-center gap-1 rounded-[9px] border px-2.5 text-[10px] font-bold ${
                              member.isActive
                                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {member.isActive ? <UserMinus size={12} /> : <UserPlus size={12} />}
                            <span className="hidden xl:inline">
                              {member.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-[18px] border border-border bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold text-text">Wali Kelas per Tahun Ajaran</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Pilih guru aktif. Wali kelas hanya bisa melihat siswa di kelas yang ditugaskan.
              </p>
            </div>
            <label className="text-[10px] font-extrabold uppercase tracking-wide text-muted">
              Tahun ajaran
              <select
                value={yearId}
                onChange={(event) => setYearId(event.target.value)}
                className="mt-1 block min-h-[38px] min-w-[150px] rounded-[10px] border border-border bg-surface px-2.5 text-xs font-bold text-text focus:border-black focus:outline-none"
              >
                {academicYears.length === 0 && <option value="">Belum ada tahun ajaran</option>}
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                    {year.isActive ? ' (aktif)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {classes.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted">
              Belum ada kelas pada tahun ajaran ini. Kelas dibuat otomatis saat siswa disimpan,
              atau tambahkan lewat menu Data Siswa.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-bg/60 text-left text-[10px] font-extrabold uppercase tracking-wide text-muted">
                    <th className="px-4 py-2.5">Kelas</th>
                    <th className="px-3 py-2.5">Siswa</th>
                    <th className="px-3 py-2.5">Wali Kelas</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((row) => {
                    const homeroom = row.homeroomMemberId
                      ? staffById[row.homeroomMemberId] || null
                      : null;
                    const saving = savingClassId === row.id;
                    return (
                      <tr key={row.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-extrabold text-text">{row.name}</p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            Tingkat {row.level ?? '-'}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-text">
                          {studentCountByClass[normalizeClass(row.name)] || 0} siswa
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={row.homeroomMemberId || ''}
                            disabled={saving}
                            onChange={(event) => {
                              const next = event.target.value;
                              if (next) void assign(row.id, next);
                              else void clear(row);
                            }}
                            className="min-h-[38px] w-full min-w-[190px] rounded-[10px] border border-border bg-surface px-2.5 text-xs font-bold text-text focus:border-black focus:outline-none disabled:opacity-50"
                          >
                            <option value="">— Belum ada wali kelas —</option>
                            {homeroom && !homeroom.isActive && (
                              <option value={homeroom.memberId}>
                                {homeroom.displayName} · Nonaktif
                              </option>
                            )}
                            {activeStaff.map((member) => (
                              <option key={member.memberId} value={member.memberId}>
                                {member.displayName} · {ROLE_LABEL[member.role]}
                              </option>
                            ))}
                          </select>
                          {homeroom && !homeroom.isActive && (
                            <p className="mt-1 text-[10px] font-bold text-red-600">
                              Akun wali kelas ini nonaktif.
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={!row.homeroomMemberId || saving}
                            onClick={() => void clear(row)}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded-[9px] border border-border bg-white px-2.5 text-[10px] font-bold text-text hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {saving ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <UserMinus size={12} />
                            )}
                            Lepas
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-border bg-bg/40 px-4 py-3 text-[11px] leading-relaxed text-muted">
            Penugasan memakai tahun ajaran kelas. Saat tahun ajaran berganti, buat kelas baru lalu
            tugaskan wali kelasnya lagi. Riwayat penugasan lama tetap tersimpan.
          </div>
        </section>
      )}

      {form && (
        <StaffFormModal
          mode={form.mode}
          member={form.member}
          schoolId={membership?.schoolId || ''}
          onClose={() => setForm(null)}
          onSaved={async (account) => {
            setForm(null);
            await load();
            if (account) {
              setCredential({
                title: account.linked ? 'Akun Dihubungkan' : 'Akun Guru Dibuat',
                account,
              });
            } else {
              onToast('Data guru disimpan.');
            }
          }}
        />
      )}

      {credential && (
        <CredentialModal
          title={credential.title}
          account={credential.account}
          onClose={() => setCredential(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: 'default' | 'warn' | 'ok';
}) {
  const valueTone =
    tone === 'warn' ? 'text-amber-700' : tone === 'ok' ? 'text-emerald-700' : 'text-text';
  return (
    <div className="rounded-[14px] border border-border bg-white p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-muted">
        {icon} {label}
      </p>
      <p className={`mt-1.5 text-[24px] font-[750] leading-none ${valueTone}`}>{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[38px] rounded-[10px] px-3.5 text-xs font-bold transition-all ${
        active
          ? 'bg-black text-white shadow-sm'
          : 'border border-border bg-white text-muted hover:bg-gray-50 hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

function StaffFormModal({
  mode,
  member,
  schoolId,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  member: StaffMember | null;
  schoolId: string;
  onClose: () => void;
  onSaved: (account: CreatedStaffAccount | null) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(member?.displayName || '');
  const [email, setEmail] = useState(member?.email || '');
  const [role, setRole] = useState<StaffRole>(member?.role || 'wali_kelas');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'create') {
        if (!schoolId) throw new Error('Sekolah tidak ditemukan.');
        const account = await staffService.createAccount({
          schoolId,
          email,
          displayName,
          role,
        });
        await onSaved(account);
      } else if (member) {
        await staffService.updateMember({
          memberId: member.memberId,
          displayName,
          role,
          email: email.trim() || null,
        });
        await onSaved(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data guru.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={(event) => void submit(event)}
        className="w-full max-w-[460px] overflow-hidden rounded-[20px] bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-text">
              {mode === 'create' ? 'Tambah Guru' : 'Edit Data Guru'}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {mode === 'create'
                ? 'Akun login dibuat lewat Edge Function manage-staff.'
                : 'Perubahan nama, email catatan, dan peran.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-bg hover:text-text"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
              Nama lengkap
            </span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="Contoh: Ibu Siti Rahmawati"
              className="mt-1 min-h-[42px] w-full rounded-[10px] border border-border bg-white px-3 text-sm font-semibold text-text focus:border-black focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
              Email login {mode === 'edit' && '(catatan)'}
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required={mode === 'create'}
              placeholder="guru@sekolah.sch.id"
              className="mt-1 min-h-[42px] w-full rounded-[10px] border border-border bg-white px-3 text-sm font-semibold text-text focus:border-black focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
              Peran
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className="mt-1 min-h-[42px] w-full rounded-[10px] border border-border bg-white px-3 text-sm font-bold text-text focus:border-black focus:outline-none"
            >
              <option value="wali_kelas">Wali Kelas</option>
              <option value="bk">Guru BK</option>
            </select>
            <span className="mt-1 block text-[10px] leading-relaxed text-muted">
              Guru BK dapat melihat semua kelas. Wali kelas hanya kelas yang ditugaskan.
            </span>
          </label>

          {mode === 'create' && (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
              Kata sandi sementara akan ditampilkan satu kali setelah akun dibuat. Serahkan
              langsung kepada guru yang bersangkutan.
            </div>
          )}

          {error && (
            <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-bg/40 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] rounded-[10px] border border-border bg-white px-4 text-xs font-bold text-text hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] bg-black px-4 text-xs font-extrabold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {mode === 'create' ? 'Buat Akun' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CredentialModal({
  title,
  account,
  onClose,
  onToast,
}: {
  title: string;
  account: CreatedStaffAccount;
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onToast(`${label} disalin.`);
    } catch {
      onToast('Gagal menyalin. Salin manual dari layar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[440px] overflow-hidden rounded-[20px] bg-surface shadow-2xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-text">
            <KeyRound size={18} /> {title}
          </h2>
          <p className="mt-1 text-[11px] text-muted">
            Tampil sekali. Catat atau serahkan sekarang sebelum menutup jendela ini.
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="rounded-[12px] border border-border bg-bg/50 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">Nama</p>
            <p className="mt-0.5 text-sm font-bold text-text">{account.displayName}</p>
            <p className="mt-1 text-[10px] font-semibold text-muted">
              {ROLE_LABEL[account.role]}
            </p>
          </div>

          <div className="rounded-[12px] border border-border bg-bg/50 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">Email</p>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-bold text-text">{account.email || '—'}</p>
              {account.email && (
                <button
                  type="button"
                  onClick={() => void copy(account.email, 'Email')}
                  className="flex-none rounded-md p-1 text-muted hover:bg-white hover:text-text"
                  aria-label="Salin email"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>

          {account.temporaryPassword ? (
            <div className="rounded-[12px] border border-emerald-300 bg-emerald-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-800">
                Kata sandi sementara
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="select-all text-lg font-extrabold tracking-wide text-emerald-900">
                  {account.temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    void copy(account.temporaryPassword || '', 'Kata sandi sementara')
                  }
                  className="flex-none rounded-md p-1 text-emerald-800 hover:bg-white"
                  aria-label="Salin kata sandi"
                >
                  <Copy size={15} />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-emerald-800">
                Minta guru mengganti kata sandi lewat “Lupa sandi?” setelah login pertama.
              </p>
            </div>
          ) : (
            <div className="rounded-[12px] border border-sky-200 bg-sky-50 p-3 text-[11px] leading-relaxed text-sky-900">
              Email ini sudah memiliki akun. Akun dihubungkan ke sekolah ini tanpa mengubah kata
              sandi lamanya. Guru dapat memakai kata sandi yang sudah ada atau memilih “Lupa
              sandi?”.
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border bg-bg/40 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] rounded-[10px] bg-black px-4 text-xs font-extrabold text-white hover:bg-neutral-800"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
