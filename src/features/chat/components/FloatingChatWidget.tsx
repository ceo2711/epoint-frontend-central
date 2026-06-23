"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { translate } from "@/i18n";
import { useAuth } from "@/features/auth/AuthContext";
import { useChatbot } from "@/features/chat/hooks/useChatbot";
import { useTranslation } from "@/contexts/LanguageContext";
import { RichTextContent } from "@/components/ui/RichTextContent";

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

export function FloatingChatWidget() {
  const { user, token } = useAuth();
  const { t, locale } = useTranslation();
  const { messages, loading, error, sendMessage, resetChat, chatLocale } = useChatbot(token, locale);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [greeted, setGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || greeted || !user) return;
    setGreeted(true);
  }, [open, greeted, user]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!user) return null;

  const greeting = translate(chatLocale, "chat.greeting", { name: user.first_name });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft;
    setDraft("");
    await sendMessage(text, locale);
  }

  function handleToggle() {
    setOpen((prev) => !prev);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {open && (
        <div
          className="pointer-events-auto flex h-[min(32rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          role="dialog"
          aria-label={t("chat.title")}
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{t("chat.title")}</p>
              <p className="text-xs text-blue-100">{t("chat.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-blue-100 transition hover:bg-white/15 hover:text-white"
              aria-label={t("common.close")}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
            <div className="mr-8 rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
              {greeting}
            </div>

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

            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                <span>{t("chat.thinking")}</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmit(event);
                  }
                }}
                rows={2}
                placeholder={t("chat.placeholder")}
                className="input-field min-h-[2.75rem] flex-1 resize-none py-2 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                className="btn btn-primary btn-sm shrink-0 px-4"
              >
                {t("chat.send")}
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={resetChat}
                className="text-xs text-slate-500 transition hover:text-slate-700"
              >
                {t("chat.newConversation")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pointer-events-auto flex flex-col items-end gap-1">
        {!open && (
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
            {t("chat.helpHint")}
          </span>
        )}
        <button
          type="button"
          onClick={handleToggle}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label={open ? t("common.close") : t("chat.open")}
          aria-expanded={open}
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MessageIcon className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
