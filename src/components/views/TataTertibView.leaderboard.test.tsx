import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TataTertibView from './TataTertibView';

const periodMock = vi.hoisted(() => {
  const rows = [
    {
      schoolId: 'school',
      studentId: 's9',
      nama: 'RIZKY LAMA',
      nis: '2110009',
      nisn: '0099999999',
      kelas: '9A',
      classId: 'c9',
      academicYearId: 'year-1',
      semesterId: 'sem-1',
      points: 120,
      guidebookPoints: 12,
      violationCount: 3,
      lastViolationAt: '2026-09-10T02:00:00.000Z',
    },
  ];
  return { rows, getPeriodPoints: vi.fn(async () => rows) };
});

const points = [
  {
    schoolId: 'school',
    studentId: 's1',
    nama: 'NURUL AULIA',
    nis: '2210045',
    nisn: '0091234567',
    jk: 'P',
    kelas: '8B',
    classId: 'c1',
    studentStatus: 'Aktif',
    pointScale: 1000,
    totalPoints: 340,
    totalGuidebookPoints: 34,
    semesterPoints: 340,
    yearPoints: 340,
    balance: 660,
    status: 'sp1',
    lastViolationAt: '2026-11-18T02:00:00.000Z',
  },
  {
    schoolId: 'school',
    studentId: 's2',
    nama: 'ADI SAPUTRA',
    nis: '2210046',
    nisn: '0091234568',
    jk: 'L',
    kelas: '7A',
    classId: 'c2',
    studentStatus: 'Aktif',
    pointScale: 1000,
    totalPoints: 200,
    totalGuidebookPoints: 20,
    semesterPoints: 200,
    yearPoints: 200,
    balance: 800,
    status: 'aman',
    lastViolationAt: '2026-11-10T02:00:00.000Z',
  },
];

vi.mock('../../context/BKContext', () => ({
  useBK: () => ({
    students: points.map((row) => ({
      id: row.studentId,
      nama: row.nama,
      nis: row.nis,
      nisn: row.nisn,
      jk: row.jk,
      kelas: row.kelas,
      status: 'Aktif',
    })),
  }),
}));

vi.mock('../../context/DisciplineContext', () => ({
  useDiscipline: () => ({
    available: true,
    loading: false,
    error: null,
    membership: { memberId: 'm1', schoolId: 'school', role: 'bk', displayName: 'BK' },
    pointScale: 1000,
    spThresholds: [260, 510, 760, 1000],
    points,
    feed: [],
    spLetters: [],
    classPoints: [
      {
        schoolId: 'school',
        classId: 'c2',
        kelas: '7A',
        studentCount: 1,
        semesterPoints: 200,
        averagePoints: 200,
        rank: 1,
      },
      {
        schoolId: 'school',
        classId: 'c1',
        kelas: '8B',
        studentCount: 1,
        semesterPoints: 340,
        averagePoints: 340,
        rank: 2,
      },
    ],
    cards: [],
    rules: [],
    academicYears: [
      {
        id: 'year-1',
        name: '2026/2027',
        startsOn: '2026-07-01',
        endsOn: '2027-06-30',
        isActive: true,
      },
    ],
    semesters: [
      {
        id: 'sem-1',
        academicYearId: 'year-1',
        name: 'Ganjil',
        startsOn: '2026-07-01',
        endsOn: '2026-12-31',
        isActive: true,
      },
    ],
    getPeriodPoints: periodMock.getPeriodPoints,
    leaderboard: [
      {
        schoolId: 'school',
        studentId: 's1',
        nama: 'NURUL AULIA',
        nis: '2210045',
        kelas: '8B',
        classId: 'c1',
        points: 340,
        schoolRank: 1,
        classRank: 1,
        schoolStudents: 2,
        classStudents: 1,
      },
      {
        schoolId: 'school',
        studentId: 's2',
        nama: 'ADI SAPUTRA',
        nis: '2210046',
        kelas: '7A',
        classId: 'c2',
        points: 200,
        schoolRank: 2,
        classRank: 1,
        schoolStudents: 2,
        classStudents: 1,
      },
    ],
    pointsByStudent: { s1: points[0], s2: points[1] },
    voidViolation: vi.fn(),
    cancelSp: vi.fn(),
    issueSp: vi.fn(),
    createManualSp: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    revokeStudentCard: vi.fn(),
  }),
}));

describe('TataTertibView peringkat', () => {
  it('menampilkan peringkat siswa dan kelas hanya untuk staf', () => {
    render(<TataTertibView onToast={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Peringkat' }));

    expect(screen.getByText('Peringkat Pelanggaran')).toBeInTheDocument();
    expect(screen.getAllByText('NURUL AULIA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ADI SAPUTRA').length).toBeGreaterThan(0);
    expect(screen.getByText('Kelas Paling Tertib')).toBeInTheDocument();
    expect(screen.getByText('Juara: 7A')).toBeInTheDocument();
    expect(screen.getByText('Laporan Periode')).toBeInTheDocument();
    expect(
      screen.getByText(/Wali kelas melihat kelasnya sendiri/i),
    ).toBeInTheDocument();
  });

  it('memuat laporan periode yang dipilih', async () => {
    render(<TataTertibView onToast={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Peringkat' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Muat laporan' }));

    expect(await screen.findByText('RIZKY LAMA')).toBeInTheDocument();
    expect(periodMock.getPeriodPoints).toHaveBeenCalledWith('year-1', 'sem-1');
    expect(screen.getByText('Siswa tercatat')).toBeInTheDocument();
  });
});
