import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuruView from './GuruView';

const ctx = vi.hoisted(() => ({
  role: 'bk' as 'bk' | 'wali_kelas',
}));

const staffMock = vi.hoisted(() => ({
  staff: [
    {
      memberId: 'm-bk',
      schoolId: 'school',
      userId: 'u-bk',
      role: 'bk' as const,
      displayName: 'BU RINA',
      email: 'rina@sekolah.test',
      isActive: true,
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    {
      memberId: 'm-a',
      schoolId: 'school',
      userId: 'u-a',
      role: 'wali_kelas' as const,
      displayName: 'PAK ANDI',
      email: 'andi@sekolah.test',
      isActive: true,
      createdAt: '2026-07-02T00:00:00.000Z',
    },
    {
      memberId: 'm-off',
      schoolId: 'school',
      userId: 'u-off',
      role: 'wali_kelas' as const,
      displayName: 'BU NONAKTIF',
      email: null,
      isActive: false,
      createdAt: '2026-07-03T00:00:00.000Z',
    },
  ],
  classes: [
    {
      id: 'c7a',
      schoolId: 'school',
      academicYearId: 'year-1',
      name: '7A',
      level: 7,
      homeroomMemberId: null,
    },
    {
      id: 'c7b',
      schoolId: 'school',
      academicYearId: 'year-1',
      name: '7B',
      level: 7,
      homeroomMemberId: 'm-a',
    },
  ],
  getStaff: vi.fn(),
  getClasses: vi.fn(),
  assignHomeroom: vi.fn(async () => undefined),
  clearHomeroom: vi.fn(async () => undefined),
  updateMember: vi.fn(async () => undefined),
  setActive: vi.fn(async () => undefined),
  createAccount: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('../../context/BKContext', () => ({
  useBK: () => ({
    students: [
      { id: 's1', nama: 'SISWA A', kelas: '7A' },
      { id: 's2', nama: 'SISWA B', kelas: '7A' },
      { id: 's3', nama: 'SISWA C', kelas: '7B' },
    ],
  }),
}));

vi.mock('../../context/DisciplineContext', () => ({
  useDiscipline: () => ({
    available: true,
    membership: {
      memberId: 'm-bk',
      schoolId: 'school',
      role: ctx.role,
      displayName: 'BU RINA',
    },
    academicYears: [
      {
        id: 'year-1',
        name: '2026/2027',
        startsOn: '2026-07-01',
        endsOn: '2027-06-30',
        isActive: true,
      },
    ],
  }),
}));

vi.mock('../../services/staffService', () => ({
  staffService: staffMock,
}));

describe('GuruView', () => {
  beforeEach(() => {
    ctx.role = 'bk';
    staffMock.getStaff.mockResolvedValue(staffMock.staff);
    staffMock.getClasses.mockResolvedValue(staffMock.classes);
    staffMock.assignHomeroom.mockClear();
    staffMock.getStaff.mockClear();
    staffMock.getClasses.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan akun staf dan menyembunyikan akun nonaktif secara default', async () => {
    render(<GuruView onToast={() => {}} />);

    expect(await screen.findByText('BU RINA')).toBeInTheDocument();
    expect(screen.getByText('PAK ANDI')).toBeInTheDocument();
    expect(screen.queryByText('BU NONAKTIF')).not.toBeInTheDocument();
    expect(screen.getByText('Staf aktif')).toBeInTheDocument();
    expect(screen.getByText('Kelas tanpa wali')).toBeInTheDocument();
  });

  it('BK menugaskan wali kelas lewat RPC penugasan', async () => {
    render(<GuruView onToast={() => {}} />);
    await screen.findByText('BU RINA');

    fireEvent.click(screen.getByRole('button', { name: 'Penugasan Wali Kelas' }));

    const row = (await screen.findByText('7A')).closest('tr');
    expect(row).not.toBeNull();
    const select = within(row as HTMLElement).getByRole('combobox');
    fireEvent.change(select, { target: { value: 'm-a' } });

    await waitFor(() =>
      expect(staffMock.assignHomeroom).toHaveBeenCalledWith('c7a', 'm-a'),
    );
  });

  it('wali kelas tidak dapat membuka manajemen guru', async () => {
    ctx.role = 'wali_kelas';
    render(<GuruView onToast={() => {}} />);

    expect(
      await screen.findByText(/Hanya guru BK yang dapat membuka manajemen guru/i),
    ).toBeInTheDocument();
    expect(staffMock.getStaff).not.toHaveBeenCalled();
  });
});
