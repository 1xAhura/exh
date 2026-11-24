import type { ReactNode } from 'react';
import type { Page } from '../../types/navigation';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    children: ReactNode;
}

export function AppLayout({ currentPage, onNavigate, children }: AppLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </main>
        </div>
    );
}