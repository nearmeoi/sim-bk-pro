import BaseModal from '../ui/BaseModal';
import CardScanPanel from './CardScanPanel';
import type { CardScanResult } from '../../types';

interface CardScanModalProps {
  open: boolean;
  canRecord: boolean;
  onClose: () => void;
  onRecord: (result: CardScanResult) => void;
}

export default function CardScanModal({
  open,
  canRecord,
  onClose,
  onRecord,
}: CardScanModalProps) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Scan Kartu Siswa"
      subtitle="Arahkan kamera ke QR di kartu, unggah foto, atau tempel kode kartu."
      maxWidth="max-w-md"
    >
      <CardScanPanel
        canRecord={canRecord}
        onClose={onClose}
        onRecord={(result) => {
          onClose();
          onRecord(result);
        }}
      />
    </BaseModal>
  );
}
