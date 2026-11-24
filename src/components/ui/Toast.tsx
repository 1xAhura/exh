import { CircleAlert, CircleCheck } from "lucide-react";
import type { ToastType } from "../../context/ToastContext";

interface ToastProps {
    type: ToastType;
    message: string;
}

export default function Toast({ type, message }: ToastProps) {
    const Icon = type === "success" ? CircleCheck : CircleAlert;
    return (
        <div className="toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-3 shadow-lg">
            <Icon
                size={17}
                className={`mt-0.5 shrink-0 ${type === "success" ? "text-emerald-600" : "text-red-600"}`}
            />
            <p className="break-words text-sm leading-5 text-zinc-700">{message}</p>
        </div>
    );
}