export type CalendarType = "Gregorian" | "Persian";

export interface GetMonthlySalesPayload {
    year: number;
    month: number;
    calendar: CalendarType;
}

export interface DailySalesPoint {
    day: number;
    quantity: number;
}

export interface MonthlySalesResponse {
    total_days: number;
    data: DailySalesPoint[];
}

export interface GetYearlySalesPayload {
    year: number;
    calendar: CalendarType;
}

export interface MonthlySalesPoint {
    month: number;
    quantity: number;
}

export interface YearlySalesResponse {
    data: MonthlySalesPoint[];
}