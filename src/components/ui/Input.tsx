import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string | null;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, error, hint, id, className = "", ...rest },
    ref,
) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
        <div className={className}>
            {label && (
                <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-zinc-700">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-zinc-900 transition-colors duration-150 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-300 focus:border-primary focus:ring-primary/20"
                    }`}
                {...rest}
            />
            {error ? (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : hint ? (
                <p className="mt-1 text-xs text-zinc-400">{hint}</p>
            ) : null}
        </div>
    );
});