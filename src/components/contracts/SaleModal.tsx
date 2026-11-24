import { useEffect, useMemo, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { findCar, sellableItems, suggestNextNumber } from "../../utils/relations";
import { todayISO } from "../../utils/format";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";
import { Select } from "../ui/Select";

interface SaleModalProps {
    open: boolean;
    onClose: () => void;
    /** Pre-select an item (opened from the inventory table). */
    prefillItemId?: number | null;
}

export default function SaleModal({ open, onClose, prefillItemId = null }: SaleModalProps) {
    const { t } = useLanguage();
    const { data, refreshAll } = useData();
    const { toast } = useToast();
    const [itemId, setItemId] = useState("");
    const [number, setNumber] = useState("");
    const [buyerId, setBuyerId] = useState("");
    const [date, setDate] = useState(todayISO());
    const [price, setPrice] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Business rule: only OWNED + InStock items are sellable here (§4.0).
    const options = useMemo(
        () =>
            sellableItems(data.items).map((item) => {
                const car = findCar(data.cars, item.car_id);
                return { id: item.id, label: car ? car.car_name : `#${item.id}` };
            }),
        [data.items, data.cars],
    );

    useEffect(() => {
        if (open) {
            const initial =
                prefillItemId != null && options.some((option) => option.id === prefillItemId)
                    ? String(prefillItemId)
                    : "";
            setItemId(initial);
            setNumber(suggestNextNumber(data.contracts.map((c) => c.contract_number), "SAL"));
            setBuyerId("");
            setDate(todayISO());
            setPrice("");
            setErrors({});
            setSubmitting(false);
        }
    }, [open, prefillItemId]);

    async function handleSubmit() {
        const nextErrors: Record<string, string> = {};
        if (!itemId) nextErrors.item = t("validation.required");
        if (!number.trim()) nextErrors.number = t("validation.required");
        if (!buyerId) nextErrors.buyer = t("validation.required");
        if (!date) nextErrors.date = t("validation.required");
        const priceNum = Number(price);
        if (!price.trim()) nextErrors.price = t("validation.required");
        else if (!Number.isInteger(priceNum)) nextErrors.price = t("validation.mustBeInteger");
        else if (priceNum <= 0) nextErrors.price = t("validation.mustBePositive");
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        try {
            // The dealership is the seller → seller_id stays null (§4.4).
            await api.createSellContract({
                contract_number: number.trim(),
                inventory_item_id: Number(itemId),
                buyer_id: Number(buyerId),
                seller_id: null,
                date,
                price: priceNum,
            });
            await refreshAll();
            toast("success", t("toasts.saleCreated"));
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
            title={t("saleModal.title")}
            width="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || options.length === 0 || data.people.length === 0}
                    >
                        {t("saleModal.submit")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Select
                    label={t("saleModal.item")}
                    value={itemId}
                    onChange={(event) => setItemId(event.target.value)}
                    error={errors.item}
                    hint={t("saleModal.itemHint")}
                >
                    <option value="" disabled>
                        {t("common.selectPlaceholder")}
                    </option>
                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </Select>
                {options.length === 0 && <p className="text-xs text-amber-600">{t("saleModal.noItems")}</p>}
                <Input
                    label={t("saleModal.number")}
                    dir="ltr"
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                    error={errors.number}
                    hint={t("common.hintSuggestedNumber")}
                />
                <Select
                    label={t("saleModal.buyer")}
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
                        label={t("saleModal.date")}
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        error={errors.date}
                    />
                    <Input
                        label={t("saleModal.price")}
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