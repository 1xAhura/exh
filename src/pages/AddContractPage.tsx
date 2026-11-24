import { useState } from 'react';
import type { FormEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { normalizeDigits } from '../utils/format';
import type { AddContractArgs } from '../types/contract';
import type { Page } from '../types/navigation';
import type { Translation } from '../i18n';

type FormState = AddContractArgs;
type FieldErrors = Partial<Record<keyof FormState, keyof Translation['addContract']['errors']>>;

const emptyForm: FormState = {
    contractNumber: '',
    buyer: '',
    seller: '',
    date: '',
    price: '',
    carName: '',
    productionDate: '',
};

interface AddContractPageProps {
    onNavigate: (page: Page) => void;
}

function validateForm(form: FormState): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.contractNumber.trim()) errors.contractNumber = 'contractNumberRequired';
    if (!form.buyer.trim()) errors.buyer = 'buyerRequired';
    if (!form.seller.trim()) errors.seller = 'sellerRequired';
    if (!form.date) errors.date = 'dateRequired';
    if (!form.price.trim()) errors.price = 'priceRequired';
    else if (!/\d/.test(normalizeDigits(form.price))) errors.price = 'priceInvalid';
    if (!form.carName.trim()) errors.carName = 'carNameRequired';
    if (!form.productionDate) errors.productionDate = 'productionDateRequired';
    return errors;
}

export function AddContractPage({ onNavigate }: AddContractPageProps) {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const errorFor = (field: keyof FormState): string | undefined => {
        const key = errors[field];
        return key ? t.addContract.errors[key] : undefined;
    };

    const updateField = (field: keyof FormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        // Clear the field's error as soon as the user edits it again.
        setErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const fieldErrors = validateForm(form);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: AddContractArgs = {
                contractNumber: form.contractNumber.trim(),
                buyer: form.buyer.trim(),
                seller: form.seller.trim(),
                date: form.date,
                price: form.price.trim(),
                carName: form.carName.trim(),
                productionDate: form.productionDate,
            };
            // camelCase keys are converted to your Rust command's snake_case
            // parameters automatically by Tauri.
            await invoke('add_contract', payload);
            showToast('success', t.addContract.toasts.success);
            // The contracts page fetches fresh data on mount, so the new
            // contract appears immediately.
            onNavigate('contracts');
        } catch (error) {
            console.error('Failed to add contract:', error);
            showToast('error', t.addContract.toasts.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader title={t.addContract.title} description={t.addContract.subtitle} />

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                    <h2 className="mb-5 text-sm font-semibold text-slate-900">{t.addContract.sectionContract}</h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Input
                            label={t.addContract.fields.contractNumber}
                            value={form.contractNumber}
                            onChange={(e) => updateField('contractNumber', e.target.value)}
                            placeholder={t.addContract.placeholders.contractNumber}
                            error={errorFor('contractNumber')}
                        />
                        <Input
                            label={t.addContract.fields.date}
                            type="date"
                            value={form.date}
                            onChange={(e) => updateField('date', e.target.value)}
                            error={errorFor('date')}
                        />
                        <Input
                            label={t.addContract.fields.buyer}
                            value={form.buyer}
                            onChange={(e) => updateField('buyer', e.target.value)}
                            placeholder={t.addContract.placeholders.buyer}
                            error={errorFor('buyer')}
                        />
                        <Input
                            label={t.addContract.fields.seller}
                            value={form.seller}
                            onChange={(e) => updateField('seller', e.target.value)}
                            placeholder={t.addContract.placeholders.seller}
                            error={errorFor('seller')}
                        />
                        <div className="sm:col-span-2">
                            <Input
                                label={t.addContract.fields.price}
                                value={form.price}
                                inputMode="decimal"
                                onChange={(e) => updateField('price', e.target.value)}
                                placeholder={t.addContract.placeholders.price}
                                hint={t.addContract.hints.price}
                                error={errorFor('price')}
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                    <h2 className="mb-5 text-sm font-semibold text-slate-900">{t.addContract.sectionCar}</h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Input
                            label={t.addContract.fields.carName}
                            value={form.carName}
                            onChange={(e) => updateField('carName', e.target.value)}
                            placeholder={t.addContract.placeholders.carName}
                            error={errorFor('carName')}
                        />
                        <Input
                            label={t.addContract.fields.productionDate}
                            type="date"
                            value={form.productionDate}
                            onChange={(e) => updateField('productionDate', e.target.value)}
                            error={errorFor('productionDate')}
                        />
                    </div>
                </section>

                {/* `justify-end` follows the direction automatically (right in LTR, left in RTL) */}
                <div className="flex items-center justify-end gap-3">
                    <Button variant="secondary" onClick={() => onNavigate('contracts')} disabled={isSubmitting}>
                        {t.addContract.cancel}
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {isSubmitting ? t.addContract.submitting : t.addContract.submit}
                    </Button>
                </div>
            </form>
        </>
    );
}