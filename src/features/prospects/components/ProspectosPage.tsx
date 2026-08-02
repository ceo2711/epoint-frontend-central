"use client";

import { useEffect, useMemo, useState } from "react";
import { HiOutlineUserPlus } from "react-icons/hi2";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useSalesReps } from "@/features/calendly/hooks/useSalesReps";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import { ProspectCreateModal } from "@/features/prospects/components/ProspectCreateModal";
import { ProspectList } from "@/features/prospects/components/ProspectList";
import { PROSPECTS_PAGE_SIZE, useProspects } from "@/features/prospects/hooks/useProspects";
import { PROSPECT_STATUS_ORDER } from "@/features/prospects/types";
import { SedeBranchList } from "@/features/sedes/components/SedeBranchList";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import {
  buildSedeBranchesFromReps,
  filterRepsBySede,
} from "@/features/sedes/utils/sedeBranches";
import { canSuperviseSalesReps, isGlobalAdmin } from "@/lib/roles";

export function ProspectosPage() {
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const roleCode = user?.role.code;
  const canSupervise = canSuperviseSalesReps(user);
  const isGlobal = isGlobalAdmin(roleCode);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [salesRepId, setSalesRepId] = useState<number | null>(null);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { sedes, loading: loadingSedes } = useSedes(
    token,
    isGlobal && hasPermission("sedes:read"),
    t("sedes.loadError"),
    "",
    false,
  );

  const { salesReps, loading: loadingReps } = useSalesReps(token, canSupervise);

  const { merchants, loading: merchantsLoading } = useMerchantOptions(
    token,
    hasPermission("prospects:create"),
  );

  const branches = useMemo(
    () =>
      buildSedeBranchesFromReps(salesReps, sedes, {
        includeAllSedes: isGlobal,
        fallbackName: t("users.sede"),
      }),
    [salesReps, sedes, isGlobal, t],
  );

  const repsForSede = useMemo(
    () =>
      filterRepsBySede(salesReps, selectedSedeId, {
        filterBySede: isGlobal,
      }),
    [salesReps, selectedSedeId, isGlobal],
  );

  const selectedSede = branches.find((branch) => branch.id === selectedSedeId) ?? null;
  const showSedePicker = isGlobal && selectedSedeId === null;
  const listEnabled = !isGlobal || selectedSedeId != null;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, salesRepId, selectedSedeId]);

  useEffect(() => {
    setSalesRepId(null);
  }, [selectedSedeId]);

  const { prospects, loading, load, total, pages } = useProspects(token, authLoading, {
    page,
    pageSize: PROSPECTS_PAGE_SIZE,
    search: debouncedSearch,
    statusFilter: statusFilter || undefined,
    salesRepId,
    sedeId: isGlobal ? selectedSedeId : null,
    allMerchants: canSupervise,
    enabled: listEnabled,
  });

  const headerTitle = isGlobal ? t("prospects.adminHeaderContext") : t("prospects.headerContext");
  const headerSubtitle = isGlobal
    ? t("prospects.adminPageSubtitleSedes")
    : t("prospects.subtitle");

  const adminLoading = isGlobal && (loadingReps || loadingSedes);

  function handleSelectSede(id: number) {
    setSelectedSedeId(id);
  }

  function handleBackToSedes() {
    setSelectedSedeId(null);
    setSalesRepId(null);
    setSearchInput("");
    setStatusFilter("");
  }

  return (
    <>
      <Header title={headerTitle} subtitle={headerSubtitle} />
      <PageContent className="space-y-4">
        {adminLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label={t("common.loading")} />
          </div>
        ) : showSedePicker ? (
          <SedeBranchList
            branches={branches}
            onSelect={handleSelectSede}
            titleKey="prospects.adminSedesTitle"
            hintKey="prospects.adminSedesSubtitle"
            emptyKey="prospects.adminSedesEmpty"
            countLabelKey="prospects.adminSedeRepCount"
          />
        ) : (
          <>
            {isGlobal ? (
              <button
                type="button"
                onClick={handleBackToSedes}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                <VscArrowLeft className="h-4 w-4" aria-hidden />
                {t("prospects.backToSedes")}
              </button>
            ) : null}

            {selectedSede ? (
              <div className="card-flat p-5">
                <h2 className="text-lg font-semibold text-slate-900">{selectedSede.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("prospects.subtitle")}</p>
              </div>
            ) : null}

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
              {canSupervise ? (
                <div className="min-w-[180px]">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("prospects.columns.salesRep")}
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={salesRepId ?? ""}
                      onChange={(e) =>
                        setSalesRepId(e.target.value ? Number(e.target.value) : null)
                      }
                    >
                      <option value="">{t("common.all")}</option>
                      {repsForSede.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.first_name} {rep.last_name}
                          {rep.parent_name
                            ? ` (${t("calendly.subSellerOf", { name: rep.parent_name })})`
                            : ""}
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
              <ProspectList
                prospects={prospects}
                onDeleted={() => void load()}
                onUpdated={() => void load()}
              />
            )}

            {pages > 1 ? (
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>
                  {t("common.showing")} {(page - 1) * PROSPECTS_PAGE_SIZE + 1}–
                  {Math.min(page * PROSPECTS_PAGE_SIZE, total)} {t("common.of")} {total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </PageContent>

      {createOpen ? (
        <ProspectCreateModal
          token={token}
          merchants={merchants}
          merchantsLoading={merchantsLoading}
          salesReps={salesReps}
          initialSedeId={isGlobal ? selectedSedeId : null}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => void load()}
        />
      ) : null}
    </>
  );
}
