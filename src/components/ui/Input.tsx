import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
        <div className="space-y-1.5">
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                {label}
            </label>
            <input
                id={inputId}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${error
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
                    } ${className}`}
                {...props}
            />
            {error ? (
                <p id={errorId} className="text-xs font-medium text-red-600">
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className="text-xs text-slate-500">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}