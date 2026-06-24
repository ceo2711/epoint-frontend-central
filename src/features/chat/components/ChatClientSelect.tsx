"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { translate } from "@/i18n";
import type { ClientOption } from "@/features/chat/hooks/useChatbot";

interface ChatClientSelectProps {
  chatLocale: "es" | "en";
  clients: ClientOption[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  disabled?: boolean;
  onSearch: (query: string) => void;
  onLoadMore: () => void;
  onSelect: (clientId: number, name: string) => void;
}

const MIN_SEARCH_CHARS = 2;

function isSearchableQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (/^#?\d{1,8}$/.test(trimmed)) return true;
  return trimmed.length >= MIN_SEARCH_CHARS;
}

export function ChatClientSelect({
  chatLocale,
  clients,
  loading,
  loadingMore,
  hasMore,
  total,
  disabled = false,
  onSearch,
  onLoadMore,
  onSelect,
}: ChatClientSelectProps) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(chatLocale, key, params);

  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const runSearch = useCallback(
    (value: string) => {
      if (!isSearchableQuery(value)) return;
      onSearch(value.trim());
    },
    [onSearch],
  );

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      runSearch(query);
    }, 350);
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loading || loadingMore || !hasMore) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (nearBottom) {
      onLoadMore();
    }
  }, [hasMore, loading, loadingMore, onLoadMore]);

  const searchable = isSearchableQuery(query);
  const showEmptyHint = !searchable && !loading;
  const showNoResults = searchable && !loading && clients.length === 0;

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("chat.searchClientPlaceholder")}
        disabled={disabled}
        className="input-field w-full py-1.5 text-xs"
        autoComplete="off"
      />

      {showEmptyHint && (
        <p className="text-[11px] leading-relaxed text-slate-500">{t("chat.clientSearchHint")}</p>
      )}

      {(searchable || clients.length > 0) && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className={`max-h-44 min-h-10 overflow-y-auto rounded-lg border border-blue-100 bg-white shadow-inner ${
            loading && !loadingMore ? "opacity-70" : ""
          }`}
          role="listbox"
          aria-label={t("chat.selectClient")}
          aria-busy={loading || loadingMore}
        >
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              role="option"
              disabled={disabled || loading}
              onClick={() => onSelect(client.id, client.name)}
              className="flex w-full flex-col border-b border-slate-50 px-2.5 py-2 text-left transition last:border-b-0 hover:bg-blue-50 disabled:opacity-50"
            >
              <span className="text-xs font-semibold text-slate-800">{client.name}</span>
              <span className="text-[10px] text-slate-500">
                #{client.id} · {client.email}
              </span>
            </button>
          ))}

          {showNoResults && (
            <p className="px-2.5 py-3 text-xs text-slate-500">{t("chat.noClientsFound")}</p>
          )}

          {clients.length > 0 && (
            <div className="sticky bottom-0 border-t border-slate-100 bg-slate-50/95 px-2.5 py-1.5">
              {hasMore ? (
                <button
                  type="button"
                  disabled={disabled || loadingMore}
                  onClick={onLoadMore}
                  className="text-[10px] font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {t("chat.loadMoreClients")}
                </button>
              ) : (
                <p className="text-[10px] text-slate-400">
                  {t("chat.clientsShown", { shown: clients.length, total })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
