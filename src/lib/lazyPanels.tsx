"use client";

import dynamic from "next/dynamic";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function panelLoader(label?: string) {
  return function PanelLoading() {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner label={label} />
      </div>
    );
  };
}

export const LazyClientBoardPanel = dynamic(
  () =>
    import("@/features/boards/components/ClientBoardPanel").then((module) => ({
      default: module.ClientBoardPanel,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyClientContractsPanel = dynamic(
  () =>
    import("@/features/docusign/components/ClientContractsPanel").then((module) => ({
      default: module.ClientContractsPanel,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyStaffClientDocumentsPanel = dynamic(
  () =>
    import("@/features/documents/components/StaffClientDocumentsPanel").then((module) => ({
      default: module.StaffClientDocumentsPanel,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyDocumentViewerModal = dynamic(
  () =>
    import("@/features/documents/components/DocumentViewerModal").then((module) => ({
      default: module.DocumentViewerModal,
    })),
  { ssr: false },
);

export const LazyFloatingChatWidget = dynamic(
  () =>
    import("@/features/chat/components/FloatingChatWidget").then((module) => ({
      default: module.FloatingChatWidget,
    })),
  { ssr: false },
);

export const LazyDashboardPage = dynamic(
  () =>
    import("@/features/dashboard/components/DashboardPage").then((module) => ({
      default: module.DashboardPage,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyClientesPage = dynamic(
  () =>
    import("@/features/clients/components/ClientesPage").then((module) => ({
      default: module.ClientesPage,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyProspectosPage = dynamic(
  () =>
    import("@/features/prospects/components/ProspectosPage").then((module) => ({
      default: module.ProspectosPage,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyContratosPage = dynamic(
  () =>
    import("@/features/docusign/components/ContratosPage").then((module) => ({
      default: module.ContratosPage,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyCalendarioPage = dynamic(
  () =>
    import("@/features/calendly/components/CalendarioPage").then((module) => ({
      default: module.CalendarioPage,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyPagosPage = dynamic(
  () =>
    import("@/features/payments/components/PagosPage").then((module) => ({
      default: module.PagosPage,
    })),
  { loading: panelLoader(), ssr: false },
);

export const LazyConfiguracionPage = dynamic(
  () =>
    import("@/features/auth/components/AccountSettingsPage").then((module) => ({
      default: module.AccountSettingsPage,
    })),
  { loading: panelLoader(), ssr: false },
);

/** Prefetch del JS de cada ruta del menú (code-split), sin bloquear la UI. */
export const ROUTE_MODULE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("@/features/dashboard/components/DashboardPage"),
  "/clientes": () => import("@/features/clients/components/ClientesPage"),
  "/prospectos": () => import("@/features/prospects/components/ProspectosPage"),
  "/calendario": () => import("@/features/calendly/components/CalendarioPage"),
  "/contratos": () => import("@/features/docusign/components/ContratosPage"),
  "/pagos": () => import("@/features/payments/components/PagosPage"),
  "/configuracion": () => import("@/features/auth/components/AccountSettingsPage"),
};

const warmedModules = new Set<string>();

export function prefetchRouteModule(href: string): void {
  const loader = ROUTE_MODULE_PREFETCHERS[href];
  if (!loader || warmedModules.has(href)) return;
  warmedModules.add(href);
  void loader().catch(() => {
    warmedModules.delete(href);
  });
}

export function prefetchAccessibleRouteModules(hrefs: string[]): void {
  for (const href of hrefs) {
    prefetchRouteModule(href);
  }
}
