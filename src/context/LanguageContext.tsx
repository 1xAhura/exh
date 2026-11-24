import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from '../i18n';
import type { Language, Translation } from '../i18n';

const STORAGE_KEY = 'car-exhibition-language';

interface LanguageContextValue {
    language: Language;
    isRTL: boolean;
    setLanguage: (language: Language) => void;
    t: Translation;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): Language {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'fa' || saved === 'en' ? saved : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(getInitialLanguage);

    // Applied in a layout effect so direction/language are set before first paint
    // and the whole UI flips instantly on switch (no restart required).
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.lang = language;
        root.dir = language === 'fa' ? 'rtl' : 'ltr';
        document.title = translations[language].appTitle;
        window.localStorage.setItem(STORAGE_KEY, language);
    }, [language]);

    const value = useMemo<LanguageContextValue>(
        () => ({ language, isRTL: language === 'fa', setLanguage, t: translations[language] }),
        [language, setLanguage],
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}