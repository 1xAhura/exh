import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ContractsPage } from './pages/ContractsPage';
import { AddContractPage } from './pages/AddContractPage';
import { SettingsPage } from './pages/SettingsPage';
import type { Page } from './types/navigation';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <AppLayout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
      {page === 'contracts' && <ContractsPage onNavigate={setPage} />}
      {page === 'add-contract' && <AddContractPage onNavigate={setPage} />}
      {page === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}