import { useEffect, useMemo, useState } from "react";
import { CalendarX, CircleCheck, CircleX, Plus, ScrollText } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import CompleteModal from "../components/agreements/CompleteModal";
import CloseModal from "../components/agreements/CloseModal";
import NewAgreementModal from "../components/agreements/NewAgreementModal";
import { Button, IconButton } from "../components/ui/Button";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/Skeleton";
import StatusChip from "../components/ui/StatusChip";
import { TableShell, Td, Th } from "../components/ui/Table";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { formatDate } from "../utils/format";
import { carNameForItem, findPerson, formatCommission } from "../utils/relations";
import type { PageProps } from "../types/nav";
import type { ConsignmentAgreement } from "../types/models";

interface CloseTarget {
    agreement: ConsignmentAgreement;
    mode: "expire" | "cancel";
}

export default function AgreementsPage({ intent, onIntentDone }: PageProps) {
    const { data, loading, error, refreshAll } = useData();
    const { t, locale } = useLanguage();
    const [newOpen, setNewOpen] = useState(false);
    const [completeTarget, setCompleteTarget] = useState<ConsignmentAgreement | null>(null);
    const [closeTarget, setCloseTarget] = useState<CloseTarget | null>(null);

    useEffect(() => {
        if (intent === "agreement") {
            setNewOpen(true);
            onIntentDone();
        }
    }, [intent, onIntentDone]);

    const rows = useMemo(
        () =>
            data.agreements
                .map((agreement) => ({
                    agreement,
                    carName: carNameForItem(data.items, data.cars, agreement.inventory_item_id),
                    ownerName: findPerson(data.people, agreement.owner_id)?.name ?? "—",
                }))
                .sort((a, b) => {
                    // Active first (they are the actionable ones), then newest start date.
                    const activeA = a.agreement.status === "Active" ? 0 : 1;
                    const activeB = b.agreement.status === "Active" ? 0 : 1;
                    if (activeA !== activeB) return activeA - activeB;
                    return b.agreement.start_date.localeCompare(a.agreement.start_date);
                }),
        [data],
    );

    if (error) {
        return (
            <div>
                <PageHeader title={t("agreements.title")} subtitle={t("agreements.subtitle")} />
                <ErrorState detail={error} onRetry={refreshAll} />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <PageHeader title={t("agreements.title")} subtitle={t("agreements.subtitle")} />
                <TableSkeleton rows={6} cols={9} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={t("agreements.title")}
                subtitle={t("agreements.subtitle")}
                actions={
                    <Button onClick={() => setNewOpen(true)}>
                        <Plus size={15} />
                        {t("agreements.newAgreement")}
                    </Button>
                }
            />

            {rows.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white">
                    <EmptyState
                        icon={ScrollText}
                        title={t("agreements.emptyTitle")}
                        message={t("agreements.emptyMessage")}
                        action={
                            <Button onClick={() => setNewOpen(true)}>
                                <Plus size={15} />
                                {t("agreements.newAgreement")}
                            </Button>
                        }
                    />
                </div>
            ) : (
                <TableShell minWidth={1040}>
                    <thead>
                        <tr>
                            <Th>{t("agreements.colNumber")}</Th>
                            <Th>{t("agreements.colCar")}</Th>
                            <Th>{t("agreements.colOwner")}</Th>
                            <Th>{t("agreements.colStart")}</Th>
                            <Th>{t("agreements.colEnd")}</Th>
                            <Th numeric>{t("agreements.colCommission")}</Th>
                            <Th>{t("agreements.colStatus")}</Th>
                            <Th>{t("agreements.colClosed")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.agreement.id}>
                                <Td className="font-medium text-zinc-900">
                                    <bdi>{row.agreement.agreement_number}</bdi>
                                </Td>
                                <Td>{row.carName || "—"}</Td>
                                <Td>{row.ownerName}</Td>
                                <Td>{formatDate(row.agreement.start_date, locale)}</Td>
                                <Td>{formatDate(row.agreement.end_date, locale)}</Td>
                                <Td numeric className="text-zinc-900">
                                    {formatCommission(row.agreement.commission, locale)}
                                </Td>
                                <Td>
                                    <StatusChip value={row.agreement.status} />
                                </Td>
                                <Td>
                                    {row.agreement.closed_date
                                        ? formatDate(row.agreement.closed_date, locale)
                                        : "—"}
                                </Td>
                                <Td>
                                    {row.agreement.status === "Active" ? (
                                        <div className="flex items-center justify-end gap-1">
                                            <IconButton
                                                icon={CircleCheck}
                                                label={t("agreements.complete")}
                                                onClick={() => setCompleteTarget(row.agreement)}
                                            />
                                            <IconButton
                                                icon={CalendarX}
                                                label={t("agreements.expire")}
                                                onClick={() =>
                                                    setCloseTarget({ agreement: row.agreement, mode: "expire" })
                                                }
                                            />
                                            <IconButton
                                                icon={CircleX}
                                                label={t("agreements.cancelAction")}
                                                destructive
                                                onClick={() =>
                                                    setCloseTarget({ agreement: row.agreement, mode: "cancel" })
                                                }
                                            />
                                        </div>
                                    ) : null}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            )}

            <NewAgreementModal open={newOpen} onClose={() => setNewOpen(false)} />
            <CompleteModal
                open={completeTarget != null}
                agreement={completeTarget}
                onClose={() => setCompleteTarget(null)}
            />
            <CloseModal
                open={closeTarget != null}
                agreement={closeTarget?.agreement ?? null}
                mode={closeTarget?.mode ?? "expire"}
                onClose={() => setCloseTarget(null)}
            />
        </div>
    );
}