import { useEffect, useMemo, useState } from "react";
import { Banknote, Car, Eye, PackageMinus, Plus, SearchX } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import PurchaseModal from "../components/contracts/PurchaseModal";
import SaleModal from "../components/contracts/SaleModal";
import ItemDetailPanel from "../components/inventory/ItemDetailPanel";
import WithdrawModal from "../components/inventory/WithdrawModal";
import { Button, IconButton } from "../components/ui/Button";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import SearchInput from "../components/ui/SearchInput";
import { TableSkeleton } from "../components/ui/Skeleton";
import StatusChip from "../components/ui/StatusChip";
import { TableShell, Td, Th } from "../components/ui/Table";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { formatDate, formatMoney, formatNumber } from "../utils/format";
import type { PageProps } from "../types/nav";
import type { InventoryItemResponse } from "../types/models";

export default function InventoryPage({ intent, onIntentDone }: PageProps) {
    const { data, loading, error, refreshAll } = useData();
    const { t, locale } = useLanguage();
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [purchaseOpen, setPurchaseOpen] = useState(false);
    const [saleItemId, setSaleItemId] = useState<number | null>(null);
    const [withdrawTarget, setWithdrawTarget] = useState<InventoryItemResponse | null>(null);

    useEffect(() => {
        if (intent === "purchase") {
            setPurchaseOpen(true);
            onIntentDone();
        }
    }, [intent, onIntentDone]);

    const rows = useMemo(() => {
        const sorted = [...data.inventoryDetails].sort((a, b) =>
            b.item.entry_date.localeCompare(a.item.entry_date),
        );
        const q = query.trim().toLowerCase();
        if (!q) return sorted;
        return sorted.filter((row) => row.car.car_name.toLowerCase().includes(q));
    }, [data.inventoryDetails, query]);

    const selected =
        selectedId != null
            ? data.inventoryDetails.find((row) => row.item.id === selectedId) ?? null
            : null;

    if (error) {
        return (
            <div>
                <PageHeader title={t("inventory.title")} subtitle={t("inventory.subtitle")} />
                <ErrorState detail={error} onRetry={refreshAll} />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <PageHeader title={t("inventory.title")} subtitle={t("inventory.subtitle")} />
                <TableSkeleton rows={8} cols={7} />
            </div>
        );
    }

    if (selected) {
        return <ItemDetailPanel detail={selected} onBack={() => setSelectedId(null)} />;
    }

    return (
        <div>
            <PageHeader
                title={t("inventory.title")}
                subtitle={t("inventory.subtitle")}
                actions={
                    <Button onClick={() => setPurchaseOpen(true)}>
                        <Plus size={15} />
                        {t("inventory.recordPurchase")}
                    </Button>
                }
            />

            {rows.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white">
                    {query.trim() ? (
                        <EmptyState
                            icon={SearchX}
                            title={t("inventory.noResultsTitle")}
                            message={t("inventory.noResultsMessage")}
                        />
                    ) : (
                        <EmptyState
                            icon={Car}
                            title={t("inventory.emptyTitle")}
                            message={t("inventory.emptyMessage")}
                            action={
                                <Button onClick={() => setPurchaseOpen(true)}>
                                    <Plus size={15} />
                                    {t("inventory.recordPurchase")}
                                </Button>
                            }
                        />
                    )}
                </div>
            ) : (
                <>
                    <SearchInput
                        className="mb-3 max-w-xs"
                        value={query}
                        onChange={setQuery}
                        placeholder={t("inventory.searchPlaceholder")}
                    />
                    <TableShell minWidth={880}>
                        <thead>
                            <tr>
                                <Th>{t("inventory.colCar")}</Th>
                                <Th numeric>{t("inventory.colYear")}</Th>
                                <Th>{t("inventory.colOwnership")}</Th>
                                <Th>{t("inventory.colStatus")}</Th>
                                <Th>{t("inventory.colEntryDate")}</Th>
                                <Th numeric>{t("inventory.colExtraCosts")}</Th>
                                <Th>{t("common.actions")}</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const costsTotal = row.extra_cost.reduce((sum, cost) => sum + cost.price, 0);
                                const canSell = row.item.acquisition_type === "Owned" && row.item.status === "InStock";
                                const canWithdraw = row.item.status === "InStock";
                                return (
                                    <tr key={row.item.id}>
                                        <Td className="font-medium text-zinc-900">{row.car.car_name}</Td>
                                        <Td numeric>{formatNumber(row.car.production_date, locale)}</Td>
                                        <Td>
                                            <StatusChip value={row.item.acquisition_type} />
                                        </Td>
                                        <Td>
                                            <StatusChip value={row.item.status} />
                                        </Td>
                                        <Td>{formatDate(row.item.entry_date, locale)}</Td>
                                        <Td numeric className="text-zinc-900">
                                            {formatMoney(costsTotal, locale)}
                                        </Td>
                                        <Td>
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={Eye}
                                                    label={t("common.details")}
                                                    onClick={() => setSelectedId(row.item.id)}
                                                />
                                                {canSell && (
                                                    <IconButton
                                                        icon={Banknote}
                                                        label={t("inventory.sellTitle")}
                                                        onClick={() => setSaleItemId(row.item.id)}
                                                    />
                                                )}
                                                {canWithdraw && (
                                                    <IconButton
                                                        icon={PackageMinus}
                                                        label={t("inventory.withdrawTitle")}
                                                        onClick={() => setWithdrawTarget(row)}
                                                    />
                                                )}
                                            </div>
                                        </Td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </TableShell>
                </>
            )}

            <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />
            <SaleModal
                open={saleItemId != null}
                prefillItemId={saleItemId}
                onClose={() => setSaleItemId(null)}
            />
            <WithdrawModal
                open={withdrawTarget != null}
                detail={withdrawTarget}
                onClose={() => setWithdrawTarget(null)}
            />
        </div>
    );
}