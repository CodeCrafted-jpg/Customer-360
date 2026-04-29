"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Receipt = {
  _id: string;
  totalAmount: number;
  paidAmount: number;
  note?: string;
  createdAt: string;
};

type CustomerDetail = {
  customer: {
    _id: string;
    name: string;
    address: string;
    mobile: string;
    createdAt: string;
  };
  receipts: Receipt[];
  totals: { totalAmount: number; paidAmount: number; due: number };
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ totalAmount: "", paidAmount: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as CustomerDetail;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addReceipt(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: id,
          totalAmount: Number(form.totalAmount || 0),
          paidAmount: Number(form.paidAmount || 0),
          note: form.note || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed");
      }
      setForm({ totalAmount: "", paidAmount: "", note: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReceipt(rid: string) {
    if (!confirm(t.customers.deleteReceipt)) return;
    const res = await fetch(`/api/receipts?id=${encodeURIComponent(rid)}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
  }

  async function deleteCustomer() {
    if (!confirm(t.customers.confirmDeleteCustomer)) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/customers");
  }

  if (loading) return <div className="text-slate-500">{t.common.loading}</div>;
  if (error || !data) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {t.common.error}: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {data.customer.name}
            </h1>
            <p className="text-sm text-slate-500">
              {data.customer.mobile}
              {data.customer.address ? ` · ${data.customer.address}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={deleteCustomer}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            {t.common.delete}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label={t.customers.totalBilled} value={formatCurrency(data.totals.totalAmount)} />
        <Stat
          label={t.customers.paid}
          value={formatCurrency(data.totals.paidAmount)}
          tone="good"
        />
        <Stat
          label={data.totals.due >= 0 ? t.customers.due : t.customers.payable}
          value={formatCurrency(Math.abs(data.totals.due))}
          tone={data.totals.due > 0 ? "warn" : data.totals.due < 0 ? "info" : "default"}
        />
      </div>

      <form
        onSubmit={addReceipt}
        className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <h2 className="font-semibold text-slate-900">{t.customers.addReceipt}</h2>
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
            />
          </Field>
          <Field label={t.customers.note}>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {submitting ? t.common.saving : t.customers.createReceipt}
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{t.customers.receipts}</h2>
        </div>
        {data.receipts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            {t.dashboard.noReceipts}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">{t.dashboard.when}</th>
                  <th className="px-5 py-2 text-left font-medium">{t.customers.note}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.customers.totalAmount}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.customers.paidAmount}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.dashboard.due}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data.receipts.map((r) => {
                  const due = r.totalAmount - r.paidAmount;
                  return (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-5 py-3 text-slate-600">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.note || t.common.none}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatCurrency(r.totalAmount)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-emerald-700">
                        {formatCurrency(r.paidAmount)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right tabular-nums ${
                          due > 0
                            ? "text-amber-700"
                            : due < 0
                              ? "text-blue-700"
                              : "text-slate-500"
                        }`}
                      >
                        {formatCurrency(Math.abs(due))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link
                            href={`/receipts/${r._id}`}
                            className="text-brand-600 hover:text-brand-700"
                            aria-label={t.receipt.download}
                            title={t.receipt.download}
                          >
                            <Download className="h-4 w-4 inline" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteReceipt(r._id)}
                            className="text-red-600 hover:text-red-700"
                            aria-label={t.common.delete}
                          >
                            <Trash2 className="h-4 w-4 inline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "info";
}) {
  const cls =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "info"
          ? "text-blue-700"
          : "text-slate-900";
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
