"use client";

import { useI18n, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  const langs: { code: Locale; label: string }[] = [
    { code: "en", label: t.settings.languages.en },
    { code: "hi", label: t.settings.languages.hi },
    { code: "bn", label: t.settings.languages.bn },
  ];

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <Globe className="h-4 w-4" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
      >
        {langs.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
