"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { VerificationBadge } from "@/components/ui/Badge";
import { Input, PasswordInput } from "@/components/ui/Input";
import { ModalCloseButton } from "@/components/ui/Modal";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { DocumentViewerModal } from "@/features/documents/components/DocumentViewerModal";
import { DocumentVerificationTooltip } from "@/features/documents/components/DocumentVerificationTooltip";
import { CardAttachmentThumbnail } from "@/features/boards/components/CardAttachmentThumbnail";
import { CardLabelBadge, CardLabelPicker } from "@/features/boards/components/CardLabelBadge";
import { CommentBody } from "@/features/boards/components/CommentBody";
import { CommentMentionTextarea } from "@/features/boards/components/CommentMentionTextarea";
import {
  cardModalThemeClass,
  type BoardCardLabel,
} from "@/features/boards/constants/cardLabels";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import type { MentionableUser } from "@/features/boards/utils/commentMentions";
import { encodeMentionsInBody } from "@/features/boards/utils/commentMentions";
import { useAttachmentContentUrl } from "@/features/boards/hooks/useAttachmentContentUrl";
import { inferMimeFromFilename, isPdfMime } from "@/features/documents/utils/documentMime";
import { prefetchAttachments } from "@/lib/contentBlobCache";
import type { BoardCard, CardAttachment, CardComment } from "@/features/boards/types";
import type { DocumentBrief } from "@/types/api";

