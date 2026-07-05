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
