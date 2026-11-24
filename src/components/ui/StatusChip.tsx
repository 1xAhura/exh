import { useLanguage } from "../../context/LanguageContext";
import type { TKey } from "../../i18n";
import type {
    AcquisitionType,
    AgreementStatus,
    ContractType,
    InventoryStatus,
} from "../../types/models";

export type DomainStatus = AcquisitionType | InventoryStatus | ContractType | AgreementStatus;
type ChipColor = "emerald" | "sky" | "amber" | "red" | "zinc" | "violet";
type ChipVariant = "soft" | "outline";

const SOFT: Record<ChipColor, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/25",
    sky: "bg-sky-50 text-sky-700 ring-sky-600/25",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/25",
    red: "bg-red-50 text-red-700 ring-red-600/25",
    zinc: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
    violet: "bg-violet-50 text-violet-700 ring-violet-600/25",
};

const OUTLINE: Record<ChipColor, string> = {
    emerald: "bg-white text-emerald-700 ring-emerald-600/40",
    sky: "bg-white text-sky-700 ring-sky-600/40",
    amber: "bg-white text-amber-700 ring-amber-600/40",
    red: "bg-white text-red-700 ring-red-600/40",
    zinc: "bg-white text-zinc-600 ring-zinc-400/50",
    violet: "bg-white text-violet-700 ring-violet-600/40",
};

const DOT: Record<ChipColor, string> = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    zinc: "bg-zinc-400",
    violet: "bg-violet-500",
};

const STATUS_MAP: Record<DomainStatus, { labelKey: TKey; color: ChipColor; variant: ChipVariant }> = {
    InStock: { labelKey: "statuses.inStock", color: "emerald", variant: "soft" },
    Sold: { labelKey: "statuses.sold", color: "sky", variant: "soft" },
    Withdrawn: { labelKey: "statuses.withdrawn", color: "zinc", variant: "soft" },
    Owned: { labelKey: "statuses.owned", color: "zinc", variant: "outline" },
    Consignment: { labelKey: "statuses.consignment", color: "violet", variant: "outline" },
    Purchase: { labelKey: "statuses.purchase", color: "zinc", variant: "outline" },
    Sale: { labelKey: "statuses.sale", color: "emerald", variant: "outline" },
    Active: { labelKey: "statuses.active", color: "emerald", variant: "soft" },
    Completed: { labelKey: "statuses.completed", color: "sky", variant: "soft" },
    Expired: { labelKey: "statuses.expired", color: "amber", variant: "soft" },
    Cancelled: { labelKey: "statuses.cancelled", color: "red", variant: "soft" },
};

export default function StatusChip({ value }: { value: DomainStatus }) {
    const { t } = useLanguage();
    const config = STATUS_MAP[value];
    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${config.variant === "soft" ? SOFT[config.color] : OUTLINE[config.color]
                }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${DOT[config.color]}`} />
            {t(config.labelKey)}
        </span>
    );
}