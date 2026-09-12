"use client";

import { createContext, useContext } from "react";

type PortalTourContextValue = {
  active: boolean;
  startTour: () => void;
};

const PortalTourContext = createContext<PortalTourContextValue>({
  active: false,
  startTour: () => {},
});

export { PortalTourContext };

export function usePortalTour() {
  return useContext(PortalTourContext);
}
