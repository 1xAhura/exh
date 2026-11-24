export function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-zinc-200/70 ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center gap-6 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-24" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex items-center gap-6 border-b border-zinc-100 px-4 py-3.5 last:border-b-0">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton key={i} className={`h-3 ${i === 0 ? "w-32" : "w-20"}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}