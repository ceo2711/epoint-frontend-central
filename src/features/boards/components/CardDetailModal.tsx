"use client";

import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import { translateStatus } from "@/i18n";
import type { BoardCard } from "@/features/boards/types";
import { TASK_STATUS_OPTIONS } from "@/features/boards/types";

interface CardDetailModalProps {
  card: BoardCard;
  comment: string;
  creds: { username: string; password: string };
  onClose: () => void;
  onCommentChange: (value: string) => void;
  onCredsChange: (creds: { username: string; password: string }) => void;
  onStatusChange: (cardId: number, status: string) => void;
  onSubmitComment: (cardId: number) => void;
  onSubmitCredentials: (cardId: number) => void;
}

export function CardDetailModal({
  card,
  comment,
  creds,
  onClose,
  onCommentChange,
  onCredsChange,
  onStatusChange,
  onSubmitComment,
  onSubmitCredentials,
}: CardDetailModalProps) {
  const { t, locale } = useTranslation();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
        {card.instructions_md && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {card.instructions_md}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {TASK_STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(card.id, s)}
              className={`badge cursor-pointer transition ${card.status === s ? "badge-blue ring-2 ring-blue-300" : "badge-slate hover:ring-1 hover:ring-slate-300"}`}
            >
              {translateStatus(locale, "taskStatus", s)}
            </button>
          ))}
        </div>
        {card.requires_credentials && (
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            <p className="text-sm font-semibold text-slate-800">{t("portalBoard.credentialsTitle")}</p>
            <Input
              placeholder={t("portalBoard.username")}
              value={creds.username}
              onChange={(e) => onCredsChange({ ...creds, username: e.target.value })}
            />
            <PasswordInput
              placeholder={t("portalBoard.password")}
              value={creds.password}
              onChange={(e) => onCredsChange({ ...creds, password: e.target.value })}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
            <Button type="button" onClick={() => onSubmitCredentials(card.id)}>
              {t("portalBoard.saveCredentials")}
            </Button>
          </div>
        )}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <textarea
            className="input-field min-h-[5rem] resize-y"
            rows={3}
            placeholder={t("portalBoard.commentPlaceholder")}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
          <Button type="button" variant="secondary" className="mt-3" onClick={() => onSubmitComment(card.id)}>
            {t("common.comment")}
          </Button>
        </div>
        <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
