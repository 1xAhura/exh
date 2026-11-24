import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Toast from "../components/ui/Toast";

export type ToastType = "success" | "error";

interface ToastEntry {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastEntry[]>([]);
    const nextId = useRef(0);

    const toast = useCallback((type: ToastType, message: string) => {
        const id = ++nextId.current;
        setToasts((list) => [...list, { id, type, message }]);
        window.setTimeout(
            () => setToasts((list) => list.filter((entry) => entry.id !== id)),
            type === "error" ? 7000 : 4000,
        );
    }, []);

    const value = useMemo(() => ({ toast }), [toast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed bottom-4 end-4 z-[70] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
                {toasts.map((entry) => (
                    <Toast key={entry.id} type={entry.type} message={entry.message} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}