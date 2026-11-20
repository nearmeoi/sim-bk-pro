import { Sheet } from './ui';
import WhatsAppComposer from '../components/discipline/WhatsAppComposer';

interface MobileWhatsAppSheetProps {
  open: boolean;
  defaultPhone: string;
  defaultMessage: string;
  studentName: string;
  guardianName?: string;
  onClose: () => void;
  onToast?: (message: string) => void;
}

export default function MobileWhatsAppSheet({
  open,
  defaultPhone,
  defaultMessage,
  studentName,
  guardianName,
  onClose,
  onToast,
}: MobileWhatsAppSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Kirim WhatsApp"
      subtitle="Buka WhatsApp, lalu kirim manual."
    >
      <WhatsAppComposer
        defaultPhone={defaultPhone}
        defaultMessage={defaultMessage}
        studentName={studentName}
        guardianName={guardianName}
        onDone={onClose}
        onToast={onToast}
      />
    </Sheet>
  );
}
