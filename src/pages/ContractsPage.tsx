import { useEffect, useMemo, useState } from "react";
import { Banknote, FileText, Plus, SearchX } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import PurchaseModal from "../components/contracts/PurchaseModal";
import SaleModal from "../components/contracts/SaleModal";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import SearchInput from "../components/ui/SearchInput";
import Segmented from "../components/ui/Segmented";
import { TableSkeleton } from "../components/ui/Skeleton";
import StatusChip from "../components/ui/StatusChip";
import { TableShell, Td, Th } from "../components/ui/Table";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { formatDate, formatMoney } from "../utils/format";
import { carNameForItem, findPerson } from "../utils/relations";
import type { PageProps } from "../types/nav";

type TypeFilter = "all" | "Purchase" | "Sale";

export default function ContractsPage({ intent, onIntentDone }: PageProps) {
    const { data, loading, error, refreshAll } = useData();
    const { t, locale } = useLanguage();
    const [query, setQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [purchaseOpen, setPurchaseOpen] = useState(false);
    const [saleOpen, setSaleOpen] = useState(false);

    useEffect(() => {
        if (intent === "purchase") {
            setPurchaseOpen(true);
            onIntentDone();
        } else if (intent === "sale") {
            setSaleOpen(true);
            onIntentDone();
        }
    }, [intent, onIntentDone]);

    const rows = useMemo(() => {
        const dealership = t("common.dealership");
        const enriched = data.contracts.map((contract) => ({
            contract,
            carName: carNameForItem(data.items, data.cars, contract.inventory_item_id),
            buyerName: findPerson(data.people, contract.buyer_id)?.name ?? dealership,
            sellerName: findPerson(data.people, contract.seller_id)?.name ?? dealership,
        }));
        const sorted = enriched.sort(
            (a, b) => b.contract.date.localeCompare(a.contract.date) || b.contract.id - a.contract.id,
        );
        const q = query.trim().toLowerCase();
        return sorted.filter((row) => {
            if (typeFilter !== "all" && row.contract.contract_type !== typeFilter) return false;
            if (!q) return true;
            return (
                row.contract.contract_number.toLowerCase().includes(q) ||
                row.carName.toLowerCase().includes(q) ||
                row.buyerName.toLowerCase().includes(q) ||
                row.sellerName.toLowerCase().includes(q)
            );
        });
    }, [data, query, typeFilter, t]);

    if (error) {
        return (
            <div>
                <PageHeader title={t("contracts.title")} subtitle={t("contracts.subtitle")} />
                <ErrorState detail={error} onRetry={refreshAll} />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <PageHeader title={t("contracts.title")} subtitle={t("contracts.subtitle")} />
                <TableSkeleton rows={8} cols={7} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={t("contracts.title")}
                subtitle={t("contracts.subtitle")}
                actions={
                    <>
                        <Button variant="secondary" onClick={() => setPurchaseOpen(true)}>
                            <Plus size={15} />
                            {t("contracts.recordPurchase")}
                        </Button>
                        <Button onClick={() => setSaleOpen(true)}>
                            <Banknote size={15} />
                            {t("contracts.recordSale")}
                        </Button>
                    </>
                }
            />

            {data.contracts.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white">
                    <EmptyState
                        icon={FileText}
                        title={t("contracts.emptyTitle")}
                        message={t("contracts.emptyMessage")}
                        action={
                            <Button onClick={() => setPurchaseOpen(true)}>
                                <Plus size={15} />
                                {t("contracts.recordPurchase")}
                            </Button>
                        }
                    />
                </div>
            ) : (
                <>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                        <SearchInput
                            className="w-full max-w-xs"
                            value={query}
                            onChange={setQuery}
                            placeholder={t("contracts.searchPlaceholder")}
                        />
                        <Segmented
                            value={typeFilter}
                            onChange={setTypeFilter}
                            options={[
                                { value: "all", label: t("contracts.filterAll") },
                                { value: "Purchase", label: t("contracts.filterPurchase") },
                                { value: "Sale", label: t("contracts.filterSale") },
                            ]}
                        />
                    </div>

                    {rows.length === 0 ? (
                        <div className="rounded-lg border border-zinc-200 bg-white">
                            <EmptyState
                                icon={SearchX}
                                title={t("contracts.noResultsTitle")}
                                message={t("contracts.noResultsMessage")}
                            />
                        </div>
                    ) : (
                        <TableShell minWidth={960}>
                            <thead>
                                <tr>
                                    <Th>{t("contracts.colType")}</Th>
                                    <Th>{t("contracts.colNumber")}</Th>
                                    <Th>{t("contracts.colDate")}</Th>
                                    <Th>{t("contracts.colCar")}</Th>
                                    <Th>{t("contracts.colBuyer")}</Th>
                                    <Th>{t("contracts.colSeller")}</Th>
                                    <Th numeric>{t("contracts.colPrice")}</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.contract.id}>
                                        <Td>
                                            <StatusChip value={row.contract.contract_type} />
                                        </Td>
                                        <Td className="font-medium text-zinc-900">
                                            <bdi>{row.contract.contract_number}</bdi>
                                        </Td>
                                        <Td>{formatDate(row.contract.date, locale)}</Td>
                                        <Td>{row.carName || "—"}</Td>
                                        <Td>{row.buyerName}</Td>
                                        <Td>{row.sellerName}</Td>
                                        <Td numeric className="text-zinc-900">
                                            {formatMoney(row.contract.price, locale)}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    )}
                </>
            )}

            <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />
            <SaleModal open={saleOpen} onClose={() => setSaleOpen(false)} />
        </div>
    );
}