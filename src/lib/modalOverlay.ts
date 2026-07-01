"use client";

import { useEffect, useState } from "react";

let overlayCount = 0;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function registerModalOverlay() {
  overlayCount += 1;
  notifyListeners();
  return () => {
    overlayCount = Math.max(0, overlayCount - 1);
    notifyListeners();
  };
}

export function isModalOverlayOpen() {
  return overlayCount > 0;
}

export function useModalOverlayOpen() {
  const [open, setOpen] = useState(overlayCount > 0);

  useEffect(() => {
    const listener = () => setOpen(overlayCount > 0);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return open;
}
