"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ItemRow = {
  name: string;
  quantity: string;
  price: string;
};

type ShopInfo = {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function blankRow(): ItemRow {
  return { name: "", quantity: "1", price: "" };
}

export default function NewReceiptPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [shop, setShop] = useState<ShopInfo>({
    shopName: "",
    shopPhone: "",
    shopAddress: "",
  });

  const [customer, setCustomer] = useState({
    name: "",
    address: "",
    mobile: "",
  });

  const [rows, setRows] = useState<ItemRow[]>([blankRow(), blankRow()]);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setShop(json.settings);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRow(i: number, patch: Partial<ItemRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, blankRow()]);
  }

  function removeRow(i: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
  }

  const computed = rows.map((r) => {
    const q = Number(r.quantity || 0);
    const p = Number(r.price || 0);
    const lineTotal = Number.isFinite(q) && Number.isFinite(p) ? q * p : 0;
    return { lineTotal };
  });
  const subtotal = computed.reduce((sum, c) => sum + c.lineTotal, 0);
  const discNum = Math.max(0, Math.min(100, Number(discountPercent || 0)));
  const discountAmount = Math.round(((subtotal * discNum) / 100) * 100) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const paidNum = Math.max(0, Number(paidAmount || 0));
  const due = grandTotal - paidNum;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = rows
      .map((r) => ({
        name: r.name.trim(),
        quantity: Number(r.quantity || 0),
        price: Number(r.price || 0),
      }))
      .filter((it) => it.name && it.quantity > 0 && it.price >= 0);

    if (validItems.length === 0) {
      setError(t.receipt.errorNoItems);
      return;
    }
    if (!customer.mobile.trim()) {
      setError(t.receipt.errorNoMobile);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.name,
          address: customer.address,
          mobile: customer.mobile,
          items: validItems,
          discountPercent: discNum,
          paidAmount: paidNum,
          note: note || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t.common.error);
        return;
      }
      router.push(`/receipts/${json.receipt._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.receipt.title}</h1>
        <p className="text-sm text-slate-500">{t.receipt.subtitle}</p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Shop header */}
        <div className="border-b border-dashed border-slate-300 bg-slate-50 px-6 py-5 text-center">
          <div className="text-xl font-bold text-slate-900">
            {shop.shopName || t.receipt.shopNamePlaceholder}
          </div>
          {shop.shopAddress && (
            <div className="text-sm text-slate-600 mt-1 whitespace-pre-line">
              {shop.shopAddress}
            </div>
          )}
          {shop.shopPhone && (
            <div className="text-sm text-slate-600">
              {t.receipt.phone}: {shop.shopPhone}
            </div>
          )}
        </div>

        {/* Customer info */}
        <div className="px-6 py-5 border-b border-slate-200 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            {t.receipt.billTo}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={t.customers.name}>
              <input
                type="text"
                value={customer.name}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, name: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </Field>
            <Field label={t.customers.address}>
              <input
                type="text"
                value={customer.address}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, address: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </Field>
            <Field label={t.customers.mobile + " *"}>
              <input
                type="text"
                required
                value={customer.mobile}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, mobile: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </Field>
          </div>
          <p className="text-xs text-slate-500">{t.receipt.customerHint}</p>
        </div>

        {/* Items table */}
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {t.receipt.items}
            </h2>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" />
              {t.receipt.addRow}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    {t.receipt.itemName}
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-24">
                    {t.receipt.quantity}
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-32">
                    {t.receipt.unitPrice}
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-32">
                    {t.receipt.lineTotal}
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                        placeholder={t.receipt.itemNamePlaceholder}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={r.quantity}
                        onChange={(e) =>
                          updateRow(i, { quantity: e.target.value })
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-right focus:border-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.price}
                        onChange={(e) => updateRow(i, { price: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-right focus:border-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {formatCurrency(computed[i].lineTotal)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <Field label={t.customers.note}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                placeholder={t.customers.note}
              />
            </Field>
          </div>
          <div className="space-y-3">
            <SummaryRow
              label={t.receipt.subtotal}
              value={formatCurrency(subtotal)}
            />
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm text-slate-600">
                {t.receipt.discountPercent}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-right focus:border-brand-500 focus:outline-none"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>
            <SummaryRow
              label={t.receipt.discountAmount}
              value={`- ${formatCurrency(discountAmount)}`}
              tone="warn"
            />
            <SummaryRow
              label={t.receipt.grandTotal}
              value={formatCurrency(grandTotal)}
              bold
            />
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <label className="text-sm text-slate-600">
                {t.receipt.paidByCustomer}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-right focus:border-brand-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <SummaryRow
              label={due >= 0 ? t.customers.due : t.customers.payable}
              value={formatCurrency(Math.abs(due))}
              tone={due > 0 ? "warn" : due < 0 ? "info" : "default"}
              bold
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-xs text-slate-500">{t.receipt.saveHint}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? t.common.saving : t.receipt.saveAndView}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  tone = "default",
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "default" | "warn" | "info";
}) {
  const cls =
    tone === "warn"
      ? "text-amber-700"
      : tone === "info"
        ? "text-blue-700"
        : "text-slate-900";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`tabular-nums ${cls} ${bold ? "text-base font-semibold" : "text-sm"}`}
      >
        {value}
      </span>
    </div>
  );
}
