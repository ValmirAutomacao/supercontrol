import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label: string;
  accentColor?: string;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function toDateObj(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function DatePickerInput({ value, onChange, label, accentColor = 'blue' }: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = toDateObj(value);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const accent = accentColor === 'emerald' ? 'emerald' : 'blue';

  return (
    <div className="relative" ref={containerRef}>
      <label className={`absolute left-3 -top-2 px-1 bg-[#0a0a0a] text-[10px] font-bold text-${accent}-500/80 uppercase tracking-widest z-10`}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-[#0a0a0a] border border-${accent}-500/20 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-${accent}-500/60 transition-all flex items-center justify-between gap-2 hover:bg-white/5`}
      >
        <span className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[18px] text-${accent}-500`}>calendar_today</span>
          <span className={value ? 'text-white font-bold' : 'text-zinc-600'}>
            {value ? formatDisplay(value) : 'Selecionar data...'}
          </span>
        </span>
        <span className="material-symbols-outlined text-zinc-600 text-[18px]">expand_more</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden p-2">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            locale={ptBR}
            captionLayout="dropdown"
            classNames={{
              today: `font-extrabold text-${accent}-400`,
              selected: `!bg-${accent}-600 !text-white !rounded-lg font-bold`,
              chevron: `fill-zinc-400`,
              month_caption: `text-zinc-200 font-bold text-sm flex items-center gap-2`,
              nav: `flex items-center gap-1`,
              button_previous: `w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors`,
              button_next: `w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors`,
              month_grid: `mt-3`,
              weekdays: `mb-1`,
              weekday: `text-zinc-600 text-[11px] font-bold uppercase tracking-wider w-9 text-center`,
              week: `flex gap-0.5`,
              day: `w-9 h-9 rounded-lg hover:bg-white/10 text-sm text-zinc-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer`,
              outside: `text-zinc-700`,
              disabled: `text-zinc-800 cursor-not-allowed`,
              day_button: `w-9 h-9 flex items-center justify-center`,
            }}
          />
        </div>
      )}
    </div>
  );
}
