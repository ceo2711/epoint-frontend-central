"use client";

import { useEffect, useState } from "react";
import { HiOutlineUserPlus } from "react-icons/hi2";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { fetchCalendlySalesReps } from "@/lib/queryFetchers";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import { ProspectCreateModal } from "@/features/prospects/components/ProspectCreateModal";
import { ProspectList } from "@/features/prospects/components/ProspectList";
import { PROSPECTS_PAGE_SIZE, useProspects } from "@/features/prospects/hooks/useProspects";
import { PROSPECT_STATUS_ORDER } from "@/features/prospects/types";

export function ProspectosPage() {
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const roleCode = user?.role.code;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [salesRepId, setSalesRepId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [salesReps, setSalesReps] = useState<CalendlySalesRep[]>([]);

  useEffect(() => {
    if (!token || roleCode !== "ADMIN") {
      setSalesReps([]);
      return;
    }
    void fetchCalendlySalesReps(token)
      .then(setSalesReps)
      .catch(() => setSalesReps([]));
  }, [token, roleCode]);
  const { merchants, loading: merchantsLoading } = useMerchantOptions(
    token,
    hasPermission("prospects:create"),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, salesRepId]);

  const { prospects, loading, load, total, pages } = useProspects(token, authLoading, {
    page,
    pageSize: PROSPECTS_PAGE_SIZE,
    search: debouncedSearch,
    statusFilter: statusFilter || undefined,
    salesRepId,
    allMerchants: roleCode === "ADMIN",
  });

  return (
    <>
      <Header title={t("prospects.headerContext")} subtitle={t("prospects.subtitle")} />
      <PageContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="block text-sm font-medium text-slate-700">
              {t("common.search")}
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("prospects.searchPlaceholder")}
              />
            </label>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-slate-700">
              {t("prospects.columns.status")}
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{t("common.all")}</option>
                {PROSPECT_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {t(`prospects.status.${status}` as never)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {roleCode === "ADMIN" ? (
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-slate-700">
                {t("prospects.columns.salesRep")}
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={salesRepId ?? ""}
                  onChange={(e) => setSalesRepId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t("common.all")}</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.first_name} {rep.last_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {hasPermission("prospects:create") ? (
            <Button onClick={() => setCreateOpen(true)}>
              <HiOutlineUserPlus className="mr-2 h-4 w-4" />
              {t("prospects.createAction")}
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label={t("common.loading")} />
          </div>
        ) : (
          <ProspectList prospects={prospects} onDeleted={() => void load()} />
        )}

        {pages > 1 ? (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {t("common.showing")} {(page - 1) * PROSPECTS_PAGE_SIZE + 1}–
              {Math.min(page * PROSPECTS_PAGE_SIZE, total)} {t("common.of")} {total}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("common.previous")}
              </Button>
              <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                {t("common.next")}
              </Button>
            </div>
          </div>
        ) : null}
      </PageContent>

      {createOpen ? (
        <ProspectCreateModal
          token={token}
          merchants={merchants}
          merchantsLoading={merchantsLoading}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => void load()}
        />
      ) : null}
    </>
  );
}
