import { BarChart3, Car, FileText, LayoutDashboard, ScrollText, Settings, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { TKey } from "../../i18n";
import type { PageId } from "../../types/nav";

interface SidebarProps {
    active: PageId;
    onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; labelKey: TKey; icon: LucideIcon }[] = [
    { id: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { id: "inventory", labelKey: "nav.inventory", icon: Car },
    { id: "people", labelKey: "nav.people", icon: Users },
    { id: "contracts", labelKey: "nav.contracts", icon: FileText },
    { id: "agreements", labelKey: "nav.agreements", icon: ScrollText },
    { id: "sales", labelKey: "navSales", icon: BarChart3 },
];

function navButtonClass(active: boolean): string {
    return `flex w-full items-center justify-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-150 xl:justify-start xl:px-3 ${active
            ? "bg-primary/20 text-cyan-300"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
        }`;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
    const { t } = useLanguage();
    return (
        <aside className="flex h-full w-14 shrink-0 flex-col border-e border-zinc-800 bg-zinc-900 xl:w-60">
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-800 px-2.5 xl:px-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                    <Car size={18} />
                </div>
                <div className="hidden min-w-0 xl:block">
                    <p className="truncate text-sm font-semibold text-white">{t("appName")}</p>
                    <p className="truncate text-xs text-zinc-500">{t("appTagline")}</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 xl:px-3">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onNavigate(item.id)}
                        title={t(item.labelKey)}
                        className={navButtonClass(active === item.id)}
                    >
                        <item.icon size={17} className="shrink-0" />
                        <span className="hidden truncate xl:inline">{t(item.labelKey)}</span>
                    </button>
                ))}
            </nav>

            <div className="shrink-0 border-t border-zinc-800 px-2 py-3 xl:px-3">
                <button
                    type="button"
                    onClick={() => onNavigate("settings")}
                    title={t("nav.settings")}
                    className={navButtonClass(active === "settings")}
                >
                    <Settings size={17} className="shrink-0" />
                    <span className="hidden truncate xl:inline">{t("nav.settings")}</span>
                </button>
            </div>
        </aside>
    );
}