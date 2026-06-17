"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { DocumentViewerModal } from "@/features/documents/components/DocumentViewerModal";
import { CardAttachmentThumbnail } from "@/features/boards/components/CardAttachmentThumbnail";
import { CommentBody } from "@/features/boards/components/CommentBody";
import { CommentMentionTextarea } from "@/features/boards/components/CommentMentionTextarea";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import type { MentionableUser } from "@/features/boards/utils/commentMentions";
import { encodeMentionsInBody } from "@/features/boards/utils/commentMentions";
import { useAttachmentContentUrl } from "@/features/boards/hooks/useAttachmentContentUrl";
import type { BoardCard, CardAttachment, CardComment } from "@/features/boards/types";

interface CardDetailModalProps {
  card: BoardCard;
  clientId: number;
  token: string | null;
  onClose: () => void;
  onUpdateDescription: (cardId: number, description: string) => Promise<void>;
  onSubmitComment: (cardId: number, body: string, files: File[], isInternal: boolean) => Promise<void>;
  onUploadAttachment: (cardId: number, file: File) => Promise<void>;
  onSubmitCredentials?: (cardId: number, username: string, password: string) => Promise<void>;
  canPostInternalComments?: boolean;
  canEditDescription?: boolean;
  canUploadCardAttachments?: boolean;
}

function formatActivityDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cardDescription(card: BoardCard) {
  const parts = [card.description_md, card.instructions_md].filter(Boolean);
  return parts.join("\n\n");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{children}</h3>
  );
}

