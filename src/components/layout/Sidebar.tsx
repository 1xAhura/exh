import { useLanguage } from '../../context/LanguageContext';
import type { Page } from '../../types/navigation';
import { CarIcon, DashboardIcon, PlusIcon, SettingsIcon } from '../ui/icons';

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

interface NavItem {
    page: Page;
    label: string;
    icon: typeof CarIcon;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
    const { t } = useLanguage();

    const mainItems: NavItem[] = [
        { page: 'dashboard', label: t.nav.dashboard, icon: DashboardIcon },
        { page: 'contracts', label: t.nav.contracts, icon: CarIcon },
        { page: 'add-contract', label: t.nav.addContract, icon: PlusIcon },
    ];

    const settingsItem: NavItem = { page: 'settings', label: t.nav.settings, icon: SettingsIcon };

    const renderNavItem = (item: NavItem) => {
        const Icon = item.icon;
        const isActive = currentPage === item.page;

        return (
            <button
                key={item.page}
                type="button"
                title={item.label}
                onClick={() => onNavigate(item.page)}
                className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:justify-start md:px-3 ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
            >
                <Icon className="h-5 w-5 shrink-0" />
                {/* Labels are hidden on narrow windows, where the sidebar becomes an icon rail */}
                <span className="hidden md:inline">{item.label}</span>
            </button>
        );
    };

    return (
        <aside className="flex w-14 shrink-0 flex-col border-e border-slate-200 bg-white md:w-60">
            <div className="flex h-16 shrink-0 items-center justify-center gap-3 border-b border-slate-200 px-3 md:justify-start md:px-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <CarIcon className="h-5 w-5" />
                </div>
                <span className="hidden text-sm font-semibold text-slate-900 md:block">{t.appName}</span>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">{mainItems.map(renderNavItem)}</nav>
            <div className="shrink-0 border-t border-slate-200 p-3">{renderNavItem(settingsItem)}</div>
        </aside>
    );
}