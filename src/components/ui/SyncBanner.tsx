import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useBK } from '../../context/BKContext';

/** Banner yang muncul ketika ada perubahan yang gagal terkirim ke cloud (jaringan putus). */
const SyncBanner: React.FC = () => {
  const { syncFailed, retrySyncNow, isSyncing, isBackendConnected } = useBK();
  if (!syncFailed || !isBackendConnected) return null;

  return (
    <div
      role="alert"
      className="fixed left-1/2 -translate-x-1/2 z-[55] fade-up top-[calc(env(safe-area-inset-top,0px)+64px)] max-w-[92%] lg:max-w-md"
    >
      <div className="bg-amber-50/80 backdrop-blur-xl border border-amber-200/80 text-amber-900 rounded-[16px] shadow-2xl px-4 py-3 flex items-center gap-3">
        <CloudOff size={18} className="flex-none text-amber-700" />
        <div className="text-xs font-semibold leading-relaxed flex-1">
          Tidak semua perubahan terkirim ke cloud. Data aman di perangkat — akan dicoba ulang otomatis.
        </div>
        <button
          type="button"
          onClick={() => void retrySyncNow()}
          disabled={isSyncing}
          className="min-h-[38px] px-3.5 rounded-[12px] bg-amber-500/90 backdrop-blur-sm hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ring-1 ring-white/30 disabled:opacity-60 flex-none"
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
          <span>Sinkron</span>
        </button>
      </div>
    </div>
  );
};

export default SyncBanner;
