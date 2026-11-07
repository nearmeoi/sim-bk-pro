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
      <div className="bg-[#1B2236] text-white text-[14px] sm:text-[15px] font-semibold px-5 py-3.5 rounded-[16px] shadow-2xl text-center leading-relaxed border border-white/15 ring-1 ring-black/10">
        {message}
      </div>
    </div>
  );
}
