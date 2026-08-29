"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CardDetailModal } from "@/features/boards/components/CardDetailModal";
import { TaskBoard } from "@/features/boards/components/TaskBoard";
import { useBoard } from "@/features/boards/hooks/useBoard";
import type { BoardCard, CardComment } from "@/features/boards/types";
import type { BoardCardLabel } from "@/features/boards/constants/cardLabels";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { isOnboardingAreaLeader, isSedeAdmin } from "@/lib/roles";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface ClientBoardPanelProps {
  token: string | null;
  clientId: number | null | undefined;
  isClientPortal?: boolean;
  /** Abre esta tarjeta al cargar (p. ej. desde una notificación de mención). */
  initialCardId?: number | null;
  /** Cambia con cada notificación para reabrir aunque sea la misma card. */
  openNonce?: string | null;
}

function normalizeCard(card: BoardCard): BoardCard {
  return {
    ...card,
    comments: card.comments ?? [],
    attachments: card.attachments ?? [],
    has_credentials: card.has_credentials ?? false,
  };
}

const BOARD_STAFF_ROLES = new Set(["ADMIN", "BRANCH_MANAGER", "ADVISOR", "AREA_LEADER"]);

export function ClientBoardPanel({
  token,
  clientId,
  isClientPortal = false,
  initialCardId = null,
  openNonce = null,
}: ClientBoardPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const modal = useModal();
  const onboardingLeader = isOnboardingAreaLeader(user);
  const canManageBoard =
    !isClientPortal && !!user && BOARD_STAFF_ROLES.has(user.role.code);
  const canCreateCards = canManageBoard || isClientPortal;
  const canDeleteCard =
    !isClientPortal &&
    !!user &&
    (user.role.code === "ADVISOR" || onboardingLeader || isSedeAdmin(user.role.code));
  const canSetLabel =
    !isClientPortal && !!user && (user.role.code === "ADVISOR" || onboardingLeader);
  const { board, error, loading, refresh, removeCardLocally, patchCardLabelLocally, restoreBoard } =
    useBoard(token, clientId, t("portalBoard.unavailable"));
  const [selected, setSelected] = useState<BoardCard | null>(null);
  const openedCardRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selected || !board) return;
    for (const list of board.lists) {
      const found = list.cards.find((card) => card.id === selected.id);
      if (found) {
        setSelected(found);
        return;
      }
    }
    if (selected.id < 0) return;
    setSelected(null);
  }, [board, selected?.id]);

  useEffect(() => {
    if (!board || !initialCardId) return;
    const openToken = `${initialCardId}:${openNonce ?? ""}`;
    if (openedCardRef.current === openToken) return;
    for (const list of board.lists) {
      const found = list.cards.find((card) => card.id === initialCardId);
      if (found) {
        openedCardRef.current = openToken;
        setSelected(found);
        return;
      }
    }
  }, [board, initialCardId, openNonce]);

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
    const created = normalizeCard(
      await api.post<BoardCard>(`/boards/lists/${listId}/cards`, { title, position }, token),
    );
    await refresh();
    setSelected(created);
    return created;
  }

  async function deleteCard(cardId: number) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("portalBoard.deleteCard"),
      message: t("portalBoard.deleteCardConfirm"),
      confirmLabel: t("portalBoard.deleteCard"),
      variant: "danger",
    });
    if (!confirmed) return;

    setSelected(null);
    const previousBoard = removeCardLocally(cardId);

    try {
      await api.delete(`/boards/cards/${cardId}`, token);
    } catch (err) {
      restoreBoard(previousBoard);
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("portalBoard.deleteCardError")),
        variant: "error",
      });
    }
  }

  async function updateDescription(cardId: number, description: string) {
    if (!token) return;
    await api.patch(`/boards/cards/${cardId}`, { description_md: description }, token);
    await refresh();
  }

  async function updateLabel(cardId: number, label: BoardCardLabel) {
    if (!token) return;
    const previous = patchCardLabelLocally(cardId, label);
    try {
      await api.patch(`/boards/cards/${cardId}/label`, { label }, token);
    } catch (err) {
      restoreBoard(previous);
      throw err;
    }
  }

  async function uploadAttachment(cardId: number, file: File, commentId?: number) {
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);
    if (commentId) formData.append("comment_id", String(commentId));
    await api.upload(`/boards/cards/${cardId}/attachments`, formData, token);
  }

  async function deleteAttachment(attachmentId: number) {
    if (!token) return;
    const confirmed = await modal.confirm({
      title: t("portalBoard.deleteAttachment"),
      message: t("portalBoard.deleteAttachmentConfirm"),
      confirmLabel: t("portalBoard.deleteAttachment"),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/boards/attachments/${attachmentId}`, token);
      await refresh();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("portalBoard.deleteAttachmentError")),
        variant: "error",
      });
    }
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
        onCreateCard={canCreateCards ? createCard : undefined}
        onUpdateLabel={canSetLabel ? updateLabel : undefined}
        canDrag={canManageBoard}
        canCreateCards={canCreateCards}
        canSetLabel={canSetLabel}
      />
      </div>

      {selected && (
        <CardDetailModal
          card={selected}
          clientId={board.client_id}
          token={token}
          onClose={() => setSelected(null)}
          onUpdateDescription={updateDescription}
          onUpdateLabel={canSetLabel ? updateLabel : undefined}
          onSubmitComment={submitComment}
          onUploadAttachment={async (cardId, file) => {
            await uploadAttachment(cardId, file);
            await refresh();
          }}
          onSubmitCredentials={isClientPortal ? submitCredentials : undefined}
          onDeleteCard={canDeleteCard ? deleteCard : undefined}
          onDeleteAttachment={deleteAttachment}
          canPostInternalComments={canManageBoard}
          canEditDescription={canManageBoard}
          canSetLabel={canSetLabel}
        />
      )}
    </>
  );
}
