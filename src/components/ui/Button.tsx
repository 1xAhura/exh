import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
    primary: "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40",
    secondary:
        "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:ring-zinc-400/40",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400/40",
    ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-400/40",
};

const SIZE: Record<ButtonSize, string> = {
    sm: "h-8 gap-1.5 px-2.5 text-xs",
    md: "h-9 gap-2 px-3.5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = "primary", size = "md", type = "button", className = "", children, ...rest },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            className={`inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label: string;
    destructive?: boolean;
}

export function IconButton({
    icon: Icon,
    label,
    destructive = false,
    type = "button",
    className = "",
    ...rest
}: IconButtonProps) {
    return (
        <button
            type={type}
            title={label}
            aria-label={label}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 disabled:pointer-events-none disabled:opacity-40 ${destructive ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-zinc-100 hover:text-zinc-900"
                } ${className}`}
            {...rest}
        >
            <Icon size={16} />
        </button>
    );
}