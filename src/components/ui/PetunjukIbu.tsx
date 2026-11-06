import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, HeartHandshake } from 'lucide-react';

interface PetunjukIbuProps {
  title?: string;
  tips: string[];
  className?: string;
}

export const PetunjukIbu: React.FC<PetunjukIbuProps> = ({
  title = 'Petunjuk Singkat:',
  tips,
  className = '',
}) => {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`print:hidden rounded-[18px] bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-emerald-50/60 border border-primary/20 p-4 transition-all shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Lightbulb size={17} className="text-primary" />
          </div>
          <h4 className="text-xs sm:text-[13px] font-bold text-primary flex items-center gap-1.5">
            {title}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs font-semibold text-muted hover:text-primary flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-white/60 transition-colors"
        >
          <span>{open ? 'Tutup' : 'Bantuan'}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {open && (
        <ul className="mt-3 space-y-1.5 text-xs text-text/85 pl-1 leading-relaxed fade-up">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary font-black mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PetunjukIbu;
