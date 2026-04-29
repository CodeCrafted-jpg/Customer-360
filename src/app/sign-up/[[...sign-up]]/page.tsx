"use client";

import { SignUp } from "@clerk/nextjs";
import { useI18n } from "@/lib/i18n";

export default function SignUpPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t.brand}</h1>
        <p className="mt-1 text-slate-600">{t.auth.welcomeSub}</p>
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
