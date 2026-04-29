"use client";

import { useEffect, useState } from "react";
import { useI18n, type Locale } from "@/lib/i18n";

type SettingsData = {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  language: Locale;
};

export default function SettingsPage() {
  const { t, setLocale } = useI18n();
  const [form, setForm] = useState<SettingsData>({
    shopName: "",
    shopPhone: "",
    shopAddress: "",
    language: "en",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!cancelled) {
          setForm(json.settings);
          setLocale(json.settings.language);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setLocale]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setForm(json.settings);
      setLocale(json.settings.language);
      setFeedback(t.common.saved);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-500">{t.common.loading}</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.settings.title}</h1>
        <p className="text-sm text-slate-500">{t.settings.subtitle}</p>
      </div>

      <form
        onSubmit={save}
        className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <Field label={t.settings.shopName}>
          <input
            type="text"
            value={form.shopName}
            onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </Field>
        <Field label={t.settings.shopPhone}>
          <input
            type="text"
            value={form.shopPhone}
            onChange={(e) => setForm((f) => ({ ...f, shopPhone: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </Field>
        <Field label={t.settings.shopAddress}>
          <textarea
            value={form.shopAddress}
            onChange={(e) => setForm((f) => ({ ...f, shopAddress: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </Field>
        <Field label={t.settings.language}>
          <select
            value={form.language}
            onChange={(e) =>
              setForm((f) => ({ ...f, language: e.target.value as Locale }))
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none bg-white"
          >
            <option value="en">{t.settings.languages.en}</option>
            <option value="hi">{t.settings.languages.hi}</option>
            <option value="bn">{t.settings.languages.bn}</option>
          </select>
        </Field>

        <div className="flex items-center justify-between pt-2">
          {feedback ? (
            <p className="text-sm text-slate-600">{feedback}</p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
