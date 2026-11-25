import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import * as api from "../api/client";
import PageHeader from "../components/layout/PageHeader";
import SalesBarChart from "../components/sales/SalesBarChart";
import type { SalesChartPoint } from "../components/sales/SalesBarChart";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import Segmented from "../components/ui/Segmented";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import type {
    CalendarType,
    DailySalesPoint,
    MonthlySalesResponse,
    MonthlySalesPoint,
    YearlySalesResponse,
} from "../types/sales";
import {
    CALENDAR_YEAR_BOUNDS,
    getMonthNames,
    gregorianToJalali,
    jalaliToGregorian,
} from "../utils/calendar";
import { formatNumber, todayISO } from "../utils/format";

type SalesMode = "monthly" | "yearly";

/** Normalized command result, independent of the selected calendar. */
type SalesData =
    | { kind: "monthly"; totalDays: number; points: DailySalesPoint[] }
    | { kind: "yearly"; points: MonthlySalesPoint[] };

function ChartSkeleton({ bars }: { bars: number }) {
    return (
        <div dir="ltr" className="w-full">
            <div className="flex h-48 items-stretch gap-1">
                {Array.from({ length: bars }).map((_, i) => (
                    <div key={i} className="flex min-w-0 flex-1 items-end">
                        <div className="w-full" style={{ height: `${18 + ((i * 29) % 62)}%` }}>
                            <Skeleton className="h-full w-full" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t border-zinc-200" />
        </div>
    );
}

export default function SalesPage() {
    const { t, locale } = useLanguage();
    const { data, loading: dataLoading } = useData();

    // Persian UI defaults to the Jalali calendar; English to Gregorian.
    const [calendar, setCalendar] = useState<CalendarType>(
        locale === "fa" ? "Persian" : "Gregorian",
    );
    const [mode, setMode] = useState<SalesMode>("monthly");
    const [yearText, setYearText] = useState("");
    const [month, setMonth] = useState(1);
    const [sales, setSales] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initDone, setInitDone] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const bounds = CALENDAR_YEAR_BOUNDS[calendar];
    const parsedYear = Number(yearText);
    const yearValid =
        yearText.trim() !== "" &&
        Number.isInteger(parsedYear) &&
        parsedYear >= bounds.min &&
        parsedYear <= bounds.max;

    // Initialise the selection to the most recent recorded sale (or today)
    // once the base collections are available.
    useEffect(() => {
        if (initDone || dataLoading) return;
        const saleDates = data.contracts
            .filter((contract) => contract.contract_type === "Sale")
            .map((contract) => contract.date)
            .sort();
        const latest = saleDates.length > 0 ? saleDates[saleDates.length - 1] : todayISO();
        const [gy, gm] = latest.split("-").map(Number);
        if (calendar === "Persian") {
            const jalali = gregorianToJalali(gy, gm, 15);
            setYearText(String(jalali.jy));
            setMonth(jalali.jm);
        } else {
            setYearText(String(gy));
            setMonth(gm);
        }
        setInitDone(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initDone, dataLoading]);

    // Fetch whenever the selection changes.
    useEffect(() => {
        if (!yearValid) {
            setSales(null);
            setError(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        const request =
            mode === "monthly"
                ? api.getMonthlySales({ year: parsedYear, month, calendar })
                : api.getYearlySales({ year: parsedYear, calendar });
        request
            .then((response) => {
                if (cancelled) return;
                if (mode === "monthly") {
                    const result = response as MonthlySalesResponse;
                    setSales({ kind: "monthly", totalDays: result.total_days, points: result.data });
                } else {
                    const result = response as YearlySalesResponse;
                    setSales({ kind: "yearly", points: result.data });
                }
            })
            .catch((err) => {
                if (!cancelled) setError(api.errorText(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [mode, calendar, month, parsedYear, yearValid, reloadKey]);

    /** Switching calendars converts the currently selected period across. */
    function handleCalendarChange(next: CalendarType) {
        if (next === calendar) return;
        const currentYear = Number(yearText);
        if (Number.isInteger(currentYear) && currentYear > 0) {
            if (next === "Persian") {
                const jalali = gregorianToJalali(currentYear, month, 15);
                setYearText(String(jalali.jy));
                setMonth(jalali.jm);
            } else {
                const gregorian = jalaliToGregorian(currentYear, month, 15);
                setYearText(String(gregorian.gy));
                setMonth(gregorian.gm);
            }
        }
        setCalendar(next);
    }

    const monthNames = getMonthNames(locale, calendar);

    // Fill the gaps: missing days/months from the backend are zero.
    const points = useMemo<SalesChartPoint[]>(() => {
        if (!sales) return [];
        const barLabel = (value: number) =>
            t("sales.barLabel", { value: formatNumber(value, locale) });
        if (sales.kind === "monthly") {
            const byDay = new Map(sales.points.map((p) => [p.day, p.quantity]));
            return Array.from({ length: sales.totalDays }, (_, i) => {
                const day = i + 1;
                const value = byDay.get(day) ?? 0;
                const label = formatNumber(day, locale);
                return { label, value, tooltip: `${label} · ${barLabel(value)}` };
            });
        }
        const byMonth = new Map(sales.points.map((p) => [p.month, p.quantity]));
        return monthNames.map((name, i) => {
            const value = byMonth.get(i + 1) ?? 0;
            return { label: name, value, tooltip: `${name} · ${barLabel(value)}` };
        });
    }, [sales, monthNames, locale, t]);

    const total = useMemo(() => points.reduce((sum, p) => sum + p.value, 0), [points]);

    const chartTitle =
        mode === "monthly"
            ? `${monthNames[month - 1]} ${formatNumber(parsedYear, locale)}`
            : formatNumber(parsedYear, locale);

    const yearError = !initDone || yearValid
        ? null
        : t("sales.yearInvalid", {
            min: formatNumber(bounds.min, locale),
            max: formatNumber(bounds.max, locale),
        });

    return (
        <div>
            <PageHeader title={t("sales.title")} subtitle={t("sales.subtitle")} />

            <section className="rounded-lg border border-zinc-200 bg-white">
                <header className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-zinc-200 px-4 py-3">
                    <Segmented
                        value={mode}
                        onChange={setMode}
                        options={[
                            { value: "monthly", label: t("sales.modeMonthly") },
                            { value: "yearly", label: t("sales.modeYearly") },
                        ]}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">{t("sales.calendarLabel")}</span>
                        <Segmented
                            value={calendar}
                            onChange={handleCalendarChange}
                            options={[
                                { value: "Gregorian", label: t("sales.calendarGregorian") },
                                { value: "Persian", label: t("sales.calendarJalali") },
                            ]}
                        />
                    </div>
                    <div className="ms-auto flex flex-wrap items-end gap-3">
                        {mode === "monthly" && (
                            <Select
                                label={t("sales.monthLabel")}
                                className="w-44"
                                value={String(month)}
                                onChange={(event) => setMonth(Number(event.target.value))}
                            >
                                {monthNames.map((name, index) => (
                                    <option key={name} value={index + 1}>
                                        {name}
                                    </option>
                                ))}
                            </Select>
                        )}
                        <Input
                            label={t("sales.yearLabel")}
                            type="number"
                            dir="ltr"
                            min={bounds.min}
                            max={bounds.max}
                            className="w-36"
                            value={yearText}
                            onChange={(event) => setYearText(event.target.value)}
                            error={yearError}
                        />
                    </div>
                </header>

                <div className="px-4 py-5">
                    {!initDone || dataLoading ? (
                        <ChartSkeleton bars={mode === "monthly" ? 30 : 12} />
                    ) : !yearValid ? (
                        <EmptyState
                            compact
                            icon={BarChart3}
                            title={t("sales.yearInvalid", {
                                min: formatNumber(bounds.min, locale),
                                max: formatNumber(bounds.max, locale),
                            })}
                        />
                    ) : error ? (
                        <ErrorState detail={error} onRetry={() => setReloadKey((k) => k + 1)} />
                    ) : loading || !sales ? (
                        <ChartSkeleton bars={mode === "monthly" ? 30 : 12} />
                    ) : total === 0 ? (
                        <EmptyState
                            compact
                            icon={BarChart3}
                            title={t("sales.emptyTitle")}
                            message={t("sales.emptyMessage")}
                        />
                    ) : (
                        <>
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-zinc-900">{chartTitle}</h2>
                                    <p className="mt-0.5 text-xs text-zinc-500">
                                        {mode === "monthly" ? t("sales.dailyChartTitle") : t("sales.monthlyChartTitle")}
                                    </p>
                                </div>
                                <div className="text-end">
                                    <p className="text-xl font-semibold tabular-nums text-zinc-900">
                                        {formatNumber(total, locale)}
                                    </p>
                                    <p className="text-xs text-zinc-500">{t("sales.totalSales")}</p>
                                </div>
                            </div>
                            <SalesBarChart points={points} showValues={mode === "yearly"} />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}