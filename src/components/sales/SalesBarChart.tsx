import { useLanguage } from "../../context/LanguageContext";
import { formatNumber } from "../../utils/format";

export interface SalesChartPoint {
    label: string;
    value: number;
    tooltip: string;
}

interface SalesBarChartProps {
    points: SalesChartPoint[];
    /** Show the numeric value above each bar (recommended for ≤ 12 bars). */
    showValues?: boolean;
}

export default function SalesBarChart({ points, showValues = false }: SalesBarChartProps) {
    const { locale } = useLanguage();
    const max = Math.max(1, ...points.map((p) => p.value));
    // Thin the x-axis labels on long (29-31 day) charts so they never crowd.
    const labelStep = Math.max(1, Math.ceil(points.length / 16));

    return (
        <div dir="ltr" className="w-full">
            <div className="flex h-48 items-stretch gap-[2px] sm:gap-1">
                {points.map((point, index) => {
                    const zero = point.value === 0;
                    const height = zero
                        ? undefined
                        : `${Math.max(3, Math.round((point.value / max) * 88))}%`;
                    return (
                        <div
                            key={index}
                            title={point.tooltip}
                            className="flex min-w-0 flex-1 cursor-default flex-col items-center justify-end"
                        >
                            {showValues && !zero && (
                                <span className="mb-1 text-[10px] font-medium tabular-nums text-zinc-600">
                                    {formatNumber(point.value, locale)}
                                </span>
                            )}
                            <div
                                className={`w-full rounded-t-sm transition-colors duration-150 ${zero ? "h-[2px] bg-zinc-200" : "bg-primary hover:bg-primary-hover"
                                    }`}
                                style={height ? { height } : undefined}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="border-t border-zinc-200" />
            <div className="mt-1.5 flex gap-[2px] sm:gap-1">
                {points.map((point, index) => (
                    <div
                        key={index}
                        className="min-w-0 flex-1 text-center text-[10px] leading-4 text-zinc-500"
                    >
                        {index % labelStep === 0 ? (
                            <span className="block truncate" title={point.label}>
                                {point.label}
                            </span>
                        ) : (
                            "\u00A0"
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}