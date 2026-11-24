import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Contract } from '../types/contract';

interface UseContractsResult {
    contracts: Contract[] | null;
    isLoading: boolean;
    hasError: boolean;
    /** Returns true when the fetch succeeded. */
    refetch: () => Promise<boolean>;
}

export function useContracts(): UseContractsResult {
    const [contracts, setContracts] = useState<Contract[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const refetch = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setHasError(false);
        try {
            const data = await invoke<Contract[]>('get_contracts');
            setContracts(data);
            return true;
        } catch (error) {
            console.error('Failed to load contracts:', error);
            setHasError(true);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { contracts, isLoading, hasError, refetch };
}