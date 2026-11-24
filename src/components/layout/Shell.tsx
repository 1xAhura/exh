import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import type { PageId } from "../../types/nav";

interface ShellProps {
    page: PageId;
    onNavigate: (page: PageId) => void;
    children: ReactNode;
}

export default function Shell({ page, onNavigate, children }: ShellProps) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar active={page} onNavigate={onNavigate} />
            {/* min-w-0: the flex item must never grow to fit its content's
          intrinsic minimum width — overflow belongs to its own scrollbar. */}
            <main className="min-w-0 flex-1 overflow-auto">
                <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </main>
        </div>
    );
}