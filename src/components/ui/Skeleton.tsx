import React from 'react';

/** Blok shimmer generik — pakai selama isBooting/isSyncing, bukan spinner penuh halaman. */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton rounded-[12px] ${className}`} aria-hidden="true" />
);

/** Skeleton daftar/tabel sepanjang layar: beberapa baris tebar muat. */
export const ListSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 6,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`} role="status" aria-label="Memuat data...">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-[52px] w-full" />
    ))}
  </div>
);

export default Skeleton;
