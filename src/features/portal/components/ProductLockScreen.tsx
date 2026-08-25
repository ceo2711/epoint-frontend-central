"use client";

import { Header } from "@/components/layout/Header";
import { Card, PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { clientEntitlements } from "@/lib/appNavigation";

export function ProductLockScreen({
  title,
  product,
}: {
  title: string;
  product: "credit" | "course" | "mentorship";
}) {
  const { t } = useTranslation();
  return (
    <>
      <Header title={title} />
      <PageContent>
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t("nav.productLocked")}</h2>
          <p className="mt-2 text-slate-600">{t(`portal.lock.${product}`)}</p>
        </Card>
      </PageContent>
    </>
  );
}

export function useHasProduct(product: "credit" | "course" | "mentorship"): boolean {
  const { user } = useAuth();
  return clientEntitlements(user)[product];
}
