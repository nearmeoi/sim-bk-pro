import { useEffect, useState } from 'react';
import { GlassCard } from '@zakisheriff/liquid-glass';

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
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        'fixed left-1/2 -translate-x-1/2 z-[60] fade-up select-none pointer-events-none ' +
        // Mobile: turun dari atas layar supaya selalu terlihat, tidak tertutup navbar bawah
        'top-[calc(env(safe-area-inset-top,0px)+14px)] max-w-[92%] ' +
        // Desktop: kembali ke bawah tengah seperti biasa
        'lg:!top-auto lg:!bottom-8 lg:max-w-md'
      }
    >
      <GlassCard
        padding="0px"
        radius="16px"
        tint="rgb(27 34 54 / 0.92)"
        className="text-[14px] sm:text-[15px] font-semibold px-5 py-3.5 shadow-2xl text-center leading-relaxed"
        style={{ color: '#fff' }}
      >
        {message}
      </GlassCard>
    </div>
  );
}
