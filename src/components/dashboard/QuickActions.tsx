import type { ReactNode } from 'react';

interface QuickAction {
    label: string;
    icon: ReactNode;
    onClick: () => void;
}

interface QuickActionsProps {
    actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
                <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-start text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        {action.icon}
                    </span>
                    {action.label}
                </button>
            ))}
        </div>
    );
}