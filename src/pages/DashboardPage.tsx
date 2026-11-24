import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ContractsTable } from '../components/contracts/ContractsTable';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import { BanknoteIcon, CarIcon, DashboardIcon, PlusIcon, RefreshIcon, SettingsIcon } from '../components/ui/icons';
import { useContracts } from '../hooks/useContracts';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { detectCurrency, formatNumber, parsePriceAmount } from '../utils/format';
import type { Page } from '../types/navigation';

interface DashboardPageProps {
    onNavigate: (page: Page) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const { contracts, isLoading, hasError, refetch } = useContracts();

    if (isLoading) {
        return (
            <>
                <PageHeader title={t.dashboard.title} description={t.dashboard.subtitle} />
                <LoadingState label={t.common.loading} />
            </>
        );
    }

    if (hasError || contracts === null) {
        return (
            <>
                <PageHeader title={t.dashboard.title} description={t.dashboard.subtitle} />
                <ErrorState title={t.dashboard.loadError} onRetry={() => void refetch()} />
            </>
        );
    }

    // Statistics are computed from the actual backend data.
    const totalContracts = contracts.length;
    const totalValue = contracts.reduce((sum, contract) => sum + parsePriceAmount(contract.price), 0);
    const currency = detectCurrency(contracts);
    const uniqueCarModels = new Set(contracts.map((contract) => contract.car.car_name)).size;
    const totalValueLabel = `${formatNumber(totalValue, language)}${currency ? ` ${currency}` : ''}`;

    const handleRefresh = async () => {
        const succeeded = await refetch();
        showToast(succeeded ? 'success' : 'error', succeeded ? t.dashboard.dataRefreshed : t.dashboard.loadError);
    };

    const actions = [
        { label: t.dashboard.actionAdd, icon: <PlusIcon className="h-5 w-5" />, onClick: () => onNavigate('add-contract') },
        { label: t.dashboard.actionView, icon: <CarIcon className="h-5 w-5" />, onClick: () => onNavigate('contracts') },
        { label: t.dashboard.actionRefresh, icon: <RefreshIcon className="h-5 w-5" />, onClick: () => void handleRefresh() },
        { label: t.dashboard.actionSettings, icon: <SettingsIcon className="h-5 w-5" />, onClick: () => onNavigate('settings') },
    ];

    return (
        <>
            <PageHeader title={t.dashboard.title} description={t.dashboard.subtitle} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    icon={<DashboardIcon className="h-5 w-5" />}
                    label={t.dashboard.totalContracts}
                    value={formatNumber(totalContracts, language)}
                />
                <StatCard
                    icon={<BanknoteIcon className="h-5 w-5" />}
                    label={t.dashboard.totalValue}
                    value={totalValueLabel}
                />
                <StatCard
                    icon={<CarIcon className="h-5 w-5" />}
                    label={t.dashboard.uniqueCars}
                    value={formatNumber(uniqueCarModels, language)}
                />
            </div>

            <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">{t.dashboard.quickActions}</h2>
                <QuickActions actions={actions} />
            </section>

            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">{t.dashboard.recentContracts}</h2>
                    <button
                        type="button"
                        onClick={() => onNavigate('contracts')}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        {t.dashboard.viewAll}
                    </button>
                </div>
                {contracts.length === 0 ? (
                    <EmptyState
                        icon={<CarIcon className="h-6 w-6" />}
                        title={t.dashboard.emptyTitle}
                        description={t.dashboard.emptyDescription}
                        action={
                            <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => onNavigate('add-contract')}>
                                {t.contracts.addContract}
                            </Button>
                        }
                    />
                ) : (
                    <ContractsTable contracts={contracts} limit={5} />
                )}
            </section>
        </>
    );
}