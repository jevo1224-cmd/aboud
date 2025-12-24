
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-bold text-black mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-black font-bold bg-white placeholder:text-slate-400 ${
          error ? 'border-red-600' : 'border-slate-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-bold">{error}</p>}
    </div>
  );
};

export default Input;
