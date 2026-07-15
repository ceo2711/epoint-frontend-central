"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/contexts/LanguageContext";
import { ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { Prospect } from "@/features/prospects/types";

export const PROSPECT_SEARCH_LIMIT = 20;

const MIN_NAME_SEARCH_LENGTH = 3;
const MIN_EMAIL_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 350;

export interface ProspectSearchResponse {
  items: Prospect[];
  total: number;
}

function minSearchLength(query: string): number {
  return query.includes("@") ? MIN_EMAIL_SEARCH_LENGTH : MIN_NAME_SEARCH_LENGTH;
}

interface ProspectSearchSelectProps {
  label?: string;
  searchPlaceholder?: string;
  prospect?: Pick<Prospect, "id" | "full_name" | "email" | "status"> | null;
  onSearch: (query: string) => Promise<ProspectSearchResponse>;
  onChange: (prospect: Prospect | null) => void;
  disabled?: boolean;
  /** Dispara búsqueda automática (p. ej. email del firmante). */
  externalSearch?: string;
}

export function ProspectSearchSelect({
  label,
  searchPlaceholder,
  prospect,
  onSearch,
  onChange,
  disabled = false,
  externalSearch,
}: ProspectSearchSelectProps) {
  const { t } = useTranslation();
  const searchRequestRef = useRef(0);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickingAnother, setPickingAnother] = useState(false);

  const manualSearch = search.trim();
  const activeQuery =
    pickingAnother || manualSearch.length > 0 ? manualSearch : (externalSearch?.trim() ?? "");

  useEffect(() => {
    if (prospect) setPickingAnother(false);
  }, [prospect]);

  useEffect(() => {
    const query = activeQuery;
    if (disabled || (prospect && !pickingAnother) || query.length < minSearchLength(query)) {
      setHasSearched(false);
      setOptions([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++searchRequestRef.current;
      setLoading(true);

      void onSearch(query)
        .then((results) => {
          if (requestId !== searchRequestRef.current) return;
          setOptions(results.items);
          setTotal(results.total);
          setHasSearched(true);
        })
        .catch(() => {
          if (requestId !== searchRequestRef.current) return;
          setOptions([]);
          setTotal(0);
          setHasSearched(true);
        })
        .finally(() => {
          if (requestId === searchRequestRef.current) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [activeQuery, onSearch, disabled, prospect, pickingAnother]);

  function handlePick(match: Prospect) {
    setSearch("");
    setOptions([]);
    setTotal(0);
    setHasSearched(false);
    setPickingAnother(false);
    onChange(match);
  }

  function handleClear() {
    setSearch("");
    setOptions([]);
    setTotal(0);
    setHasSearched(false);
    setPickingAnother(false);
    onChange(null);
  }

  function handleChangeProspect() {
    setPickingAnother(true);
    setSearch("");
    setOptions([]);
    setTotal(0);
    setHasSearched(false);
  }

  if (prospect && !pickingAnother) {
    return (
      <div>
        {label ? <p className="input-label">{label}</p> : null}
        <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{prospect.full_name}</span>
              <ProspectStatusBadge status={prospect.status} />
            </div>
            <p className="text-sm text-slate-600">{prospect.email}</p>
            <p className="mt-1 text-xs text-emerald-700">{t("docusign.prospectLinkedHint")}</p>
          </div>
          {!disabled ? (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button
                type="button"
                className="text-xs font-medium text-brand hover:underline"
                onClick={handleChangeProspect}
              >
                {t("docusign.changeProspect")}
              </button>
              <button
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
                onClick={handleClear}
              >
                {t("docusign.clearProspect")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const showDropdown = activeQuery.length >= minSearchLength(activeQuery) && (loading || hasSearched);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          disabled={disabled}
          autoComplete="off"
        />
      </label>

      {activeQuery.length < minSearchLength(activeQuery) ? (
        <p className="text-xs text-slate-500">{t("prospects.linkPickerPrompt")}</p>
      ) : null}

      {showDropdown ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="px-3 py-2.5 text-xs text-slate-500">{t("common.loading")}</p>
          ) : options.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-slate-500">{t("prospects.linkPickerEmpty")}</p>
          ) : (
            <>
              <ul className="max-h-60 overflow-y-auto">
                {options.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-0.5 border-b border-slate-100 px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-slate-50"
                      onClick={() => handlePick(item)}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{item.full_name}</span>
                        <ProspectStatusBadge status={item.status} />
                      </span>
                      <span className="text-slate-500">{item.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {total > options.length ? (
                <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {t("prospects.searchMoreHint", {
                    shown: options.length,
                    total,
                  })}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
