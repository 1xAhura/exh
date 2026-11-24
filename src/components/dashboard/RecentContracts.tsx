import { FileText } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatMoney } from "../../utils/format";
import { carNameForItem } from "../../utils/relations";
import type { Contract } from "../../types/models";
import { EmptyState } from "../ui/EmptyState";
import StatusChip from "../ui/StatusChip";
import { TableShell, Td, Th } from "../ui/Table";

interface RecentContractsProps {
    contracts: Contract[];
}

export default function RecentContracts({ contracts }: RecentContractsProps) {
    const { t, locale } = useLanguage();
    const { data } = useData();
    return (
        <section className="flex min-w-0 flex-col rounded-lg border border-zinc-200 bg-white">
            <header className="border-b border-zinc-200 px-4 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">{t("dashboard.recentContracts")}</h2>
            </header>
            {contracts.length === 0 ? (
                <EmptyState compact icon={FileText} title={t("contracts.emptyTitle")} />
            ) : (
                <TableShell plain>
                    <thead>
                        <tr>
                            <Th>{t("contracts.colType")}</Th>
                            <Th>{t("contracts.colNumber")}</Th>
                            <Th>{t("contracts.colCar")}</Th>
                            <Th numeric>{t("contracts.colPrice")}</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.map((contract) => (
                            <tr key={contract.id}>
                                <Td>
                                    <StatusChip value={contract.contract_type} />
                                </Td>
                                <Td>
                                    <bdi>{contract.contract_number}</bdi>
                                </Td>
                                {/* Long names wrap instead of widening the table; the TableShell
                    wrapper is the backstop if the row still exceeds the card. */}
                                <Td className="whitespace-normal break-words">
                                    {carNameForItem(data.items, data.cars, contract.inventory_item_id) || "—"}
                                </Td>
                                <Td numeric className="whitespace-nowrap text-zinc-900">
                                    {formatMoney(contract.price, locale)}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            )}
        </section>
    );
}