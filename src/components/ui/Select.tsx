import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string | null;
    hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { label, error, hint, id, className = "", children, ...rest },
    ref,
) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
        <div className={className}>
            {label && (
                <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-zinc-700">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    id={selectId}
                    className={`h-9 w-full appearance-none rounded-md border bg-white ps-3 pe-8 text-sm text-zinc-900 transition-colors duration-150 focus:outline-none focus:ring-2 ${error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-300 focus:border-primary focus:ring-primary/20"
                        }`}
                    {...rest}
                >
                    {children}
                </select>
                <ChevronDown
                    size={15}
                    className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
            </div>
            {error ? (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : hint ? (
                <p className="mt-1 text-xs text-zinc-400">{hint}</p>
            ) : null}
        </div>
    );
}); 