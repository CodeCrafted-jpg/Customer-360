"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Plus } from "lucide-react";

type CustomerRow = {
  _id: string;
  name: string;
  address: string;
  mobile: string;
  totalAmount: number;
  paidAmount: number;
  due: number;
  receiptCount: number;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CustomersPage() {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile: "",
    totalAmount: "",
    paidAmount: "",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { customers: CustomerRow[] };
      setCustomers(json.customers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          mobile: form.mobile,
          totalAmount: Number(form.totalAmount || 0),
          paidAmount: Number(form.paidAmount || 0),
          note: form.note || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback(json.error || t.common.error);
      } else {
        setFeedback(
          json.createdCustomer
            ? `${json.customer.name} — ${t.customers.addOrReceipt}`
            : `${json.customer.name} — ${t.customers.createReceipt}`
        );
        setForm({
          name: "",
          address: "",
          mobile: "",
          totalAmount: "",
          paidAmount: "",
          note: "",
        });
        await load();
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.customers.title}</h1>
        <p className="text-sm text-slate-500">{t.customers.subtitle}</p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <p className="text-xs text-slate-500">{t.customers.addOrReceiptHint}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={t.customers.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder={t.customers.name}
            />
          </Field>
          <Field label={t.customers.address}>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder={t.customers.address}
            />
          </Field>
          <Field label={t.customers.mobile + " *"}>
            <input
              type="text"
              required
              value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder={t.customers.mobile}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={t.customers.totalAmount + " *"}>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.totalAmount}
              onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="0"
            />
          </Field>
          <Field label={t.customers.paidAmount}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.paidAmount}
              onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder="0"
            />
          </Field>
          <Field label={t.customers.note}>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              placeholder={t.customers.note}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          {feedback ? (
            <p className="text-xs text-slate-600">{feedback}</p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {submitting ? t.common.saving : t.customers.addOrReceipt}
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{t.customers.list}</h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-500">{t.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            {t.customers.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">{t.customers.name}</th>
                  <th className="px-5 py-2 text-left font-medium">{t.customers.mobile}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.customers.totalBilled}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.customers.paid}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.customers.due}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-t border-slate-100">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      {c.address ? (
                        <div className="text-xs text-slate-500">{c.address}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{c.mobile}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatCurrency(c.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-emerald-700">
                      {formatCurrency(c.paidAmount)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right tabular-nums ${
                        c.due > 0
                          ? "text-amber-700"
                          : c.due < 0
                            ? "text-blue-700"
                            : "text-slate-500"
                      }`}
                    >
                      {formatCurrency(Math.abs(c.due))}
                      {c.due < 0 ? ` (${t.customers.payable})` : ""}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/customers/${c._id}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        {t.customers.viewProfile}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
