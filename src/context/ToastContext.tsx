import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from './LanguageContext';
import { AlertIcon, CheckIcon, XIcon } from '../components/ui/icons';

export type ToastType = 'success' | 'error';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 4000;
let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const { t } = useLanguage();
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismissToast = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string) => {
            const id = ++nextToastId;
            setToasts((current) => [...current, { id, type, message }]);
            window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
        },
        [dismissToast],
    );

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* `end-4` places toasts at the bottom-right in LTR and bottom-left in RTL */}
            <div
                role="status"
                aria-live="polite"
                className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-md"
                    >
                        {toast.type === 'success' ? (
                            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        ) : (
                            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        )}
                        <p className="flex-1 text-sm leading-5 text-slate-700">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => dismissToast(toast.id)}
                            aria-label={t.common.dismiss}
                            className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}