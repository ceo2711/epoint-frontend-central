"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/features/auth/AuthContext";
import { ProductLockScreen } from "@/features/portal/components/ProductLockScreen";
import { useTranslation } from "@/contexts/LanguageContext";
import { clientEntitlements } from "@/lib/appNavigation";

const CREDIT_PATHS = ["/portal/datos", "/portal/documentos", "/portal/tablero"];

export function PortalProductGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const flags = clientEntitlements(user);

  if (CREDIT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) && !flags.credit) {
    return <ProductLockScreen title={t("nav.myPortal")} product="credit" />;
  }
  if (pathname.startsWith("/portal/cursos") && !flags.course) {
    return <ProductLockScreen title={t("nav.courses")} product="course" />;
  }
  if (pathname.startsWith("/portal/mentorias") && !flags.mentorship) {
    return <ProductLockScreen title={t("nav.mentorships")} product="mentorship" />;
  }
  return children;
}
