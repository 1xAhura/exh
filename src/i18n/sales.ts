// Sales-report strings, merged into the base dictionaries in
// src/i18n/index.ts — keeps en.ts / fa.ts untouched.

export const salesEn = {
    navSales: "Sales Report",
    sales: {
        title: "Sales Report",
        subtitle: "Number of cars sold per day or per month",
        modeMonthly: "Monthly",
        modeYearly: "Yearly",
        calendarLabel: "Calendar",
        calendarGregorian: "Gregorian",
        calendarJalali: "Jalali",
        monthLabel: "Month",
        yearLabel: "Year",
        totalSales: "Total sales",
        dailyChartTitle: "Sales per day",
        monthlyChartTitle: "Sales per month",
        barLabel: "{value} sales",
        emptyTitle: "No sales in this period",
        emptyMessage: "Select a different month or year, or record a new sale first.",
        yearInvalid: "Enter a year between {min} and {max}",
    },
};

export type SalesDictionary = typeof salesEn;

export const salesFa: SalesDictionary = {
    navSales: "گزارش فروش",
    sales: {
        title: "گزارش فروش",
        subtitle: "تعداد خودروهای فروش‌رفته به تفکیک روز یا ماه",
        modeMonthly: "ماهانه",
        modeYearly: "سالانه",
        calendarLabel: "تقویم",
        calendarGregorian: "میلادی",
        calendarJalali: "شمسی",
        monthLabel: "ماه",
        yearLabel: "سال",
        totalSales: "مجموع فروش",
        dailyChartTitle: "فروش به تفکیک روز",
        monthlyChartTitle: "فروش به تفکیک ماه",
        barLabel: "{value} فروش",
        emptyTitle: "در این بازه فروشی ثبت نشده است",
        emptyMessage: "ماه یا سال دیگری را انتخاب کنید یا ابتدا یک فروش ثبت کنید.",
        yearInvalid: "سالِ بین {min} و {max} وارد کنید",
    },
};