export type AcquisitionType = "Owned" | "Consignment";
export type InventoryStatus = "InStock" | "Sold" | "Withdrawn";
export type ContractType = "Purchase" | "Sale";
export type AgreementStatus = "Active" | "Completed" | "Expired" | "Cancelled";

export type Commission =
    | { FixedAmount: { amount: number } }
    | { Percentage: { basis_points: number } };

export interface Person {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
}

export interface Car {
    id: number;
    car_name: string;
    production_date: number; // a YEAR (u16), not a date
}

export interface InventoryItem {
    id: number;
    car_id: number;
    acquisition_type: AcquisitionType;
    status: InventoryStatus;
    entry_date: string;
    removal_date: string | null;
}

export interface Contract {
    id: number;
    contract_number: string;
    inventory_item_id: number;
    buyer_id: number | null;
    seller_id: number | null;
    contract_type: ContractType;
    date: string;
    price: number;
}

export interface ExtraCost {
    id: number;
    inventory_item_id: number;
    title: string;
    description: string;
    price: number;
    date: string;
}

export interface ConsignmentAgreement {
    id: number;
    agreement_number: string;
    inventory_item_id: number;
    owner_id: number;
    start_date: string;
    end_date: string;
    closed_date: string | null;
    minimum_owner_payout: number;
    commission: Commission;
    status: AgreementStatus;
}

export interface InventoryItemResponse {
    car: Car;
    item: InventoryItem;
    extra_cost: ExtraCost[]; // singular key, plural array
}