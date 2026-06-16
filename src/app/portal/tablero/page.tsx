"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PageContent } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { CardDetailModal } from "@/features/boards/components/CardDetailModal";
import { TaskBoard } from "@/features/boards/components/TaskBoard";
import { useBoard } from "@/features/boards/hooks/useBoard";
import type { BoardCard } from "@/features/boards/types";
import { api } from "@/lib/api";

export default function PortalTableroPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const { board, error, loading, load } = useBoard(token, user?.client_id, t("portalBoard.unavailable"));
  const [selected, setSelected] = useState<BoardCard | null>(null);
  const [comment, setComment] = useState("");
  const [creds, setCreds] = useState({ username: "", password: "" });

  async function updateStatus(cardId: number, status: string) {
    if (!token) return;
    await api.patch(`/boards/cards/${cardId}/status`, { status }, token);
    load();
  }

  async function submitComment(cardId: number) {
    if (!token || !comment.trim()) return;
    await api.post(`/boards/cards/${cardId}/comments`, { body: comment }, token);
    setComment("");
    load();
    setSelected(null);
  }

  async function submitCredentials(cardId: number) {
    if (!token) return;
    await api.post(`/boards/cards/${cardId}/credentials`, creds, token);
    setCreds({ username: "", password: "" });
    await modal.alert({
      title: t("portalBoard.saveCredentials"),
      message: t("portalBoard.credentialsSaved"),
      variant: "success",
    });
    load();
  }

  return (
    <>
      <Header title={t("portalBoard.headerContext")} subtitle={t("portalBoard.subtitle")} />
      <PageContent>
        {error && !loading && <div className="alert alert-info mb-4">{error}</div>}
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner label={t("portalBoard.loading")} />
          </div>
        )}
        {!loading && board && <TaskBoard board={board} onSelectCard={setSelected} />}
      </PageContent>

      {selected && (
        <CardDetailModal
          card={selected}
          comment={comment}
          creds={creds}
          onClose={() => setSelected(null)}
          onCommentChange={setComment}
          onCredsChange={setCreds}
          onStatusChange={updateStatus}
          onSubmitComment={submitComment}
          onSubmitCredentials={submitCredentials}
        />
      )}
    </>
  );
}
