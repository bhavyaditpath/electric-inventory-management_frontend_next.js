import React from 'react';

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  step?: string;
  name?: string;
  error?: string;
  min?: string | number;
  max?: string | number;
  maxLength?: number;
}

const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  step,
  name,
  error,
  min,
  max,
  maxLength,
}: InputFieldProps) => {
  return (
    <div className="mb-2">
      <label className="block text-sm font-semibold text-[var(--theme-text)] mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        step={step}
        name={name}
        min={min}
        max={max}
        maxLength={maxLength}
        className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-[var(--theme-surface)] text-[var(--theme-text)]
          ${error ? 'border-red-500' : 'border-[var(--theme-border)]'}
        `}
      />

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default InputField;
