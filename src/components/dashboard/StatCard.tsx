import type { ReactNode } from 'react';

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {icon}
                </div>
                <span className="text-sm font-medium text-slate-500">{label}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}