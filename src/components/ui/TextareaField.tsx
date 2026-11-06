import React from 'react';

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  hint,
  error,
  className = '',
  rows = 3,
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
      <textarea
        rows={rows}
        className={`w-full p-3.5 rounded-[14px] border border-border bg-surface text-[15px] font-medium leading-relaxed text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y shadow-sm ${
          error ? 'border-alert focus:border-alert focus:ring-alert/10' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-alert font-medium">{error}</p>}
    </div>
  );
};

export default TextareaField;
