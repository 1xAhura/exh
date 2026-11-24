import { useEffect, useState } from "react";
import * as api from "../../api/client";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import type { Person } from "../../types/models";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Modal from "../ui/Modal";

interface PersonFormModalProps {
  open: boolean;
  /** null → create mode */
  person: Person | null;
  onClose: () => void;
}

export default function PersonFormModal({ open, person, onClose }: PersonFormModalProps) {
  const { t } = useLanguage();
  const { refreshAll } = useData();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(person?.name ?? "");
      setPhone(person?.phone ?? "");
      setAddress(person?.address ?? "");
      setErrors({});
      setSubmitting(false);
    }
  }, [open, person]);

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = t("validation.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (person) {
        await api.updatePerson({
          id: person.id,
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        });
        toast("success", t("toasts.personUpdated"));
      } else {
        await api.createPerson({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        });
        toast("success", t("toasts.personCreated"));
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
      title={person ? t("people.editTitle") : t("people.addTitle")}
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
          label={t("people.formName")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <Input
          label={t("people.formPhone")}
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Input
          label={t("people.formAddress")}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>
    </Modal>
  );
}