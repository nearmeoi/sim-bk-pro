import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MobileTataTertib from './MobileTataTertib';

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
];

vi.mock('../context/BKContext', () => ({
  useBK: () => ({ students: [] }),
}));

vi.mock('../context/DisciplineContext', () => ({
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
        classId: 'c1',
        kelas: '8B',
        studentCount: 1,
        semesterPoints: 340,
        averagePoints: 340,
        rank: 1,
      },
    ],
    cards: [],
    rules: [],
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
        schoolStudents: 1,
        classStudents: 1,
      },
    ],
    pointsByStudent: { s1: points[0] },
    voidViolation: vi.fn(),
    cancelSp: vi.fn(),
    issueSp: vi.fn(),
    createManualSp: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    revokeStudentCard: vi.fn(),
  }),
}));

describe('MobileTataTertib peringkat', () => {
  it('menampilkan papan peringkat dan kelas tertib', () => {
    render(<MobileTataTertib onBack={() => {}} onToast={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Peringkat' }));

    expect(screen.getByText('Peringkat Pelanggaran')).toBeInTheDocument();
    expect(screen.getAllByText('NURUL AULIA').length).toBeGreaterThan(0);
    expect(screen.getByText('Kelas Paling Tertib')).toBeInTheDocument();
    expect(screen.getByText(/1 dari 1 siswa/)).toBeInTheDocument();
  });
});
