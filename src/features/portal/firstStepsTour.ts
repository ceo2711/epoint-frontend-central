export const PORTAL_TOUR_TARGET_ATTR = "data-portal-tour";

export type PortalTourStep = {
  id: string;
  /** Valor de `data-portal-tour`. Null = card centrada, sin spotlight. */
  target: string | null;
  titleKey: string;
  bodyKey: string;
};

export const PORTAL_TOUR_STEPS: PortalTourStep[] = [
  {
    id: "welcome",
    target: null,
    titleKey: "portalFirstSteps.welcomeTitle",
    bodyKey: "portalFirstSteps.welcomeBody",
  },
  {
    id: "portal",
    target: "portal",
    titleKey: "portalFirstSteps.stepPortalTitle",
    bodyKey: "portalFirstSteps.stepPortalBody",
  },
  {
    id: "datos",
    target: "datos",
    titleKey: "portalFirstSteps.stepDataTitle",
    bodyKey: "portalFirstSteps.stepDataBody",
  },
  {
    id: "documentos",
    target: "documentos",
    titleKey: "portalFirstSteps.stepDocsTitle",
    bodyKey: "portalFirstSteps.stepDocsBody",
  },
  {
    id: "tablero",
    target: "tablero",
    titleKey: "portalFirstSteps.stepBoardTitle",
    bodyKey: "portalFirstSteps.stepBoardBody",
  },
];

export function portalTourSelector(target: string): string {
  return `[${PORTAL_TOUR_TARGET_ATTR}="${target}"]`;
}

export function portalTourTargetForHref(href: string): string | undefined {
  switch (href) {
    case "/portal":
      return "portal";
    case "/portal/datos":
      return "datos";
    case "/portal/documentos":
      return "documentos";
    case "/portal/tablero":
      return "tablero";
    default:
      return undefined;
  }
}

export type InflatedRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function inflateRect(rect: { top: number; left: number; width: number; height: number }, padding: number): InflatedRect {
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}
