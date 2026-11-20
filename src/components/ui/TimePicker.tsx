import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import Popover from './Popover';

interface TimePickerProps {
  value: string; // HH:MM
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Pemilih waktu bertema aplikasi (pengganti <input type="time"> bawaan browser). */
export default function TimePicker({ value, onChange, placeholder = 'Pilih waktu', id }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const [hour, minute] = useMemo(() => {
    const m = /^(\d{2}):(\d{2})$/.exec(value);
    return m ? [m[1], m[2]] : ['', ''];
  }, [value]);

  // Geser daftar ke jam/menit yang sedang terpilih.
  // Panel baru ter-mount setelah Popover menghitung posisi, jadi tunggu frame berikutnya.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      [hourRef.current, minuteRef.current].forEach((container) => {
        if (!container) return;
        const active = container.querySelector<HTMLElement>('[data-active="true"]');
        if (!active) return;
        const cRect = container.getBoundingClientRect();
        const aRect = active.getBoundingClientRect();
        container.scrollTop += aRect.top - cRect.top - cRect.height / 2 + aRect.height / 2;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const setHour = (h: string) => onChange(`${h}:${minute || '00'}`);
  const setMinute = (m: string) => {
    onChange(`${hour || '00'}:${m}`);
    setOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-full min-h-[48px] px-3.5 rounded-[12px] border bg-surface text-sm text-left flex items-center justify-between gap-2 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10 ${
          open ? 'border-primary ring-2 ring-primary/10' : 'border-border hover:border-primary/60'
        }`}
      >
        <span className={value ? 'font-semibold text-text tabular-nums' : 'text-muted/70'}>
          {value || placeholder}
        </span>
        <Clock size={17} className={open ? 'text-accent' : 'text-muted'} />
      </button>

      {open && (
        <Popover
          open={open}
          anchorRef={wrapRef}
          onClose={() => setOpen(false)}
          minWidth={240}
          width={240}
          estimatedHeight={300}
          role="dialog"
          ariaLabel="Pilih waktu"
        >
          <div className="grid grid-cols-2 divide-x divide-border">
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                Jam
              </p>
              <div ref={hourRef} className="max-h-[200px] overflow-y-auto px-1.5 pb-2">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    data-active={h === hour}
                    onClick={() => setHour(h)}
                    className={`w-full h-8 rounded-[8px] text-[13px] font-semibold tabular-nums transition-colors ${
                      h === hour
                        ? 'bg-accent text-white'
                        : 'text-text hover:bg-primary-tint'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                Menit
              </p>
              <div ref={minuteRef} className="max-h-[200px] overflow-y-auto px-1.5 pb-2">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-active={m === minute}
                    onClick={() => setMinute(m)}
                    className={`w-full h-8 rounded-[8px] text-[13px] font-semibold tabular-nums transition-colors ${
                      m === minute
                        ? 'bg-accent text-white'
                        : 'text-text hover:bg-primary-tint'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border px-3 py-2 flex items-center justify-between">
            <span className="text-[12px] font-bold text-text tabular-nums">
              {hour ? `${hour}:${minute || '00'}` : '--:--'}
            </span>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onChange(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
                setOpen(false);
              }}
              className="text-[12px] font-bold text-accent hover:underline"
            >
              Sekarang
            </button>
          </div>
        </Popover>
      )}
    </div>
  );
}
