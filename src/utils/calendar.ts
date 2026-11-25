import type { Locale } from "../i18n";
import type { CalendarType } from "../types/sales";

// ── Gregorian <-> Jalali conversion (33-year cycle algorithm) ──────────
// Accurate for the 1900-2100 Gregorian range this app operates in.

export function isGregorianLeap(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function gregorianToJalali(
    gy: number,
    gm: number,
    gd: number,
): { jy: number; jm: number; jd: number } {
    const gDayCumulative = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    const y = gy - (gy <= 1600 ? 621 : 1600);
    const gy2 = gm > 2 ? y + 1 : y;
    let days =
        365 * y +
        Math.floor((gy2 + 3) / 4) -
        Math.floor((gy2 + 99) / 100) +
        Math.floor((gy2 + 399) / 400) -
        80 +
        gd +
        gDayCumulative[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return { jy, jm, jd };
}

export function jalaliToGregorian(
    jy: number,
    jm: number,
    jd: number,
): { gy: number; gm: number; gd: number } {
    let gy = jy <= 979 ? 621 : 1600;
    const jy2 = jy - (jy <= 979 ? 0 : 979);
    let days =
        365 * jy2 +
        Math.floor(jy2 / 33) * 8 +
        Math.floor(((jy2 % 33) + 3) / 4) +
        78 +
        jd +
        (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        days -= 1;
        gy += 100 * Math.floor(days / 36524);
        days %= 36524;
        if (days >= 365) days += 1;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    let gd = days + 1;
    const monthDays = [
        31,
        isGregorianLeap(gy) ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    let gm = 1;
    while (gm <= 12 && gd > monthDays[gm - 1]) {
        gd -= monthDays[gm - 1];
        gm += 1;
    }
    return { gy, gm, gd };
}

// ── Localized month names (locale × calendar matrix) ───────────────────

const GREGORIAN_MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const GREGORIAN_MONTHS_FA = [
    "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
    "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

const JALALI_MONTHS_EN = [
    "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
    "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand",
];

const JALALI_MONTHS_FA = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** Month names for the selected UI language AND calendar system. */
export function getMonthNames(locale: Locale, calendar: CalendarType): string[] {
    if (calendar === "Persian") {
        return locale === "fa" ? JALALI_MONTHS_FA : JALALI_MONTHS_EN;
    }
    return locale === "fa" ? GREGORIAN_MONTHS_FA : GREGORIAN_MONTHS_EN;
}

// ── Validation bounds (also protects the backend from unwrap panics) ───

export const CALENDAR_YEAR_BOUNDS: Record<CalendarType, { min: number; max: number }> = {
    Gregorian: { min: 1900, max: 2100 },
    Persian: { min: 1300, max: 1500 },
};