import type { ReactNode } from "react";

export default function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <dt className="shrink-0 text-zinc-500">{label}</dt>
            <dd className="min-w-0 break-words text-end font-medium text-zinc-900">{children}</dd>
        </div>
    );
}