interface CardDetailModalProps {
  card: BoardCard;
  clientId: number;
  token: string | null;
  onClose: () => void;
  onUpdateDescription: (cardId: number, description: string) => Promise<void>;
  onUpdateLabel?: (cardId: number, label: BoardCardLabel) => Promise<void>;
  onSubmitComment: (cardId: number, body: string, files: File[], isInternal: boolean) => Promise<void>;
  onUploadAttachment: (cardId: number, file: File) => Promise<void>;
  onSubmitCredentials?: (cardId: number, username: string, password: string) => Promise<void>;
  onDeleteCard?: (cardId: number) => Promise<void>;
  canPostInternalComments?: boolean;
  canEditDescription?: boolean;
  canSetLabel?: boolean;
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
  onUpdateLabel,
  onSubmitComment,
  onUploadAttachment,
  onSubmitCredentials,
  onDeleteCard,
  canPostInternalComments = false,
  canEditDescription = false,
  canSetLabel = false,
}: CardDetailModalProps) {
  const { t, locale } = useTranslation();
  const modal = useModal();
  const [description, setDescription] = useState(cardDescription(card));
  const [editingDescription, setEditingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [savingLabel, setSavingLabel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comment, setComment] = useState("");
  const [internalComment, setInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [viewingAttachment, setViewingAttachment] = useState<CardAttachment | null>(null);
  const viewingAttachmentUrl = useAttachmentContentUrl(
    viewingAttachment?.id ?? null,
    token,
    !!viewingAttachment,
    viewingAttachment?.mime_type,
    viewingAttachment?.original_filename,
  );
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);

  useEffect(() => {
    setDescription(cardDescription(card));
    setEditingDescription(false);
  }, [card]);

  useEffect(() => {
    if (!token || card.attachments.length === 0) return;
    prefetchAttachments(card.attachments, token);
  }, [card.attachments, token]);

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
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("portalBoard.uploadError")),
        variant: "error",
      });
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleSubmitComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const encodedBody = encodeMentionsInBody(comment, mentionableUsers);
      await onSubmitComment(card.id, encodedBody, [], internalComment);
      setComment("");
      setInternalComment(false);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleLabelChange(next: BoardCardLabel) {
    if (!onUpdateLabel) return;
    setSavingLabel(true);
    try {
      await onUpdateLabel(card.id, next);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("portalBoard.cardLabelError")),
        variant: "error",
      });
    } finally {
      setSavingLabel(false);
    }
  }

  return (
    <>
      <ModalPortal>
        <div
          className="modal-overlay fixed inset-0 z-[60] flex max-sm:items-stretch max-sm:justify-stretch max-sm:p-0 sm:items-center sm:justify-center sm:p-4"
          onClick={onClose}
        >
          <div
            className={`modal-panel modal-panel-xl flex max-h-[92vh] w-full flex-col overflow-hidden border p-0 transition-[background,border-color] duration-300 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none max-sm:pb-[env(safe-area-inset-bottom)] sm:rounded-xl ${cardModalThemeClass(card.label)}`}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="card-modal-header shrink-0 border-b px-4 py-3 transition-colors duration-300 sm:px-6 sm:py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-base font-bold leading-snug text-slate-900 sm:text-lg lg:text-xl">
                  {card.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <CardLabelBadge label={card.label} />
                  {canSetLabel && onUpdateLabel ? (
                    <CardLabelPicker
                      value={card.label}
                      disabled={savingLabel}
                      onChange={(next) => {
                        void handleLabelChange(next);
                      }}
                    />
                  ) : null}
                </div>
              </div>
              <ModalCloseButton onClick={onClose} />
            </div>
          </div>

          {/* Body — single scroll on mobile, split columns on desktop */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            {/* Left — description & attachments */}
            <div className="min-w-0 shrink-0 px-4 py-4 sm:px-6 sm:py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:max-w-[calc(100%-20rem)]">
              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <SectionLabel>{t("portalBoard.description")}</SectionLabel>
                  {!editingDescription && (canEditDescription || onDeleteCard) && (
                    <div className="flex items-center gap-0.5">
                      {canEditDescription && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm !px-2 text-slate-500 hover:text-slate-800"
                          title={t("portalBoard.editDescription")}
                          aria-label={t("portalBoard.editDescription")}
                          onClick={() => setEditingDescription(true)}
                        >
                          <HiOutlinePencilSquare className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      {onDeleteCard && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                          title={t("portalBoard.deleteCard")}
                          aria-label={t("portalBoard.deleteCard")}
                          disabled={deleting}
                          onClick={async () => {
                            setDeleting(true);
                            try {
                              await onDeleteCard(card.id);
                            } finally {
                              setDeleting(false);
                            }
                          }}
                        >
                          <HiOutlineTrash className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
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
                </div>
                <p className="mb-3 text-xs text-slate-400">{t("portalBoard.files")}</p>
                {cardAttachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
                    {cardAttachments.map((attachment) => (
                      <div key={attachment.id} className="flex flex-col gap-1">
                        <CardAttachmentThumbnail
                          attachment={attachment}
                          token={token}
                          size="md"
                          onView={() => setViewingAttachment(attachment)}
                        />
                        {attachment.verification_status && (
                          <div className="flex flex-wrap items-center gap-1 px-0.5">
                            <VerificationBadge status={attachment.verification_status} />
                            <DocumentVerificationTooltip
                              doc={
                                {
                                  verification_status: attachment.verification_status,
                                  rejection_reasons: attachment.rejection_reasons,
                                  approval_reasons: attachment.approval_reasons,
                                } as DocumentBrief
                              }
                              locale={locale}
                              rejectionTitle={t("portalDocs.rejectionTitle")}
                              approvalTitle={t("portalDocs.approvalTitle")}
                              expiringTitle={t("portalDocs.expiringTitle")}
                              expiringAction={t("portalDocs.expiringAction")}
                              viewLabel={t("portalDocs.viewVerificationDetails")}
                            />
                          </div>
                        )}
                      </div>
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
            <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-slate-50/90 lg:min-h-0 lg:w-80 lg:shrink-0 lg:overflow-hidden lg:border-l lg:border-t-0 xl:w-96">
              <div className="shrink-0 border-b border-slate-200 px-4 py-3">
                <SectionLabel>{t("portalBoard.commentsActivity")}</SectionLabel>
              </div>

              <div className="px-4 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                <p className="mb-3 text-xs leading-relaxed text-slate-500">{t("portalBoard.conversationHint")}</p>
                <form
                  id={`comment-form-${card.id}`}
                  onSubmit={handleSubmitComment}
                  className="mb-5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                >
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
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-1">
                      <label
                        title={t("portalBoard.attachFiles")}
                        className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 ${
                          uploadingAttachment ? "pointer-events-none opacity-60" : ""
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="sm:inline">
                          {uploadingAttachment ? t("common.uploading") : t("portalBoard.attachFiles")}
                        </span>
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
                      disabled={submittingComment || !comment.trim()}
                      className="self-end text-sm font-semibold text-blue-600 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
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
                              <div key={attachment.id} className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingAttachment(attachment)}
                                  className="text-left text-sm font-medium text-blue-600 hover:underline"
                                >
                                  {attachment.original_filename}
                                </button>
                                {attachment.verification_status && (
                                  <>
                                    <VerificationBadge status={attachment.verification_status} />
                                    <DocumentVerificationTooltip
                                      doc={
                                        {
                                          verification_status: attachment.verification_status,
                                          rejection_reasons: attachment.rejection_reasons,
                                          approval_reasons: attachment.approval_reasons,
                                        } as DocumentBrief
                                      }
                                      locale={locale}
                                      rejectionTitle={t("portalDocs.rejectionTitle")}
                                      approvalTitle={t("portalDocs.approvalTitle")}
                                      expiringTitle={t("portalDocs.expiringTitle")}
                                      expiringAction={t("portalDocs.expiringAction")}
                                      viewLabel={t("portalDocs.viewVerificationDetails")}
                                    />
                                  </>
                                )}
                              </div>
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
      </ModalPortal>

      {viewingAttachment && (
        <ModalPortal>
        <DocumentViewerModal
          url={viewingAttachmentUrl ?? ""}
          loading={
            !isPdfMime(
              viewingAttachment.mime_type ?? inferMimeFromFilename(viewingAttachment.original_filename),
            ) && !viewingAttachmentUrl
          }
          filename={viewingAttachment.original_filename}
          mimeType={viewingAttachment.mime_type}
          title={viewingAttachment.original_filename}
          pdfSource={
            token &&
            isPdfMime(
              viewingAttachment.mime_type ?? inferMimeFromFilename(viewingAttachment.original_filename),
            )
              ? {
                  kind: "attachment",
                  id: viewingAttachment.id,
                  token,
                  mimeType: viewingAttachment.mime_type,
                  filename: viewingAttachment.original_filename,
                }
              : undefined
          }
          onClose={() => setViewingAttachment(null)}
        />
        </ModalPortal>
      )}
    </>
  );
}
