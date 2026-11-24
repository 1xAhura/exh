import { useEffect, useMemo, useState } from "react";
import { Pencil, UserPlus, Users } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import PersonFormModal from "../components/people/PersonFormModal";
import { Button, IconButton } from "../components/ui/Button";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/Skeleton";
import { TableShell, Td, Th } from "../components/ui/Table";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { formatNumber } from "../utils/format";
import type { PageProps } from "../types/nav";
import type { Person } from "../types/models";

export default function PeoplePage({ intent, onIntentDone }: PageProps) {
    const { data, loading, error, refreshAll } = useData();
    const { t, locale } = useLanguage();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Person | null>(null);

    useEffect(() => {
        if (intent === "person") {
            setEditing(null);
            setFormOpen(true);
            onIntentDone();
        }
    }, [intent, onIntentDone]);

    const rows = useMemo(
        () =>
            [...data.people]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((person) => ({
                    person,
                    carsBought: data.contracts.filter(
                        (c) => c.contract_type === "Sale" && c.buyer_id === person.id,
                    ).length,
                    activeConsignments: data.agreements.filter(
                        (a) => a.status === "Active" && a.owner_id === person.id,
                    ).length,
                })),
        [data],
    );

    function openAdd() {
        setEditing(null);
        setFormOpen(true);
    }

    if (error) {
        return (
            <div>
                <PageHeader title={t("people.title")} subtitle={t("people.subtitle")} />
                <ErrorState detail={error} onRetry={refreshAll} />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <PageHeader title={t("people.title")} subtitle={t("people.subtitle")} />
                <TableSkeleton rows={6} cols={6} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={t("people.title")}
                subtitle={t("people.subtitle")}
                actions={
                    <Button onClick={openAdd}>
                        <UserPlus size={15} />
                        {t("people.addPerson")}
                    </Button>
                }
            />

            {rows.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white">
                    <EmptyState
                        icon={Users}
                        title={t("people.emptyTitle")}
                        message={t("people.emptyMessage")}
                        action={
                            <Button onClick={openAdd}>
                                <UserPlus size={15} />
                                {t("people.addPerson")}
                            </Button>
                        }
                    />
                </div>
            ) : (
                <TableShell minWidth={760}>
                    <thead>
                        <tr>
                            <Th>{t("people.colName")}</Th>
                            <Th>{t("people.colPhone")}</Th>
                            <Th>{t("people.colAddress")}</Th>
                            <Th numeric>{t("people.colCarsBought")}</Th>
                            <Th numeric>{t("people.colActiveConsignments")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.person.id}>
                                <Td className="font-medium text-zinc-900">{row.person.name}</Td>
                                <Td>{row.person.phone ? <bdi>{row.person.phone}</bdi> : "—"}</Td>
                                <Td className="max-w-[20rem] truncate">{row.person.address || "—"}</Td>
                                <Td numeric>{formatNumber(row.carsBought, locale)}</Td>
                                <Td numeric>{formatNumber(row.activeConsignments, locale)}</Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-1">
                                        <IconButton
                                            icon={Pencil}
                                            label={t("common.edit")}
                                            onClick={() => {
                                                setEditing(row.person);
                                                setFormOpen(true);
                                            }}
                                        />
                                    </div>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </TableShell>
            )}

            <PersonFormModal open={formOpen} person={editing} onClose={() => setFormOpen(false)} />
        </div>
    );
}