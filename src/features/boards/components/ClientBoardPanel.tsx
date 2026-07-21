"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CardDetailModal } from "@/features/boards/components/CardDetailModal";
import { TaskBoard } from "@/features/boards/components/TaskBoard";
import { useBoard } from "@/features/boards/hooks/useBoard";
import type { BoardCard, CardComment } from "@/features/boards/types";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

interface ClientBoardPanelProps {
  token: string | null;
  clientId: number | null | undefined;
  isClientPortal?: boolean;
}

function normalizeCard(card: BoardCard): BoardCard {
  return {
    ...card,
    comments: card.comments ?? [],
    attachments: card.attachments ?? [],
    has_credentials: card.has_credentials ?? false,
  };
}

const BOARD_STAFF_ROLES = new Set(["ADMIN", "BRANCH_MANAGER", "ONBOARDING_MANAGER", "ADVISOR"]);

export function ClientBoardPanel({ token, clientId, isClientPortal = false }: ClientBoardPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const modal = useModal();
  const canManageBoard =
    !isClientPortal && !!user && BOARD_STAFF_ROLES.has(user.role.code);
  const { board, error, loading, refresh } = useBoard(token, clientId, t("portalBoard.unavailable"));
  const [selected, setSelected] = useState<BoardCard | null>(null);

  useEffect(() => {
    if (!selected || !board) return;
    for (const list of board.lists) {
      const found = list.cards.find((card) => card.id === selected.id);
      if (found) {
        setSelected(found);
        return;
      }
    }
  }, [board, selected?.id]);

  const isVerifyingAttachments = board?.lists.some((list) =>
    list.cards.some((card) =>
      card.attachments.some(
        (attachment) =>
          attachment.verification_status === "PENDIENTE" ||
          attachment.verification_status === "EN_PROCESO",
      ),
    ),
  );

  useEffect(() => {
    if (!token || !isVerifyingAttachments) return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [token, isVerifyingAttachments, refresh]);

  async function moveCard(cardId: number, listId: number, position: number) {
    if (!token) return;
    await api.patch(`/boards/cards/${cardId}/move`, { list_id: listId, position }, token);
  }

  async function createCard(listId: number, title: string, position?: number): Promise<BoardCard> {
    if (!token) throw new Error("missing token");
    const created = await api.post<BoardCard>(`/boards/lists/${listId}/cards`, { title, position }, token);
    return normalizeCard(created);
  }

  async function updateDescription(cardId: number, description: string) {
    if (!token) return;
    await api.patch(`/boards/cards/${cardId}`, { description_md: description }, token);
    await refresh();
  }

  async function uploadAttachment(cardId: number, file: File, commentId?: number) {
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);
    if (commentId) formData.append("comment_id", String(commentId));
    await api.upload(`/boards/cards/${cardId}/attachments`, formData, token);
  }

  async function submitComment(cardId: number, body: string, files: File[], isInternal: boolean) {
    if (!token) return;
    if (!body.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append("body", body);
    formData.append("is_internal", String(isInternal));
    for (const file of files) {
      formData.append("files", file);
    }

    await api.upload<CardComment>(`/boards/cards/${cardId}/comments`, formData, token);
    await refresh();
  }

  async function submitCredentials(cardId: number, username: string, password: string) {
    if (!token) return;
    await api.post(`/boards/cards/${cardId}/credentials`, { username, password }, token);
    await modal.alert({
      title: t("portalBoard.saveCredentials"),
      message: t("portalBoard.credentialsSaved"),
      variant: "success",
    });
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner label={t("portalBoard.loading")} />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-info">{error}</div>;
  }

  if (!board) return null;

  return (
    <>
      <div className="min-w-0 max-w-full">
        <TaskBoard
        board={board}
        onSelectCard={setSelected}
        onMoveCard={canManageBoard ? moveCard : undefined}
        onCreateCard={canManageBoard ? createCard : undefined}
        canDrag={canManageBoard}
        canCreateCards={canManageBoard}
      />
      </div>

      {selected && (
        <CardDetailModal
          card={selected}
          clientId={board.client_id}
          token={token}
          onClose={() => setSelected(null)}
          onUpdateDescription={updateDescription}
          onSubmitComment={submitComment}
          onUploadAttachment={async (cardId, file) => {
            await uploadAttachment(cardId, file);
            await refresh();
          }}
          onSubmitCredentials={isClientPortal ? submitCredentials : undefined}
          canPostInternalComments={canManageBoard}
          canEditDescription={canManageBoard}
        />
      )}
    </>
  );
}
