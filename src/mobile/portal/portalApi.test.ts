import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildStudentPortalUrl,
  clearPortalSession,
  extractCardToken,
  isValidCardToken,
  loadPortalSession,
  savePortalSession,
} from './portalApi';

const TOKEN = 'SIMBK1:0123456789abcdef0123456789abcdef';

describe('portal kartu siswa', () => {
  beforeEach(() => {
    clearPortalSession();
  });

  it('membuat URL portal yang membawa token kartu', () => {
    const url = new URL(buildStudentPortalUrl(TOKEN, 'https://sekolah.test'));
    expect(url.pathname).toBe('/m/');
    expect(url.searchParams.get('card')).toBe(TOKEN);
  });

  it('menerima token mentah, query string, dan URL kartu', () => {
    expect(extractCardToken(TOKEN)).toBe(TOKEN);
    expect(extractCardToken(`?card=${encodeURIComponent(TOKEN)}`)).toBe(TOKEN);
    expect(
      extractCardToken(`https://sekolah.test/m/?card=${encodeURIComponent(TOKEN)}`),
    ).toBe(TOKEN);
    expect(extractCardToken('')).toBe('');
  });

  it('memvalidasi format token SIMBK1', () => {
    expect(isValidCardToken(TOKEN)).toBe(true);
    expect(isValidCardToken('SIMBK1:pendek')).toBe(false);
    expect(isValidCardToken('NIS-1234')).toBe(false);
  });

  it('menyimpan sesi hanya di sessionStorage', () => {
    expect(loadPortalSession()).toBeNull();

    savePortalSession({ token: 'sesi-abc', expiresAt: '2026-11-20T10:00:00.000Z' });
    expect(loadPortalSession()).toEqual({
      token: 'sesi-abc',
      expiresAt: '2026-11-20T10:00:00.000Z',
    });
    expect(window.localStorage.getItem('sim_bk_portal_session_v1')).toBeNull();

    clearPortalSession();
    expect(loadPortalSession()).toBeNull();
  });
});
