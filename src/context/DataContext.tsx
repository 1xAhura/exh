import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as api from "../api/client";
import type {
    Car,
    ConsignmentAgreement,
    Contract,
    ExtraCost,
    InventoryItem,
    InventoryItemResponse,
    Person,
} from "../types/models";

export interface AppData {
    cars: Car[];
    items: InventoryItem[];
    contracts: Contract[];
    people: Person[];
    extraCosts: ExtraCost[];
    agreements: ConsignmentAgreement[];
    inventoryDetails: InventoryItemResponse[];
}

interface DataContextValue {
    data: AppData;
    loading: boolean;
    error: string | null;
    refreshAll: () => Promise<void>;
}

const EMPTY_DATA: AppData = {
    cars: [],
    items: [],
    contracts: [],
    people: [],
    extraCosts: [],
    agreements: [],
    inventoryDetails: [],
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (withSpinner: boolean) => {
        if (withSpinner) setLoading(true);
        try {
            const [cars, items, contracts, people, extraCosts, agreements, inventoryDetails] =
                await Promise.all([
                    api.getCars(),
                    api.getItems(),
                    api.getContracts(),
                    api.getPeople(),
                    api.getExtraCosts(),
                    api.getConsignmentAgreements(),
                    api.getInventoryDetails(),
                ]);
            setData({ cars, items, contracts, people, extraCosts, agreements, inventoryDetails });
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            if (withSpinner) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load(true);
    }, [load]);

    const refreshAll = useCallback(() => load(false), [load]);

    const value = useMemo(() => ({ data, loading, error, refreshAll }), [data, loading, error, refreshAll]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error("useData must be used inside DataProvider");
    return ctx;
}