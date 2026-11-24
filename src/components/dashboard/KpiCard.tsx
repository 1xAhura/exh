import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
}

export default function KpiCard({ icon: Icon, label, value }: KpiCardProps) {
    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon size={15} />
                </div>
                <span className="caps text-xs font-medium text-zinc-500">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-zinc-900">{value}</p>
        </div>
    );
}