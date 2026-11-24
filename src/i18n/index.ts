import { en } from "./en";
import { fa } from "./fa";

export type Locale = "en" | "fa";
export type Dictionary = typeof en;

/** Dot-path union of all dictionary leaf keys, e.g. "contracts.title". */
type DictPath<T> = T extends string
    ? never
    : {
        [K in keyof T & string]: T[K] extends string ? K : `${K}.${DictPath<T[K]>}`;
    }[keyof T & string];

export type TKey = DictPath<Dictionary>;

export const dictionaries: Record<Locale, Dictionary> = { en, fa };

export function translate(dict: Dictionary, key: TKey, params?: Record<string, string>): string {
    let current: unknown = dict;
    for (const part of key.split(".")) {
        if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[part];
        } else {
            return key;
        }
    }
    if (typeof current !== "string") return key;
    if (!params) return current;
    let result = current;
    for (const [name, value] of Object.entries(params)) {
        result = result.split(`{${name}}`).join(value);
    }
    return result;
}