import { TrendingUp } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { formatMoney, formatMonth, formatNumber } from "../../utils/format";
import type { MonthlyProfitRow } from "../../utils/relations";
import { EmptyState } from "../ui/EmptyState";
import { TableShell, Td, Th } from "../ui/Table";

interface NetProfitPanelProps {
    total: number;
    months: MonthlyProfitRow[];
}

export default function NetProfitPanel({ total, months }: NetProfitPanelProps) {
    const { t, locale } = useLanguage();
    return (
        <section className="flex flex-col rounded-lg border border-zinc-200 bg-white">
            <header className="border-b border-zinc-200 px-4 py-4">
                <div className="flex items-center gap-2 text-zinc-500">
                    <TrendingUp size={15} />
                    <h2 className="caps text-xs font-medium">{t("dashboard.netProfitTitle")}</h2>
                </div>
                <p
                    className={`mt-1.5 text-2xl font-semibold tabular-nums ${total < 0 ? "text-red-600" : "text-zinc-900"
                        }`}
                >
                    {formatMoney(total, locale)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">{t("dashboard.netProfitSubtitle")}</p>
            </header>
            {months.length === 0 ? (
                <EmptyState compact icon={TrendingUp} title={t("dashboard.noProfitData")} />
            ) : (
                <TableShell plain>
                    <thead>
                        <tr>
                            <Th>{t("dashboard.colMonth")}</Th>
                            <Th numeric>{t("dashboard.colSales")}</Th>
                            <Th numeric>{t("dashboard.colProfit")}</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {months.map((row) => (
                            <tr key={row.month}>
                                <Td className="font-medium text-zinc-900">{formatMonth(row.month, locale)}</Td>
                                <Td numeric>{formatNumber(row.salesCount, locale)}</Td>
                                <Td numeric className={row.netProfit < 0 ? "text-red-600" : "text-zinc-900"}>
                                    {formatMoney(row.netProfit, locale)}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            )}
        </section>
    );
}