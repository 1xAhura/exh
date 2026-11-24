import { useEffect, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { suggestNextNumber } from "../../utils/relations";
import { todayISO } from "../../utils/format";
import type { Commission } from "../../types/models";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";
import Segmented from "../ui/Segmented";
import { Select } from "../ui/Select";

interface NewAgreementModalProps {
    open: boolean;
    onClose: () => void;
}

export default function NewAgreementModal({ open, onClose }: NewAgreementModalProps) {
    const { t } = useLanguage();
    const { data, refreshAll } = useData();
    const { toast } = useToast();
    const [number, setNumber] = useState("");
    const [ownerId, setOwnerId] = useState("");
    const [carName, setCarName] = useState("");
    const [year, setYear] = useState("");
    const [startDate, setStartDate] = useState(todayISO());
    const [endDate, setEndDate] = useState("");
    const [minPayout, setMinPayout] = useState("0");
    const [commissionType, setCommissionType] = useState<"fixed" | "percent">("percent");
    const [fixedAmount, setFixedAmount] = useState("");
    const [percent, setPercent] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setNumber(suggestNextNumber(data.agreements.map((a) => a.agreement_number), "CON"));
            setOwnerId("");
            setCarName("");
            setYear("");
            setStartDate(todayISO());
            setEndDate("");
            setMinPayout("0");
            setCommissionType("percent");
            setFixedAmount("");
            setPercent("");
            setErrors({});
            setSubmitting(false);
        }
    }, [open]);

    async function handleSubmit() {
        const nextErrors: Record<string, string> = {};
        if (!number.trim()) nextErrors.number = t("validation.required");
        if (!ownerId) nextErrors.owner = t("validation.required");
        if (!carName.trim()) nextErrors.carName = t("validation.required");
        const yearNum = Number(year);
        if (!year.trim()) nextErrors.year = t("validation.required");
        else if (
            !Number.isInteger(yearNum) ||
            yearNum < 1900 ||
            yearNum > new Date().getFullYear() + 1
        ) {
            nextErrors.year = t("validation.yearInvalid");
        }
        if (!startDate) nextErrors.startDate = t("validation.required");
        if (!endDate) nextErrors.endDate = t("validation.required");
        else if (startDate && endDate <= startDate) nextErrors.endDate = t("validation.endAfterStart");
        const minPayoutNum = Number(minPayout);
        if (!minPayout.trim()) nextErrors.minPayout = t("validation.required");
        else if (!Number.isInteger(minPayoutNum)) nextErrors.minPayout = t("validation.mustBeInteger");
        else if (minPayoutNum < 0) nextErrors.minPayout = t("validation.nonNegative");

        let commission: Commission;
        if (commissionType === "fixed") {
            const fixedNum = Number(fixedAmount);
            if (!fixedAmount.trim()) nextErrors.commission = t("validation.required");
            else if (!Number.isInteger(fixedNum)) nextErrors.commission = t("validation.mustBeInteger");
            else if (fixedNum < 0) nextErrors.commission = t("validation.nonNegative");
            commission = { FixedAmount: { amount: fixedNum } };
        } else {
            const percentNum = Number(percent);
            if (!percent.trim()) nextErrors.commission = t("validation.required");
            else if (!Number.isFinite(percentNum) || percentNum < 0 || percentNum > 100)
                nextErrors.commission = t("validation.percentRange");
            commission = { Percentage: { basis_points: Math.round(percentNum * 100) } };
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        try {
            await api.createConsignmentAgreement({
                agreement_number: number.trim(),
                owner_id: Number(ownerId),
                car_name: carName.trim(),
                start_date: startDate,
                end_date: endDate,
                minimum_owner_payout: minPayoutNum,
                production_date: yearNum,
                commission,
            });
            await refreshAll();
            toast("success", t("toasts.agreementCreated"));
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
            title={t("agreementModal.title")}
            width="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || data.people.length === 0}>
                        {t("agreementModal.submit")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t("agreementModal.number")}
                        dir="ltr"
                        value={number}
                        onChange={(event) => setNumber(event.target.value)}
                        error={errors.number}
                        hint={t("common.hintSuggestedNumber")}
                    />
                    <Input
                        label={t("agreementModal.productionYear")}
                        type="number"
                        min={1900}
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                        error={errors.year}
                    />
                </div>
                <Select
                    label={t("agreementModal.owner")}
                    value={ownerId}
                    onChange={(event) => setOwnerId(event.target.value)}
                    error={errors.owner}
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
                <Input
                    label={t("agreementModal.carName")}
                    value={carName}
                    onChange={(event) => setCarName(event.target.value)}
                    error={errors.carName}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t("agreementModal.startDate")}
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        error={errors.startDate}
                    />
                    <Input
                        label={t("agreementModal.endDate")}
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        error={errors.endDate}
                    />
                </div>
                <Input
                    label={t("agreementModal.minPayout")}
                    type="number"
                    min={0}
                    value={minPayout}
                    onChange={(event) => setMinPayout(event.target.value)}
                    error={errors.minPayout}
                />
                <div>
                    <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                        {t("agreementModal.commission")}
                    </span>
                    <Segmented
                        value={commissionType}
                        onChange={setCommissionType}
                        options={[
                            { value: "percent", label: t("agreementModal.commissionPercent") },
                            { value: "fixed", label: t("agreementModal.commissionFixed") },
                        ]}
                    />
                    <div className="mt-3">
                        {commissionType === "percent" ? (
                            <Input
                                label={t("agreementModal.percentLabel")}
                                type="number"
                                min={0}
                                max={100}
                                step="0.1"
                                value={percent}
                                onChange={(event) => setPercent(event.target.value)}
                                error={errors.commission}
                            />
                        ) : (
                            <Input
                                label={t("agreementModal.fixedAmountLabel")}
                                type="number"
                                min={0}
                                value={fixedAmount}
                                onChange={(event) => setFixedAmount(event.target.value)}
                                error={errors.commission}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}