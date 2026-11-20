import BaseModal from '../ui/BaseModal';
import WhatsAppComposer from './WhatsAppComposer';

interface WhatsAppModalProps {
  open: boolean;
  defaultPhone: string;
  defaultMessage: string;
  studentName: string;
  guardianName?: string;
  onClose: () => void;
  onToast?: (message: string) => void;
}

export default function WhatsAppModal({
  open,
  defaultPhone,
  defaultMessage,
  studentName,
  guardianName,
  onClose,
  onToast,
}: WhatsAppModalProps) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Kirim WhatsApp"
      subtitle="Pesan dibuka di WhatsApp dan tetap dikirim manual oleh guru BK."
      maxWidth="max-w-lg"
    >
      <WhatsAppComposer
        defaultPhone={defaultPhone}
        defaultMessage={defaultMessage}
        studentName={studentName}
        guardianName={guardianName}
        onDone={onClose}
        onToast={onToast}
      />
    </BaseModal>
  );
}
