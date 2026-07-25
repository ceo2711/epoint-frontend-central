"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { translate } from "@/i18n";
import { useAuth } from "@/features/auth/AuthContext";
import { ChatFileRoutePanel } from "@/features/chat/components/ChatFileRoutePanel";
import { ChatCalendlyPanel } from "@/features/chat/components/ChatCalendlyPanel";
import { useChatbot } from "@/features/chat/hooks/useChatbot";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/features/chat/types";
import { useChatClientIdHint } from "@/features/chat/hooks/useChatClientIdHint";
import { useTranslation } from "@/contexts/LanguageContext";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { useModalOverlayOpen } from "@/lib/modalOverlay";

const BOARD_UPLOAD_ROLES = new Set(["ADMIN", "BRANCH_MANAGER", "ONBOARDING_MANAGER", "ADVISOR"]);
const APPROVE_ROLES = new Set(["ADMIN", "BRANCH_MANAGER", "ONBOARDING_MANAGER"]);
const SALESISH_ROLES = new Set(["SALES_REP", "ADMIN", "BRANCH_MANAGER", "AREA_LEADER"]);

function suggestionKeysForRole(roleCode: string): string[] {
  if (roleCode === "CLIENT") {
    return [
      "chat.suggestionClientData",
      "chat.suggestionClientDocs",
      "chat.suggestionClientBoard",
    ];
  }
  const keys = ["chat.suggestionHowPlatform", "chat.suggestionPortalClient"];
  if (SALESISH_ROLES.has(roleCode)) {
    keys.splice(1, 0, "chat.suggestionRegisterClient", "chat.suggestionProspects");
  }
  if (APPROVE_ROLES.has(roleCode)) {
    keys.splice(1, 0, "chat.suggestionApproveClient");
  }
  if (BOARD_UPLOAD_ROLES.has(roleCode) || roleCode === "SALES_REP") {
    keys.push("chat.suggestionUploadDocs");
  }
  // Evitar demasiados chips: máximo 4 únicos.
  return [...new Set(keys)].slice(0, 4);
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function AttachIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
      />
    </svg>
  );
}

function formatConversationDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(locale.startsWith("en") ? "en-US" : "es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FloatingChatWidget() {
  const { user, token } = useAuth();
  const { locale } = useTranslation();
  const clientIdHint = useChatClientIdHint();
  const modalOverlayOpen = useModalOverlayOpen();

  const canUploadDocuments = Boolean(
    user && (user.role.code === "CLIENT" || BOARD_UPLOAD_ROLES.has(user.role.code)),
  );
  const canUploadToBoard = Boolean(user && BOARD_UPLOAD_ROLES.has(user.role.code));

  const {
    messages,
    loading,
    fileUploading,
    error,
    sendMessage,
    sendCalendlySelection,
    stageFile,
    selectDestination,
    finishDocumentUpload,
    finishBoardUpload,
    cancelStagedUpload,
    conversations,
    conversationsLoading,
    conversationsError,
    conversationLoading,
    loadConversations,
    startNewConversation,
    selectConversation,
    chatLocale,
    stagedUpload,
    boardCards,
    boardCardsLoading,
    clientOptions,
    clientSearchLoading,
    clientSearchLoadingMore,
    clientSearchHasMore,
    clientSearchTotal,
    searchClients,
    loadMoreClients,
    selectClient,
    changeClient,
    canAttachFile,
    calendlyOptions,
  } = useChatbot(token, locale, {
    userId: user?.id ?? null,
    clientIdHint,
    canUploadDocuments,
    canUploadToBoard,
  });

  const chatT = (key: string, params?: Record<string, string | number>) =>
    translate(chatLocale, key, params);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !token) return;
    setView("list");
    void loadConversations();
    // Solo al abrir el widget: mostrar la lista de conversaciones.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open es el disparador intencional
  }, [open]);

  useEffect(() => {
    if (!open || view !== "chat") return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, fileUploading, open, calendlyOptions, view]);

  useEffect(() => {
    if (open && view === "chat") {
      inputRef.current?.focus();
    }
  }, [open, view]);

  if (!user) return null;

  const isClient = user.role.code === "CLIENT";
  const greeting = chatT(isClient ? "chat.greetingClient" : "chat.greeting", {
    name: user.first_name,
  });
  const chatSubtitle = chatT(isClient ? "chat.subtitleClient" : "chat.subtitle");
  const suggestionKeys = suggestionKeysForRole(user.role.code);
  const showSuggestions = messages.length === 0 && !loading && !fileUploading && !stagedUpload;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft;
    setDraft("");
    await sendMessage(text, locale);
  }

  function handleFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    stageFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleToggle() {
    setOpen((prev) => !prev);
  }

  function handleStartNew() {
    startNewConversation();
    setDraft("");
    setView("chat");
  }

  async function handleSelectConversation(id: number) {
    const ok = await selectConversation(id);
    if (ok) {
      setDraft("");
      setView("chat");
    }
  }

  function handleBackToList() {
    setView("list");
    void loadConversations();
  }

  if (modalOverlayOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {open && (
        <div
          className="pointer-events-auto flex h-[min(32rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          role="dialog"
          aria-label={chatT("chat.title")}
        >
          <header className="flex items-center justify-between gap-3 border-b border-cream-500 bg-gradient-to-r from-brown-800 to-brand px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{chatT("chat.title")}</p>
              <p className="truncate text-xs text-cream-700">
                {view === "list" ? chatT("chat.conversationsSubtitle") : chatSubtitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {view === "chat" && (
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="rounded-lg p-1.5 text-cream-700 transition hover:bg-white/15 hover:text-white"
                  aria-label={chatT("chat.backToConversations")}
                  title={chatT("chat.backToConversations")}
                >
                  <BackIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-cream-700 transition hover:bg-white/15 hover:text-white"
                aria-label={chatT("common.close")}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </header>

          {view === "list" ? (
            <div className="flex flex-1 flex-col overflow-hidden bg-cream-400">
              <div className="border-b border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="btn btn-primary w-full"
                >
                  {chatT("chat.startNewConversation")}
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                <p className="px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {chatT("chat.conversationsTitle")}
                </p>

                {conversationsLoading || conversationLoading ? (
                  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <span>{chatT("chat.conversationsLoading")}</span>
                  </div>
                ) : conversationsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {conversationsError}
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="rounded-xl bg-white px-3 py-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {chatT("chat.conversationsEmpty")}
                  </p>
                ) : (
                  conversations.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void handleSelectConversation(item.id)}
                      className="w-full rounded-xl bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-blue-300"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatConversationDate(item.updated_at, chatLocale)}
                        {" · "}
                        {chatT("chat.conversationMessages", { count: item.message_count })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-cream-400 px-3 py-4">
                <div className="mr-8 rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                  {greeting}
                </div>

                {showSuggestions && (
                  <div className="mr-4 space-y-2">
                    <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {chatT("chat.suggestionsTitle")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestionKeys.map((key) => {
                        const label = chatT(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={loading || !!fileUploading}
                            onClick={() => void sendMessage(label, locale)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:opacity-50"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {canAttachFile && !stagedUpload && (
                  <p className="mr-8 text-[11px] text-slate-500">
                    {chatT(isClient ? "chat.attachFileHintClient" : "chat.attachFileHint")}
                  </p>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-10 rounded-2xl rounded-br-md bg-blue-600 px-3 py-2 text-sm text-white shadow-sm"
                        : "mr-8 rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200"
                    }
                  >
                    {message.role === "assistant" ? (
                      <RichTextContent content={message.content} className="chat-markdown" />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                ))}

                {loading && !fileUploading && (
                  <div className="mr-8 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <span>{chatT("chat.thinking")}</span>
                  </div>
                )}

                {fileUploading && (
                  <div className="mr-8 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <span>{chatT("chat.uploadingFile", { file: fileUploading })}</span>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {calendlyOptions && !fileUploading && (
                  <div className="mr-8 rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                    <ChatCalendlyPanel
                      options={calendlyOptions}
                      chatLocale={chatLocale}
                      disabled={loading || !!fileUploading}
                      onSelectEventType={(uri, name) =>
                        void sendCalendlySelection({ type: "event_type", uri, name }, locale)
                      }
                      onSelectDate={(value, draft) =>
                        void sendCalendlySelection({ type: "date", value, draft }, locale)
                      }
                      onSelectSlot={(value, label, draft) =>
                        void sendCalendlySelection({ type: "slot", value, label, draft }, locale)
                      }
                      onSubmitCreate={(payload) =>
                        void sendCalendlySelection({ type: "submit_create", ...payload }, locale)
                      }
                      onSubmitUpdate={(payload) =>
                        void sendCalendlySelection({ type: "submit_update", ...payload }, locale)
                      }
                      onCancelEvent={(eventId) =>
                        void sendCalendlySelection({ type: "cancel_event", event_id: eventId }, locale)
                      }
                      onStartEdit={(eventId) =>
                        void sendCalendlySelection({ type: "start_edit", event_id: eventId }, locale)
                      }
                      onStartCreate={() =>
                        void sendCalendlySelection({ type: "start_create" }, locale)
                      }
                    />
                  </div>
                )}
              </div>

              {stagedUpload && !fileUploading && (
                <div className="shrink-0 border-t border-blue-200 bg-blue-50/80 px-3 py-2">
                  <ChatFileRoutePanel
                    staged={stagedUpload}
                    chatLocale={chatLocale}
                    canUploadToBoard={canUploadToBoard}
                    boardCards={boardCards}
                    boardCardsLoading={boardCardsLoading}
                    clientOptions={clientOptions}
                    clientSearchLoading={clientSearchLoading}
                    clientSearchLoadingMore={clientSearchLoadingMore}
                    clientSearchHasMore={clientSearchHasMore}
                    clientSearchTotal={clientSearchTotal}
                    disabled={loading || !!fileUploading}
                    onSelectDestination={(destination) => void selectDestination(destination)}
                    onSelectDocumentType={(value) => void finishDocumentUpload(value)}
                    onSelectBoardCard={(cardId) => void finishBoardUpload(cardId)}
                    onSelectClient={(clientId, name) => void selectClient(clientId, name)}
                    onSearchClient={(query) => void searchClients(query)}
                    onLoadMoreClients={() => void loadMoreClients()}
                    onChangeClient={changeClient}
                    onCancel={cancelStagedUpload}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-3">
                <div className="flex items-end gap-2">
                  <div className="flex min-w-0 flex-1 items-end gap-1">
                    {canAttachFile && (
                      <label
                        title={chatT("chat.attachFile")}
                        className="mb-1 inline-flex shrink-0 cursor-pointer rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                      >
                        <AttachIcon className="h-4 w-4" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                          disabled={loading || !!fileUploading}
                          onChange={(e) => handleFileSelected(e.target.files)}
                        />
                      </label>
                    )}
                    <textarea
                      ref={inputRef}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value.slice(0, CHAT_MESSAGE_MAX_LENGTH))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSubmit(event);
                        }
                      }}
                      rows={2}
                      maxLength={CHAT_MESSAGE_MAX_LENGTH}
                      placeholder={
                        stagedUpload?.step === "client"
                          ? chatT("chat.searchClientPlaceholder")
                          : chatT("chat.placeholder")
                      }
                      className="input-field min-h-[2.75rem] w-full resize-none py-2 text-sm"
                      disabled={loading || !!fileUploading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !!fileUploading || !draft.trim()}
                    className="btn btn-primary btn-sm shrink-0 px-4"
                  >
                    {chatT("chat.send")}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleStartNew}
                    className="text-xs text-slate-500 transition hover:text-slate-700"
                  >
                    {chatT("chat.newConversation")}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <div className="pointer-events-auto flex flex-col items-end gap-1">
        {!open && (
          <span className="rounded-full bg-brown-950/80 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
            {chatT("chat.helpHint")}
          </span>
        )}
        <button
          type="button"
          onClick={handleToggle}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30 transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label={open ? chatT("common.close") : chatT("chat.open")}
          aria-expanded={open}
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MessageIcon className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
