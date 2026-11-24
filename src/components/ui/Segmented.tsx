interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedProps<T extends string> {
    value: T;
    options: SegmentedOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

export default function Segmented<T extends string>({
    value,
    options,
    onChange,
    className = "",
}: SegmentedProps<T>) {
    return (
        <div className={`inline-flex rounded-md border border-zinc-200 bg-zinc-100 p-0.5 ${className}`}>
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-[5px] px-3 py-1 text-sm font-medium transition-colors duration-150 ${active
                                ? "bg-white text-zinc-900 ring-1 ring-zinc-200"
                                : "text-zinc-500 hover:text-zinc-800"
                            }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}