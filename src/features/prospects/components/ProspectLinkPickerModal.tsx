"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { ProspectStatusBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { Prospect } from "@/features/prospects/types";
import type { Paginated } from "@/types/api";
import { api } from "@/lib/api";

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
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSearch() {
    if (!token || !search.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", page_size: "20", search: search.trim() });
      const data = await api.get<Paginated<Prospect>>(`/prospects?${params.toString()}`, token);
      setProspects(data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (emailHint) void handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailHint, token]);

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
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("prospects.searchPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSearch();
            }}
          />
          <Button type="button" variant="secondary" onClick={() => void handleSearch()} disabled={loading}>
            {t("common.search")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner label={t("common.loading")} />
          </div>
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
