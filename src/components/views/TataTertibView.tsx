import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Eye,
  FileSignature,
  FileText,
  IdCard,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trophy,
  Users,
} from 'lucide-react';
import { useBK } from '../../context/BKContext';
import { useDiscipline } from '../../context/DisciplineContext';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_STYLES,
  POINT_STATUS_LABELS,
  POINT_STATUS_STYLES,
  SP_STATUS_LABELS,
  SP_STATUS_STYLES,
  SP_TYPE_LABELS,
  SP_TYPE_SHORT,
  formatDate,
  formatDateTime,
  suggestSanction,
} from '../../lib/discipline';
import RecordViolationModal from '../discipline/RecordViolationModal';
import ReasonModal from '../discipline/ReasonModal';
import RuleModal from '../discipline/RuleModal';
import { IssueSpModal, ManualSpModal } from '../discipline/SpModals';
import SpDocumentModal from '../discipline/SpDocumentModal';
import StudentCardModal from '../discipline/StudentCardModal';
import type {
  LeaderboardEntry,
  PeriodStudentPoints,
  SpLetter,
  Student,
  StudentCard,
  ViolationCategory,
  ViolationFeedItem,
  ViolationRule,
} from '../../types';

interface TataTertibViewProps {
  onToast: (message: string) => void;
}

type Tab = 'ringkasan' | 'pelanggaran' | 'peringkat' | 'sp' | 'aturan' | 'kartu';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'pelanggaran', label: 'Pelanggaran' },
  { id: 'peringkat', label: 'Peringkat' },
  { id: 'sp', label: 'Surat Peringatan' },
  { id: 'aturan', label: 'Aturan Poin' },
  { id: 'kartu', label: 'Kartu QR' },
];

const numberFormat = new Intl.NumberFormat('id-ID');

