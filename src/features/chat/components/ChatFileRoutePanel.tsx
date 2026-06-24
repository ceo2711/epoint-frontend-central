"use client";

import { translate } from "@/i18n";
import { ChatClientSelect } from "@/features/chat/components/ChatClientSelect";
import { DOCUMENT_SECTIONS } from "@/features/documents/document-requirements";
import type { StagedUpload, BoardCardOption, ClientOption } from "@/features/chat/hooks/useChatbot";

interface ChatFileRoutePanelProps {
  staged: StagedUpload;
  chatLocale: "es" | "en";
  canUploadToBoard: boolean;
  boardCards: BoardCardOption[];
  boardCardsLoading: boolean;
  clientOptions: ClientOption[];
  clientSearchLoading: boolean;
  clientSearchLoadingMore: boolean;
  clientSearchHasMore: boolean;
  clientSearchTotal: number;
  disabled?: boolean;
  onSelectDestination: (destination: "document" | "board") => void;
  onSelectDocumentType: (value: string) => void;
  onSelectBoardCard: (cardId: number) => void;
  onSelectClient: (clientId: number, name: string) => void;
  onSearchClient: (query: string) => void;
  onLoadMoreClients: () => void;
  onChangeClient: () => void;
  onCancel: () => void;
}

export function ChatFileRoutePanel({
  staged,
  chatLocale,
  canUploadToBoard,
  boardCards,
  boardCardsLoading,
  clientOptions,
  clientSearchLoading,
  clientSearchLoadingMore,
  clientSearchHasMore,
  clientSearchTotal,
  disabled = false,
  onSelectDestination,
  onSelectDocumentType,
  onSelectBoardCard,
  onSelectClient,
  onSearchClient,
  onLoadMoreClients,
  onChangeClient,
  onCancel,
}: ChatFileRoutePanelProps) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(chatLocale, key, params);

  const showSelectedClient =
    staged.selectedClientId &&
    staged.selectedClientName &&
    staged.step !== "client";

  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/90 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-900">{t("chat.stagedFileTitle")}</p>
          <p className="truncate text-sm text-blue-800">📎 {staged.fileName}</p>
          {showSelectedClient && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                {t("chat.selectedClientLabel", {
                  name: staged.selectedClientName!,
                  id: staged.selectedClientId!,
                })}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={onChangeClient}
                className="text-[10px] font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {t("chat.changeClient")}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className="shrink-0 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          {t("chat.cancelUpload")}
        </button>
      </div>

      {staged.step === "destination" && (
        <div>
          <p className="mb-2 text-xs font-medium text-blue-800">{t("chat.selectDestination")}</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectDestination("document")}
              className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 disabled:opacity-50"
            >
              {t("chat.destinationDocument")}
            </button>
            {canUploadToBoard && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectDestination("board")}
                className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100 disabled:opacity-50"
              >
                {t("chat.destinationBoard")}
              </button>
            )}
          </div>
        </div>
      )}

      {staged.step === "client" && (
        <div>
          <p className="mb-2 text-xs font-medium text-blue-800">{t("chat.selectClient")}</p>
          <ChatClientSelect
            chatLocale={chatLocale}
            clients={clientOptions}
            loading={clientSearchLoading}
            loadingMore={clientSearchLoadingMore}
            hasMore={clientSearchHasMore}
            total={clientSearchTotal}
            disabled={disabled}
            onSearch={onSearchClient}
            onLoadMore={onLoadMoreClients}
            onSelect={onSelectClient}
          />
        </div>
      )}

      {staged.step === "document_type" && (
        <div className="max-h-52 space-y-3 overflow-y-auto">
          <p className="text-xs font-medium text-blue-800">{t("chat.selectDocumentType")}</p>
          {DOCUMENT_SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t(section.titleKey)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[section.primary, ...(section.alternatives ?? [])].flatMap((group) =>
                  group.slots.map((slot) => (
                    <button
                      key={slot.type}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelectDocumentType(slot.type)}
                      className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {translate(chatLocale, `documentTypes.${slot.type}`)}
                    </button>
                  )),
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {staged.step === "board_card" && (
        <div>
          <p className="mb-2 text-xs font-medium text-violet-800">{t("chat.selectBoardCard")}</p>
          {boardCardsLoading ? (
            <p className="text-xs text-slate-500">{t("chat.loadingBoardCards")}</p>
          ) : boardCards.length > 0 ? (
            <div className="max-h-36 space-y-1 overflow-y-auto">
              {boardCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectBoardCard(card.id)}
                  className="flex w-full flex-col rounded-lg bg-white px-2.5 py-2 text-left ring-1 ring-violet-200 transition hover:bg-violet-100 disabled:opacity-50"
                >
                  <span className="text-xs font-semibold text-slate-800">{card.title}</span>
                  <span className="text-[10px] text-slate-500">{card.column}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{t("chat.noBoardCards")}</p>
          )}
        </div>
      )}
    </div>
  );
}
