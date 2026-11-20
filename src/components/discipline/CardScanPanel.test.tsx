import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CardScanPanel from './CardScanPanel';

const staffMock = vi.hoisted(() => ({
  resolveCard: vi.fn(),
}));

vi.mock('../../services/staffService', () => ({
  staffService: staffMock,
}));

const result = {
  cardId: 'card-1',
  studentId: 'S001',
  schoolId: 'school',
  nama: 'SISWA SATU',
  nis: '2210001',
  nisn: '0090000001',
  jk: 'P' as const,
  kelas: '7A',
  classId: 'class-1',
  studentStatus: 'Aktif',
  pointScale: 1000,
  totalPoints: 260,
  totalGuidebookPoints: 26,
  semesterPoints: 260,
  yearPoints: 260,
  balance: 740,
  status: 'sp1' as const,
  lastViolationAt: null,
};

describe('CardScanPanel', () => {
  it('membaca token manual dan menampilkan ringkasan siswa', async () => {
    staffMock.resolveCard.mockResolvedValueOnce(result);
    render(<CardScanPanel canRecord onClose={() => {}} onRecord={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText(/SIMBK1/), {
      target: { value: 'SIMBK1:0123456789abcdef0123456789abcdef' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cek' }));

    expect(await screen.findByText('SISWA SATU')).toBeInTheDocument();
    expect(staffMock.resolveCard).toHaveBeenCalledWith(
      'SIMBK1:0123456789abcdef0123456789abcdef',
    );
    expect(screen.getByText('Kartu dikenali')).toBeInTheDocument();
    expect(screen.getByText('740')).toBeInTheDocument();
  });

  it('meneruskan hasil ke pencatatan pelanggaran untuk BK', async () => {
    staffMock.resolveCard.mockResolvedValueOnce(result);
    const onRecord = vi.fn();
    render(<CardScanPanel canRecord onClose={() => {}} onRecord={onRecord} />);

    fireEvent.change(screen.getByPlaceholderText(/SIMBK1/), {
      target: { value: 'SIMBK1:0123456789abcdef0123456789abcdef' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cek' }));
    fireEvent.click(await screen.findByRole('button', { name: /Catat Pelanggaran/ }));

    await waitFor(() => expect(onRecord).toHaveBeenCalledWith(result));
  });

  it('wali kelas hanya melihat ringkasan tanpa tombol catat', async () => {
    staffMock.resolveCard.mockResolvedValueOnce(result);
    render(<CardScanPanel canRecord={false} onClose={() => {}} onRecord={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText(/SIMBK1/), {
      target: { value: 'SIMBK1:0123456789abcdef0123456789abcdef' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cek' }));

    expect(await screen.findByText('SISWA SATU')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Catat Pelanggaran/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selesai' })).toBeInTheDocument();
  });
});
