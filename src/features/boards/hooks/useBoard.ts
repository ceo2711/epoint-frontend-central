"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchClientBoard } from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import { CLIENTS_REFRESH_EVENT, shouldRefreshClient, type ClientsRefreshDetail } from "@/lib/clientEvents";
import type { Board } from "@/features/boards/types";

function removeCardFromBoard(board: Board, cardId: number): Board {
  return {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      cards: list.cards
        .filter((card) => card.id !== cardId)
        .map((card, index) => ({ ...card, position: index })),
    })),
  };
}

function patchCardLabelInBoard(board: Board, cardId: number, label: string): Board {
  return {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      cards: list.cards.map((card) => (card.id === cardId ? { ...card, label } : card)),
    })),
  };
}

export function useBoard(
  token: string | null,
  clientId: number | null | undefined,
  unavailableMessage: string,
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.boards.client(clientId ?? 0),
    queryFn: () => fetchClientBoard(token!, clientId!),
    enabled: !!token && !!clientId,
  });

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token || !clientId) return null;
      if (options?.silent) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.boards.client(clientId) });
      }
      const result = await refetch();
      return result.data ?? null;
    },
    [token, clientId, queryClient, refetch],
  );

  const refresh = useCallback(async () => load({ silent: true }), [load]);

  const removeCardLocally = useCallback(
    (cardId: number) => {
      if (!clientId) return null;
      const previous = queryClient.getQueryData<Board>(queryKeys.boards.client(clientId)) ?? null;
      queryClient.setQueryData<Board>(queryKeys.boards.client(clientId), (old) =>
        old ? removeCardFromBoard(old, cardId) : old,
      );
      return previous;
    },
    [clientId, queryClient],
  );

  const patchCardLabelLocally = useCallback(
    (cardId: number, label: string) => {
      if (!clientId) return null;
      const previous = queryClient.getQueryData<Board>(queryKeys.boards.client(clientId)) ?? null;
      queryClient.setQueryData<Board>(queryKeys.boards.client(clientId), (old) =>
        old ? patchCardLabelInBoard(old, cardId, label) : old,
      );
      return previous;
    },
    [clientId, queryClient],
  );

  const restoreBoard = useCallback(
    (board: Board | null) => {
      if (!clientId || !board) return;
      queryClient.setQueryData(queryKeys.boards.client(clientId), board);
    },
    [clientId, queryClient],
  );

  useEffect(() => {
    if (!token || !clientId) return;

    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent<ClientsRefreshDetail>).detail;
      if (!shouldRefreshClient(detail, clientId)) return;
      if (detail?.scope === "documents") return;
      void refresh();
    };

    window.addEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
  }, [token, clientId, refresh]);

  return {
    board: (data ?? null) as Board | null,
    error: isError ? unavailableMessage : "",
    loading: isLoading,
    load,
    refresh,
    removeCardLocally,
    patchCardLabelLocally,
    restoreBoard,
  };
}
