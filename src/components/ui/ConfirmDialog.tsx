import type { ReactNode } from "react";
import { Button } from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    danger?: boolean;
    busy?: boolean;
    children?: ReactNode;
}

export default function ConfirmDialog({
    open,
    onClose,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    danger = false,
    busy = false,
    children,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            width="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        {cancelLabel}
                    </Button>
                    <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <p className="text-sm leading-6 text-zinc-600">{message}</p>
            {children && <div className="mt-4">{children}</div>}
        </Modal>
    );
}