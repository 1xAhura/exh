import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/contracts/SearchInput';
import { ContractsTable } from '../components/contracts/ContractsTable';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import { CarIcon, PlusIcon, SearchIcon } from '../components/ui/icons';
import { useContracts } from '../hooks/useContracts';
import { useLanguage } from '../context/LanguageContext';
import { normalizeDigits } from '../utils/format';
import type { Page } from '../types/navigation';

interface ContractsPageProps {
    onNavigate: (page: Page) => void;
}

export function ContractsPage({ onNavigate }: ContractsPageProps) {
    const { t } = useLanguage();
    const { contracts, isLoading, hasError, refetch } = useContracts();
    const [search, setSearch] = useState('');

    const filteredContracts = useMemo(() => {
        if (!contracts) return [];
        const query = normalizeDigits(search.trim().toLowerCase());
        if (!query) return contracts;
        return contracts.filter((contract) =>
            [
                contract.contract_number,
                contract.buyer,
                contract.seller,
                contract.car.car_name,
                contract.price,
            ].some((field) => normalizeDigits(field.toLowerCase()).includes(query)),
        );
    }, [contracts, search]);

    const isSearching = search.trim().length > 0;

    return (
        <>
            <PageHeader
                title={t.contracts.title}
                description={t.contracts.subtitle}
                actions={
                    <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => onNavigate('add-contract')}>
                        {t.contracts.addContract}
                    </Button>
                }
            />

            <div className="mb-4">
                <SearchInput value={search} onChange={setSearch} placeholder={t.contracts.searchPlaceholder} />
            </div>

            {isLoading ? (
                <LoadingState label={t.common.loading} />
            ) : hasError || contracts === null ? (
                <ErrorState title={t.contracts.loadError} onRetry={() => void refetch()} />
            ) : filteredContracts.length === 0 ? (
                isSearching ? (
                    <EmptyState
                        icon={<SearchIcon className="h-6 w-6" />}
                        title={t.contracts.noResultsTitle}
                        description={t.contracts.noResultsDescription}
                    />
                ) : (
                    <EmptyState
                        icon={<CarIcon className="h-6 w-6" />}
                        title={t.contracts.emptyTitle}
                        description={t.contracts.emptyDescription}
                        action={
                            <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => onNavigate('add-contract')}>
                                {t.contracts.addContract}
                            </Button>
                        }
                    />
                )
            ) : (
                <ContractsTable contracts={filteredContracts} />
            )}
        </>
    );
}