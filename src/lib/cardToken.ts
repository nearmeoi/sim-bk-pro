/**
 * Normalisasi token kartu siswa.
 *
 * QR kartu berisi URL portal (`/m/?card=SIMBK1:...`) agar kamera ponsel
 * langsung membuka portal. Aplikasi guru juga perlu menerima token mentah,
 * tempelan URL, atau query string dari hasil pindai.
 */

/** Ambil token dari tempelan URL kartu, query string, atau token mentah. */
export function extractCardToken(input: string): string {
  const value = input.trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      return (new URL(value).searchParams.get('card') ?? '').trim();
    } catch {
      return '';
    }
  }

  const match = value.match(/[?&]card=([^&]+)/);
  if (match) {
    try {
      return decodeURIComponent(match[1]).trim();
    } catch {
      return match[1].trim();
    }
  }

  return value;
}

export function isValidCardToken(value: string): boolean {
  return /^SIMBK1:[A-Za-z0-9_-]{16,64}$/.test(value.trim());
}
