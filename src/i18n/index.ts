import { en } from './en';
import { fa } from './fa';

export const translations = {
    en,
    fa,
} as const;

export type Language = keyof typeof translations;

export type { Translation } from './en';