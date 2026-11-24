import { useCallback, useState } from "react";
import Shell from "./components/layout/Shell";
import { DataProvider } from "./context/DataContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./context/ToastContext";
import AgreementsPage from "./pages/AgreementsPage";
import ContractsPage from "./pages/ContractsPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import PeoplePage from "./pages/PeoplePage";
import SettingsPage from "./pages/SettingsPage";
import type { ModalIntent, PageId } from "./types/nav";

function AppContent() {
    const [page, setPage] = useState<PageId>("dashboard");
    const [intent, setIntent] = useState<ModalIntent | null>(null);

    const navigate = useCallback((next: PageId, nextIntent?: ModalIntent) => {
        setIntent(nextIntent ?? null);
        setPage(next);
    }, []);

    const clearIntent = useCallback(() => setIntent(null), []);

    return (
        <Shell page={page} onNavigate={(next) => navigate(next)}>
            {page === "dashboard" && (
                <DashboardPage intent={intent} onIntentDone={clearIntent} onNavigate={navigate} />
            )}
            {page === "inventory" && (
                <InventoryPage intent={intent} onIntentDone={clearIntent} onNavigate={navigate} />
            )}
            {page === "people" && (
                <PeoplePage intent={intent} onIntentDone={clearIntent} onNavigate={navigate} />
            )}
            {page === "contracts" && (
                <ContractsPage intent={intent} onIntentDone={clearIntent} onNavigate={navigate} />
            )}
            {page === "agreements" && (
                <AgreementsPage intent={intent} onIntentDone={clearIntent} onNavigate={navigate} />
            )}
            {page === "settings" && <SettingsPage />}
        </Shell>
    );
}

export default function App() {
    return (
        <LanguageProvider>
            <ToastProvider>
                <DataProvider>
                    <AppContent />
                </DataProvider>
            </ToastProvider>
        </LanguageProvider>
    );
}