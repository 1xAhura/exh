/**
 * Mirrors the Rust backend structs.
 * Field names match serde's default (snake_case) JSON serialization,
 * which is what `get_contracts` returns.
 *
 * These are declared as `type` aliases (not `interface`) because Tauri's
 * `invoke()` args parameter is typed as `Record<string, unknown>`, and
 * TypeScript only gives type aliases — not interfaces — an implicit
 * string index signature.
 */
export type Car = {
    car_name: string;
    production_date: string;
};

export type Contract = {
    contract_number: string;
    buyer: string;
    seller: string;
    date: string;
    price: string;
    car: Car;
};

/**
 * Arguments for the `add_contract` Tauri command.
 * Tauri converts these camelCase JS keys to the snake_case
 * Rust parameters automatically.
 */
export type AddContractArgs = {
    contractNumber: string;
    buyer: string;
    seller: string;
    date: string;
    price: string;
    carName: string;
    productionDate: string;
};