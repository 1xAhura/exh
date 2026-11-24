import { useEffect, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { todayISO } from "../../utils/format";
import type { ExtraCost } from "../../types/models";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";

interface ExtraCostModalProps {
    open: boolean;
    onClose: () => void;
    inventoryItemId: number;
    existing: ExtraCost | null;
}

export default function ExtraCostModal({ open, onClose, inventoryItemId, existing }: ExtraCostModalProps) {
    const { t } = useLanguage();
    const { refreshAll } = useData();
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(todayISO());
    const [price, setPrice] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(existing?.title ?? "");
            setDescription(existing?.description ?? "");
            setDate(existing?.date ?? todayISO());
            setPrice(existing ? String(existing.price) : "");
            setErrors({});
            setSubmitting(false);
        }
    }, [open, existing]);

    async function handleSubmit() {
        const nextErrors: Record<string, string> = {};
        if (!title.trim()) nextErrors.title = t("validation.required");
        if (!date) nextErrors.date = t("validation.required");
        const priceNum = Number(price);
        if (!price.trim()) nextErrors.price = t("validation.required");
        else if (!Number.isFinite(priceNum) || !Number.isInteger(priceNum))
            nextErrors.price = t("validation.mustBeInteger");
        else if (priceNum <= 0) nextErrors.price = t("validation.mustBePositive");
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        try {
            if (existing) {
                await api.updateExtraCost({
                    id: existing.id,
                    title: title.trim(),
                    description: description.trim(),
                    date,
                    price: priceNum,
                });
                toast("success", t("toasts.costUpdated"));
            } else {
                await api.addExtraCost({
                    inventory_item_id: inventoryItemId,
                    title: title.trim(),
                    description: description.trim(),
                    price: priceNum,
                    date,
                });
                toast("success", t("toasts.costAdded"));
            }
            await refreshAll();
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
            title={existing ? t("costModal.editTitle") : t("costModal.addTitle")}
            width="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {t("common.save")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label={t("costModal.title")}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    error={errors.title}
                />
                <Input
                    label={t("costModal.description")}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={t("costModal.date")}
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        error={errors.date}
                    />
                    <Input
                        label={t("costModal.price")}
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