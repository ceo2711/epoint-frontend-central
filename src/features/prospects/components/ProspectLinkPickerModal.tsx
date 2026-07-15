"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { Prospect } from "@/features/prospects/types";
import type { Paginated } from "@/types/api";
import { api } from "@/lib/api";

const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 350;

interface ProspectLinkPickerModalProps {
  token: string | null;
  title: string;
  emailHint?: string;
  onClose: () => void;
  onSelect: (prospectId: number) => Promise<void>;
}

export function ProspectLinkPickerModal({
  token,
  title,
  emailHint,
  onClose,
  onSelect,
}: ProspectLinkPickerModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(emailHint ?? "");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    const query = search.trim();
    if (!token || query.length < MIN_SEARCH_LENGTH) {
      setHasSearched(false);
      setProspects([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++searchRequestRef.current;
      setLoading(true);
      setSelectedId(null);

      const params = new URLSearchParams({ page: "1", page_size: "20", search: query });
      void api
        .get<Paginated<Prospect>>(`/prospects?${params.toString()}`, token)
        .then((data) => {
          if (requestId !== searchRequestRef.current) return;
          setProspects(data.items);
          setHasSearched(true);
        })
        .catch(() => {
          if (requestId !== searchRequestRef.current) return;
          setProspects([]);
          setHasSearched(true);
        })
        .finally(() => {
          if (requestId === searchRequestRef.current) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [search, token]);

  async function handleSubmit() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await onSelect(selectedId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <div className="space-y-4">
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("prospects.searchPlaceholder")}
          autoFocus
        />

        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner label={t("common.loading")} />
          </div>
        ) : !hasSearched ? (
          <p className="text-sm text-slate-500">{t("prospects.linkPickerPrompt")}</p>
        ) : prospects.length === 0 ? (
          <p className="text-sm text-slate-500">{t("prospects.linkPickerEmpty")}</p>
        ) : (
          <div className="max-h-[320px] space-y-2 overflow-y-auto">
            {prospects.map((prospect) => (
              <label
                key={prospect.id}
                className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm ${
                  selectedId === prospect.id
                    ? "border-brand bg-brand/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="prospect-link"
                  className="mt-1"
                  checked={selectedId === prospect.id}
                  onChange={() => setSelectedId(prospect.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{prospect.full_name}</span>
                    <ProspectStatusBadge status={prospect.status} />
                  </div>
                  <p className="text-slate-600">{prospect.email}</p>
                  <Link
                    href={`/prospectos/${prospect.id}`}
                    className="text-xs text-brand hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("common.view")}
                  </Link>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={() => void handleSubmit()} disabled={!selectedId || submitting}>
          {submitting ? t("common.loading") : t("prospects.linkPickerConfirm")}
        </Button>
      </div>
    </Modal>
  );
}
