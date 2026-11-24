import type { ReactNode } from "react";

interface TableShellProps {
    children: ReactNode;
    className?: string;
    /** Vertical scroll limit for the bordered (non-plain) variant. */
    maxHeight?: string;
    minWidth?: number;
    /** Render the bare table (for embedding inside an existing card). */
    plain?: boolean;
}

export function TableShell({
    children,
    className = "",
    maxHeight = "min(70vh, 640px)",
    minWidth,
    plain = false,
}: TableShellProps) {
    const tableStyle = minWidth ? { minWidth } : undefined;
    if (plain) {
        // Plain tables live inside cards: overflow must be contained here so it
        // can never propagate to the page-level scroll container.
        return (
            <div className={`min-w-0 overflow-x-auto ${className}`}>
                <table className="data-table" style={tableStyle}>
                    {children}
                </table>
            </div>
        );
    }
    return (
        <div
            className={`min-w-0 overflow-auto rounded-lg border border-zinc-200 bg-white ${className}`}
            style={{ maxHeight }}
        >
            <table className="data-table data-table-scroll" style={tableStyle}>
                {children}
            </table>
        </div>
    );
}

interface CellProps {
    numeric?: boolean;
    className?: string;
    children?: ReactNode;
}

export function Th({ numeric = false, className = "", children }: CellProps) {
    return (
        <th scope="col" className={`${numeric ? "text-end tabular-nums" : "text-start"} ${className}`}>
            {children}
        </th>
    );
}

export function Td({ numeric = false, className = "", children }: CellProps) {
    return <td className={`${numeric ? "text-end tabular-nums" : ""} ${className}`}>{children}</td>;
}