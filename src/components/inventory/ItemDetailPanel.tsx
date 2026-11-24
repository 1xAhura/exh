import { useMemo, useState } from "react";
import { ArrowLeft, FileText, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { formatDate, formatMoney, formatNumber } from "../../utils/format";
import { findPerson, formatCommission } from "../../utils/relations";
import type { ExtraCost, InventoryItemResponse } from "../../types/models";
import Badge from "../ui/Badge";
import { Button, IconButton } from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import InfoRow from "../ui/InfoRow";
import StatusChip from "../ui/StatusChip";
import { TableShell, Td, Th } from "../ui/Table";
import CarEditModal from "./CarEditModal";
import ExtraCostModal from "./ExtraCostModal";

interface ItemDetailPanelProps {
    detail: InventoryItemResponse;
    onBack: () => void;
}

export default function ItemDetailPanel({ detail, onBack }: ItemDetailPanelProps) {
    const { t, locale } = useLanguage();
    const { data, refreshAll } = useData();
    const { toast } = useToast();

    const [carEditOpen, setCarEditOpen] = useState(false);
    const [costModal, setCostModal] = useState<{ mode: "add" } | { mode: "edit"; cost: ExtraCost } | null>(null);
    const [costToDelete, setCostToDelete] = useState<ExtraCost | null>(null);
    const [deleting, setDeleting] = useState(false);

    const isConsigned = detail.item.acquisition_type === "Consignment";

    const agreement = useMemo(
        () => data.agreements.find((a) => a.inventory_item_id === detail.item.id) ?? null,
        [data.agreements, detail.item.id],
    );

    const itemContracts = useMemo(
        () =>
            data.contracts
                .filter((c) => c.inventory_item_id === detail.item.id)
                .sort((a, b) => b.date.localeCompare(a.date)),
        [data.contracts, detail.item.id],
    );

    const owner = agreement ? findPerson(data.people, agreement.owner_id) : undefined;

    async function handleDeleteCost() {
        if (!costToDelete) return;
        setDeleting(true);
        try {
            await api.deleteExtraCost(costToDelete.id);
            await refreshAll();
            toast("success", t("toasts.costDeleted"));
            setCostToDelete(null);
        } catch (err) {
            toast("error", `${t("toasts.failed")}: ${api.errorText(err)}`);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors duration-150 hover:text-zinc-900"
            >
                <ArrowLeft size={15} className="rtl:scale-x-[-1]" />
                {t("inventory.detailBack")}
            </button>

            <div className="mb-5 mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-zinc-900">{detail.car.car_name}</h1>
                <StatusChip value={detail.item.acquisition_type} />
                <StatusChip value={detail.item.status} />
                <Button variant="secondary" size="sm" className="ms-auto" onClick={() => setCarEditOpen(true)}>
                    <Pencil size={14} />
                    {t("common.edit")}
                </Button>
            </div>

            <div className={`grid grid-cols-1 gap-4 ${isConsigned ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                <section className="rounded-lg border border-zinc-200 bg-white p-5">
                    <h2 className="text-sm font-semibold text-zinc-900">{t("inventory.detailCarSection")}</h2>
                    <dl className="mt-3 space-y-2.5">
                        <InfoRow label={t("carModal.name")}>{detail.car.car_name}</InfoRow>
                        <InfoRow label={t("carModal.year")}>
                            <span className="tabular-nums">{formatNumber(detail.car.production_date, locale)}</span>
                        </InfoRow>
                    </dl>
                </section>

                <section className="rounded-lg border border-zinc-200 bg-white p-5">
                    <h2 className="text-sm font-semibold text-zinc-900">{t("inventory.detailLifecycleSection")}</h2>
                    <dl className="mt-3 space-y-2.5">
                        <InfoRow label={t("inventory.detailEntryDate")}>{formatDate(detail.item.entry_date, locale)}</InfoRow>
                        <InfoRow label={t("inventory.detailRemovalDate")}>
                            {detail.item.removal_date ? formatDate(detail.item.removal_date, locale) : "—"}
                        </InfoRow>
                        <InfoRow label={t("inventory.detailStatus")}>
                            <StatusChip value={detail.item.status} />
                        </InfoRow>
                    </dl>
                </section>

                {isConsigned && (
                    <section className="rounded-lg border border-zinc-200 bg-white p-5">
                        <h2 className="text-sm font-semibold text-zinc-900">{t("inventory.detailConsigneeSection")}</h2>
                        {agreement ? (
                            <dl className="mt-3 space-y-2.5">
                                <InfoRow label={t("inventory.detailOwner")}>{owner?.name ?? "—"}</InfoRow>
                                <InfoRow label={t("inventory.detailAgreement")}>
                                    <bdi>{agreement.agreement_number}</bdi>
                                </InfoRow>
                                <InfoRow label={t("agreements.colStatus")}>
                                    <StatusChip value={agreement.status} />
                                </InfoRow>
                                <InfoRow label={t("agreements.colCommission")}>
                                    {formatCommission(agreement.commission, locale)}
                                </InfoRow>
                                <InfoRow label={t("agreements.colStart")}>{formatDate(agreement.start_date, locale)}</InfoRow>
                                <InfoRow label={t("agreements.colEnd")}>{formatDate(agreement.end_date, locale)}</InfoRow>
                            </dl>
                        ) : (
                            <p className="mt-3 text-sm text-zinc-500">—</p>
                        )}
                    </section>
                )}
            </div>

            {/* Extra costs exist only for owned vehicles — the backend rejects consigned ones. */}
            {!isConsigned && (
                <section className="mt-4 rounded-lg border border-zinc-200 bg-white">
                    <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-zinc-900">{t("inventory.detailCostsSection")}</h2>
                            <Badge>{formatNumber(detail.extra_cost.length, locale)}</Badge>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setCostModal({ mode: "add" })}>
                            <Plus size={14} />
                            {t("inventory.detailAddCost")}
                        </Button>
                    </header>
                    {detail.extra_cost.length === 0 ? (
                        <EmptyState compact icon={Receipt} title={t("inventory.noCosts")} />
                    ) : (
                        <TableShell plain>
                            <thead>
                                <tr>
                                    <Th>{t("inventory.costColTitle")}</Th>
                                    <Th>{t("inventory.costColDescription")}</Th>
                                    <Th>{t("inventory.costColDate")}</Th>
                                    <Th numeric>{t("inventory.costColPrice")}</Th>
                                    <Th>{t("common.actions")}</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.extra_cost.map((cost) => (
                                    <tr key={cost.id}>
                                        <Td className="font-medium text-zinc-900">{cost.title}</Td>
                                        <Td className="max-w-[18rem] truncate">{cost.description || "—"}</Td>
                                        <Td>{formatDate(cost.date, locale)}</Td>
                                        <Td numeric className="text-zinc-900">
                                            {formatMoney(cost.price, locale)}
                                        </Td>
                                        <Td>
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    icon={Pencil}
                                                    label={t("common.edit")}
                                                    onClick={() => setCostModal({ mode: "edit", cost })}
                                                />
                                                <IconButton
                                                    icon={Trash2}
                                                    label={t("common.delete")}
                                                    destructive
                                                    onClick={() => setCostToDelete(cost)}
                                                />
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    )}
                </section>
            )}

            <section className="mt-4 rounded-lg border border-zinc-200 bg-white">
                <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-zinc-900">{t("inventory.detailContractsSection")}</h2>
                        <Badge>{formatNumber(itemContracts.length, locale)}</Badge>
                    </div>
                </header>
                {itemContracts.length === 0 ? (
                    <EmptyState compact icon={FileText} title={t("inventory.detailNoContracts")} />
                ) : (
                    <TableShell plain>
                        <thead>
                            <tr>
                                <Th>{t("contracts.colType")}</Th>
                                <Th>{t("contracts.colNumber")}</Th>
                                <Th>{t("contracts.colDate")}</Th>
                                <Th numeric>{t("contracts.colPrice")}</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemContracts.map((contract) => (
                                <tr key={contract.id}>
                                    <Td>
                                        <StatusChip value={contract.contract_type} />
                                    </Td>
                                    <Td>
                                        <bdi>{contract.contract_number}</bdi>
                                    </Td>
                                    <Td>{formatDate(contract.date, locale)}</Td>
                                    <Td numeric className="text-zinc-900">
                                        {formatMoney(contract.price, locale)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableShell>
                )}
            </section>

            <CarEditModal open={carEditOpen} car={detail.car} onClose={() => setCarEditOpen(false)} />
            <ExtraCostModal
                open={costModal != null}
                inventoryItemId={detail.item.id}
                existing={costModal?.mode === "edit" ? costModal.cost : null}
                onClose={() => setCostModal(null)}
            />
            <ConfirmDialog
                open={costToDelete != null}
                onClose={() => setCostToDelete(null)}
                title={t("common.delete")}
                message={t("inventory.costDeleteMessage", { title: costToDelete?.title ?? "" })}
                confirmLabel={t("common.delete")}
                cancelLabel={t("common.cancel")}
                onConfirm={handleDeleteCost}
                danger
                busy={deleting}
            />
        </div>
    );
}