import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  open: boolean;
  /** Elemen pemicu; panel diposisikan menempel di bawah/samping elemen ini. */
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Lebar minimum panel (px). Default: selebar anchor. */
  minWidth?: number;
  /** Lebar tetap panel (px). Default: selebar anchor. */
  width?: number;
  /** Perkiraan tinggi panel (px) untuk menentukan arah buka. */
  estimatedHeight?: number;
  /** Role ARIA panel, mis. "dialog" atau "listbox". */
  role?: string;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}

interface PopoverPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

const MARGIN = 8;
const GAP = 6;

/**
 * Panel mengambang (dropdown) yang dirender lewat portal ke <body>.
 *
 * Dipakai picker di dalam modal: dengan portal panel tidak ikut terpotong
 * oleh container yang scrollable, dan otomatis membalik ke atas bila ruang
 * di bawah layar tidak cukup.
 */
export default function Popover({
  open,
  anchorRef,
  onClose,
  minWidth,
  width,
  estimatedHeight = 300,
  role,
  ariaLabel,
  className = '',
  children,
}: PopoverProps) {
  const [pos, setPos] = useState<PopoverPosition | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        onCloseRef.current();
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const panelWidth = Math.min(
        Math.max(width ?? rect.width, minWidth ?? 0),
        vw - MARGIN * 2,
      );

      let left = rect.left;
      if (left + panelWidth > vw - MARGIN) left = vw - panelWidth - MARGIN;
      if (left < MARGIN) left = MARGIN;

      const spaceBelow = vh - rect.bottom - GAP - MARGIN;
      const spaceAbove = rect.top - GAP - MARGIN;
      const flipUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      setPos({
        left,
        width: panelWidth,
        maxHeight: Math.max(160, flipUp ? spaceAbove : spaceBelow),
        ...(flipUp
          ? { bottom: vh - rect.top + GAP }
          : { top: rect.bottom + GAP }),
      });
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('[data-popover-panel]')) return;
      onCloseRef.current();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, anchorRef, width, minWidth, estimatedHeight]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      data-popover-panel=""
      role={role}
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
      }}
      className={`z-[80] overflow-y-auto overscroll-contain rounded-[16px] border border-border bg-white shadow-[0_16px_40px_rgb(0_0_0/0.16)] fade-up ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
