import type { CounselingRecord } from '../types';

export type StatusKey = CounselingRecord['status'];

export interface StatusStyle {
  /** Label panjang untuk pilihan status */
  label: string;
  /** Label pendek untuk badge tabel */
  short: string;
  /** Pill terpilih: warna pekat + teks kontras */
  solid: string;
  /** Badge/pill tidak terpilih: latar lembut, teks & garis berwarna */
  soft: string;
  /** Warna titik indikator */
  dot: string;
}

export const STATUS_STYLES: Record<StatusKey, StatusStyle> = {
  Proses: {
    label: 'Sedang Diproses',
    short: 'Diproses',
    solid: 'bg-[#FBBF24] text-[#451A03] border-[#FBBF24] shadow-[0_6px_16px_rgb(251_191_36/0.35)]',
    soft: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
    dot: 'bg-[#F59E0B]',
  },
  Selesai: {
    label: 'Kasus Selesai',
    short: 'Selesai',
    solid: 'bg-[#047857] text-white border-[#047857] shadow-[0_6px_16px_rgb(4_120_87/0.25)]',
    soft: 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]',
    dot: 'bg-[#047857]',
  },
  Menunggu: {
    label: 'Menunggu Tindak Lanjut',
    short: 'Menunggu',
    solid: 'bg-[#DC2626] text-white border-[#DC2626] shadow-[0_6px_16px_rgb(220_38_38/0.25)]',
    soft: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
    dot: 'bg-[#DC2626]',
  },
};

export const statusStyle = (status: string): StatusStyle =>
  STATUS_STYLES[status as StatusKey] ?? STATUS_STYLES.Proses;
