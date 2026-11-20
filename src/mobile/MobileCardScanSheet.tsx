import { Sheet } from './ui';
import CardScanPanel from '../components/discipline/CardScanPanel';
import type { CardScanResult } from '../types';

interface MobileCardScanSheetProps {
  open: boolean;
  canRecord: boolean;
  onClose: () => void;
  onRecord: (result: CardScanResult) => void;
}

export default function MobileCardScanSheet({
  open,
  canRecord,
  onClose,
  onRecord,
}: MobileCardScanSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Scan Kartu Siswa"
      subtitle="Scan QR, unggah foto, atau tempel kode."
    >
      <CardScanPanel
        canRecord={canRecord}
        onClose={onClose}
        onRecord={(result) => {
          onClose();
          onRecord(result);
        }}
      />
    </Sheet>
  );
}
