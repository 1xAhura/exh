import type { Language } from '../i18n';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Converts Persian/Arabic-Indic digits to Latin digits. */
export function normalizeDigits(input: string): string {
    return input.replace(/[۰-۹٠-٩]/g, (char) => {
        const persianIndex = PERSIAN_DIGITS.indexOf(char);
        if (persianIndex !== -1) return String(persianIndex);
        return String(ARABIC_DIGITS.indexOf(char));
    });
}

/**
 * Extracts the first numeric amount from a free-form price string
 * such as "25,000 USD" or "۲۵۰۰۰ USD".
 */
export function parsePriceAmount(price: string): number {
    const normalized = normalizeDigits(price).replace(/,/g, '');
    const match = normalized.match(/\d+(\.\d+)?/);
    return match ? Number.parseFloat(match[0]) : 0;
}

/** Formats a number using the digits and separators of the active language. */
export function formatNumber(value: number, language: Language): string {
    return new Intl.NumberFormat(language === 'fa' ? 'fa-IR' : 'en-US').format(value);
}

/**
 * Returns the currency code (e.g. "USD") only when every contract uses
 * the same one. Returns null when currencies are mixed or missing.
 */
export function detectCurrency(contracts: { price: string }[]): string | null {
    const tokens = contracts.flatMap(
        (contract) => contract.price.toUpperCase().match(/[A-Z]{3,4}/g) ?? [],
    );
    const unique = [...new Set(tokens)];
    return unique.length === 1 ? unique[0] : null;
}