import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SiswaView from './SiswaView';

vi.mock('../../context/BKContext', () => ({
  useBK: () => ({
    students: [
      { id: 'a', nama: 'ADI', nis: '1', nisn: '-', jk: 'L', kelas: '7A', status: 'Aktif' },
      { id: 'b', nama: 'BUDI', nis: '2', nisn: '-', jk: 'L', kelas: '7B', status: 'Aktif' },
      { id: 'c', nama: 'CITRA', nis: '3', nisn: '-', jk: 'P', kelas: '8A', status: 'Aktif' },
    ],
    records: [],
    addStudent: vi.fn(),
    updateStudent: vi.fn(),
    addCounselingRecord: vi.fn(),
    settings: { namaSekolah: 'SMPN 34', tahunAjaran: '2026/2027' },
    isBooting: false,
  }),
}));

describe('SiswaView filter rombel', () => {
  it('menampilkan pilihan A/B setelah tingkat dipilih dan menyaring per kelas', () => {
    render(<SiswaView onToast={() => {}} />);

    expect(screen.getByText('CITRA')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kelas 7' }));
    expect(screen.getByRole('button', { name: 'Semua 7' })).toBeInTheDocument();
    expect(screen.getByText('ADI')).toBeInTheDocument();
    expect(screen.getByText('BUDI')).toBeInTheDocument();
    expect(screen.queryByText('CITRA')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.queryByText('ADI')).not.toBeInTheDocument();
    expect(screen.getByText('BUDI')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Semua 7' }));
    expect(screen.getByText('ADI')).toBeInTheDocument();
  });
});
