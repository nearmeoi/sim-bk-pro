import { describe, it, expect } from 'vitest';
import {
  formatKotaTanggal,
  formatNamaPejabat,
  formatNIP,
  formatNamaSekolah,
  formatTahunAjaran,
} from './documentFormat';

describe('documentFormat helpers', () => {
  it('formatKotaTanggal formats date with kota when provided', () => {
    const fixedDate = new Date(2026, 10, 10); // Nov 10, 2026
    expect(formatKotaTanggal('Bandung', fixedDate)).toBe('Bandung, 10 November 2026');
  });

  it('formatKotaTanggal formats only date when kota is null or empty', () => {
    const fixedDate = new Date(2026, 10, 10);
    expect(formatKotaTanggal('', fixedDate)).toBe('10 November 2026');
    expect(formatKotaTanggal(null, fixedDate)).toBe('10 November 2026');
    expect(formatKotaTanggal(undefined, fixedDate)).toBe('10 November 2026');
  });

  it('formatNamaPejabat returns clean name or fallback', () => {
    expect(formatNamaPejabat('Dra. Hj. Nurul, M.Pd.')).toBe('Dra. Hj. Nurul, M.Pd.');
    expect(formatNamaPejabat('')).toBe('( .......................................... )');
    expect(formatNamaPejabat(null, 'Kepala Sekolah')).toBe('Kepala Sekolah');
  });

  it('formatNIP returns formatted NIP or NIP. -', () => {
    expect(formatNIP('19850101 201001 1 002')).toBe('NIP. 19850101 201001 1 002');
    expect(formatNIP('')).toBe('NIP. -');
    expect(formatNIP(null)).toBe('NIP. -');
    expect(formatNIP(undefined)).toBe('NIP. -');
  });

  it('formatNamaSekolah returns school name or fallback', () => {
    expect(formatNamaSekolah('SMP Negeri 2 Jakarta')).toBe('SMP Negeri 2 Jakarta');
    expect(formatNamaSekolah('')).toBe('SIM-BK');
    expect(formatNamaSekolah(null, 'Satuan Pendidikan')).toBe('Satuan Pendidikan');
  });

  it('formatTahunAjaran returns existing year or generates current', () => {
    expect(formatTahunAjaran('2025/2026')).toBe('2025/2026');
    const dynamic = formatTahunAjaran('');
    expect(dynamic).toMatch(/^\d{4}\/\d{4}$/);
  });
});
