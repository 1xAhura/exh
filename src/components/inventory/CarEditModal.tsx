import { useEffect, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import type { Car } from "../../types/models";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";

interface CarEditModalProps {
    open: boolean;
    car: Car | null;
    onClose: () => void;
}

export default function CarEditModal({ open, car, onClose }: CarEditModalProps) {
    const { t } = useLanguage();
    const { refreshAll } = useData();
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [year, setYear] = useState("");
    const [errors, setErrors] = useState<{ name?: string; year?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open && car) {
            setName(car.car_name);
            setYear(String(car.production_date));
            setErrors({});
            setSubmitting(false);
        }
    }, [open, car]);

    async function handleSubmit() {
        if (!car) return;
        const nextErrors: { name?: string; year?: string } = {};
        if (!name.trim()) nextErrors.name = t("validation.required");
        const yearNum = Number(year);
        if (!year.trim()) nextErrors.year = t("validation.required");
        else if (
            !Number.isInteger(yearNum) ||
            yearNum < 1900 ||
            yearNum > new Date().getFullYear() + 1
        ) {
            nextErrors.year = t("validation.yearInvalid");
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        try {
            await api.updateCar({ car_id: car.id, car_name: name.trim(), production_date: yearNum });
            await refreshAll();
            toast("success", t("toasts.carUpdated"));
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
            title={t("carModal.title")}
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
                    label={t("carModal.name")}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    error={errors.name}
                />
                <Input
                    label={t("carModal.year")}
                    type="number"
                    min={1900}
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    error={errors.year}
                />
            </div>
        </Modal>
    );
}