import type {
  PointStatus,
  SpStatus,
  SpType,
  ViolationCategory,
} from '../types';

export const CATEGORY_ORDER: ViolationCategory[] = [
  'kewajiban',
  'ringan',
  'sedang',
  'berat',
  'sangat_berat',
];

export const CATEGORY_LABELS: Record<ViolationCategory, string> = {
  kewajiban: 'Kewajiban',
  ringan: 'Pelanggaran Ringan',
  sedang: 'Pelanggaran Sedang',
  berat: 'Pelanggaran Berat',
  sangat_berat: 'Pelanggaran Sangat Berat',
};

export const CATEGORY_SHORT_LABELS: Record<ViolationCategory, string> = {
  kewajiban: 'Kewajiban',
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
  sangat_berat: 'Sangat Berat',
};

/** Warna lembut untuk chip kategori. */
export const CATEGORY_STYLES: Record<ViolationCategory, string> = {
  kewajiban: 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC]',
  ringan: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]',
  sedang: 'bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]',
  berat: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
  sangat_berat: 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]',
};

export const POINT_STATUS_LABELS: Record<PointStatus, string> = {
  aman: 'Aman',
  pembinaan: 'Pembinaan',
  sp1: 'SP1',
  sp2: 'SP2',
  sp3: 'SP3',
  pleno: 'Sidang Pleno',
};

export const POINT_STATUS_STYLES: Record<PointStatus, string> = {
  aman: 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]',
  pembinaan: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
  sp1: 'bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]',
  sp2: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
  sp3: 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]',
  pleno: 'bg-[#111827] text-white border-[#111827]',
};

export const SP_TYPE_LABELS: Record<SpType, string> = {
  sp1: 'SP1 — Panggilan Orang Tua I',
  sp2: 'SP2 — Panggilan Orang Tua II',
  sp3: 'SP3 — Peringatan Terakhir',
  pleno: 'Sidang Pleno',
};

export const SP_TYPE_SHORT: Record<SpType, string> = {
  sp1: 'SP1',
  sp2: 'SP2',
  sp3: 'SP3',
  pleno: 'Pleno',
};

export const SP_STATUS_LABELS: Record<SpStatus, string> = {
  draft: 'Draft',
  issued: 'Terbit',
  cancelled: 'Dibatalkan',
};

export const SP_STATUS_STYLES: Record<SpStatus, string> = {
  draft: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
  issued: 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]',
  cancelled: 'bg-neutral-200 text-neutral-700 border-neutral-300',
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Saran sanksi mengikuti buku panduan; hanya teks bantu, bukan aturan data. */
export function suggestSanction(status: PointStatus): string {
  switch (status) {
    case 'pembinaan':
      return 'Teguran lisan dan pembinaan wali kelas.';
    case 'sp1':
      return 'Panggilan orang tua I dan surat peringatan SP1.';
    case 'sp2':
      return 'Panggilan orang tua II, skorsing 3 hari, dan SP2.';
    case 'sp3':
      return 'Skorsing 5–9 hari dan SP3 sebagai peringatan terakhir.';
    case 'pleno':
      return 'Sidang pleno: dikembalikan ke orang tua atau dikeluarkan.';
    default:
      return 'Belum ada tindakan khusus.';
  }
}

/** Status poin setelah pelanggaran baru ditambahkan (pratinjau UI). */
export function previewStatus(
  totalPoints: number,
  thresholds: number[] = [260, 510, 760, 1000],
): PointStatus {
  if (totalPoints >= (thresholds[3] ?? 1000)) return 'pleno';
  if (totalPoints >= (thresholds[2] ?? 760)) return 'sp3';
  if (totalPoints >= (thresholds[1] ?? 510)) return 'sp2';
  if (totalPoints >= (thresholds[0] ?? 260)) return 'sp1';
  if (totalPoints > 0) return 'pembinaan';
  return 'aman';
}
