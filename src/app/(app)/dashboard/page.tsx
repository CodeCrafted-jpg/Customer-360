"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import {
  Users,
  CalendarDays,
  CalendarClock,
  Wallet,
  TrendingUp,
  Banknote,
  AlertCircle,
} from "lucide-react";

type Dashboard = {
  customers: { total: number; month: number; week: number };
  revenue: { allTime: number; month: number; week: number };
  totalDue: number;
  recent: Array<{
    _id: string;
    totalAmount: number;
    paidAmount: number;
    createdAt: string;
    customer: { _id: string; name: string; mobile: string } | null;
  }>;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600 bg-emerald-50"
      : tone === "warn"
        ? "text-amber-600 bg-amber-50"
        : "text-brand-600 bg-brand-50";
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as Dashboard;
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
  }, []);

  if (loading) {
    return <div className="text-slate-500">{t.common.loading}</div>;
  }
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
        <h1 className="text-2xl font-bold text-slate-900">{t.dashboard.title}</h1>
        <p className="text-sm text-slate-500">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.dashboard.totalCustomers} value={data.customers.total} icon={Users} />
        <StatCard label={t.dashboard.customersThisMonth} value={data.customers.month} icon={CalendarDays} />
        <StatCard label={t.dashboard.customersThisWeek} value={data.customers.week} icon={CalendarClock} />
        <StatCard
          label={t.dashboard.totalDue}
          value={formatCurrency(data.totalDue)}
          icon={AlertCircle}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t.dashboard.revenueAllTime}
          value={formatCurrency(data.revenue.allTime)}
          icon={Wallet}
          tone="good"
        />
        <StatCard
          label={t.dashboard.revenueThisMonth}
          value={formatCurrency(data.revenue.month)}
          icon={TrendingUp}
          tone="good"
        />
        <StatCard
          label={t.dashboard.revenueThisWeek}
          value={formatCurrency(data.revenue.week)}
          icon={Banknote}
          tone="good"
        />
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{t.dashboard.recentReceipts}</h2>
        </div>
        {data.recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            {t.dashboard.noReceipts}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">{t.dashboard.customer}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.dashboard.amount}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.dashboard.paid}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.dashboard.due}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.dashboard.when}</th>
                  <th className="px-5 py-2 text-right font-medium">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => {
                  const due = r.totalAmount - r.paidAmount;
                  return (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-5 py-3">
                        {r.customer ? (
                          <Link
                            href={`/customers/${r.customer._id}`}
                            className="font-medium text-slate-900 hover:text-brand-600"
                          >
                            {r.customer.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">{t.common.none}</span>
                        )}
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
                        {due < 0 ? ` (${t.customers.payable})` : ""}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/receipts/${r._id}`}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          {t.receipt.download}
                        </Link>
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
