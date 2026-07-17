"use client";

import { FormEvent, useEffect, useState } from "react";
import { HiOutlineClock, HiOutlinePencil } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

export interface SentEmailEntry {
  id: number;
  subject: string;
  message_html: string;
  recipient_email: string;
  sent_by_name: string;
  created_at: string;
}

interface SendEmailModalProps {
  recipientName: string;
  recipientEmail: string;
  /** Ruta base del recurso, ej: /prospects/5 o /clients/8 */
  basePath: string;
  onClose: () => void;
}

function hasVisibleContent(html: string) {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text.length > 0;
}

export function SendEmailModal({ recipientName, recipientEmail, basePath, onClose }: SendEmailModalProps) {
  const { token } = useAuth();
  const { t, locale } = useTranslation();
  const modal = useModal();
  const [view, setView] = useState<"compose" | "history">("compose");
  const [subject, setSubject] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentEmailEntry[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewerEntry, setViewerEntry] = useState<SentEmailEntry | null>(null);

  const canSend = subject.trim().length > 0 && hasVisibleContent(messageHtml);

  useEffect(() => {
    if (view !== "history" || history !== null || !token) return;
    setLoadingHistory(true);
    api
      .get<SentEmailEntry[]>(`${basePath}/emails`, token)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [view, history, token, basePath]);

  function formatDate(value: string) {
    return new Date(value).toLocaleString(locale === "es" ? "es-AR" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !canSend || sending) return;
    setSending(true);
    try {
      const result = await api.post<{ message: string }>(
        `${basePath}/send-email`,
        { subject: subject.trim(), message_html: messageHtml },
        token,
      );
      onClose();
      await modal.alert({
        title: t("emailCompose.successTitle"),
        message: result.message,
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("emailCompose.error")),
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      title={view === "compose" ? t("emailCompose.title") : t("emailCompose.history")}
      subtitle={`${recipientName} · ${recipientEmail}`}
      onClose={viewerEntry ? () => setViewerEntry(null) : onClose}
      size="lg"
    >
      <div className="mb-4 flex justify-end">
        {view === "compose" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition hover:opacity-80"
            onClick={() => setView("history")}
          >
            <HiOutlineClock className="h-4 w-4" aria-hidden />
            {t("emailCompose.historyShow")}
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition hover:opacity-80"
            onClick={() => setView("compose")}
          >
            <HiOutlinePencil className="h-4 w-4" aria-hidden />
            {t("emailCompose.historyBack")}
          </button>
        )}
      </div>

      {view === "compose" ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Input
            id="email-subject"
            label={t("emailCompose.subject")}
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("emailCompose.subjectPlaceholder")}
          />

          <div>
            <p className="input-label mb-1">{t("emailCompose.message")}</p>
            <RichTextEditor
              value={messageHtml}
              onChange={setMessageHtml}
              placeholder={t("emailCompose.messagePlaceholder")}
            />
            <p className="mt-1.5 text-xs text-slate-500">{t("emailCompose.hint")}</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!canSend || sending}>
              {sending ? t("emailCompose.sending") : t("emailCompose.send")}
            </Button>
          </div>
        </form>
      ) : loadingHistory ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : !history || history.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t("emailCompose.historyEmpty")}</p>
      ) : (
        <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
          {history.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                onClick={() => setViewerEntry(entry)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {entry.subject}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {formatDate(entry.created_at)} ·{" "}
                    {t("emailCompose.historySentBy", { name: entry.sent_by_name })}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-brand">
                  {t("emailCompose.historyView")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {viewerEntry ? (
        <Modal
          title={viewerEntry.subject}
          subtitle={`${formatDate(viewerEntry.created_at)} · ${t("emailCompose.historySentBy", {
            name: viewerEntry.sent_by_name,
          })} · ${viewerEntry.recipient_email}`}
          onClose={() => setViewerEntry(null)}
          size="lg"
          footer={
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setViewerEntry(null)}>
                {t("common.close")}
              </Button>
            </div>
          }
        >
          <div
            className="rich-text-editor max-h-[24rem] overflow-y-auto overflow-x-hidden break-words [overflow-wrap:anywhere] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700"
            dangerouslySetInnerHTML={{ __html: viewerEntry.message_html }}
          />
        </Modal>
      ) : null}
    </Modal>
  );
}
