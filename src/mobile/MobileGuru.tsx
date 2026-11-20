import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BadgeCheck,
  BookUser,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useBK } from '../context/BKContext';
import { useDiscipline } from '../context/DisciplineContext';
import { confirmDialog } from '../components/ui/ConfirmModal';
import { staffService } from '../services/staffService';
import type {
  CreatedStaffAccount,
  SchoolClassOption,
  StaffMember,
} from '../types';
import {
  DetailBar,
  EmptyState,
  Field,
  PageHeader,
  SectionTitle,
  Sheet,
  inputCls,
  smallBtnCls,
} from './ui';

interface MobileGuruProps {
  onBack: () => void;
  onToast: (message: string) => void;
}

type Tab = 'akun' | 'kelas';
type StaffRole = StaffMember['role'];

const ROLE_LABEL: Record<StaffRole, string> = {
  bk: 'Guru BK',
  wali_kelas: 'Wali Kelas',
};

const normalizeClass = (value: string) => value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

const initialOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'G';

export default function MobileGuru({ onBack, onToast }: MobileGuruProps) {
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
    title: string;
    account: CreatedStaffAccount;
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
  const visibleStaff = useMemo(
    () => (showInactive ? staff : staff.filter((row) => row.isActive)),
    [staff, showInactive],
  );
  const classesWithout = classes.filter((row) => !row.homeroomMemberId).length;

  const studentCountByClass = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((student) => {
      const key = normalizeClass(student.kelas);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [students]);

  const classCountByMember = useMemo(() => {
    const map: Record<string, number> = {};
    classes.forEach((row) => {
      if (row.homeroomMemberId) {
        map[row.homeroomMemberId] = (map[row.homeroomMemberId] || 0) + 1;
      }
    });
    return map;
  }, [classes]);

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
      description: 'Akun guru tetap ada. Kelas akan tampil tanpa wali kelas.',
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
          'Akun tidak bisa membuka data sekolah lagi dan penugasan wali kelasnya dilepas.',
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
      description: 'Kata sandi lama langsung tidak berlaku. Sandi baru tampil sekali.',
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
      <div className="fade-up space-y-4 pb-6">
        <DetailBar onBack={onBack} label="Menu" />
        <EmptyState icon={<ShieldCheck size={28} />}>
          Manajemen guru membutuhkan koneksi Supabase.
        </EmptyState>
      </div>
    );
  }

  if (!isBk) {
    return (
      <div className="fade-up space-y-4 pb-6">
        <DetailBar onBack={onBack} label="Menu" />
        <EmptyState icon={<ShieldCheck size={28} />}>
          Hanya guru BK yang dapat membuka manajemen guru.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="fade-up space-y-4 pb-6">
      <DetailBar
        onBack={onBack}
        label="Menu"
        right={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={smallBtnCls}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Muat
          </button>
        }
      />

      <PageHeader
        title="Guru &amp; Kelas"
        subtitle="Akun staf dan penugasan wali kelas"
        right={
          <button
            type="button"
            onClick={() => setForm({ mode: 'create', member: null })}
            className="bk-btn primary !min-h-[42px] !px-3.5 !text-xs"
          >
            <UserPlus size={15} /> Tambah
          </button>
        }
      />

      {error && (
        <div className="rounded-[14px] border border-red-300 bg-red-50 p-3 text-xs leading-relaxed text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <MobileStat icon={<Users size={15} />} label="Staf aktif" value={activeStaff.length} />
        <MobileStat
          icon={<BadgeCheck size={15} />}
          label="Guru BK"
          value={activeStaff.filter((row) => row.role === 'bk').length}
        />
        <MobileStat
          icon={<BookUser size={15} />}
          label="Wali kelas"
          value={activeStaff.filter((row) => row.role === 'wali_kelas').length}
        />
        <MobileStat
          icon={<ShieldCheck size={15} />}
          label="Kelas tanpa wali"
          value={classesWithout}
          tone={classesWithout > 0 ? 'warn' : 'ok'}
        />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-[14px] border border-border bg-surface p-1">
        <Segment active={tab === 'akun'} onClick={() => setTab('akun')}>
          Akun Staf
        </Segment>
        <Segment active={tab === 'kelas'} onClick={() => setTab('kelas')}>
          Wali Kelas
        </Segment>
      </div>

      {loading && staff.length === 0 ? (
        <div className="bk-card flex items-center justify-center gap-2 py-8 text-xs text-muted">
          <Loader2 size={16} className="animate-spin" /> Memuat data guru…
        </div>
      ) : tab === 'akun' ? (
        <section className="space-y-2.5">
          <SectionTitle
            action={
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) => setShowInactive(event.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Nonaktif
              </label>
            }
          >
            Akun Staf
          </SectionTitle>

          {visibleStaff.length === 0 ? (
            <EmptyState icon={<Users size={28} />}>
              Belum ada akun staf. Tambahkan guru pertama lewat tombol Tambah.
            </EmptyState>
          ) : (
            visibleStaff.map((member) => (
              <div
                key={member.memberId}
                className={`bk-card space-y-3 !p-3.5 ${member.isActive ? '' : 'opacity-70'}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-neutral-900 text-[11px] font-extrabold text-white">
                    {initialOf(member.displayName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-text">
                      {member.displayName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {member.email || 'Email belum dicatat'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
                          member.role === 'bk'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-sky-200 bg-sky-50 text-sky-800'
                        }`}
                      >
                        {ROLE_LABEL[member.role]}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
                          member.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-border bg-bg text-muted'
                        }`}
                      >
                        {member.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-bold text-muted">
                        {classCountByMember[member.memberId] || 0} kelas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ mode: 'edit', member })}
                    className={`${smallBtnCls} !min-h-[34px] !text-[10px]`}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  {member.isActive && (
                    <button
                      type="button"
                      onClick={() => void resetPassword(member)}
                      className={`${smallBtnCls} !min-h-[34px] !text-[10px]`}
                    >
                      <KeyRound size={12} /> Reset sandi
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void toggleActive(member)}
                    className={`${smallBtnCls} !min-h-[34px] !text-[10px] ${
                      member.isActive ? '!text-alert' : '!text-emerald-700'
                    }`}
                  >
                    {member.isActive ? <UserMinus size={12} /> : <UserPlus size={12} />}
                    {member.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        <section className="space-y-2.5">
          <SectionTitle
            action={
              <select
                value={yearId}
                onChange={(event) => setYearId(event.target.value)}
                className="min-h-[36px] rounded-[10px] border border-border bg-surface px-2 text-[11px] font-bold text-text"
              >
                {academicYears.length === 0 && <option value="">Belum ada tahun</option>}
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                    {year.isActive ? ' (aktif)' : ''}
                  </option>
                ))}
              </select>
            }
          >
            Wali Kelas
          </SectionTitle>

          {classes.length === 0 ? (
            <EmptyState icon={<BookUser size={28} />}>
              Belum ada kelas pada tahun ajaran ini.
            </EmptyState>
          ) : (
            classes.map((row) => {
              const homeroom = row.homeroomMemberId
                ? staffById[row.homeroomMemberId] || null
                : null;
              const saving = savingClassId === row.id;
              return (
                <div key={row.id} className="bk-card space-y-2.5 !p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-text">{row.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {studentCountByClass[normalizeClass(row.name)] || 0} siswa · Tingkat{' '}
                        {row.level ?? '-'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!row.homeroomMemberId || saving}
                      onClick={() => void clear(row)}
                      className={`${smallBtnCls} !min-h-[32px] !text-[10px]`}
                    >
                      {saving ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <UserMinus size={12} />
                      )}
                      Lepas
                    </button>
                  </div>

                  <select
                    value={row.homeroomMemberId || ''}
                    disabled={saving}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (next) void assign(row.id, next);
                      else void clear(row);
                    }}
                    className={`${inputCls} !min-h-[42px] !text-xs`}
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
                    <p className="text-[10px] font-bold text-red-600">
                      Akun wali kelas ini nonaktif.
                    </p>
                  )}
                </div>
              );
            })
          )}

          <p className="px-1 text-[10.5px] leading-relaxed text-muted">
            Satu guru hanya menjadi wali untuk satu kelas per tahun ajaran. Saat tahun berganti,
            buat kelas baru lalu tugaskan lagi.
          </p>
        </section>
      )}

      <StaffFormSheet
        open={Boolean(form)}
        mode={form?.mode || 'create'}
        member={form?.member || null}
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

      <CredentialSheet
        open={Boolean(credential)}
        title={credential?.title || ''}
        account={credential?.account || null}
        onClose={() => setCredential(null)}
        onToast={onToast}
      />
    </div>
  );
}

function MobileStat({
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
    <div className="rounded-[14px] border border-border bg-surface p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
        {icon} {label}
      </p>
      <p className={`mt-1 text-[22px] font-[750] leading-none ${valueTone}`}>{value}</p>
    </div>
  );
}

function Segment({
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
      className={`min-h-[40px] rounded-[11px] text-xs font-bold transition ${
        active ? 'bg-neutral-900 text-white shadow-sm' : 'text-muted'
      }`}
    >
      {children}
    </button>
  );
}

function StaffFormSheet({
  open,
  mode,
  member,
  schoolId,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  member: StaffMember | null;
  schoolId: string;
  onClose: () => void;
  onSaved: (account: CreatedStaffAccount | null) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('wali_kelas');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDisplayName(member?.displayName || '');
    setEmail(member?.email || '');
    setRole(member?.role || 'wali_kelas');
    setError(null);
    setBusy(false);
  }, [open, member]);

  const submit = async () => {
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
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Tambah Guru' : 'Edit Data Guru'}
      subtitle={
        mode === 'create'
          ? 'Akun login dibuat lewat fungsi aman manage-staff'
          : 'Ubah nama, email catatan, dan peran'
      }
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${smallBtnCls} flex-1`}>
            Batal
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="bk-btn primary min-h-[44px] flex-1"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {mode === 'create' ? 'Buat Akun' : 'Simpan'}
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        <Field label="Nama lengkap">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Contoh: Ibu Siti Rahmawati"
            className={inputCls}
          />
        </Field>

        <Field
          label={mode === 'create' ? 'Email login' : 'Email login (catatan)'}
          hint={
            mode === 'create'
              ? 'Email ini dipakai guru untuk masuk. Gunakan email aktif.'
              : 'Mengubah catatan di sini tidak mengubah email login di Supabase Auth.'
          }
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="guru@sekolah.sch.id"
            className={inputCls}
          />
        </Field>

        <Field
          label="Peran"
          hint="Guru BK melihat semua kelas. Wali kelas hanya kelas yang ditugaskan."
        >
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
            className={inputCls}
          >
            <option value="wali_kelas">Wali Kelas</option>
            <option value="bk">Guru BK</option>
          </select>
        </Field>

        {mode === 'create' && (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
            Kata sandi sementara tampil satu kali setelah akun dibuat. Serahkan langsung kepada
            guru yang bersangkutan.
          </div>
        )}

        {error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

function CredentialSheet({
  open,
  title,
  account,
  onClose,
  onToast,
}: {
  open: boolean;
  title: string;
  account: CreatedStaffAccount | null;
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
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Tampil sekali. Catat atau serahkan sekarang."
      footer={
        <button type="button" onClick={onClose} className="bk-btn primary min-h-[44px] w-full">
          Selesai
        </button>
      }
    >
      {account && (
        <div className="space-y-3">
          <div className="rounded-[12px] border border-border bg-bg/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Nama</p>
            <p className="mt-0.5 text-sm font-bold text-text">{account.displayName}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-muted">
              {ROLE_LABEL[account.role]}
            </p>
          </div>

          <div className="rounded-[12px] border border-border bg-bg/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Email</p>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-bold text-text">{account.email || '—'}</p>
              {account.email && (
                <button
                  type="button"
                  onClick={() => void copy(account.email, 'Email')}
                  aria-label="Salin email"
                  className="flex-none rounded-md p-1 text-muted active:bg-white"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>

          {account.temporaryPassword ? (
            <div className="rounded-[12px] border border-emerald-300 bg-emerald-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
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
                  aria-label="Salin kata sandi"
                  className="flex-none rounded-md p-1 text-emerald-800 active:bg-white"
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
              Email ini sudah memiliki akun. Akun dihubungkan ke sekolah tanpa mengubah kata
              sandi lamanya.
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
