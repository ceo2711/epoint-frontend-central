"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { BoardUnlockedCongratsModal } from "@/features/portal/components/BoardUnlockedCongratsModal";
import { usePortalMe } from "@/features/portal/hooks/usePortalWorkspace";
import { useAuth } from "@/features/auth/AuthContext";

function storageKey(clientId: number) {
  return `epoint_portal_board_congrats_seen_${clientId}`;
}

function clearCongratsSeen(clientId: number) {
  try {
    localStorage.removeItem(storageKey(clientId));
  } catch {
    /* ignore */
  }
}

function markCongratsSeen(clientId: number) {
  try {
    localStorage.setItem(storageKey(clientId), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Poll del perfil portal + modal de felicitaciones al desbloquear el tablero.
 * Mientras board_unlocked sea false, refresca periódicamente para detectar la promoción.
 */
export function PortalBoardUnlockGate({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showCongrats, setShowCongrats] = useState(false);
  const prevUnlockedRef = useRef<boolean | null>(null);

  const shouldPoll = Boolean(token && user?.role.code === "CLIENT");
  const { data: client } = usePortalMe(token, {
    enabled: shouldPoll,
    refetchInterval: (query) => {
      const unlocked = Boolean(query.state.data?.board_unlocked);
      if (unlocked) return false;
      // Más frecuente en documentos: la verificación IA puede completar en segundos.
      return pathname?.startsWith("/portal/documentos") ? 4_000 : 8_000;
    },
  });

  const boardUnlocked = Boolean(client?.board_unlocked);
  const clientId = client?.id;

  useEffect(() => {
    if (!clientId) return;

    const prev = prevUnlockedRef.current;

    // Tablero bloqueado de nuevo → permitir mostrar el modal en el próximo unlock.
    if (prev === true && !boardUnlocked) {
      clearCongratsSeen(clientId);
      setShowCongrats(false);
    }

    // Transición bloqueado → desbloqueado: mostrar felicitaciones.
    if (prev === false && boardUnlocked) {
      setShowCongrats(true);
    }

    prevUnlockedRef.current = boardUnlocked;
  }, [clientId, boardUnlocked]);

  const dismiss = useCallback(() => {
    if (clientId) markCongratsSeen(clientId);
    setShowCongrats(false);
  }, [clientId]);

  const goToBoard = useCallback(() => {
    if (clientId) markCongratsSeen(clientId);
    setShowCongrats(false);
    router.push("/portal/tablero");
  }, [clientId, router]);

  return (
    <>
      {children}
      {showCongrats ? (
        <BoardUnlockedCongratsModal onClose={dismiss} onGoToBoard={goToBoard} />
      ) : null}
    </>
  );
}

export function usePortalBoardUnlocked(): boolean {
  const { token, user } = useAuth();
  const { data: client } = usePortalMe(token, {
    enabled: Boolean(token && user?.role.code === "CLIENT"),
  });
  return Boolean(client?.board_unlocked);
}
