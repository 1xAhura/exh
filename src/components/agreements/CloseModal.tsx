import { useEffect, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { todayISO } from "../../utils/format";
import type { ConsignmentAgreement } from "../../types/models";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";

interface CloseModalProps {
    open: boolean;
    onClose: () => void;
    agreement: ConsignmentAgreement | null;
    mode: "expire" | "cancel";
}

export default function CloseModal({ open, onClose, agreement, mode }: CloseModalProps) {
    const { t } = useLanguage();
    const { refreshAll } = useData();
    const { toast } = useToast();
    const [endDate, setEndDate] = useState(todayISO());
    const [dateError, setDateError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const isExpire = mode === "expire";

    useEffect(() => {
        if (open) {
            setEndDate(todayISO());
            setDateError(null);
            setSubmitting(false);
        }
    }, [open]);

    async function handleSubmit() {
        if (!agreement) return;
        if (!endDate) {
            setDateError(t("validation.required"));
            return;
        }
        setSubmitting(true);
        try {
            if (isExpire) {
                await api.expireConsignmentAgreement(agreement.id, endDate);
                toast("success", t("toasts.agreementExpired"));
            } else {
                await api.cancelConsignmentAgreement(agreement.id, endDate);
                toast("success", t("toasts.agreementCancelled"));
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
            title={isExpire ? t("closeModal.expireTitle") : t("closeModal.cancelTitle")}
            width="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("common.cancel")}
                    </Button>
                    <Button variant="danger" onClick={handleSubmit} disabled={submitting}>
                        {isExpire ? t("closeModal.submitExpire") : t("closeModal.submitCancel")}
                    </Button>
                </>
            }
        >
            <p className="text-sm leading-6 text-zinc-600">
                {t("closeModal.message", {
                    status: t(isExpire ? "statuses.expired" : "statuses.cancelled"),
                })}
            </p>
            {agreement && (
                <p className="mt-2 text-sm font-medium text-zinc-900">
                    <bdi>{agreement.agreement_number}</bdi>
                </p>
            )}
            <Input
                label={t("closeModal.endDate")}
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                error={dateError}
                className="mt-4"
            />
        </Modal>
    );
}