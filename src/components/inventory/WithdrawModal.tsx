import { useEffect, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { todayISO } from "../../utils/format";
import type { InventoryItemResponse } from "../../types/models";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";

interface WithdrawModalProps {
    open: boolean;
    detail: InventoryItemResponse | null;
    onClose: () => void;
}

export default function WithdrawModal({ open, detail, onClose }: WithdrawModalProps) {
    const { t } = useLanguage();
    const { refreshAll } = useData();
    const { toast } = useToast();
    const [removalDate, setRemovalDate] = useState(todayISO());
    const [dateError, setDateError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setRemovalDate(todayISO());
            setDateError(null);
            setSubmitting(false);
        }
    }, [open]);

    async function handleSubmit() {
        if (!detail) return;
        if (!removalDate) {
            setDateError(t("validation.required"));
            return;
        }
        setSubmitting(true);
        try {
            await api.withdrawInventoryItem(detail.item.id, removalDate);
            await refreshAll();
            toast("success", t("toasts.itemWithdrawn"));
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
            title={t("inventory.withdrawTitle")}
            width="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("common.cancel")}
                    </Button>
                    <Button variant="danger" onClick={handleSubmit} disabled={submitting}>
                        {t("inventory.withdrawTitle")}
                    </Button>
                </>
            }
        >
            <p className="text-sm leading-6 text-zinc-600">{t("inventory.withdrawMessage")}</p>
            {detail && <p className="mt-2 text-sm font-medium text-zinc-900">{detail.car.car_name}</p>}
            <Input
                label={t("inventory.withdrawDate")}
                type="date"
                value={removalDate}
                onChange={(event) => setRemovalDate(event.target.value)}
                error={dateError}
                className="mt-4"
            />
        </Modal>
    );
}