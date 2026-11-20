import { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentPicker from './StudentPicker';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import type { Student } from '../../types';

const STUDENTS: Student[] = [
  { id: 'a', nama: 'ADI SAPUTRA', nis: '1', nisn: '-', jk: 'L', kelas: '7A', status: 'Aktif' },
  { id: 'b', nama: 'BUDI SANTOSO', nis: '2', nisn: '-', jk: 'L', kelas: '7B', status: 'Aktif' },
];

describe('StudentPicker', () => {
  it('menyaring siswa saat mengetik dan mengirim nama + kelas terpilih', () => {
    const onChange = vi.fn();
    const onPick = vi.fn();

    function Harness() {
      const [value, setValue] = useState('');
      return (
        <StudentPicker
          value={value}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
          onPick={onPick}
          students={STUDENTS}
        />
      );
    }

    render(<Harness />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'budi' } });

    const list = screen.getByRole('listbox');
    expect(within(list).getByText('BUDI SANTOSO')).toBeInTheDocument();
    expect(within(list).queryByText('ADI SAPUTRA')).not.toBeInTheDocument();

    fireEvent.click(within(list).getByText('BUDI SANTOSO'));

    expect(onChange).toHaveBeenLastCalledWith('BUDI SANTOSO');
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ nama: 'BUDI SANTOSO', kelas: '7B' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('DatePicker', () => {
  it('memilih tanggal dan menutup panel', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-11-05" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /5 Nov 2026/ }));
    const dialog = screen.getByRole('dialog', { name: 'Pilih tanggal' });
    fireEvent.click(within(dialog).getByRole('button', { name: '12' }));

    expect(onChange).toHaveBeenCalledWith('2026-11-12');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('TimePicker', () => {
  it('memilih jam lalu menit', () => {
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState('09:00');
      return (
        <TimePicker
          value={value}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: '09:00' }));
    const dialog = screen.getByRole('dialog', { name: 'Pilih waktu' });

    fireEvent.click(within(dialog).getAllByRole('button', { name: '14' })[0]);
    expect(onChange).toHaveBeenLastCalledWith('14:00');

    fireEvent.click(within(dialog).getByRole('button', { name: '30' }));
    expect(onChange).toHaveBeenLastCalledWith('14:30');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
