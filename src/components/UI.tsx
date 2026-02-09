import React from 'react';
import { cn } from '@/utils/cn';
import { Info, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';

/* ─── Input ─── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({ label, required, hint, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {icon && <span className="text-purple-500">{icon}</span>}
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      {hint && <HintText>{hint}</HintText>}
      <input
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200',
          'placeholder:text-gray-400',
          'focus:border-purple-400 focus:outline-none focus:ring-3 focus:ring-purple-100',
          'hover:border-purple-300',
          className
        )}
        {...props}
      />
    </div>
  );
}

/* ─── TextArea ─── */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}

export function TextArea({ label, required, hint, icon, className, ...props }: TextAreaProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {icon && <span className="text-purple-500">{icon}</span>}
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      {hint && <HintText>{hint}</HintText>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 min-h-[110px] resize-y',
          'placeholder:text-gray-400',
          'focus:border-purple-400 focus:outline-none focus:ring-3 focus:ring-purple-100',
          'hover:border-purple-300',
          className
        )}
        {...props}
      />
    </div>
  );
}

/* ─── RadioGroup ─── */
interface RadioOption {
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  options: RadioOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  withOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  horizontal?: boolean;
}

export function RadioGroup({
  label, required, hint, icon, options, value, onChange, withOther, otherValue, onOtherChange, horizontal
}: RadioGroupProps) {
  const normalizedOptions: RadioOption[] = options.map((o) =>
    typeof o === 'string' ? { label: o } : o
  );

  return (
    <div className="space-y-2.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {icon && <span className="text-purple-500">{icon}</span>}
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      {hint && <HintText>{hint}</HintText>}
      <div className={cn('gap-2', horizontal ? 'flex flex-wrap' : 'flex flex-col')}>
        {normalizedOptions.map((option) => (
          <div
            key={option.label}
            role="button"
            tabIndex={0}
            onClick={() => onChange(option.label)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(option.label); }}}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 text-sm group select-none',
              horizontal && 'flex-1 min-w-[120px] justify-center',
              value === option.label
                ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-purple-50/50 text-purple-800 shadow-sm ring-1 ring-purple-200'
                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/20'
            )}
          >
            <div className={cn(
              'w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
              value === option.label ? 'border-purple-600 bg-purple-600' : 'border-gray-300 group-hover:border-purple-300'
            )}>
              {value === option.label && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="text-left">
              <span className={cn(value === option.label && 'font-medium')}>{option.label}</span>
              {option.description && (
                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
              )}
            </div>
          </div>
        ))}
        {withOther && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onChange('__other__')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange('__other__'); }}}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 text-sm group select-none',
              value === '__other__'
                ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-purple-50/50 text-purple-800 shadow-sm ring-1 ring-purple-200'
                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/20'
            )}
          >
            <div className={cn(
              'w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
              value === '__other__' ? 'border-purple-600 bg-purple-600' : 'border-gray-300 group-hover:border-purple-300'
            )}>
              {value === '__other__' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className="flex-shrink-0 text-gray-500">Другое:</span>
            <input
              type="text"
              className="flex-1 border-b border-gray-300 bg-transparent py-0.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none transition-colors"
              value={otherValue || ''}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                onChange('__other__');
                onOtherChange?.(e.target.value);
              }}
              onFocus={() => onChange('__other__')}
              placeholder="Укажите..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── HintText ─── */
function HintText({ children }: { children: string }) {
  const lines = children.split('\n');
  return (
    <div className="text-xs text-gray-500 leading-relaxed space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('•') || line.startsWith('·')) {
          return (
            <div key={i} className="flex items-start gap-1.5 ml-2">
              <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
              <span>{line.slice(1).trim()}</span>
            </div>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

/* ─── InfoBox ─── */
interface InfoBoxProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'purple' | 'success';
  icon?: React.ReactNode;
}

export function InfoBox({ children, variant = 'info', icon }: InfoBoxProps) {
  const styles = {
    info: 'bg-blue-50/80 border-blue-200/60 text-blue-800',
    warning: 'bg-amber-50/80 border-amber-200/60 text-amber-800',
    purple: 'bg-purple-50/80 border-purple-200/60 text-purple-800',
    success: 'bg-emerald-50/80 border-emerald-200/60 text-emerald-800',
  };
  const defaultIcons = {
    info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />,
    purple: <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />,
    success: <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
  };
  return (
    <div className={cn('rounded-xl border p-4 text-sm leading-relaxed', styles[variant])}>
      <div className="flex items-start gap-3">
        {icon || defaultIcons[variant]}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

/* ─── StepCard ─── */
interface StepCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function StepCard({ children, title, subtitle, icon }: StepCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100/80 bg-white p-6 md:p-8 shadow-xl shadow-purple-100/10">
      {(title || subtitle) && (
        <div className="mb-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md shadow-purple-200">
                <span className="text-white">{icon}</span>
              </div>
            )}
            <div>
              {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

/* ─── Divider ─── */
export function Divider({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }
  return <div className="h-px bg-gray-100" />;
}

/* ─── NumberStepper ─── */
interface NumberStepperProps {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

export function NumberStepper({ label, required, icon, hint, value, onChange, min, max }: NumberStepperProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {icon && <span className="text-purple-500">{icon}</span>}
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      {hint && <HintText>{hint}</HintText>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center text-lg font-bold transition-all',
            value <= min
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 active:scale-95'
          )}
        >
          −
        </button>
        <div className="w-16 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-sm font-bold text-gray-900">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center text-lg font-bold transition-all',
            value >= max
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 active:scale-95'
          )}
        >
          +
        </button>
        <span className="text-xs text-gray-400">
          {min === max ? `${min} трек(ов)` : `от ${min} до ${max}`}
        </span>
      </div>
    </div>
  );
}

/* ─── DatePicker ─── */
interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}

export function DatePicker({ label, required, hint, icon, className, ...props }: DatePickerProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {icon && <span className="text-purple-500">{icon}</span>}
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      {hint && <HintText>{hint}</HintText>}
      <div className="relative">
        <input
          type="date"
          className={cn(
            'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200',
            'placeholder:text-gray-400',
            'focus:border-purple-400 focus:outline-none focus:ring-3 focus:ring-purple-100',
            'hover:border-purple-300',
            'date-input-custom',
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
}

/* ─── Select ─── */
interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  options: SelectOption[] | string[];
  onChange: (value: string) => void;
  value: string;
  placeholder?: string;
}

export function Select({ 
  label, 
  required, 
  hint, 
  icon, 
  options, 
  value, 
  onChange, 
  placeholder,
  className,
  ...props 
}: SelectProps) {
  const normalizedOptions: SelectOption[] = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  const selectElement = (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 appearance-none cursor-pointer',
          'focus:border-purple-400 focus:outline-none focus:ring-3 focus:ring-purple-100',
          'hover:border-purple-300 hover:shadow-md',
          'select-custom',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-hover:translate-y-[-1px]">
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
      </div>
    </div>
  );

  if (label) {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {icon && <span className="text-purple-500">{icon}</span>}
          {label}
          {required && <span className="text-red-400 text-xs">*</span>}
        </label>
        {hint && <HintText>{hint}</HintText>}
        {selectElement}
      </div>
    );
  }

  return selectElement;
}
