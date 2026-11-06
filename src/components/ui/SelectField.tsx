import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: (string | SelectOption)[];
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  hint,
  error,
  options,
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
      <select
        className={`w-full min-h-[48px] px-4 rounded-[14px] border border-border bg-surface text-[15px] font-medium text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm ${
          error ? 'border-alert focus:border-alert focus:ring-alert/10' : ''
        } ${className}`}
        {...props}
      >
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <p className="text-xs text-alert font-medium">{error}</p>}
    </div>
  );
};

export default SelectField;
