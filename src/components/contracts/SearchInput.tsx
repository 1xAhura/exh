import { SearchIcon } from '../ui/icons';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
    return (
        <div className="relative w-full sm:w-72">
            {/* `start-0` keeps the icon on the correct side in both LTR and RTL */}
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400">
                <SearchIcon className="h-4 w-4" />
            </span>
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pe-3 ps-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}