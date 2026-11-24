// Central formatting helpers. Change CURRENCY once to change it everywhere.
export const CURRENCY = "USD";

export type FormatLocale = "en" | "fa";

function numberFormatter(locale: FormatLocale): Intl.NumberFormat {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
}

export function formatNumber(value: number, locale: FormatLocale): string {
    return numberFormatter(locale).format(value);
}

export function formatMoney(value: number, locale: FormatLocale): string {
    return `${numberFormatter(locale).format(value)} ${CURRENCY}`;
}

/** 500 basis points -> "5%" (locale-aware digits). */
export function formatPercent(basisPoints: number, locale: FormatLocale): string {
    return new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 2,
    }).format(basisPoints / 10000);
}

/** Formats a stored "YYYY-MM-DD" string with Intl.DateTimeFormat. */
export function formatDate(value: string | null, locale: FormatLocale): string {
    if (!value) return "—";
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(year, month - 1, day));
}

/** Formats a "YYYY-MM" month key for the net-profit breakdown. */
export function formatMonth(month: string, locale: FormatLocale): string {
    const [year, m] = month.split("-").map(Number);
    if (!year || !m) return month;
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" }).format(
        new Date(year, m - 1, 1),
    );
}

/** Today as "YYYY-MM-DD" (the backend's date format). */
export function todayISO(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}