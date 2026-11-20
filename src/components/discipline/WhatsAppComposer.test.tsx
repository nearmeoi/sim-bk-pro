import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WhatsAppComposer from './WhatsAppComposer';

const baseProps = {
  defaultPhone: '0812-3456-7890',
  defaultMessage: 'Halo Bapak/Ibu, ini pesan uji.',
  studentName: 'Nurul Aulia',
  guardianName: 'Ibu Sari',
  onClose: () => {},
};

describe('WhatsAppComposer', () => {
  it('menampilkan tautan wa.me dari nomor yang dinormalkan', () => {
    render(<WhatsAppComposer {...baseProps} />);

    const link = screen.getByRole('link', { name: /Buka WhatsApp/i });
    expect(link.getAttribute('href')).toContain('https://wa.me/6281234567890?text=');
    expect(screen.getByText(/Akan dibuka sebagai \+6281234567890/)).toBeInTheDocument();
  });

  it('menonaktifkan tautan bila nomor tidak valid', () => {
    render(<WhatsAppComposer {...baseProps} defaultPhone="0411 123456" />);

    expect(screen.queryByRole('link', { name: /Buka WhatsApp/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buka WhatsApp/i })).toBeDisabled();
    expect(screen.getByText(/Nomor belum valid/i)).toBeInTheDocument();
  });

  it('mengubah nomor dan pesan sebelum membuka WhatsApp', () => {
    const onDone = vi.fn();
    render(<WhatsAppComposer {...baseProps} onDone={onDone} />);

    fireEvent.change(screen.getByPlaceholderText('08xx xxxx xxxx'), {
      target: { value: '62811 2222 3333' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Isi pesan/i }), {
      target: { value: 'Pesan baru untuk orang tua.' },
    });

    const link = screen.getByRole('link', { name: /Buka WhatsApp/i });
    expect(link.getAttribute('href')).toContain('https://wa.me/6281122223333');
    expect(decodeURIComponent(link.getAttribute('href')!.split('text=')[1])).toBe(
      'Pesan baru untuk orang tua.',
    );

    fireEvent.click(link);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('memakai nomor kosong tanpa memaksa membuka WhatsApp', () => {
    render(<WhatsAppComposer {...baseProps} defaultPhone="" />);

    expect(screen.queryByRole('link', { name: /Buka WhatsApp/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buka WhatsApp/i })).toBeDisabled();
  });
});
