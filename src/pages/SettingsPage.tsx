import { PageHeader } from '../components/layout/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { GlobeIcon } from '../components/ui/icons';
import type { Language } from '../i18n';

interface LanguageOption {
    id: Language;
    /** Language selectors conventionally show the native name, always untranslated. */
    nativeName: string;
    directionLabel: string;
}

export function SettingsPage() {
    const { t, language, setLanguage } = useLanguage();

    const languageOptions: LanguageOption[] = [
        { id: 'en', nativeName: 'English', directionLabel: t.settings.directionLtr },
        { id: 'fa', nativeName: 'فارسی', directionLabel: t.settings.directionRtl },
    ];

    return (
        <>
            <PageHeader title={t.settings.title} description={t.settings.subtitle} />

            <section className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2">
                    <GlobeIcon className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-900">{t.settings.language}</h2>
                </div>
                <p className="mb-4 text-sm text-slate-500">{t.settings.languageDescription}</p>

                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                    {languageOptions.map((option) => {
                        const isSelected = language === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setLanguage(option.id)}
                                className={`flex w-full items-center gap-4 p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-blue-600' : 'border-slate-300'
                                        }`}
                                >
                                    {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                                </span>
                                <span className="flex-1">
                                    <span className="block text-sm font-medium text-slate-900">{option.nativeName}</span>
                                    <span className="block text-xs text-slate-500">{option.directionLabel}</span>
                                </span>
                                {isSelected && (
                                    <span className="text-xs font-medium text-blue-700">{t.settings.selected}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-3 text-xs text-slate-500">{t.settings.savedNote}</p>
            </section>

            <section className="mt-8 max-w-2xl">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">{t.settings.about}</h2>
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-900">{t.settings.aboutName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t.settings.aboutDescription}</p>
                </div>
            </section>
        </>
    );
}