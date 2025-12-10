import React from 'react';

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  step?: string;
  name?: string;
  error?: string;
}

const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  step,
  name,
  error,
}: InputFieldProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        step={step}
        name={name}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default InputField;
