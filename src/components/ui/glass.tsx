import React from 'react';
import { GlassButton } from '@zakisheriff/liquid-glass';
import '@zakisheriff/liquid-glass/styles.css';
import type { ReactNode } from 'react';

/**
 * Adapter liquid glass untuk seluruh app.
 * Memetakan varian semantik app -> varian @zakisheriff/liquid-glass:
 *  - primary  : CTA utama oranye (bg-primary)
 *  - accent   : aksi kuat oranye tua (bg-accent)
 *  - neutral  : hitam solid ala iOS (bg-black)
 *  - ghost    : sekunder transparan (bk-btn.ghost / bk-chip)
 *  - danger   : aksi merusak (bg-alert)
 *  - glass/clear/tinted/tinted-filled : pass-through varian library
 */
type AppVariant =
  | 'primary'
  | 'accent'
  | 'neutral'
  | 'ghost'
  | 'danger'
  | 'glass'
  | 'clear'
  | 'tinted'
  | 'tinted-filled';

type GlassVariant = 'glass' | 'clear' | 'tinted' | 'tinted-filled' | 'filled';

const VARIANT_MAP: Record<AppVariant, { variant: GlassVariant; tint?: string; destructive?: boolean }> = {
  primary: { variant: 'filled', tint: '#FF8A3D' },
  accent: { variant: 'filled', tint: '#E86A33' },
  neutral: { variant: 'filled', tint: '#1A1A1A' },
  ghost: { variant: 'glass' },
  danger: { variant: 'filled', destructive: true },
  glass: { variant: 'glass' },
  clear: { variant: 'clear' },
  tinted: { variant: 'tinted' },
  'tinted-filled': { variant: 'tinted-filled' },
};

interface AppGlassButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: AppVariant;
  /** Override warna — dipakai untuk tint custom (mis. palet oranye app) */
  tint?: string;
  destructive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function AppGlassButton({
  variant = 'ghost',
  tint,
  destructive,
  size = 'md',
  icon,
  children,
  className,
  ...rest
}: AppGlassButtonProps) {
  const mapped = VARIANT_MAP[variant];
  return (
    <GlassButton
      {...rest}
      variant={mapped.variant}
      tint={tint ?? mapped.tint}
      destructive={destructive ?? mapped.destructive}
      size={size}
      icon={icon}
      className={className}
    >
      {children}
    </GlassButton>
  );
}
