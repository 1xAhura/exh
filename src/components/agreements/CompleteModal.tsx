import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { suggestNextNumber } from "../../utils/relations";
import { commissionAmount, carNameForItem, findPerson, formatCommission } from "../../utils/relations";
import { formatMoney, todayISO } from "../../utils/format";
import type { ConsignmentAgreement } from "../../types/models";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import InfoRow from "../ui/InfoRow";
import Modal from "../ui/Modal";
import { Select } from "../ui/Select";

interface CompleteModalProps {
    open: boolean;
    onClose: () => void;
    agreement: ConsignmentAgreement | null;
}

export default function CompleteModal({ open, onClose, agreement }: CompleteModalProps) {
    const { t, locale } = useLanguage();
    const { data, refreshAll } = useData();
    const { toast } = useToast();
    const [number, setNumber] = useState("");
    const [buyerId, setBuyerId] = useState("");
    const [endDate, setEndDate] = useState(todayISO());
    const [price, setPrice] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open && agreement) {
            setNumber(suggestNextNumber(data.contracts.map((c) => c.contract_number), "SAL"));
            setBuyerId("");
            setEndDate(todayISO());
            setPrice("");
            setErrors({});
            setSubmitting(false);
        }
    }, [open, agreement]);

    const carName = agreement
        ? carNameForItem(data.items, data.cars, agreement.inventory_item_id)
        : "";
    const ownerName = agreement
        ? findPerson(data.people, agreement.owner_id)?.name ?? "—"
        : "—";
    const commissionLabel = agreement ? formatCommission(agreement.commission, locale) : "—";

    // Live payout preview (§4.5).
    const priceNum = Number(price);
    const priceValid =
        price.trim() !== "" && Number.isFinite(priceNum) && Number.isInteger(priceNum) && priceNum > 0;
    const previewCommission =
        agreement && priceValid ? commissionAmount(agreement.commission, priceNum) : null;
    const payout = previewCommission != null ? priceNum - previewCommission : null;
    const belowMinimum =
        payout != null && agreement != null && payout < agreement.minimum_owner_payout;

    async function handleSubmit() {
        if (!agreement) return;
        const nextErrors: Record<string, string> = {};
        if (!number.trim()) nextErrors.number = t("validation.required");
        if (!buyerId) nextErrors.buyer = t("validation.required");
        if (!endDate) nextErrors.endDate = t("validation.required");
        const parsedPrice = Number(price);
        if (!price.trim()) nextErrors.price = t("validation.required");
        else if (!Number.isInteger(parsedPrice)) nextErrors.price = t("validation.mustBeInteger");
        else if (parsedPrice <= 0) nextErrors.price = t("validation.mustBePositive");
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        try {
            await api.completeConsignmentAgreement(
                agreement.id,
                endDate,
                number.trim(),
                Number(buyerId),
                parsedPrice,
            );
            await refreshAll();
            toast("success", t("toasts.agreementCompleted"));
            onClose();
        } catch (err) {
            toast("error", `${t("toasts.failed")}: ${api.errorText(err)}`);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t("completeModal.title")}
            width="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || data.people.length === 0}
                    >
                        {t("completeModal.submit")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <dl className="space-y-1.5">
                        <InfoRow label={t("completeModal.summaryCar")}>{carName || "—"}</InfoRow>
                        <InfoRow label={t("completeModal.summaryOwner")}>{ownerName}</InfoRow>
                        <InfoRow label={t("completeModal.summaryCommission")}>{commissionLabel}</InfoRow>
                    </dl>
                </div>

                <Input
                    label={t("completeModal.number")}
                    dir="ltr"
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                    error={errors.number}
                    hint={t("common.hintSuggestedNumber")}
                />
                <Select
                    label={t("completeModal.buyer")}
                    value={buyerId}
                    onChange={(event) => setBuyerId(event.target.value)}
                    error={errors.buyer}
                >
                    <option value="" disabled>
                        {t("common.selectPlaceholder")}
                    </option>
                    {data.people.map((person) => (
                        <option key={person.id} value={person.id}>
                            {person.name}
                        </option>
                    ))}
                </Select>
                {data.people.length === 0 && (
                    <p className="text-xs text-amber-600">{t("common.noPeopleYet")}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t("completeModal.endDate")}
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        error={errors.endDate}
                    />
                    <Input
                        label={t("completeModal.salePrice")}
                        type="number"
                        min={0}
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        error={errors.price}
                    />
                </div>

                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">{t("completeModal.previewCommission")}</span>
                        <span className="font-medium tabular-nums text-zinc-900">
                            {previewCommission != null ? formatMoney(previewCommission, locale) : "—"}
                        </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                        <span className="text-zinc-500">{t("completeModal.previewPayout")}</span>
                        <span className="font-semibold tabular-nums text-zinc-900">
                            {payout != null ? formatMoney(payout, locale) : "—"}
                        </span>
                    </div>
                </div>

                {belowMinimum && agreement && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                        <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                        <span>
                            {t("completeModal.payoutWarning", {
                                min: formatMoney(agreement.minimum_owner_payout, locale),
                            })}
                        </span>
                    </div>
                )}
            </div>
        </Modal>
    );
}