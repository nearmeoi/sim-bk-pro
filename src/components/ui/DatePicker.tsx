import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Popover from './Popover';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseISO = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatLabel = (value: string) => {
  const d = parseISO(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

/** Pemilih tanggal bertema aplikasi (pengganti <input type="date"> bawaan browser). */
export default function DatePicker({ value, onChange, placeholder = 'Pilih tanggal', id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const [view, setView] = useState<Date>(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const base = parseISO(value) ?? new Date();
      setView(new Date(base.getFullYear(), base.getMonth(), 1));
    }
  }, [open, value]);

  const days = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Senin = kolom pertama
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(year, month, i - offset + 1);
      cells.push({ date, inMonth: date.getMonth() === month });
    }
    return cells;
  }, [view]);

  const todayISO = toISO(new Date());
  const shiftMonth = (delta: number) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-full min-h-[48px] px-3 rounded-[12px] border bg-surface text-[13px] text-left flex items-center justify-between gap-1.5 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10 ${
          open ? 'border-primary ring-2 ring-primary/10' : 'border-border hover:border-primary/60'
        }`}
      >
        <span className={`truncate ${value ? 'font-semibold text-text' : 'text-muted/70'}`}>
          {value ? formatLabel(value) : placeholder}
        </span>
        <CalendarDays size={16} className={`flex-none ${open ? 'text-accent' : 'text-muted'}`} />
      </button>

      {open && (
        <Popover
          open={open}
          anchorRef={wrapRef}
          onClose={() => setOpen(false)}
          minWidth={320}
          estimatedHeight={360}
          role="dialog"
          ariaLabel="Pilih tanggal"
          className="p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Bulan sebelumnya"
              className="h-8 w-8 grid place-items-center rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
            >
              <ChevronLeft size={17} />
            </button>
            <p className="text-[13px] font-extrabold text-text">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
              className="h-8 w-8 grid place-items-center rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-center text-[10px] font-bold uppercase text-muted py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map(({ date, inMonth }) => {
              const iso = toISO(date);
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`h-9 rounded-[10px] text-[13px] font-semibold transition-colors ${
                    isSelected
                      ? 'bg-accent text-white shadow-sm'
                      : isToday
                        ? 'text-accent ring-1 ring-accent/40 hover:bg-primary-tint'
                        : inMonth
                          ? 'text-text hover:bg-primary-tint'
                          : 'text-muted/35 hover:bg-bg'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange(todayISO);
                setOpen(false);
              }}
              className="text-[12px] font-bold text-accent hover:underline"
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-[12px] font-semibold text-muted hover:text-text"
            >
              Kosongkan
            </button>
          </div>
        </Popover>
      )}
    </div>
  );
}