export default function TataTertibView({ onToast }: TataTertibViewProps) {
  const { students } = useBK();
  const {
    available,
    loading,
    error,
    membership,
    points,
    feed,
    spLetters,
    classPoints,
    cards,
    rules,
    leaderboard,
    academicYears,
    semesters,
    pointsByStudent,
    getPeriodPoints,
    voidViolation,
    cancelSp,
    issueSp,
    createManualSp,
    createRule,
    updateRule,
    revokeStudentCard,
  } = useDiscipline();

  const [tab, setTab] = useState<Tab>('ringkasan');
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordStudent, setRecordStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibleRows, setVisibleRows] = useState(60);
  const [voidTarget, setVoidTarget] = useState<ViolationFeedItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SpLetter | null>(null);
  const [issueTarget, setIssueTarget] = useState<SpLetter | null>(null);
  const [preview, setPreview] = useState<{
    letter: SpLetter;
    kind: 'sp' | 'berita-acara';
  } | null>(null);
  const [cardStudent, setCardStudent] = useState<Student | null>(null);
  const [cardQuery, setCardQuery] = useState('');
  const [cardVisible, setCardVisible] = useState(40);
  const [rankVisible, setRankVisible] = useState(20);
  const [periodYearId, setPeriodYearId] = useState('');
  const [periodSemesterId, setPeriodSemesterId] = useState('');
  const [periodRows, setPeriodRows] = useState<PeriodStudentPoints[] | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [revokeCardTarget, setRevokeCardTarget] = useState<{
    card: StudentCard;
    student: Student;
  } | null>(null);
  const [manualSpOpen, setManualSpOpen] = useState(false);
  const [ruleModal, setRuleModal] = useState<{ open: boolean; rule: ViolationRule | null }>({
    open: false,
    rule: null,
  });

  const canManage = membership?.role === 'bk';

  const attention = useMemo(
    () =>
      points
        .filter((row) => row.status !== 'aman')
        .sort((a, b) => b.totalPoints - a.totalPoints),
    [points]
  );

  const draftLetters = useMemo(
    () => spLetters.filter((row) => row.status === 'draft'),
    [spLetters]
  );

  const issuedLetters = useMemo(
    () => spLetters.filter((row) => row.status !== 'draft'),
    [spLetters]
  );

  const totalSemesterPoints = useMemo(
    () => points.reduce((sum, row) => sum + row.semesterPoints, 0),
    [points]
  );

  const bestClass = classPoints[0] || null;
  const isBk = membership?.role === 'bk';

  const rankRows = useMemo(
    () =>
      leaderboard
        .slice()
        .sort((a, b) => b.points - a.points || a.nama.localeCompare(b.nama, 'id')),
    [leaderboard]
  );

  const visibleRankRows = rankRows.slice(0, rankVisible);
  const podium = rankRows.slice(0, 3);
  const rankOf = (row: LeaderboardEntry) => (isBk ? row.schoolRank : row.classRank);
  const rankTotalOf = (row: LeaderboardEntry) =>
    isBk ? row.schoolStudents : row.classStudents;

  const activeYear = academicYears.find((row) => row.isActive) || academicYears[0] || null;
  const selectedYearId = periodYearId || activeYear?.id || '';
  const yearSemesters = semesters.filter((row) => row.academicYearId === selectedYearId);
  const activeSemester = yearSemesters.find((row) => row.isActive) || yearSemesters[0] || null;
  const selectedSemesterId = periodSemesterId || activeSemester?.id || '';

  const periodTotals = useMemo(() => {
    const rows = periodRows || [];
    return {
      students: rows.length,
      points: rows.reduce((sum, row) => sum + row.points, 0),
      violations: rows.reduce((sum, row) => sum + row.violationCount, 0),
    };
  }, [periodRows]);

  const loadPeriodReport = async (yearId: string, semesterId: string) => {
    if (!yearId || !semesterId) return;
    setPeriodLoading(true);
    setPeriodError(null);
    try {
      setPeriodRows(await getPeriodPoints(yearId, semesterId));
    } catch (err) {
      setPeriodRows([]);
      setPeriodError(err instanceof Error ? err.message : 'Gagal memuat laporan periode.');
    } finally {
      setPeriodLoading(false);
    }
  };

  const activeCardByStudent = useMemo(() => {
    const map: Record<string, StudentCard> = {};
    cards
      .filter((card) => card.status === 'active')
      .forEach((card) => {
        map[card.studentId] = card;
      });
    return map;
  }, [cards]);

  const cardStudents = useMemo(() => {
    const q = cardQuery.trim().toLowerCase();
    return students
      .filter((student) => {
        if (!q) return true;
        return (
          student.nama.toLowerCase().includes(q) ||
          student.nis.toLowerCase().includes(q) ||
          student.kelas.toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [students, cardQuery]);

  const filteredFeed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feed.filter((row) => {
      if (kelasFilter && !row.kelas.toUpperCase().replace(/[^0-9A-Z]/g, '').startsWith(kelasFilter)) {
        return false;
      }
      if (categoryFilter && row.ruleCategory !== categoryFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.nama.toLowerCase().includes(q) ||
        row.ruleName.toLowerCase().includes(q) ||
        row.ruleCode.toLowerCase().includes(q) ||
        row.kelas.toLowerCase().includes(q)
      );
    });
  }, [feed, search, kelasFilter, categoryFilter, statusFilter]);

  const openRecord = (student?: Student) => {
    setRecordStudent(student || null);
    setRecordOpen(true);
  };

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-[750] leading-tight tracking-tight text-text sm:text-[28px]">
            Tata Tertib &amp; Poin Siswa
          </h1>
          <p className="mt-1 text-xs text-muted">
            Poin pelanggaran bersifat permanen. Laporan dapat dilihat per semester dan tahun ajaran.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setManualSpOpen(true)}
              className="flex min-h-[40px] items-center gap-1.5 rounded-[12px] border border-border bg-white px-3.5 text-xs font-bold text-text shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]"
            >
              <FileText size={15} /> SP Manual
            </button>
            <button
              type="button"
              onClick={() => openRecord()}
              className="flex min-h-[40px] items-center gap-1.5 rounded-[12px] bg-black px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.5} /> Catat Pelanggaran
            </button>
          </div>
        )}
      </div>

      {!available && (
        <div className="flex items-start gap-2.5 rounded-[16px] border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 flex-none" />
          <div>
            <p className="font-extrabold">Tata Tertib membutuhkan koneksi Supabase.</p>
            <p className="mt-0.5 leading-relaxed">
              Mode lokal tanpa backend belum menyimpan poin. Hubungkan aplikasi ke Supabase agar
              pencatatan, ledger, dan SP aktif.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-[16px] border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          <AlertTriangle size={18} className="mt-0.5 flex-none" />
          <div>
            <p className="font-extrabold">Gagal memuat data tata tertib.</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
            <p className="mt-1 leading-relaxed">
              Pastikan migrasi Fase 1 dan Fase 2 sudah dijalankan, lalu muat ulang halaman.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2 no-scrollbar">
        {TABS.map((item) => {
          if (item.id === 'kartu' && !canManage) return null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`bk-chip !min-h-[36px] !text-xs ${tab === item.id ? 'on' : ''}`}
            >
              {item.label}
              {item.id === 'sp' && draftLetters.length > 0 && (
                <span className="ml-1 rounded-full bg-alert px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                  {draftLetters.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && points.length === 0 && (
        <div className="rounded-[18px] border border-border bg-white p-6 text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-border border-t-black" />
          <p className="text-xs font-semibold text-muted">Memuat data tata tertib...</p>
        </div>
      )}

      {tab === 'ringkasan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard
              label="Siswa Dipantau"
              value={numberFormat.format(points.length)}
              hint={`${attention.length} perlu perhatian`}
              icon={Users}
            />
            <StatCard
              label="Poin Semester Ini"
              value={numberFormat.format(totalSemesterPoints)}
              hint="akumulasi seluruh siswa"
              icon={BarChart3}
            />
            <StatCard
              label="SP Draft"
              value={numberFormat.format(draftLetters.length)}
              hint="menunggu review BK"
              icon={FileText}
              tone={draftLetters.length > 0 ? 'alert' : 'normal'}
            />
            <StatCard
              label="Kelas Paling Tertib"
              value={bestClass?.kelas || '-'}
              hint={bestClass ? `rata-rata ${bestClass.averagePoints} poin` : 'belum ada data'}
              icon={Trophy}
              tone="success"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-[18px] border border-border bg-white">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-extrabold text-text">Perlu Perhatian</h2>
                  <p className="mt-0.5 text-[11px] text-muted">Poin kumulatif tertinggi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('pelanggaran')}
                  className="text-[11px] font-bold text-muted hover:text-text"
                >
                  Lihat semua
                </button>
              </div>
              {attention.length === 0 ? (
                <EmptyState icon={CheckCircle2} text="Belum ada siswa di atas ambang pembinaan." />
              ) : (
                <ul className="divide-y divide-border/70">
                  {attention.slice(0, 6).map((row) => (
                    <li key={row.studentId} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-neutral-900 text-[10px] font-extrabold text-white">
                        {row.nama
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold text-text">{row.nama}</p>
                        <p className="text-[10.5px] text-muted">
                          Kelas {row.kelas} · sisa {row.balance} poin
                        </p>
                      </div>
                      <div className="flex flex-none flex-col items-end gap-0.5">
                        <span
                          className={`rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${POINT_STATUS_STYLES[row.status]}`}
                        >
                          {POINT_STATUS_LABELS[row.status]}
                        </span>
                        <span className="text-[10px] font-bold tabular-nums text-alert">
                          +{row.totalPoints}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[18px] border border-border bg-white">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-extrabold text-text">SP Menunggu Review</h2>
                  <p className="mt-0.5 text-[11px] text-muted">Tidak pernah terkirim otomatis</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('sp')}
                  className="text-[11px] font-bold text-muted hover:text-text"
                >
                  Buka SP
                </button>
              </div>
              {draftLetters.length === 0 ? (
                <EmptyState icon={FileText} text="Tidak ada draft SP saat ini." />
              ) : (
                <ul className="divide-y divide-border/70">
                  {draftLetters.slice(0, 5).map((letter) => (
                    <li key={letter.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-amber-100 text-[10px] font-extrabold text-amber-800">
                        {SP_TYPE_SHORT[letter.type]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold text-text">{letter.nama}</p>
                        <p className="text-[10.5px] text-muted">
                          Kelas {letter.kelas} · {letter.totalPoints} poin
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setIssueTarget(letter)}
                          className="flex-none rounded-[8px] bg-black px-2.5 py-1 text-[10px] font-bold text-white hover:bg-neutral-800"
                        >
                          Terbitkan
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-[18px] border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-extrabold text-text">Pelanggaran Terbaru</h2>
                <p className="mt-0.5 text-[11px] text-muted">Catatan terakhir dari seluruh kelas</p>
              </div>
              <button
                type="button"
                onClick={() => setTab('pelanggaran')}
                className="text-[11px] font-bold text-muted hover:text-text"
              >
                Riwayat lengkap
              </button>
            </div>
            {feed.length === 0 ? (
              <EmptyState icon={ShieldAlert} text="Belum ada pelanggaran tercatat." />
            ) : (
              <ul className="divide-y divide-border/70">
                {feed.slice(0, 6).map((row) => (
                  <li key={row.id} className="flex items-start gap-3 px-4 py-2.5">
                    <span
                      className={`mt-0.5 flex-none rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[row.ruleCategory]}`}
                    >
                      {row.ruleCode}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold text-text">{row.ruleName}</p>
                      <p className="text-[10.5px] text-muted">
                        {row.nama} · Kelas {row.kelas} · {formatDateTime(row.occurredAt)}
                      </p>
                    </div>
                    <span className="flex-none text-[12px] font-extrabold tabular-nums text-alert">
                      +{row.rulePoints}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'peringkat' && (
        <div className="space-y-3">
          <section className="overflow-hidden rounded-[18px] border border-border bg-white">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-extrabold text-text">Peringkat Pelanggaran</h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  Poin semester berjalan. Hanya BK dan wali kelas yang dapat melihat papan ini.
                </p>
              </div>
              <span className="flex-none rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">
                {isBk ? 'Tingkat sekolah' : 'Kelas saya'} · {rankRows.length} siswa
              </span>
            </div>

            {rankRows.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                text="Belum ada poin pelanggaran pada semester ini."
              />
            ) : (
              <>
                <div className="grid gap-2.5 p-4 sm:grid-cols-3">
                  {podium.map((row) => {
                    const rank = rankOf(row);
                    const summary = pointsByStudent[row.studentId];
                    const tone =
                      rank === 1
                        ? 'border-amber-300 bg-amber-50'
                        : rank === 2
                          ? 'border-neutral-300 bg-neutral-50'
                          : 'border-orange-200 bg-orange-50';
                    return (
                      <div key={row.studentId} className={`rounded-[14px] border p-3 ${tone}`}>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-extrabold text-text">
                            #{rank}
                          </span>
                          <Trophy
                            size={15}
                            className={
                              rank === 1
                                ? 'text-amber-600'
                                : rank === 2
                                  ? 'text-neutral-500'
                                  : 'text-orange-500'
                            }
                          />
                        </div>
                        <p className="mt-2 truncate text-[13px] font-extrabold text-text">
                          {row.nama}
                        </p>
                        <p className="truncate text-[10.5px] text-muted">
                          Kelas {row.kelas} · NIS {row.nis}
                        </p>
                        <p className="mt-2 flex items-end gap-1">
                          <span className="text-[22px] font-extrabold leading-none tabular-nums text-text">
                            {row.points}
                          </span>
                          <span className="pb-0.5 text-[10px] font-bold text-muted">
                            poin semester
                          </span>
                        </p>
                        <p className="mt-1 text-[10px] text-muted">
                          {summary ? `Sisa ${summary.balance} poin` : 'Ringkasan belum termuat'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full min-w-[780px] border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-gray-50/80 text-left text-[10px] uppercase tracking-wide text-muted">
                        <th className="px-4 py-2 font-extrabold">Peringkat</th>
                        <th className="px-3 py-2 font-extrabold">Siswa</th>
                        <th className="px-3 py-2 font-extrabold">Kelas</th>
                        <th className="px-3 py-2 text-right font-extrabold">Poin semester</th>
                        <th className="px-3 py-2 text-right font-extrabold">Sisa poin</th>
                        <th className="px-3 py-2 font-extrabold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {visibleRankRows.map((row) => {
                        const rank = rankOf(row);
                        const totalStudents = rankTotalOf(row);
                        const summary = pointsByStudent[row.studentId];
                        return (
                          <tr key={row.studentId} className="hover:bg-gray-50/60">
                            <td className="px-4 py-2.5 font-extrabold tabular-nums text-text">
                              #{rank}
                              <span className="ml-1 text-[9.5px] font-semibold text-muted">
                                /{totalStudents}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="font-bold text-text">{row.nama}</p>
                              <p className="text-[10px] text-muted">NIS {row.nis}</p>
                            </td>
                            <td className="px-3 py-2.5 text-muted">{row.kelas}</td>
                            <td className="px-3 py-2.5 text-right font-extrabold tabular-nums text-alert">
                              +{row.points}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                              {summary ? summary.balance : '-'}
                            </td>
                            <td className="px-3 py-2.5">
                              {summary ? (
                                <span
                                  className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${POINT_STATUS_STYLES[summary.status]}`}
                                >
                                  {POINT_STATUS_LABELS[summary.status]}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {rankRows.length > 20 && (
                  <div className="border-t border-border px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setRankVisible(rankVisible >= rankRows.length ? 20 : rankRows.length)
                      }
                      className="min-h-[36px] rounded-[10px] border border-border bg-white px-4 text-[11px] font-bold text-text hover:bg-gray-50"
                    >
                      {rankVisible >= rankRows.length
                        ? 'Tampilkan lebih sedikit'
                        : `Tampilkan semua (${rankRows.length})`}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="overflow-hidden rounded-[18px] border border-border bg-white">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-extrabold text-text">Kelas Paling Tertib</h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  Rata-rata poin semester terendah menempati peringkat pertama.
                </p>
              </div>
              <span className="flex-none rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                {bestClass?.kelas ? `Juara: ${bestClass.kelas}` : 'Belum ada data'}
              </span>
            </div>
            {classPoints.length === 0 ? (
              <EmptyState icon={Trophy} text="Belum ada data kelas pada semester ini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-gray-50/80 text-left text-[10px] uppercase tracking-wide text-muted">
                      <th className="px-4 py-2 font-extrabold">Rank</th>
                      <th className="px-3 py-2 font-extrabold">Kelas</th>
                      <th className="px-3 py-2 text-right font-extrabold">Siswa</th>
                      <th className="px-3 py-2 text-right font-extrabold">Rata-rata</th>
                      <th className="px-3 py-2 text-right font-extrabold">Total semester</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {classPoints.map((row) => (
                      <tr key={row.classId} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 font-extrabold tabular-nums text-text">
                          #{row.rank}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-text">{row.kelas}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                          {row.studentCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-extrabold tabular-nums text-text">
                          {row.averagePoints}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                          {row.semesterPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[18px] border border-border bg-white">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-extrabold text-text">Laporan Periode</h2>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Rekap poin per semester. Poin tidak pernah direset; pilih semester lama untuk
                membuka riwayatnya.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 border-b border-border px-4 py-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-[10px] font-extrabold uppercase tracking-wide text-muted">
                Tahun ajaran
                <select
                  value={selectedYearId}
                  onChange={(e) => {
                    setPeriodYearId(e.target.value);
                    setPeriodSemesterId('');
                    setPeriodRows(null);
                    setPeriodError(null);
                  }}
                  className="mt-1 min-h-[40px] w-full rounded-[10px] border border-border bg-surface px-2.5 text-xs font-bold text-text focus:border-black focus:outline-none"
                >
                  {academicYears.length === 0 && <option value="">Belum ada tahun ajaran</option>}
                  {academicYears.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                      {row.isActive ? ' · aktif' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1 text-[10px] font-extrabold uppercase tracking-wide text-muted">
                Semester
                <select
                  value={selectedSemesterId}
                  onChange={(e) => {
                    setPeriodSemesterId(e.target.value);
                    setPeriodRows(null);
                    setPeriodError(null);
                  }}
                  className="mt-1 min-h-[40px] w-full rounded-[10px] border border-border bg-surface px-2.5 text-xs font-bold text-text focus:border-black focus:outline-none"
                >
                  {yearSemesters.length === 0 && <option value="">Belum ada semester</option>}
                  {yearSemesters.map((row) => (
                    <option key={row.id} value={row.id}>
                      Semester {row.name}
                      {row.isActive ? ' · aktif' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!selectedYearId || !selectedSemesterId || periodLoading}
                onClick={() => void loadPeriodReport(selectedYearId, selectedSemesterId)}
                className="min-h-[40px] flex-none rounded-[10px] bg-black px-4 text-[11px] font-extrabold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {periodLoading ? 'Memuat…' : 'Muat laporan'}
              </button>
            </div>

            {periodError && (
              <p className="mx-4 my-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                {periodError}
              </p>
            )}

            {!periodError && periodRows === null && (
              <div className="flex items-start gap-2.5 px-4 py-5 text-[11px] leading-relaxed text-muted">
                <BarChart3 size={15} className="mt-0.5 flex-none text-text" />
                <p>
                  Pilih tahun ajaran dan semester, lalu muat laporan. Peringkat di atas selalu
                  memakai semester berjalan.
                </p>
              </div>
            )}

            {!periodError && periodRows !== null && periodRows.length === 0 && (
              <EmptyState icon={FileText} text="Tidak ada pelanggaran pada periode ini." />
            )}

            {!periodError && periodRows !== null && periodRows.length > 0 && (
              <>
                <div className="grid gap-2 px-4 py-3 sm:grid-cols-3">
                  <div className="rounded-[12px] border border-border bg-bg/60 px-3 py-2.5">
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wide text-muted">
                      Siswa tercatat
                    </p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums text-text">
                      {periodTotals.students}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-border bg-bg/60 px-3 py-2.5">
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wide text-muted">
                      Total poin
                    </p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums text-alert">
                      {numberFormat.format(periodTotals.points)}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-border bg-bg/60 px-3 py-2.5">
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wide text-muted">
                      Catatan pelanggaran
                    </p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums text-text">
                      {numberFormat.format(periodTotals.violations)}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full min-w-[760px] border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-gray-50/80 text-left text-[10px] uppercase tracking-wide text-muted">
                        <th className="px-4 py-2 font-extrabold">Peringkat</th>
                        <th className="px-3 py-2 font-extrabold">Siswa</th>
                        <th className="px-3 py-2 font-extrabold">Kelas</th>
                        <th className="px-3 py-2 text-right font-extrabold">Pelanggaran</th>
                        <th className="px-3 py-2 text-right font-extrabold">Poin</th>
                        <th className="px-3 py-2 text-right font-extrabold">Poin buku</th>
                        <th className="px-3 py-2 font-extrabold">Terakhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {periodRows.map((row, index) => (
                        <tr key={`${row.studentId}-${row.semesterId}`} className="hover:bg-gray-50/60">
                          <td className="px-4 py-2.5 font-extrabold tabular-nums text-text">
                            #{index + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-bold text-text">{row.nama}</p>
                            <p className="text-[10px] text-muted">NIS {row.nis || '-'}</p>
                          </td>
                          <td className="px-3 py-2.5 text-muted">{row.kelas || '-'}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                            {row.violationCount}
                          </td>
                          <td className="px-3 py-2.5 text-right font-extrabold tabular-nums text-alert">
                            +{row.points}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                            {row.guidebookPoints}
                          </td>
                          <td className="px-3 py-2.5 text-[10.5px] text-muted">
                            {row.lastViolationAt ? formatDate(row.lastViolationAt) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <div className="flex items-start gap-2.5 rounded-[14px] border border-border bg-white px-4 py-3 text-[11px] leading-relaxed text-muted">
            <Eye size={15} className="mt-0.5 flex-none text-text" />
            <p>
              Papan ini hanya untuk BK dan wali kelas. Wali kelas melihat kelasnya sendiri; siswa
              tidak pernah melihat nama atau poin siswa lain.
            </p>
          </div>
        </div>
      )}

      {tab === 'pelanggaran' && (
        <div className="space-y-3">
          <div className="rounded-[18px] border border-border bg-white p-3.5">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleRows(60);
                  }}
                  placeholder="Cari siswa, aturan, atau kelas..."
                  className="min-h-[42px] w-full rounded-[12px] border border-border bg-surface pl-10 pr-3 text-sm text-text focus:border-black focus:outline-none"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setVisibleRows(60);
                }}
                className="min-h-[42px] rounded-[12px] border border-border bg-surface px-3 text-xs font-bold text-text focus:border-black focus:outline-none"
              >
                <option value="">Semua kategori</option>
                {CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setVisibleRows(60);
                }}
                className="min-h-[42px] rounded-[12px] border border-border bg-surface px-3 text-xs font-bold text-text focus:border-black focus:outline-none"
              >
                <option value="">Semua status</option>
                <option value="recorded">Tercatat</option>
                <option value="verified">Terverifikasi</option>
                <option value="void">Dibatalkan</option>
              </select>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: '', label: 'Semua kelas' },
                { key: '7', label: 'Kelas 7' },
                { key: '8', label: 'Kelas 8' },
                { key: '9', label: 'Kelas 9' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setKelasFilter(item.key);
                    setVisibleRows(60);
                  }}
                  className={`bk-chip !min-h-[30px] !px-2.5 !text-[11px] ${kelasFilter === item.key ? 'on' : ''}`}
                >
                  {item.label}
                </button>
              ))}
              <span className="ml-auto flex-none text-[11px] font-bold text-muted">
                {filteredFeed.length} catatan
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-[12px]">
                <thead>
                  <tr className="bg-bg/70 text-left text-[10px] font-extrabold uppercase tracking-wide text-muted">
                    <th className="px-3 py-2.5">Tanggal</th>
                    <th className="px-3 py-2.5">Siswa</th>
                    <th className="px-3 py-2.5">Aturan</th>
                    <th className="px-3 py-2.5 text-center">Kategori</th>
                    <th className="px-3 py-2.5 text-right">Poin</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeed.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-xs text-muted">
                        Tidak ada pelanggaran yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredFeed.slice(0, visibleRows).map((row) => (
                      <tr key={row.id} className="border-t border-border/70 hover:bg-primary-tint/40">
                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-muted">
                          {formatDateTime(row.occurredAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-text">{row.nama}</p>
                          <p className="text-[10.5px] text-muted">Kelas {row.kelas}</p>
                        </td>
                        <td className="max-w-[260px] px-3 py-2.5">
                          <p
                            className={`font-semibold ${row.status === 'void' ? 'text-muted line-through' : 'text-text'}`}
                          >
                            {row.ruleName}
                          </p>
                          <p className="text-[10.5px] text-muted">
                            {row.ruleCode}
                            {row.location ? ` · ${row.location}` : ''}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[row.ruleCategory]}`}
                          >
                            {CATEGORY_LABELS[row.ruleCategory].replace('Pelanggaran ', '')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-extrabold tabular-nums text-alert">
                          +{row.rulePoints}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                              row.status === 'void'
                                ? 'border-neutral-300 bg-neutral-100 text-neutral-600'
                                : row.status === 'verified'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                            }`}
                          >
                            {row.status === 'void'
                              ? 'Dibatalkan'
                              : row.status === 'verified'
                                ? 'Terverifikasi'
                                : 'Tercatat'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {canManage && row.status !== 'void' ? (
                            <button
                              type="button"
                              onClick={() => setVoidTarget(row)}
                              className="rounded-[8px] border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-100"
                            >
                              Batalkan
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredFeed.length > visibleRows && (
              <div className="border-t border-border p-3 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleRows((count) => count + 60)}
                  className="rounded-[10px] border border-border bg-white px-4 py-2 text-xs font-bold text-text hover:bg-bg"
                >
                  Muat 60 catatan lagi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'sp' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-border bg-white px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold text-text">Draft SP</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                SP dibuat otomatis saat ambang tercapai. BK memutuskan kapan diterbitkan.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setManualSpOpen(true)}
                className="flex min-h-[38px] items-center gap-1.5 rounded-[10px] bg-black px-3 text-[11px] font-bold text-white hover:bg-neutral-800"
              >
                <Plus size={13} /> Buat SP Manual
              </button>
            )}
          </div>

          {draftLetters.length === 0 ? (
            <div className="rounded-[18px] border border-border bg-white">
              <EmptyState icon={CheckCircle2} text="Tidak ada draft SP yang menunggu review." />
            </div>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {draftLetters.map((letter) => (
                <div key={letter.id} className="rounded-[18px] border border-amber-300 bg-amber-50/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-text">{letter.nama}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        Kelas {letter.kelas} · dibuat {formatDate(letter.createdAt)}
                      </p>
                    </div>
                    <span className="flex-none rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-800">
                      {SP_TYPE_SHORT[letter.type]}
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-muted">Total poin</p>
                      <p className="font-extrabold tabular-nums text-text">{letter.totalPoints}</p>
                    </div>
                    <div>
                      <p className="text-muted">Ambang jenis</p>
                      <p className="font-extrabold tabular-nums text-text">{letter.thresholdPoints}</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-snug text-amber-900">
                    {SP_TYPE_LABELS[letter.type]}
                    {letter.isOverride ? ' · draft override dari aturan khusus' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreview({ letter, kind: 'sp' })}
                    className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-800 underline-offset-2 hover:underline"
                  >
                    <Eye size={12} /> Pratinjau draft
                  </button>
                  {canManage && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIssueTarget(letter)}
                        className="flex-1 rounded-[9px] bg-black px-3 py-2 text-[11px] font-bold text-white hover:bg-neutral-800"
                      >
                        Terbitkan
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(letter)}
                        className="rounded-[9px] border border-border bg-white px-3 py-2 text-[11px] font-bold text-muted hover:text-red-700"
                      >
                        Batalkan
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-[18px] border border-border bg-white">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-extrabold text-text">Riwayat SP</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Nomor ditetapkan saat terbit; isi surat memakai snapshot saat itu.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[12px]">
                <thead>
                  <tr className="bg-bg/70 text-left text-[10px] font-extrabold uppercase tracking-wide text-muted">
                    <th className="px-3 py-2.5">Nomor</th>
                    <th className="px-3 py-2.5">Siswa</th>
                    <th className="px-3 py-2.5">Jenis</th>
                    <th className="px-3 py-2.5 text-right">Poin</th>
                    <th className="px-3 py-2.5">Pertemuan</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedLetters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-xs text-muted">
                        Belum ada SP yang diterbitkan.
                      </td>
                    </tr>
                  ) : (
                    issuedLetters.map((letter) => (
                      <tr key={letter.id} className="border-t border-border/70">
                        <td className="px-3 py-2.5 font-bold text-text">
                          {letter.number || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-text">{letter.nama}</p>
                          <p className="text-[10.5px] text-muted">Kelas {letter.kelas}</p>
                        </td>
                        <td className="px-3 py-2.5 text-[11px]">{SP_TYPE_LABELS[letter.type]}</td>
                        <td className="px-3 py-2.5 text-right font-extrabold tabular-nums">
                          {letter.totalPoints}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted">
                          {formatDateTime(letter.meetingAt)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${SP_STATUS_STYLES[letter.status]}`}
                          >
                            {SP_STATUS_LABELS[letter.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setPreview({ letter, kind: 'sp' })}
                              className="rounded-md border border-border bg-white p-1.5 text-muted hover:text-text"
                              title="Pratinjau / cetak surat"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreview({ letter, kind: 'berita-acara' })}
                              className="rounded-md border border-border bg-white p-1.5 text-muted hover:text-text"
                              title="Cetak berita acara"
                            >
                              <FileSignature size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="rounded-[12px] border border-border bg-bg/60 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-muted">
            Catatan: SP2 dan SP3 mengikuti sanksi buku panduan (skorsing). Sistem hanya membuat
            draft; keputusan dan tanda tangan tetap milik sekolah.
          </p>
        </div>
      )}

      {tab === 'aturan' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-border bg-white px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold text-text">Master Aturan Poin</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                {rules.length} aturan · poin aplikasi dan poin buku panduan disimpan terpisah.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setRuleModal({ open: true, rule: null })}
                className="flex min-h-[38px] items-center gap-1.5 rounded-[10px] bg-black px-3 text-[11px] font-bold text-white hover:bg-neutral-800"
              >
                <Plus size={13} /> Tambah Aturan
              </button>
            )}
          </div>

          {CATEGORY_ORDER.map((category) => {
            const list = rules.filter((rule) => rule.category === category);
            if (list.length === 0) return null;
            return (
              <section key={category} className="overflow-hidden rounded-[18px] border border-border bg-white">
                <div className="flex items-center gap-2 border-b border-border bg-bg/50 px-4 py-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[category]}`}
                  >
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-[10.5px] font-bold text-muted">{list.length} aturan</span>
                </div>
                <ul className="divide-y divide-border/70">
                  {list.map((rule) => (
                    <li key={rule.id} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="mt-0.5 flex-none rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-neutral-700">
                        {rule.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12.5px] font-bold ${rule.isActive ? 'text-text' : 'text-muted line-through'}`}>
                          {rule.name}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted">
                          Buku: {rule.guidebookPoints} poin
                          {rule.spOverride ? ` · minimal SP${rule.spOverride}` : ''}
                          {rule.isExpulsion ? ' · sidang pleno' : ''}
                        </p>
                        {rule.defaultSanction && (
                          <p className="mt-0.5 text-[10.5px] leading-snug text-gray-600">
                            {rule.defaultSanction}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-none items-center gap-2">
                        <span className="text-sm font-extrabold tabular-nums text-text">
                          {rule.points}
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setRuleModal({ open: true, rule })}
                            className="rounded-md p-1.5 text-muted hover:bg-bg hover:text-text"
                            title="Ubah aturan"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {tab === 'kartu' && (
        <div className="space-y-3">
          <div className="rounded-[16px] border border-border bg-white p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-text">Kartu QR Siswa</h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  {cards.filter((card) => card.status === 'active').length} kartu aktif · PIN 6 digit
                </p>
              </div>
              <span className="rounded-full border border-border bg-bg px-2.5 py-1 text-[10px] font-bold text-muted">
                Token tidak dapat dilihat lagi
              </span>
            </div>
            <div className="relative mt-2.5">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={cardQuery}
                onChange={(e) => {
                  setCardQuery(e.target.value);
                  setCardVisible(40);
                }}
                placeholder="Cari nama, NIS, atau kelas..."
                className="min-h-[42px] w-full rounded-[10px] border border-border bg-surface pl-10 pr-3 text-sm text-text focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-border bg-white">
            {cardStudents.length === 0 ? (
              <EmptyState icon={IdCard} text="Tidak ada siswa yang cocok." />
            ) : (
              <ul className="divide-y divide-border/70">
                {cardStudents.slice(0, cardVisible).map((student) => {
                  const card = activeCardByStudent[student.id] || null;
                  const locked = Boolean(
                    card?.lockedUntil && new Date(card.lockedUntil).getTime() > Date.now()
                  );
                  return (
                    <li key={student.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                      <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-neutral-100 text-neutral-700">
                        <IdCard size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold text-text">{student.nama}</p>
                        <p className="text-[10.5px] text-muted">
                          NIS {student.nis || '-'} · Kelas {student.kelas}
                          {card?.lastUsedAt ? ` · terakhir ${formatDate(card.lastUsedAt)}` : ''}
                        </p>
                      </div>
                      <span
                        className={`flex-none rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          locked
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : card
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-neutral-300 bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {locked ? 'Terkunci' : card ? 'Aktif' : 'Belum ada'}
                      </span>
                      <div className="flex flex-none items-center gap-1.5">
                        {card ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setRevokeCardTarget({ card, student })}
                              className="rounded-[8px] border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-100"
                            >
                              Cabut
                            </button>
                            <button
                              type="button"
                              onClick={() => setCardStudent(student)}
                              className="rounded-[8px] bg-black px-2 py-1 text-[10px] font-bold text-white hover:bg-neutral-800"
                            >
                              Terbitkan Ulang
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCardStudent(student)}
                            className="rounded-[8px] bg-black px-2 py-1 text-[10px] font-bold text-white hover:bg-neutral-800"
                          >
                            Buat Kartu
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {cardStudents.length > cardVisible && (
              <div className="border-t border-border p-3 text-center">
                <button
                  type="button"
                  onClick={() => setCardVisible((count) => count + 40)}
                  className="rounded-[10px] border border-border bg-white px-4 py-2 text-xs font-bold text-text hover:bg-bg"
                >
                  Muat 40 siswa lagi
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-[12px] border border-border bg-bg/60 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-muted">
            <Lock size={13} className="mt-0.5 flex-none" />
            <p>
              Token QR disimpan sebagai hash. Setelah kartu dibuat, token dan PIN hanya tampil sekali
              untuk dicetak. Kartu yang hilang wajib dicabut agar tidak bisa dipakai.
            </p>
          </div>

          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-amber-900">
            Kartu aktif lama otomatis dicabut saat kartu baru diterbitkan. Pastikan kartu lama sudah
            ditarik dari siswa sebelum penerbitan ulang.
          </div>
        </div>
      )}

      <RecordViolationModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        defaultStudent={recordStudent}
        onSaved={(message) => onToast(message)}
      />

      <IssueSpModal
        open={Boolean(issueTarget)}
        onClose={() => setIssueTarget(null)}
        letter={issueTarget}
        onIssue={issueSp}
        onToast={onToast}
      />

      <ManualSpModal
        open={manualSpOpen}
        onClose={() => setManualSpOpen(false)}
        students={students}
        onCreate={createManualSp}
        onToast={onToast}
      />

      <RuleModal
        open={ruleModal.open}
        onClose={() => setRuleModal({ open: false, rule: null })}
        rule={ruleModal.rule}
        onCreate={createRule}
        onUpdate={updateRule}
        onToast={onToast}
      />

      <StudentCardModal
        student={cardStudent}
        onClose={() => setCardStudent(null)}
        onToast={onToast}
      />

      <ReasonModal
        open={Boolean(revokeCardTarget)}
        onClose={() => setRevokeCardTarget(null)}
        title="Cabut Kartu Siswa"
        description={
          revokeCardTarget
            ? `${revokeCardTarget.student.nama} · Kelas ${revokeCardTarget.student.kelas}`
            : undefined
        }
        label="Alasan pencabutan *"
        confirmLabel="Cabut Kartu"
        tone="danger"
        onConfirm={async (reason) => {
          if (!revokeCardTarget) return;
          await revokeStudentCard(revokeCardTarget.card.id, reason);
          onToast('Kartu siswa dicabut. Siswa tidak bisa memakai kartu lama.');
        }}
      />

      <SpDocumentModal
        letter={preview?.letter ?? null}
        kind={preview?.kind}
        onClose={() => setPreview(null)}
      />

      <ReasonModal
        open={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        title="Batalkan Pelanggaran"
        description={
          voidTarget
            ? `${voidTarget.nama} · ${voidTarget.ruleName} · ${formatDateTime(voidTarget.occurredAt)}`
            : undefined
        }
        label="Alasan pembatalan *"
        confirmLabel="Batalkan Pelanggaran"
        tone="danger"
        onConfirm={async (reason) => {
          if (!voidTarget) return;
          await voidViolation(voidTarget.id, reason);
          onToast('Pelanggaran dibatalkan. Koreksi tercatat, riwayat lama tetap tersimpan.');
        }}
      />

      <ReasonModal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Batalkan Draft SP"
        description={
          cancelTarget
            ? `${cancelTarget.nama} · ${SP_TYPE_LABELS[cancelTarget.type]}`
            : undefined
        }
        label="Alasan pembatalan *"
        confirmLabel="Batalkan Draft"
        tone="danger"
        onConfirm={async (reason) => {
          if (!cancelTarget) return;
          await cancelSp(cancelTarget.id, reason);
          onToast('Draft SP dibatalkan.');
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'normal',
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone?: 'normal' | 'alert' | 'success';
}) {
  return (
    <div className="rounded-[18px] border border-border bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{label}</p>
        <span
          className={`grid h-7 w-7 place-items-center rounded-[9px] ${
            tone === 'alert'
              ? 'bg-amber-100 text-amber-700'
              : tone === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-1.5 text-[22px] font-extrabold leading-none tabular-nums text-text">{value}</p>
      <p className="mt-1 truncate text-[10px] text-muted">{hint}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <Icon size={28} className="mx-auto mb-2 text-muted/40" />
      <p className="text-xs font-semibold text-muted">{text}</p>
    </div>
  );
}
