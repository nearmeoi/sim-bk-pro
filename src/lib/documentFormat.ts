/**
 * Utility helpers untuk standardisasi format teks dinamis dokumen resmi BK.
 * Mencegah kebocoran data dummy/hardcode (seperti nama, NIP, atau kota fiktif).
 */

export function formatKotaTanggal(kota?: string | null, date: Date = new Date()): string {
  const tanggalStr = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const clean = kota?.trim();
  return clean ? `${clean}, ${tanggalStr}` : tanggalStr;
}

export function formatNamaPejabat(nama?: string | null, defaultLabel = '( .......................................... )'): string {
  const clean = nama?.trim();
  return clean || defaultLabel;
}

export function formatNIP(nip?: string | null): string {
  const clean = nip?.trim();
  return clean ? `NIP. ${clean}` : 'NIP. -';
}

export function formatNamaSekolah(nama?: string | null, fallback = 'SIM-BK'): string {
  return nama?.trim() || fallback;
}

export function formatTahunAjaran(tahunAjaran?: string | null): string {
  if (tahunAjaran?.trim()) return tahunAjaran.trim();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  return currentMonth >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
}