export function CardDetailModal({
  card,
  clientId,
  token,
  onClose,
  onUpdateDescription,
  onSubmitComment,
  onUploadAttachment,
  onSubmitCredentials,
  canPostInternalComments = false,
  canEditDescription = false,
  canUploadCardAttachments = false,
}: CardDetailModalProps) {
  const { t, locale } = useTranslation();
  const [description, setDescription] = useState(cardDescription(card));
  const [editingDescription, setEditingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [internalComment, setInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [viewingAttachment, setViewingAttachment] = useState<CardAttachment | null>(null);
  const viewingAttachmentUrl = useAttachmentContentUrl(
    viewingAttachment?.id ?? null,
    token,
    !!viewingAttachment,
  );
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);

  useEffect(() => {
    setDescription(cardDescription(card));
    setEditingDescription(false);
  }, [card]);

  useEffect(() => {
    if (!token) {
      setMentionableUsers([]);
      return;
    }
    const includeClient = !internalComment || !canPostInternalComments;
    void api
      .get<MentionableUser[]>(
        `/boards/client/${clientId}/mentionable-users?include_client=${includeClient ? "true" : "false"}`,
        token,
      )
      .then(setMentionableUsers)
      .catch(() => setMentionableUsers([]));
  }, [token, clientId, internalComment, canPostInternalComments]);

  const cardAttachments = useMemo(
    () =>
      [...card.attachments].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ta - tb;
      }),
    [card.attachments],
  );

  const attachmentsByComment = useMemo(() => {
    const map = new Map<number, CardAttachment[]>();
    for (const attachment of card.attachments) {
      if (!attachment.comment_id) continue;
      const list = map.get(attachment.comment_id) ?? [];
      list.push(attachment);
      map.set(attachment.comment_id, list);
    }
    return map;
  }, [card.attachments]);

  const sortedComments = useMemo(
    () => [...card.comments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [card.comments],
  );

  async function handleSaveDescription() {
    setSavingDescription(true);
    try {
      await onUpdateDescription(card.id, description);
      setEditingDescription(false);
    } finally {
      setSavingDescription(false);
    }
  }

  async function handleAttachmentUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploadingAttachment(true);
    try {
      for (const file of Array.from(fileList)) {
        await onUploadAttachment(card.id, file);
      }
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleSubmitComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim() && commentFiles.length === 0) return;
    setSubmittingComment(true);
    try {
      const encodedBody = encodeMentionsInBody(comment, mentionableUsers);
      await onSubmitComment(card.id, encodedBody, commentFiles, internalComment);
      setComment("");
      setCommentFiles([]);
      setInternalComment(false);
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel modal-panel-xl max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="pr-4 text-lg font-bold leading-snug text-slate-900 sm:text-xl">{card.title}</h2>
              <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={onClose}>
                {t("common.close")}
              </button>
            </div>
          </div>

          {/* Two-column body */}
          <div className="flex max-h-[calc(92vh-7rem)] flex-col lg:flex-row">
            {/* Left — description & attachments */}
            <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 lg:max-w-[calc(100%-20rem)]">
              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <SectionLabel>{t("portalBoard.description")}</SectionLabel>
                  {!editingDescription && canEditDescription && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingDescription(true)}>
                      {t("portalBoard.editDescription")}
                    </button>
                  )}
                </div>
                {editingDescription ? (
                  <div className="space-y-3">
                    <textarea
                      className="input-field min-h-[10rem] resize-y font-mono text-sm leading-relaxed"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("portalBoard.descriptionPlaceholder")}
                    />
                    {description.trim() && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t("portalBoard.descriptionPreview")}
                        </p>
                        <RichTextContent content={description} />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" disabled={savingDescription} onClick={handleSaveDescription}>
                        {savingDescription ? t("common.loading") : t("portalBoard.saveDescription")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setDescription(cardDescription(card));
                          setEditingDescription(false);
                        }}
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <RichTextContent content={description || t("portalBoard.noDescription")} />
                )}
              </section>

              <section className="mt-8">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <SectionLabel>{t("portalBoard.attachments")}</SectionLabel>
                  {canUploadCardAttachments && (
                    <label className="btn btn-secondary btn-sm cursor-pointer">
                      {uploadingAttachment ? t("common.uploading") : t("portalBoard.addAttachment")}
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                        disabled={uploadingAttachment}
                        onChange={(e) => {
                          void handleAttachmentUpload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="mb-3 text-xs text-slate-400">{t("portalBoard.files")}</p>
                {cardAttachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {cardAttachments.map((attachment) => (
                      <CardAttachmentThumbnail
                        key={attachment.id}
                        attachment={attachment}
                        token={token}
                        size="md"
                        onView={() => setViewingAttachment(attachment)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">{t("portalBoard.noAttachments")}</p>
                )}
              </section>

              {card.requires_credentials && onSubmitCredentials && (
                <section className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                  <SectionLabel>{t("portalBoard.credentialsTitle")}</SectionLabel>
                  <Input
                    placeholder={t("portalBoard.username")}
                    value={creds.username}
                    onChange={(e) => setCreds({ ...creds, username: e.target.value })}
                  />
                  <PasswordInput
                    placeholder={t("portalBoard.password")}
                    value={creds.password}
                    onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                    showLabel={t("login.showPassword")}
                    hideLabel={t("login.hidePassword")}
                  />
                  <Button type="button" onClick={() => onSubmitCredentials(card.id, creds.username, creds.password)}>
                    {t("portalBoard.saveCredentials")}
                  </Button>
                </section>
              )}
            </div>

            {/* Right — comments & activity */}
            <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-slate-50/90 lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
              <div className="border-b border-slate-200 px-4 py-3">
                <SectionLabel>{t("portalBoard.commentsActivity")}</SectionLabel>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-3 text-xs leading-relaxed text-slate-500">{t("portalBoard.conversationHint")}</p>
                <form id={`comment-form-${card.id}`} onSubmit={handleSubmitComment} className="mb-5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                  {commentFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
                      {commentFiles.map((file, index) => (
                        <span
                          key={`${file.name}-${index}`}
                          className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100"
                        >
                          {file.name}
                          <button
                            type="button"
                            className="text-blue-400 hover:text-red-500"
                            onClick={() => setCommentFiles((prev) => prev.filter((_, i) => i !== index))}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <CommentMentionTextarea
                    value={comment}
                    onChange={setComment}
                    mentionableUsers={mentionableUsers}
                    placeholder={t("portalBoard.commentPlaceholder")}
                    onSubmit={() => {
                      const form = document.getElementById(`comment-form-${card.id}`) as HTMLFormElement | null;
                      form?.requestSubmit();
                    }}
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <label
                        title={t("portalBoard.attachFiles")}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>{t("portalBoard.attachFiles")}</span>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              setCommentFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {canPostInternalComments && (
                        <label
                          title={t("portalBoard.internalComment")}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            checked={internalComment}
                            onChange={(e) => setInternalComment(e.target.checked)}
                          />
                          {t("portalBoard.internalComment")}
                        </label>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submittingComment || (!comment.trim() && commentFiles.length === 0)}
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submittingComment ? t("common.loading") : t("portalBoard.publish")}
                    </button>
                  </div>
                </form>

                {sortedComments.length > 0 ? (
                  <div className="space-y-4">
                    {sortedComments.map((item: CardComment) => (
                      <article key={item.id} className="border-b border-slate-200/80 pb-4 last:border-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-slate-800">{item.author_name}</span>
                          <span className="text-[11px] text-slate-400">
                            {formatActivityDate(item.created_at, locale)}
                          </span>
                          {item.is_internal && (
                            <span className="badge badge-slate text-[10px]">{t("portalBoard.internalComment")}</span>
                          )}
                        </div>
                        {(item.body.trim() || item.body.includes("(mention:")) && <CommentBody body={item.body} />}
                        {(attachmentsByComment.get(item.id) ?? []).length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {(attachmentsByComment.get(item.id) ?? []).map((attachment) => (
                              <button
                                key={attachment.id}
                                type="button"
                                onClick={() => setViewingAttachment(attachment)}
                                className="block text-left text-sm font-medium text-blue-600 hover:underline"
                              >
                                {attachment.original_filename}
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">{t("portalBoard.noComments")}</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {viewingAttachment && viewingAttachmentUrl && (
        <DocumentViewerModal
          url={viewingAttachmentUrl}
          filename={viewingAttachment.original_filename}
          mimeType={viewingAttachment.mime_type}
          title={viewingAttachment.original_filename}
          onClose={() => setViewingAttachment(null)}
        />
      )}
    </>
  );
}
