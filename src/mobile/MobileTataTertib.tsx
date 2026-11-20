import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileSignature,
  FileText,
  Plus,
  ScanLine,
  Search,
  ShieldAlert,
  Trophy,
} from 'lucide-react';
import { useBK } from '../context/BKContext';
import { useDiscipline } from '../context/DisciplineContext';
import { DetailBar, PageHeader, SectionTitle, EmptyState } from './ui';
import MobileViolationSheet from './MobileViolationSheet';
import MobileCardScanSheet from './MobileCardScanSheet';
import { resolveScannedStudent } from '../lib/cardScan';
import SpDocumentModal from '../components/discipline/SpDocumentModal';
import StudentPicker from '../components/ui/StudentPicker';
import DatePicker from '../components/ui/DatePicker';
import TimePicker from '../components/ui/TimePicker';
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
} from '../lib/discipline';
import type { PeriodStudentPoints, SpLetter, SpType, Student } from '../types';

interface MobileTataTertibProps {
  onBack: () => void;
  onToast: (message: string) => void;
}

type Tab = 'pelanggaran' | 'peringkat' | 'sp' | 'aturan';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pelanggaran', label: 'Pelanggaran' },
  { id: 'peringkat', label: 'Peringkat' },
  { id: 'sp', label: 'SP' },
  { id: 'aturan', label: 'Aturan' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function suggestedNumber(letter: SpLetter): string {
  const tier = letter.type === 'pleno' ? 'PLENO' : letter.type.toUpperCase();
  const seq = String(letter.sequence || 1).padStart(3, '0');
  return `${tier}/${seq}/BK/${new Date().getFullYear()}`;
}

export default function MobileTataTertib({ onBack, onToast }: MobileTataTertibProps) {
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
    rules,
    pointScale,
    leaderboard,
    academicYears,
    semesters,
    pointsByStudent,
    getPeriodPoints,
    issueSp,
    cancelSp,
    createManualSp,
  } = useDiscipline();

  const [tab, setTab] = useState<Tab>('pelanggaran');
  const [search, setSearch] = useState('');
  const [kelas, setKelas] = useState('');
  const [visible, setVisible] = useState(40);
  const [rankVisible, setRankVisible] = useState(20);
  const [periodYearId, setPeriodYearId] = useState('');
  const [periodSemesterId, setPeriodSemesterId] = useState('');
  const [periodRows, setPeriodRows] = useState<PeriodStudentPoints[] | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [periodVisible, setPeriodVisible] = useState(20);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordStudent, setRecordStudent] = useState<Student | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<SpLetter | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SpLetter | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [preview, setPreview] = useState<{
    letter: SpLetter;
    kind: 'sp' | 'berita-acara';
  } | null>(null);

  const canManage = membership?.role === 'bk';

  const attention = useMemo(
    () =>
      points
        .filter((row) => row.status !== 'aman')
        .sort((a, b) => b.totalPoints - a.totalPoints),
    [points],
  );

  const draftLetters = useMemo(
    () => spLetters.filter((row) => row.status === 'draft'),
    [spLetters],
  );

  const isBk = membership?.role === 'bk';
  const rankRows = useMemo(
    () =>
      leaderboard
        .slice()
        .sort((a, b) => b.points - a.points || a.nama.localeCompare(b.nama, 'id')),
    [leaderboard],
  );
  const visibleRankRows = rankRows.slice(0, rankVisible);
  const rankOf = (row: (typeof rankRows)[number]) => (isBk ? row.schoolRank : row.classRank);
  const rankTotalOf = (row: (typeof rankRows)[number]) =>
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

  const issuedLetters = useMemo(
    () => spLetters.filter((row) => row.status !== 'draft'),
    [spLetters],
  );

  const totalSemester = useMemo(
    () => points.reduce((sum, row) => sum + row.semesterPoints, 0),
    [points],
  );

  const bestClass = classPoints[0] || null;

  const filteredFeed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feed.filter((row) => {
      if (kelas && !row.kelas.toUpperCase().replace(/[^0-9A-Z]/g, '').startsWith(kelas)) {
        return false;
      }
      if (!q) return true;
      return (
        row.nama.toLowerCase().includes(q) ||
        row.ruleName.toLowerCase().includes(q) ||
        row.kelas.toLowerCase().includes(q)
      );
    });
  }, [feed, search, kelas]);

  return (
    <div className="space-y-4">
      <DetailBar onBack={onBack} label="Beranda" />

      <PageHeader
        title="Tata Tertib"
        subtitle="Poin permanen, laporan per semester, dan SP"
        right={
          available || canManage ? (
            <div className="flex items-center gap-2">
              {available && (
                <button
                  type="button"
                  onClick={() => setScanOpen(true)}
                  aria-label="Scan kartu siswa"
                  title="Scan kartu siswa"
                  className="grid h-[42px] w-[42px] place-items-center rounded-[12px] border border-border bg-white text-text shadow-sm active:scale-[0.98]"
                >
                  <ScanLine size={18} />
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setRecordStudent(null);
                    setRecordOpen(true);
                  }}
                  className="flex min-h-[42px] items-center gap-1.5 rounded-[12px] bg-accent px-3 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
                >
                  <Plus size={15} /> Catat
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-red-300 bg-red-50 p-3.5 text-xs text-red-800">
          <AlertTriangle size={16} className="mt-0.5 flex-none" />
          <div>
            <p className="font-extrabold">Gagal memuat tata tertib.</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[16px] border border-black/10 bg-black p-3.5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Siswa</p>
          <p className="mt-1 text-[22px] font-extrabold leading-none tabular-nums">{points.length}</p>
          <p className="mt-1 text-[10px] text-white/60">{attention.length} perlu perhatian</p>
        </div>
        <div className="bk-card !p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Poin Semester</p>
          <p className="mt-1 text-[22px] font-extrabold leading-none tabular-nums">
            {totalSemester}
          </p>
          <p className="mt-1 text-[10px] text-muted">akumulasi seluruh siswa</p>
        </div>
        <div className="bk-card !p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Draft SP</p>
          <p className="mt-1 text-[22px] font-extrabold leading-none tabular-nums text-amber-700">
            {draftLetters.length}
          </p>
          <p className="mt-1 text-[10px] text-muted">menunggu review BK</p>
        </div>
        <div className="bk-card !p-3.5">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <Trophy size={11} /> Kelas Tertib
          </p>
          <p className="mt-1 truncate text-[19px] font-extrabold leading-none">
            {bestClass?.kelas || '—'}
          </p>
          <p className="mt-1 text-[10px] text-muted">
            {bestClass ? `rata-rata ${bestClass.averagePoints} poin` : 'belum ada data'}
          </p>
        </div>
      </div>

      {attention.length > 0 && (
        <section className="bk-card !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <SectionTitle>Perlu Perhatian</SectionTitle>
            <span className="text-[10px] font-bold text-muted">{attention.length} siswa</span>
          </div>
          <ul className="divide-y divide-border/70">
            {attention.slice(0, 4).map((row) => (
              <li key={row.studentId} className="flex items-center gap-2.5 px-4 py-2.5">
                <div className="grid h-7 w-7 flex-none place-items-center rounded-full bg-neutral-900 text-[9px] font-extrabold text-white">
                  {row.nama
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-text">{row.nama}</p>
                  <p className="text-[10px] text-muted">
                    Kelas {row.kelas} · sisa {row.balance} dari {row.pointScale ?? pointScale}
                  </p>
                </div>
                <span
                  className={`flex-none rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${POINT_STATUS_STYLES[row.status]}`}
                >
                  {POINT_STATUS_LABELS[row.status]}
                </span>
                <span className="flex-none text-[11px] font-extrabold tabular-nums text-alert">
                  +{row.totalPoints}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((item) => (
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
        ))}
      </div>

      {tab === 'pelanggaran' && (
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisible(40);
              }}
              placeholder="Cari siswa, aturan, atau kelas..."
              className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface pl-10 pr-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { key: '', label: 'Semua' },
              { key: '7', label: 'Kelas 7' },
              { key: '8', label: 'Kelas 8' },
              { key: '9', label: 'Kelas 9' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setKelas(item.key);
                  setVisible(40);
                }}
                className={`bk-chip !min-h-[30px] !px-2.5 !text-[11px] ${kelas === item.key ? 'on' : ''}`}
              >
                {item.label}
              </button>
            ))}
            <span className="ml-auto flex-none text-[10.5px] font-bold text-muted">
              {filteredFeed.length} catatan
            </span>
          </div>

          {loading && feed.length === 0 ? (
            <div className="bk-card text-center">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-border border-t-black" />
              <p className="text-xs font-semibold text-muted">Memuat catatan...</p>
            </div>
          ) : filteredFeed.length === 0 ? (
            <EmptyState icon={<ShieldAlert size={22} />}>
              Belum ada pelanggaran yang cocok.
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {filteredFeed.slice(0, visible).map((row) => (
                <div key={row.id} className="bk-card !p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 inline-flex flex-none rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[row.ruleCategory]}`}
                    >
                      {row.ruleCode}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-bold leading-snug ${
                          row.status === 'void' ? 'text-muted line-through' : 'text-text'
                        }`}
                      >
                        {row.ruleName}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        {row.nama} · Kelas {row.kelas}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {formatDateTime(row.occurredAt)}
                        {row.location ? ` · ${row.location}` : ''}
                        {row.status === 'void' ? ' · dibatalkan' : ''}
                      </p>
                    </div>
                    <div className="flex flex-none flex-col items-end">
                      <span className="text-[13px] font-extrabold tabular-nums text-alert">
                        +{row.rulePoints}
                      </span>
                      <span className="mt-0.5 text-[9px] text-muted">{row.ruleGuidebookPoints} buku</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredFeed.length > visible && (
                <button
                  type="button"
                  onClick={() => setVisible((count) => count + 40)}
                  className="bk-btn ghost min-h-[44px] w-full"
                >
                  Muat 40 catatan lagi
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'peringkat' && (
        <div className="space-y-3">
          <section className="bk-card overflow-hidden !p-0">
            <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <SectionTitle>Peringkat Pelanggaran</SectionTitle>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                  Poin semester berjalan. Hanya staf yang dapat melihat.
                </p>
              </div>
              <span className="flex-none rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[9.5px] font-extrabold text-amber-800">
                {isBk ? 'Sekolah' : 'Kelas saya'}
              </span>
            </div>

            {rankRows.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={<CheckCircle2 size={22} />}>
                  Belum ada poin pelanggaran semester ini.
                </EmptyState>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border/70">
                  {visibleRankRows.map((row) => {
                    const rank = rankOf(row);
                    const summary = pointsByStudent[row.studentId];
                    const rankTone =
                      rank === 1
                        ? 'bg-amber-400 text-amber-950'
                        : rank === 2
                          ? 'bg-neutral-300 text-neutral-800'
                          : rank === 3
                            ? 'bg-orange-300 text-orange-950'
                            : 'bg-neutral-100 text-neutral-600';
                    return (
                      <li key={row.studentId} className="flex items-center gap-2.5 px-4 py-2.5">
                        <span
                          className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[10px] font-extrabold tabular-nums ${rankTone}`}
                        >
                          {rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold text-text">{row.nama}</p>
                          <p className="text-[10px] text-muted">
                            Kelas {row.kelas} · {rank} dari {rankTotalOf(row)} siswa
                          </p>
                        </div>
                        <div className="flex flex-none flex-col items-end gap-0.5">
                          <span className="text-[12px] font-extrabold tabular-nums text-alert">
                            +{row.points}
                          </span>
                          {summary && (
                            <span
                              className={`rounded-full border px-1 py-0.5 text-[8.5px] font-extrabold uppercase ${POINT_STATUS_STYLES[summary.status]}`}
                            >
                              {POINT_STATUS_LABELS[summary.status]}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {rankRows.length > 20 && (
                  <button
                    type="button"
                    onClick={() =>
                      setRankVisible(rankVisible >= rankRows.length ? 20 : rankRows.length)
                    }
                    className="min-h-[42px] w-full border-t border-border text-[11px] font-bold text-text"
                  >
                    {rankVisible >= rankRows.length
                      ? 'Tampilkan lebih sedikit'
                      : `Muat semua (${rankRows.length} siswa)`}
                  </button>
                )}
              </>
            )}
          </section>

          <section className="bk-card overflow-hidden !p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <SectionTitle>Kelas Paling Tertib</SectionTitle>
                <p className="mt-0.5 text-[10.5px] text-muted">Rata-rata terendah di atas</p>
              </div>
              <Trophy size={16} className="flex-none text-amber-600" />
            </div>
            {classPoints.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={<Trophy size={22} />}>Belum ada data kelas.</EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {classPoints.slice(0, 10).map((row) => (
                  <li key={row.classId} className="flex items-center gap-2.5 px-4 py-2.5">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-neutral-100 text-[10px] font-extrabold tabular-nums text-neutral-600">
                      {row.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold text-text">{row.kelas}</p>
                      <p className="text-[10px] text-muted">{row.studentCount} siswa</p>
                    </div>
                    <div className="flex-none text-right">
                      <p className="text-[12px] font-extrabold tabular-nums text-text">
                        {row.averagePoints}
                      </p>
                      <p className="text-[9px] text-muted">rata-rata</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bk-card overflow-hidden !p-0">
            <div className="border-b border-border px-4 py-3">
              <SectionTitle>Laporan Periode</SectionTitle>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                Poin tidak pernah direset. Pilih semester lama untuk melihat riwayatnya.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3">
              <label className="block text-[9px] font-extrabold uppercase tracking-wide text-muted">
                Tahun ajaran
                <select
                  value={selectedYearId}
                  onChange={(e) => {
                    setPeriodYearId(e.target.value);
                    setPeriodSemesterId('');
                    setPeriodRows(null);
                    setPeriodError(null);
                  }}
                  className="mt-1 min-h-[38px] w-full rounded-[9px] border border-border bg-surface px-1.5 text-[11px] font-bold text-text focus:border-black focus:outline-none"
                >
                  {academicYears.length === 0 && <option value="">Belum ada</option>}
                  {academicYears.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                      {row.isActive ? ' · aktif' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[9px] font-extrabold uppercase tracking-wide text-muted">
                Semester
                <select
                  value={selectedSemesterId}
                  onChange={(e) => {
                    setPeriodSemesterId(e.target.value);
                    setPeriodRows(null);
                    setPeriodError(null);
                  }}
                  className="mt-1 min-h-[38px] w-full rounded-[9px] border border-border bg-surface px-1.5 text-[11px] font-bold text-text focus:border-black focus:outline-none"
                >
                  {yearSemesters.length === 0 && <option value="">Belum ada</option>}
                  {yearSemesters.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                      {row.isActive ? ' · aktif' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!selectedYearId || !selectedSemesterId || periodLoading}
                onClick={() => void loadPeriodReport(selectedYearId, selectedSemesterId)}
                className="col-span-2 min-h-[42px] rounded-[10px] bg-black text-[11px] font-extrabold text-white disabled:opacity-40"
              >
                {periodLoading ? 'Memuat…' : 'Muat laporan'}
              </button>
            </div>

            {periodError && (
              <p className="mx-4 my-3 rounded-[9px] border border-red-200 bg-red-50 px-3 py-2 text-[10.5px] font-semibold text-red-700">
                {periodError}
              </p>
            )}

            {!periodError && periodRows === null && (
              <p className="px-4 py-4 text-[10.5px] leading-relaxed text-muted">
                Peringkat di atas selalu memakai semester berjalan. Laporan ini untuk semester lama.
              </p>
            )}

            {!periodError && periodRows !== null && periodRows.length === 0 && (
              <div className="p-4">
                <EmptyState icon={<FileText size={22} />}>
                  Tidak ada pelanggaran pada periode ini.
                </EmptyState>
              </div>
            )}

            {!periodError && periodRows !== null && periodRows.length > 0 && (
              <>
                <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                  <div className="px-2 py-2.5 text-center">
                    <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-muted">
                      Siswa
                    </p>
                    <p className="mt-0.5 text-[13px] font-extrabold tabular-nums text-text">
                      {periodTotals.students}
                    </p>
                  </div>
                  <div className="px-2 py-2.5 text-center">
                    <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-muted">
                      Poin
                    </p>
                    <p className="mt-0.5 text-[13px] font-extrabold tabular-nums text-alert">
                      {periodTotals.points}
                    </p>
                  </div>
                  <div className="px-2 py-2.5 text-center">
                    <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-muted">
                      Catatan
                    </p>
                    <p className="mt-0.5 text-[13px] font-extrabold tabular-nums text-text">
                      {periodTotals.violations}
                    </p>
                  </div>
                </div>

                <ul className="divide-y divide-border/70">
                  {periodRows.slice(0, periodVisible).map((row, index) => (
                    <li key={`${row.studentId}-${row.semesterId}`} className="flex items-center gap-2.5 px-4 py-2.5">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-neutral-100 text-[10px] font-extrabold tabular-nums text-neutral-600">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold text-text">{row.nama}</p>
                        <p className="text-[10px] text-muted">
                          Kelas {row.kelas || '-'} · {row.violationCount} catatan
                        </p>
                      </div>
                      <div className="flex-none text-right">
                        <p className="text-[12px] font-extrabold tabular-nums text-alert">
                          +{row.points}
                        </p>
                        <p className="text-[9px] text-muted">
                          {row.lastViolationAt ? formatDate(row.lastViolationAt) : '-'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {periodRows.length > 20 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPeriodVisible(
                        periodVisible >= periodRows.length ? 20 : periodRows.length,
                      )
                    }
                    className="min-h-[42px] w-full border-t border-border text-[11px] font-bold text-text"
                  >
                    {periodVisible >= periodRows.length
                      ? 'Tampilkan lebih sedikit'
                      : `Muat semua (${periodRows.length} siswa)`}
                  </button>
                )}
              </>
            )}
          </section>

          <div className="flex items-start gap-2 rounded-[12px] border border-border bg-white/70 px-3.5 py-3 text-[10px] leading-relaxed text-muted">
            <Eye size={14} className="mt-0.5 flex-none text-text" />
            <p>
              Papan ini hanya untuk BK dan wali kelas. Wali kelas melihat kelasnya sendiri; siswa
              tidak melihat nama atau poin siswa lain.
            </p>
          </div>
        </div>
      )}

      {tab === 'sp' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <SectionTitle>Draft SP</SectionTitle>
              <p className="mt-0.5 text-[11px] text-muted">Tidak pernah terkirim otomatis</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setManualOpen(true)}
                className="bk-btn ghost min-h-[38px] !text-[11px]"
              >
                <Plus size={13} /> SP Manual
              </button>
            )}
          </div>

          {draftLetters.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22} />}>
              Tidak ada draft SP yang menunggu review.
            </EmptyState>
          ) : (
            <div className="space-y-2.5">
              {draftLetters.map((letter) => (
                <div key={letter.id} className="rounded-[16px] border border-amber-300 bg-amber-50/70 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-extrabold text-text">{letter.nama}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        Kelas {letter.kelas} · dibuat {formatDate(letter.createdAt)}
                      </p>
                    </div>
                    <span className="flex-none rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-800">
                      {SP_TYPE_SHORT[letter.type]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-amber-900">
                    {SP_TYPE_LABELS[letter.type]} · {letter.totalPoints} poin (ambang{' '}
                    {letter.thresholdPoints})
                    {letter.isOverride ? ' · override aturan' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreview({ letter, kind: 'sp' })}
                    className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-800 underline-offset-2 active:underline"
                  >
                    <Eye size={12} /> Pratinjau draft
                  </button>
                  {canManage && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIssueTarget(letter)}
                        className="flex-1 rounded-[10px] bg-black px-3 py-2 text-[11px] font-bold text-white active:scale-[0.98]"
                      >
                        Terbitkan
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(letter)}
                        className="rounded-[10px] border border-border bg-white px-3 py-2 text-[11px] font-bold text-muted active:scale-[0.98]"
                      >
                        Batalkan
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bk-card !p-0 overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <SectionTitle>Riwayat SP</SectionTitle>
            </div>
            {issuedLetters.length === 0 ? (
              <EmptyState icon={<FileText size={22} />}>Belum ada SP diterbitkan.</EmptyState>
            ) : (
              <ul className="divide-y divide-border/70">
                {issuedLetters.slice(0, 30).map((letter) => (
                  <li key={letter.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[12.5px] font-bold text-text">
                        {letter.nama} · {SP_TYPE_SHORT[letter.type]}
                      </p>
                      <span
                        className={`flex-none rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${SP_STATUS_STYLES[letter.status]}`}
                      >
                        {SP_STATUS_LABELS[letter.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-muted">
                      {letter.number || 'Nomor belum ditetapkan'} · {letter.totalPoints} poin
                    </p>
                    {letter.meetingAt && (
                      <p className="mt-0.5 text-[10.5px] font-semibold text-text">
                        Pertemuan {formatDateTime(letter.meetingAt)}
                      </p>
                    )}
                    <div className="mt-1.5 flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreview({ letter, kind: 'sp' })}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[10px] font-bold text-muted active:text-text"
                      >
                        <Eye size={11} /> Surat
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreview({ letter, kind: 'berita-acara' })}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[10px] font-bold text-muted active:text-text"
                      >
                        <FileSignature size={11} /> Berita Acara
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="rounded-[12px] border border-border bg-bg/60 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-muted">
            SP2 dan SP3 mengikuti sanksi buku panduan. Sistem hanya membuat draft; keputusan dan
            tanda tangan tetap milik sekolah.
          </p>
        </div>
      )}

      {tab === 'aturan' && (
        <div className="space-y-3">
          <div>
            <SectionTitle>Master Aturan Poin</SectionTitle>
            <p className="mt-0.5 text-[11px] text-muted">
              {rules.length} aturan · poin aplikasi dan buku panduan terpisah
            </p>
          </div>

          {CATEGORY_ORDER.map((category) => {
            const list = rules.filter((rule) => rule.category === category);
            if (list.length === 0) return null;
            return (
              <section key={category} className="bk-card !p-0 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-bg/50 px-4 py-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${CATEGORY_STYLES[category]}`}
                  >
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-[10px] font-bold text-muted">{list.length} aturan</span>
                </div>
                <ul className="divide-y divide-border/70">
                  {list.map((rule) => (
                    <li key={rule.id} className="flex items-start gap-2.5 px-4 py-2.5">
                      <span className="mt-0.5 flex-none rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-neutral-700">
                        {rule.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[12px] font-bold leading-snug ${
                            rule.isActive ? 'text-text' : 'text-muted line-through'
                          }`}
                        >
                          {rule.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          Buku: {rule.guidebookPoints} poin
                          {rule.spOverride ? ` · SP${rule.spOverride}` : ''}
                          {rule.isExpulsion ? ' · pleno' : ''}
                        </p>
                      </div>
                      <span className="flex-none text-[13px] font-extrabold tabular-nums text-text">
                        {rule.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <p className="text-[10.5px] leading-relaxed text-muted">
            Ubah poin atau menambah aturan dilakukan dari versi PC agar perubahan master data
            tercatat rapi.
          </p>
        </div>
      )}

      {scanOpen && (
        <MobileCardScanSheet
          open={scanOpen}
          canRecord={canManage}
          onClose={() => setScanOpen(false)}
          onRecord={(result) => {
            setScanOpen(false);
            setRecordStudent(resolveScannedStudent(result, students));
            setRecordOpen(true);
          }}
        />
      )}

      {recordOpen && (
        <MobileViolationSheet
          student={recordStudent}
          onClose={() => {
            setRecordOpen(false);
            setRecordStudent(null);
          }}
          onSaved={(message) => onToast(message)}
        />
      )}

      {issueTarget && (
        <MobileIssueSheet
          letter={issueTarget}
          onClose={() => setIssueTarget(null)}
          onIssue={issueSp}
          onSaved={(message) => onToast(message)}
        />
      )}

      {cancelTarget && (
        <MobileReasonSheet
          title={`Batalkan ${SP_TYPE_SHORT[cancelTarget.type]}`}
          subtitle={`${cancelTarget.nama} · Kelas ${cancelTarget.kelas}`}
          label="Alasan pembatalan"
          confirmLabel="Batalkan Draft"
          onClose={() => setCancelTarget(null)}
          onConfirm={async (reason) => {
            await cancelSp(cancelTarget.id, reason);
            onToast('Draft SP dibatalkan.');
          }}
        />
      )}

      {manualOpen && (
        <MobileManualSpSheet
          onClose={() => setManualOpen(false)}
          students={students}
          onCreate={createManualSp}
          onSaved={(message) => onToast(message)}
        />
      )}

      <SpDocumentModal
        letter={preview?.letter ?? null}
        kind={preview?.kind}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}

function MobileIssueSheet({
  letter,
  onClose,
  onIssue,
  onSaved,
}: {
  letter: SpLetter;
  onClose: () => void;
  onIssue: (id: string, number: string, meetingAt: string | null) => Promise<void>;
  onSaved: (message: string) => void;
}) {
  const [number, setNumber] = useState(suggestedNumber(letter));
  const [tanggal, setTanggal] = useState(todayISO);
  const [waktu, setWaktu] = useState(nowTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNumber(suggestedNumber(letter));
    setTanggal(todayISO());
    setWaktu(nowTime());
    setSaving(false);
    setError('');
  }, [letter]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!number.trim()) {
      setError('Nomor surat wajib diisi.');
      return;
    }
    const meeting = new Date(`${tanggal}T${waktu}:00`);
    if (Number.isNaN(meeting.getTime())) {
      setError('Tanggal pertemuan tidak valid.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onIssue(letter.id, number.trim(), meeting.toISOString());
      onSaved(`${SP_TYPE_SHORT[letter.type]} ${letter.nama} berhasil diterbitkan.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menerbitkan SP.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileFormSheet
      title="Terbitkan SP"
      subtitle={`${letter.nama} · ${SP_TYPE_LABELS[letter.type]}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-[14px] border border-border bg-bg/60 p-3 text-[11px] text-muted">
          <p className="font-bold text-text">
            {letter.totalPoints} poin · ambang {letter.thresholdPoints}
          </p>
          <p className="mt-1">Dibuat {formatDateTime(letter.createdAt)}</p>
          {letter.isOverride && (
            <p className="mt-1 font-semibold text-amber-700">
              Draft override: boleh terbit di bawah ambang jenis SP.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Nomor Surat *</label>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm font-semibold text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            required
          />
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

        {error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-accent text-sm font-bold text-white shadow-[0_6px_16px_rgb(var(--accent-rgb)/0.3)] active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Menerbitkan...' : 'Terbitkan SP'}
        </button>
      </form>
    </MobileFormSheet>
  );
}

function MobileManualSpSheet({
  onClose,
  students,
  onCreate,
  onSaved,
}: {
  onClose: () => void;
  students: Student[];
  onCreate: (studentId: string, type: SpType, reason: string) => Promise<string>;
  onSaved: (message: string) => void;
}) {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState<SpType>('sp1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
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
      onSaved(`Draft ${type.toUpperCase()} untuk ${studentName} berhasil dibuat.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat SP manual.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileFormSheet
      title="Buat SP Manual"
      subtitle="Untuk kebutuhan di luar hitungan otomatis"
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
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
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">Jenis SP *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SpType)}
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-3.5 text-sm font-semibold text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
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
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Pertimbangan BK / hasil rapat wali kelas..."
            className="w-full rounded-[12px] border border-border bg-surface p-3 text-sm leading-relaxed text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            required
          />
        </div>

        {error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-accent text-sm font-bold text-white shadow-[0_6px_16px_rgb(var(--accent-rgb)/0.3)] active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Membuat...' : 'Buat Draft SP'}
        </button>
      </form>
    </MobileFormSheet>
  );
}

function MobileReasonSheet({
  title,
  subtitle,
  label,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  subtitle: string;
  label: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Alasan wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileFormSheet title={title} subtitle={subtitle} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-text">{label} *</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-[12px] border border-border bg-surface p-3 text-sm leading-relaxed text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            required
          />
        </div>
        {error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-red-700 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : confirmLabel}
        </button>
      </form>
    </MobileFormSheet>
  );
}

function MobileFormSheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[18px] font-extrabold leading-tight text-text">{title}</h3>
            <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
