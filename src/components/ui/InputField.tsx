import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  hint,
  error,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {(label || hint) && (
        <div className="flex items-center justify-between">
          {label && <label className="block text-xs font-bold text-text">{label}</label>}
          {hint && <span className="text-[11px] text-muted">{hint}</span>}
        </div>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <Icon size={17} />
          </div>
        )}
        <input
          className={`w-full min-h-[48px] px-4 rounded-[14px] border border-border bg-surface text-[15px] font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm ${
            Icon ? 'pl-11' : ''
          } ${error ? 'border-alert focus:border-alert focus:ring-alert/10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-alert font-medium">{error}</p>}
    </div>
  );
};

export default InputField;
