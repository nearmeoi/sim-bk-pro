import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import Popover from './Popover';
import type { Student } from '../../types';

interface StudentPickerProps {
  value: string;
  onChange: (nama: string) => void;
  onPick?: (student: Student) => void;
  students: Student[];
  placeholder?: string;
  required?: boolean;
  id?: string;
}

const MAX_RESULTS = 40;

/**
 * Combobox pencarian siswa bertema aplikasi (pengganti <datalist> bawaan browser
 * yang tampil gelap dan menduplikasi nama).
 */
export default function StudentPicker({
  value,
  onChange,
  onPick,
  students,
  placeholder = 'Pilih atau ketik nama siswa...',
  required,
  id,
}: StudentPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? students.filter(
          (s) =>
            s.nama.toLowerCase().includes(q) ||
            s.nis.toLowerCase().includes(q) ||
            s.kelas.toLowerCase().includes(q),
        )
      : students;
    return base.slice(0, MAX_RESULTS);
  }, [students, query]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`);
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight, open]);

  const openList = () => {
    setQuery('');
    setHighlight(0);
    setOpen(true);
  };

  const pick = (s: Student) => {
    onChange(s.nama);
    onPick?.(s);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      if (open && results[highlight]) {
        e.preventDefault();
        pick(results[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="student-picker-list"
          aria-autocomplete="list"
          autoComplete="off"
          required={required}
          value={open ? query : value}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full min-h-[48px] pl-10 pr-10 rounded-[12px] border border-border bg-surface text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm"
        />
        {value && !open ? (
          <button
            type="button"
            aria-label="Kosongkan nama"
            onClick={() => {
              onChange('');
              setQuery('');
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <X size={15} />
          </button>
        ) : (
          <button
            type="button"
            aria-label={open ? 'Tutup daftar siswa' : 'Buka daftar siswa'}
            onClick={() => (open ? setOpen(false) : openList())}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <ChevronDown
              size={17}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {open && (
        <Popover open={open} anchorRef={wrapRef} onClose={() => setOpen(false)}>
          <div className="max-h-[264px] overflow-y-auto p-1.5" ref={listRef} id="student-picker-list" role="listbox">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted">
                Tidak ada siswa yang cocok. Nama tetap bisa diketik bebas.
              </p>
            ) : (
              results.map((s, idx) => {
                const active = idx === highlight;
                const selected = s.nama === value;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-idx={idx}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => pick(s)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                      active ? 'bg-primary-tint' : 'bg-transparent'
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-[13px] font-bold truncate ${
                          selected ? 'text-accent' : 'text-text'
                        }`}
                      >
                        {s.nama}
                      </span>
                      <span className="block text-[11px] text-muted mt-0.5">
                        Kelas {s.kelas} · NIS {s.nis || '-'}
                      </span>
                    </span>
                    {selected && <Check size={16} className="text-accent flex-none" />}
                  </button>
                );
              })
            )}
          </div>
          {results.length === MAX_RESULTS && (
            <p className="px-3 py-2 border-t border-border text-[11px] text-muted bg-bg">
              Menampilkan {MAX_RESULTS} hasil pertama — ketik nama untuk mempersempit.
            </p>
          )}
        </Popover>
      )}
    </div>
  );
}
