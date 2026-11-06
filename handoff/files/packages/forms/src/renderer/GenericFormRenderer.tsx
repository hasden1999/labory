import React from 'react';
import { FormSchema, FormFieldDefinition, FormSectionDefinition } from './types';
import { FormInput } from './FormInput';

export interface GenericFormRendererProps {
  schema: FormSchema;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  className?: string;
}

export const GenericFormRenderer: React.FC<GenericFormRendererProps> = ({
  schema,
  values,
  onChange,
  className = ''
}) => {
  const renderField = (field: FormFieldDefinition) => {
    const val = values[field.key] ?? field.defaultValue ?? '';

    switch (field.type) {
      case 'chips':
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{field.label}</span>
              {field.arabicLabel && <span className="text-slate-500 font-normal">{field.arabicLabel}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {(field.options || []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(field.key, opt)}
                  className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-all ${
                    val === opt
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{field.label}</span>
              {field.arabicLabel && <span className="text-slate-500 font-normal">{field.arabicLabel}</span>}
            </div>
            <select
              value={val}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">-- Choose / اختر --</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      case 'text':
      case 'number':
      default:
        return (
          <FormInput
            key={field.key}
            label={field.label}
            arabicLabel={field.arabicLabel}
            value={String(val)}
            onChange={(newVal) => onChange(field.key, newVal)}
            options={field.options}
            unit={field.unit}
            placeholder={field.normalRange ? `Ref: ${field.normalRange}` : undefined}
          />
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {schema.sections.map((section: FormSectionDefinition) => (
        <div
          key={section.id}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4"
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {section.title}
            </h3>
            {section.arabicTitle && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {section.arabicTitle}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.fields.map(renderField)}
          </div>
        </div>
      ))}
    </div>
  );
};
