import { Search } from "lucide-react";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
}

export default function SearchInput({ value, onChange, placeholder, className = "" }: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <Search size={15} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-9 w-full rounded-md border border-zinc-300 bg-white ps-8 pe-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
        </div>
    );
}