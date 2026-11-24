import { useMemo } from "react";
import { Banknote, Car, Plus, ScrollText, UserPlus, Wallet } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import KpiCard from "../components/dashboard/KpiCard";
import NetProfitPanel from "../components/dashboard/NetProfitPanel";
import RecentContracts from "../components/dashboard/RecentContracts";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { computeNetProfitSummary } from "../utils/relations";
import { formatMoney, formatNumber } from "../utils/format";
import type { PageProps } from "../types/nav";

export default function DashboardPage({ onNavigate }: PageProps) {
    const { data, loading, error, refreshAll } = useData();
    const { t, locale } = useLanguage();

    const kpis = useMemo(() => {
        const inStock = data.items.filter((item) => item.status === "InStock").length;
        const sold = data.items.filter((item) => item.status === "Sold").length;
        const activeConsignments = data.agreements.filter((a) => a.status === "Active").length;
        const contractValue = data.contracts.reduce((sum, contract) => sum + contract.price, 0);
        return { inStock, sold, activeConsignments, contractValue };
    }, [data]);

    const profit = useMemo(
        () => computeNetProfitSummary(data.contracts, data.extraCosts, data.agreements),
        [data],
    );

    const recent = useMemo(
        () =>
            [...data.contracts]
                .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                .slice(0, 5),
        [data],
    );

    if (error) {
        return (
            <div>
                <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />
                <ErrorState detail={error} onRetry={refreshAll} />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="mt-3 h-7 w-16" />
                        </div>
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-white p-5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-3 h-8 w-44" />
                        <Skeleton className="mt-6 h-28 w-full" />
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-white p-5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-4 h-3 w-full" />
                        <Skeleton className="mt-3 h-3 w-full" />
                        <Skeleton className="mt-3 h-3 w-2/3" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <KpiCard icon={Car} label={t("dashboard.kpiInStock")} value={formatNumber(kpis.inStock, locale)} />
                <KpiCard icon={Banknote} label={t("dashboard.kpiSold")} value={formatNumber(kpis.sold, locale)} />
                <KpiCard
                    icon={ScrollText}
                    label={t("dashboard.kpiActiveConsignments")}
                    value={formatNumber(kpis.activeConsignments, locale)}
                />
                <KpiCard
                    icon={Wallet}
                    label={t("dashboard.kpiContractValue")}
                    value={formatMoney(kpis.contractValue, locale)}
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <NetProfitPanel total={profit.total} months={profit.months} />
                <RecentContracts contracts={recent} />
            </div>

            <section className="mt-6">
                <h2 className="text-sm font-semibold text-zinc-900">{t("dashboard.quickActions")}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => onNavigate("contracts", "purchase")}>
                        <Plus size={15} />
                        {t("dashboard.qaPurchase")}
                    </Button>
                    <Button variant="secondary" onClick={() => onNavigate("contracts", "sale")}>
                        <Banknote size={15} />
                        {t("dashboard.qaSale")}
                    </Button>
                    <Button variant="secondary" onClick={() => onNavigate("agreements", "agreement")}>
                        <ScrollText size={15} />
                        {t("dashboard.qaAgreement")}
                    </Button>
                    <Button variant="secondary" onClick={() => onNavigate("people", "person")}>
                        <UserPlus size={15} />
                        {t("dashboard.qaPerson")}
                    </Button>
                </div>
            </section>
        </div>
    );
}