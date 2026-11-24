import PageHeader from "../components/layout/PageHeader";
import Segmented from "../components/ui/Segmented";
import { useLanguage } from "../context/LanguageContext";

export default function SettingsPage() {
    const { t, locale, setLocale } = useLanguage();
    return (
        <div>
            <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

            <section className="rounded-lg border border-zinc-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-zinc-900">{t("settings.language")}</h2>
                <p className="mt-0.5 text-xs text-zinc-500">{t("settings.languageHint")}</p>
                <Segmented
                    className="mt-4"
                    value={locale}
                    onChange={setLocale}
                    options={[
                        { value: "en", label: t("settings.english") },
                        { value: "fa", label: t("settings.persian") },
                    ]}
                />
            </section>

            <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-zinc-900">{t("settings.about")}</h2>
                <p className="mt-2 text-sm text-zinc-500">
                    {t("appName")} · <bdi>{t("appVersion")}</bdi>
                </p>
            </section>
        </div>
    );
}