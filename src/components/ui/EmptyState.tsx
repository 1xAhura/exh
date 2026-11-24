import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Button } from "./Button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    message?: string;
    action?: ReactNode;
    compact?: boolean;
}

export function EmptyState({ icon: Icon, title, message, action, compact = false }: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center text-center ${compact ? "px-6 py-10" : "px-6 py-16"}`}>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <Icon size={20} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
            {message && <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">{message}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function ErrorState({ detail, onRetry }: { detail?: string | null; onRetry: () => void }) {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-500">
                <TriangleAlert size={20} />
            </div>
            <h3 className="text-sm font-semibold text-red-800">{t("common.loadErrorTitle")}</h3>
            <p className="mt-1 max-w-md break-words text-sm leading-6 text-red-600">
                {detail || t("common.loadErrorMessage")}
            </p>
            <Button variant="secondary" className="mt-4" onClick={onRetry}>
                {t("common.retry")}
            </Button>
        </div>
    );
}