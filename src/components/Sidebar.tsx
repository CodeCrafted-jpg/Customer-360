"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/customers", label: t.nav.customers, icon: Users },
    { href: "/receipt/new", label: t.nav.receipt, icon: ReceiptIcon },
    { href: "/settings", label: t.nav.settings, icon: SettingsIcon },
  ];

  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => onClose && onClose()}
          />
          <aside className="relative z-10 w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200">
              <Link href="/dashboard" className="block">
                <span className="text-xl font-bold text-brand-600">{t.brand}</span>
              </Link>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {items.map((it) => {
                const active =
                  pathname === it.href || pathname?.startsWith(it.href + "/");
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}>
                    <Icon className="h-4 w-4" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-200 p-4 space-y-3">
              <LanguageSwitcher />
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/sign-in" />
                <span className="text-xs text-slate-500">{t.nav.signOut}</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <aside className="hidden md:flex w-64 shrink-0 border-r border-slate-200 bg-white flex-col">
          <div className="px-6 py-5 border-b border-slate-200">
            <Link href="/dashboard" className="block">
              <span className="text-xl font-bold text-brand-600">{t.brand}</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {items.map((it) => {
              const active =
                pathname === it.href || pathname?.startsWith(it.href + "/");
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}>
                  <Icon className="h-4 w-4" />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 p-4 space-y-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/sign-in" />
              <span className="text-xs text-slate-500">{t.nav.signOut}</span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
