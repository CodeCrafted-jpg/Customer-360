"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ReceiptDownloadButton } from "@/components/ReceiptDownloadButton";

type ReceiptItem = { name: string; quantity: number; price: number };

type ReceiptData = {
  receipt: {
    _id: string;
    items: ReceiptItem[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    note?: string;
    createdAt: string;
  };
  customer: {
    _id: string;
    name: string;
    address: string;
    mobile: string;
  } | null;
  shop: {
    shopName: string;
    shopPhone: string;
    shopAddress: string;
  };
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ReceiptViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useI18n();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/receipts/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as ReceiptData;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="text-slate-500">{t.common.loading}</div>;
  if (error || !data) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {t.common.error}: {error}
      </div>
    );
  }

  const { receipt, customer, shop } = data;
  const due = receipt.totalAmount - receipt.paidAmount;
  const fileName = `receipt-${customer?.name?.replace(/\s+/g, "_") || "customer"}-${new Date(
    receipt.createdAt
  )
    .toISOString()
    .slice(0, 10)}.pdf`;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={customer ? `/customers/${customer._id}` : "/customers"}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
        <ReceiptDownloadButton
          targetId="receipt-print"
          fileName={fileName}
          label={t.receipt.downloadPdf}
        />
      </div>

      <div
        id="receipt-print"
        className="bg-white border border-slate-300 shadow-sm p-8 text-slate-900"
      >
        {/* Shop header */}
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <div className="text-2xl font-bold tracking-tight">
            {shop.shopName || "Shop"}
          </div>
          {shop.shopAddress && (
            <div className="text-sm mt-1 whitespace-pre-line">
              {shop.shopAddress}
            </div>
          )}
          {shop.shopPhone && (
            <div className="text-sm">
              {t.receipt.phone}: {shop.shopPhone}
            </div>
          )}
        </div>

        {/* Receipt meta */}
        <div className="flex items-start justify-between mt-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {t.receipt.billTo}
            </div>
            <div className="mt-1 font-semibold">
              {customer?.name || t.common.none}
            </div>
            {customer?.address && (
              <div className="text-sm">{customer.address}</div>
            )}
            {customer?.mobile && (
              <div className="text-sm">
                {t.receipt.phone}: {customer.mobile}
              </div>
            )}
          </div>
          <div className="text-right text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {t.receipt.receiptNo}
            </div>
            <div className="font-mono">{receipt._id.slice(-8).toUpperCase()}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mt-2">
              {t.receipt.date}
            </div>
            <div>{new Date(receipt.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left">
                <th className="py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-2 font-semibold">{t.receipt.itemName}</th>
                <th className="py-2 pr-2 text-right font-semibold">
                  {t.receipt.quantity}
                </th>
                <th className="py-2 pr-2 text-right font-semibold">
                  {t.receipt.unitPrice}
                </th>
                <th className="py-2 text-right font-semibold">
                  {t.receipt.lineTotal}
                </th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.length === 0 ? (
                <tr className="border-b border-slate-200">
                  <td className="py-2 pr-2">1</td>
                  <td className="py-2 pr-2">{receipt.note || t.receipt.itemsNotListed}</td>
                  <td className="py-2 pr-2 text-right">1</td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {formatCurrency(receipt.subtotal)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatCurrency(receipt.subtotal)}
                  </td>
                </tr>
              ) : (
                receipt.items.map((it, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="py-2 pr-2">{i + 1}</td>
                    <td className="py-2 pr-2">{it.name}</td>
                    <td className="py-2 pr-2 text-right">{it.quantity}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {formatCurrency(it.price)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatCurrency(it.quantity * it.price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <Row label={t.receipt.subtotal} value={formatCurrency(receipt.subtotal)} />
            <Row
              label={`${t.receipt.discount} (${receipt.discountPercent}%)`}
              value={`- ${formatCurrency(receipt.discountAmount)}`}
            />
            <div className="border-t-2 border-slate-900 pt-2 mt-2">
              <Row
                label={t.receipt.grandTotal}
                value={formatCurrency(receipt.totalAmount)}
                bold
              />
            </div>
            <Row label={t.receipt.paid} value={formatCurrency(receipt.paidAmount)} />
            <div className="border-t border-slate-300 pt-1.5 mt-1.5">
              <Row
                label={due >= 0 ? t.receipt.balanceDue : t.receipt.balancePayable}
                value={formatCurrency(Math.abs(due))}
                bold
              />
            </div>
          </div>
        </div>

        {receipt.note && (
          <div className="mt-6 text-sm">
            <span className="font-semibold">{t.customers.note}: </span>
            {receipt.note}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-xs text-slate-500">
          {t.receipt.thankYou}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={bold ? "font-semibold" : "text-slate-600"}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
