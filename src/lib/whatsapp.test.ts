import { describe, expect, it } from 'vitest';
import {
  buildPointNoticeMessage,
  buildSpNoticeMessage,
  buildWhatsAppUrl,
  formatWhatsAppDate,
  normalizeWhatsAppNumber,
} from './whatsapp';

describe('normalizeWhatsAppNumber', () => {
  it('menormalkan nomor Indonesia ke format 62', () => {
    expect(normalizeWhatsAppNumber('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('62812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('812.3456.7890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('0062 812 3456 7890')).toBe('6281234567890');
  });

  it('menolak nomor yang tidak mungkin dipakai WhatsApp', () => {
    expect(normalizeWhatsAppNumber('')).toBeNull();
    expect(normalizeWhatsAppNumber('abc')).toBeNull();
    expect(normalizeWhatsAppNumber('0411 123456')).toBeNull();
    expect(normalizeWhatsAppNumber('0812')).toBeNull();
    expect(normalizeWhatsAppNumber('+1 555 0100')).toBeNull();
  });
});

describe('buildWhatsAppUrl', () => {
  it('membuat tautan wa.me dengan pesan terenkode', () => {
    const message = 'Halo Bapak/Ibu, ini uji & pesan.';
    const url = buildWhatsAppUrl('0812-3456-7890', message);

    expect(url).toContain('https://wa.me/6281234567890?text=');
    expect(decodeURIComponent(url!.split('text=')[1])).toBe(message);
  });

  it('mengembalikan null bila nomor atau pesan kosong', () => {
    expect(buildWhatsAppUrl('', 'Halo')).toBeNull();
    expect(buildWhatsAppUrl('0812', 'Halo')).toBeNull();
    expect(buildWhatsAppUrl('08123456789', '   ')).toBeNull();
  });
});

describe('pesan WhatsApp', () => {
  it('menyusun ringkasan poin tanpa mengirim otomatis', () => {
    const message = buildPointNoticeMessage({
      schoolName: 'SMP Negeri 34 Makassar',
      guardianName: 'Ibu Sari',
      studentName: 'Nurul Aulia',
      className: '8B',
      statusLabel: 'SP1',
      totalPoints: 260,
      balance: 740,
      pointScale: 1000,
      suggestion: 'Panggilan orang tua pertama.',
      lastViolation: {
        name: 'Terlambat masuk kelas',
        occurredAt: '2026-09-18T02:00:00.000Z',
      },
    });

    expect(message).toContain("Assalamu'alaikum Ibu Sari,");
    expect(message).toContain('BK SMP Negeri 34 Makassar');
    expect(message).toContain('Nurul Aulia (kelas 8B)');
    expect(message).toContain('260 poin');
    expect(message).toContain('740 dari 1000');
    expect(message).toContain('Status pembinaan: SP1.');
    expect(message).toContain('Terlambat masuk kelas');
    expect(message).toContain('Panggilan orang tua pertama.');
  });

  it('menyusun undangan SP dengan nomor dan jadwal', () => {
    const message = buildSpNoticeMessage({
      schoolName: 'SMP Negeri 34 Makassar',
      guardianName: 'Pak Andi',
      studentName: 'Adi Saputra',
      className: '7A',
      spLabel: 'SP1 — Panggilan Orang Tua I',
      spNumber: 'SP1/001/SMP34/2026',
      totalPoints: 270,
      meetingAt: '2026-11-25T02:00:00.000Z',
    });

    expect(message).toContain('mengundang Bapak/Ibu');
    expect(message).toContain('Adi Saputra (kelas 7A)');
    expect(message).toContain('Surat: SP1 — Panggilan Orang Tua I');
    expect(message).toContain('Nomor: SP1/001/SMP34/2026');
    expect(message).toContain('Pertemuan:');
  });

  it('menambahkan Bapak/Ibu hanya bila nama wali belum bergelar', () => {
    const message = buildPointNoticeMessage({
      guardianName: 'Sari Dewi',
      studentName: 'Nurul Aulia',
      className: '8B',
      statusLabel: 'Aman',
      totalPoints: 0,
      balance: 1000,
      pointScale: 1000,
    });

    expect(message).toContain("Assalamu'alaikum Bapak/Ibu Sari Dewi,");
  });

  it('memakai sapaan netral bila nama wali belum diisi', () => {
    const message = buildSpNoticeMessage({
      studentName: 'Siswa Tanpa Wali',
      className: '9C',
      spLabel: 'SP2',
      totalPoints: 600,
    });

    expect(message).toContain("Assalamu'alaikum Bapak/Ibu orang tua/wali,");
    expect(message).toContain('Jadwal pertemuan akan diinformasikan lebih lanjut.');
  });
});

describe('formatWhatsAppDate', () => {
  it('mengembalikan string kosong untuk tanggal tidak valid', () => {
    expect(formatWhatsAppDate(null)).toBe('');
    expect(formatWhatsAppDate('bukan tanggal')).toBe('');
  });
});
