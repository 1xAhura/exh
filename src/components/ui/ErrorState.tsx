import { useLanguage } from '../../context/LanguageContext';
import { AlertIcon, RefreshIcon } from './icons';
import { Button } from './Button';

interface ErrorStateProps {
    title: string;
    description?: string;
    onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {onRetry && (
                <Button variant="secondary" size="sm" className="mt-4" icon={<RefreshIcon className="h-4 w-4" />} onClick={onRetry}>
                    {t.common.retry}
                </Button>
            )}
        </div>
    );
}