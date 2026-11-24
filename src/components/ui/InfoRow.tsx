import type { ReactNode } from "react";

export default function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="shrink-0 text-zinc-500">{label}</dt>
            <dd className="text-end font-medium text-zinc-900">{children}</dd>
        </div>
    );
}