import { LogOut, Settings, ShieldAlert, UserCog, UserRound } from 'lucide-react';
import { useBK } from '../context/BKContext';
import { useDiscipline } from '../context/DisciplineContext';
import { confirmDialog } from '../components/ui/ConfirmModal';
import { Sheet } from './ui';
import type { MobileRoute } from './MobileApp';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: MobileRoute) => void;
  onToast: (msg: string) => void;
}

export default function MobileMenu({ open, onClose, onNavigate, onToast }: MobileMenuProps) {
  const { logout } = useBK();
  const { membership } = useDiscipline();

  const go = (route: MobileRoute) => {
    onClose();
    onNavigate(route);
  };

  const keluar = async () => {
    const ok = await confirmDialog({
      title: 'Keluar dari aplikasi SIM BK PRO?',
      description: 'Data yang tersimpan aman di cloud. Anda akan kembali ke halaman masuk.',
      confirmLabel: 'Keluar',
      tone: 'danger',
    });
    if (!ok) return;
    onClose();
    logout();
    onToast('Ibu telah keluar dari sesi aplikasi.');
  };

  const item = (
    label: string,
    desc: string,
    Icon: typeof Settings,
    onClick: () => void,
  ) => (
    <button key={label} type="button" onClick={onClick} className="bk-row group !p-3.5">
      <span className="bk-tile s flex-none">
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15px] font-bold text-text transition-colors group-hover:text-primary">
          {label}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">{desc}</span>
      </span>
      <span className="flex-none text-muted/60 transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Menu Aplikasi">
      <div className="space-y-2.5">
        {membership?.role === 'bk' &&
          item('Guru & Kelas', 'Akun staf dan penugasan wali kelas', UserCog, () =>
            go('guru'),
          )}
        {item('Tata Tertib', 'Poin siswa, pelanggaran, dan surat peringatan', ShieldAlert, () =>
          go('tata-tertib'),
        )}
        {item('Pengaturan', 'Kop surat, identitas sekolah, dan data', Settings, () =>
          go('pengaturan'),
        )}
        {item('Profil', 'Ringkasan akun dan identitas guru BK', UserRound, () => go('profil'))}

        <div className="!mt-4 border-t border-border pt-3">
          <button
            type="button"
            onClick={keluar}
            className="bk-btn ghost mt-2.5 min-h-[48px] w-full !text-alert"
          >
            <LogOut size={16} /> Keluar Akun
          </button>
        </div>
      </div>
    </Sheet>
  );
}
