import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';

export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  unit?: string;
  label?: string;
  arabicLabel?: string;
}

/**
 * FormInput with Caret Focus & Position Retention
 * Prevents cursor jumping to the end on rapid typing in RTL/Arabic contexts.
 */
export const FormInput: React.FC<FormInputProps> = ({
  value,
  onChange,
  options,
  unit,
  label,
  arabicLabel,
  className = '',
  placeholder,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (cursor !== null && inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(cursor, cursor);
    }
  }, [cursor, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCursor(e.target.selectionStart);
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {(label || arabicLabel) && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          {arabicLabel && <span className="text-slate-500 font-normal">{arabicLabel}</span>}
        </div>
      )}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
            unit ? 'pr-12' : ''
          } ${className}`}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 text-xs text-slate-400 select-none pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {options && options.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {options.slice(0, 6).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                value === opt
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-700 font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
