import { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 z-50 bg-[#2D3748] text-white text-[14px] font-medium px-5 py-3 rounded-[14px] shadow-2xl max-w-[90%] text-center fade-up select-none pointer-events-none border border-white/10"
      style={{
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <span className="lg:bottom-8">{message}</span>
    </div>
  );
}
