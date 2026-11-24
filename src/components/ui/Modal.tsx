import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalWidth = "sm" | "md" | "lg";

const WIDTH: Record<ModalWidth, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
};

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    width?: ModalWidth;
}

export default function Modal({ open, onClose, title, children, footer, width = "md" }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
            onMouseDown={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`modal-panel flex max-h-[85vh] w-full flex-col rounded-lg bg-white shadow-lg ${WIDTH[width]}`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-3.5">
                    <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={title}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-600"
                    >
                        <X size={15} />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && (
                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3.5">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}