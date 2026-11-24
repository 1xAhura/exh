import { useEffect, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { suggestNextNumber } from "../../utils/relations";
import { todayISO } from "../../utils/format";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";
import { Select } from "../ui/Select";

interface PurchaseModalProps {
    open: boolean;
    onClose: () => void;
}

export default function PurchaseModal({ open, onClose }: PurchaseModalProps) {
    const { t } = useLanguage();
    const { data, refreshAll } = useData();
    const { toast } = useToast();
    const [number, setNumber] = useState("");
    const [sellerId, setSellerId] = useState("");
    const [date, setDate] = useState(todayISO());
    const [carName, setCarName] = useState("");
    const [year, setYear] = useState("");
    const [price, setPrice] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setNumber(suggestNextNumber(data.contracts.map((c) => c.contract_number), "PUR"));
            setSellerId("");
            setDate(todayISO());
            setCarName("");
            setYear("");
            setPrice("");
            setErrors({});
            setSubmitting(false);
        }
    }, [open]);

    async function handleSubmit() {
        const nextErrors: Record<string, string> = {};
        if (!number.trim()) nextErrors.number = t("validation.required");
        if (!sellerId) nextErrors.seller = t("validation.required");
        if (!date) nextErrors.date = t("validation.required");
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
        const priceNum = Number(price);
        if (!price.trim()) nextErrors.price = t("validation.required");
        else if (!Number.isInteger(priceNum)) nextErrors.price = t("validation.mustBeInteger");
        else if (priceNum <= 0) nextErrors.price = t("validation.mustBePositive");
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        try {
            // The dealership is the buyer → buyer_id stays null (§4.4).
            await api.createPurchaseContract({
                contract_number: number.trim(),
                buyer_id: null,
                seller_id: Number(sellerId),
                date,
                car_name: carName.trim(),
                production_date: yearNum,
                price: priceNum,
            });
            await refreshAll();
            toast("success", t("toasts.purchaseCreated"));
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
            title={t("purchaseModal.title")}
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
                        {t("purchaseModal.submit")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t("purchaseModal.number")}
                        dir="ltr"
                        value={number}
                        onChange={(event) => setNumber(event.target.value)}
                        error={errors.number}
                        hint={t("common.hintSuggestedNumber")}
                    />
                    <Input
                        label={t("purchaseModal.date")}
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        error={errors.date}
                    />
                </div>
                <Select
                    label={t("purchaseModal.seller")}
                    value={sellerId}
                    onChange={(event) => setSellerId(event.target.value)}
                    error={errors.seller}
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
                    label={t("purchaseModal.carName")}
                    value={carName}
                    onChange={(event) => setCarName(event.target.value)}
                    error={errors.carName}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t("purchaseModal.productionYear")}
                        type="number"
                        min={1900}
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                        error={errors.year}
                    />
                    <Input
                        label={t("purchaseModal.price")}
                        type="number"
                        min={0}
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        error={errors.price}
                    />
                </div>
            </div>
        </Modal>
    );
}