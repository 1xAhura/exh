import { invoke } from "@tauri-apps/api/core";
import type {
    Car,
    Commission,
    ConsignmentAgreement,
    Contract,
    ExtraCost,
    InventoryItem,
    InventoryItemResponse,
    Person,
} from "../types/models";
import type {
    GetMonthlySalesPayload,
    GetYearlySalesPayload,
    MonthlySalesResponse,
    YearlySalesResponse,
} from "../types/sales";

// ── Payload shapes ─────────────────────────────────────────────────────
// Top-level invoke args are camelCase (Tauri converts them); fields INSIDE
// struct payloads stay snake_case exactly as declared in Rust (§5.1).

export interface UpdateCarPayload {
    car_id: number;
    car_name?: string | null;
    production_date?: number | null;
}

export interface UpdatePersonPayload {
    id: number;
    name?: string | null;
    phone?: string | null;
    address?: string | null;
}

export interface UpdateExtraCostPayload {
    id: number;
    title?: string | null;
    description?: string | null;
    date?: string | null;
    price?: number | null;
}

export interface CreatePurchaseContractPayload {
    contract_number: string;
    buyer_id: number | null;
    seller_id: number | null;
    date: string;
    car_name: string;
    production_date: number;
    price: number;
}

export interface CreateSellContractPayload {
    contract_number: string;
    inventory_item_id: number;
    buyer_id: number | null;
    seller_id: number | null;
    date: string;
    price: number;
}

export interface CreatePersonPayload {
    name: string;
    phone: string | null;
    address: string | null;
}

export interface AddExtraCostPayload {
    inventory_item_id: number;
    title: string;
    description: string;
    price: number;
    date: string;
}

export interface CreateConsignmentAgreementPayload {
    agreement_number: string;
    owner_id: number;
    car_name: string;
    start_date: string;
    end_date: string;
    minimum_owner_payout: number;
    production_date: number;
    commission: Commission;
}

/** Business-rule violations reject with a plain English string. */
export function errorText(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

// ── Getters ────────────────────────────────────────────────────────────
export const getCars = () => invoke<Car[]>("get_cars");
export const getItems = () => invoke<InventoryItem[]>("get_items");
export const getContracts = () => invoke<Contract[]>("get_contracts");
export const getPeople = () => invoke<Person[]>("get_people");
export const getExtraCosts = () => invoke<ExtraCost[]>("get_extra_costs");
export const getConsignmentAgreements = () =>
    invoke<ConsignmentAgreement[]>("get_consignment_agreements");
export const getInventoryDetails = () =>
    invoke<InventoryItemResponse[]>("get_inventory_details");
export const getInventoryItemDetails = (inventoryItemId: number) =>
    invoke<InventoryItemResponse>("get_inventory_item_details", { inventoryItemId });

// ── Sales statistics ───────────────────────────────────────────────────
// Both commands return only the days/months that have sales; the UI fills
// the gaps with zeros. calendar selects how year/month/day are interpreted.
export const getMonthlySales = (monthlySales: GetMonthlySalesPayload) =>
    invoke<MonthlySalesResponse>("get_monthly_sales", { monthlySales });

export const getYearlySales = (yearlySales: GetYearlySalesPayload) =>
    invoke<YearlySalesResponse>("get_yearly_sales", { yearlySales });

// ── Updates & deletes ──────────────────────────────────────────────────
export const updateCar = (updatedCar: UpdateCarPayload) =>
    invoke<void>("update_car", { updatedCar });
export const updatePerson = (updatedPerson: UpdatePersonPayload) =>
    invoke<void>("update_person", { updatedPerson });
export const updateExtraCost = (updatedCost: UpdateExtraCostPayload) =>
    invoke<void>("update_extra_cost", { updatedCost });
export const deleteExtraCost = (costId: number) =>
    invoke<void>("delete_extra_cost", { costId });

// ── Creates ────────────────────────────────────────────────────────────
export const createPurchaseContract = (contract: CreatePurchaseContractPayload) =>
    invoke<void>("create_purchase_contract", { contract });
export const createSellContract = (contract: CreateSellContractPayload) =>
    invoke<void>("create_sell_contract", { contract });
export const createPerson = (person: CreatePersonPayload) =>
    invoke<void>("create_person", { person });
export const addExtraCost = (extraCost: AddExtraCostPayload) =>
    invoke<void>("add_extra_cost", { extraCost });
export const createConsignmentAgreement = (agreement: CreateConsignmentAgreementPayload) =>
    invoke<void>("create_consignment_agreement", { agreement });

// ── Lifecycle actions (flat args → camelCase) ─────────────────────────
export const withdrawInventoryItem = (itemId: number, removalDate: string) =>
    invoke<void>("withdraw_inventory_item", { itemId, removalDate });

export const completeConsignmentAgreement = (
    agreementId: number,
    endDate: string,
    contractNumber: string,
    buyerId: number,
    price: number,
) =>
    invoke<void>("complete_consignment_agreement", {
        agreementId,
        endDate,
        contractNumber,
        buyerId,
        price,
    });

export const expireConsignmentAgreement = (agreementId: number, endDate: string) =>
    invoke<void>("expire_consignment_agreement", { agreementId, endDate });

export const cancelConsignmentAgreement = (agreementId: number, endDate: string) =>
    invoke<void>("cancel_consignment_agreement", { agreementId, endDate });