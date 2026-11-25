export type PageId =
    | "dashboard"
    | "inventory"
    | "people"
    | "contracts"
    | "agreements"
    | "sales"
    | "settings";

export type ModalIntent = "purchase" | "sale" | "agreement" | "person";

export interface PageProps {
    intent: ModalIntent | null;
    onIntentDone: () => void;
    onNavigate: (page: PageId, intent?: ModalIntent) => void;
}