import type {
    Car,
    Commission,
    ConsignmentAgreement,
    Contract,
    ExtraCost,
    InventoryItem,
    Person,
} from "../types/models";
import { formatMoney, formatPercent } from "./format";
import type { FormatLocale } from "./format";

export function findPerson(people: Person[], id: number | null | undefined): Person | undefined {
    if (id == null) return undefined;
    return people.find((p) => p.id === id);
}

export function findCar(cars: Car[], id: number | null | undefined): Car | undefined {
    if (id == null) return undefined;
    return cars.find((c) => c.id === id);
}

export function findItem(items: InventoryItem[], id: number | null | undefined): InventoryItem | undefined {
    if (id == null) return undefined;
    return items.find((i) => i.id === id);
}

/** Contract/Agreement → car name via inventory_item_id → item → car. */
export function carNameForItem(items: InventoryItem[], cars: Car[], itemId: number): string {
    const item = findItem(items, itemId);
    if (!item) return "";
    const car = findCar(cars, item.car_id);
    return car ? car.car_name : "";
}

/** Business rule: only OWNED + InStock items may be sold via "Record sale". */
export function sellableItems(items: InventoryItem[]): InventoryItem[] {
    return items.filter((i) => i.acquisition_type === "Owned" && i.status === "InStock");
}

export function commissionAmount(commission: Commission, salePrice: number): number {
    if ("FixedAmount" in commission) return commission.FixedAmount.amount;
    return Math.floor((salePrice * commission.Percentage.basis_points) / 10000);
}

/** Human-readable commission: "1,000 USD" or "5%". */
export function formatCommission(commission: Commission, locale: FormatLocale): string {
    if ("FixedAmount" in commission) return formatMoney(commission.FixedAmount.amount, locale);
    return formatPercent(commission.Percentage.basis_points, locale);
}

/** Net profit of one sale contract (§4.1 rules). */
export function computeSaleProfit(
    sale: Contract,
    contracts: Contract[],
    extraCosts: ExtraCost[],
    agreements: ConsignmentAgreement[],
): number {
    const purchases = contracts
        .filter((c) => c.contract_type === "Purchase" && c.inventory_item_id === sale.inventory_item_id)
        .sort((a, b) => a.date.localeCompare(b.date));
    if (purchases.length > 0) {
        const costs = extraCosts
            .filter((c) => c.inventory_item_id === sale.inventory_item_id)
            .reduce((sum, c) => sum + c.price, 0);
        return sale.price - purchases[0].price - costs;
    }
    const agreement = agreements.find(
        (a) => a.inventory_item_id === sale.inventory_item_id && a.status === "Completed",
    );
    if (!agreement) return 0;
    return commissionAmount(agreement.commission, sale.price);
}

export interface MonthlyProfitRow {
    month: string; // "YYYY-MM"
    salesCount: number;
    netProfit: number;
}

export interface NetProfitSummary {
    total: number;
    months: MonthlyProfitRow[]; // newest first, max 6
}

export function computeNetProfitSummary(
    contracts: Contract[],
    extraCosts: ExtraCost[],
    agreements: ConsignmentAgreement[],
): NetProfitSummary {
    const byMonth = new Map<string, MonthlyProfitRow>();
    let total = 0;
    for (const sale of contracts) {
        if (sale.contract_type !== "Sale") continue;
        const profit = computeSaleProfit(sale, contracts, extraCosts, agreements);
        total += profit;
        const month = sale.date.slice(0, 7);
        const row = byMonth.get(month) ?? { month, salesCount: 0, netProfit: 0 };
        row.salesCount += 1;
        row.netProfit += profit;
        byMonth.set(month, row);
    }
    const months = [...byMonth.values()]
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 6);
    return { total, months };
}

/** Suggests "PUR-2026-004"-style next numbers from existing ones. */
export function suggestNextNumber(existing: string[], prefix: string): string {
    const year = new Date().getFullYear();
    const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
    let maxSeq = 0;
    for (const value of existing) {
        const match = re.exec(value);
        if (match) {
            const seq = Number.parseInt(match[1], 10);
            if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
        }
    }
    return `${prefix}-${year}-${String(maxSeq + 1).padStart(3, "0")}`;
}