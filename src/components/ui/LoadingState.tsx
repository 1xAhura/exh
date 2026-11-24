import { Spinner } from './Spinner';

interface LoadingStateProps {
    label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
    return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <Spinner className="h-6 w-6 text-slate-400" />
            {label && <p className="text-sm">{label}</p>}
        </div>
    );
}