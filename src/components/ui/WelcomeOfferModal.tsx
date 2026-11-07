import React from 'react';
import { Sparkles } from 'lucide-react';
import BaseModal from './BaseModal';

interface WelcomeOfferModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal penawaran paket berbayar (SaaS).
 * shortcut: isi masih kosong — akan diisi saat alur pembayaran (va/gateway) aktif.
 */
const WelcomeOfferModal: React.FC<WelcomeOfferModalProps> = ({ open, onClose }) => (
  <BaseModal open={open} onClose={onClose} maxWidth="max-w-md" title="SIM BK PRO Premium" subtitle="Segera hadir">
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
        <Sparkles size={14} />
        <span>Penawaran Awal</span>
      </div>
      {/* Placeholder kosong — diisi konten paket/harga nantinya */}
      <div className="min-h-[140px] rounded-[16px] border-2 border-dashed border-border flex items-center justify-center text-center">
        <p className="text-xs text-muted font-medium leading-relaxed px-6">
          Informasi paket &amp; harga belum tersedia.
          <br />
          Konten ini akan muncul saat pembayaran diaktifkan.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="bk-btn primary w-full"
      >
        Lanjut ke Aplikasi
      </button>
    </div>
  </BaseModal>
);

export default WelcomeOfferModal;
