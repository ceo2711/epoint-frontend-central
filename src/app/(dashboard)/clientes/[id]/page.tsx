"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { ClientAdvisorPanel } from "@/features/clients/components/ClientAdvisorPanel";
import { ClientSalesPipelineSection } from "@/features/clients/components/ClientSalesPipelineSection";
import { PortalCredentialsCard } from "@/features/clients/components/PortalCredentialsCard";
import { ClientOnboardingTabs, type ClientWorkspaceTab } from "@/features/clients/components/ClientOnboardingTabs";
import {
  LazyClientBoardPanel,
  LazyClientContractsPanel,
  LazyDocumentViewerModal,
  LazyStaffClientDocumentsPanel,
} from "@/lib/lazyPanels";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useClientWorkflow } from "@/features/clients/hooks/useClientWorkflow";
import { formatClientConflict, useClientAvailabilityCheck } from "@/features/clients/hooks/useClientAvailabilityCheck";
import { ClientSourceSelect } from "@/features/clients/components/ClientSourceSelect";
import { MerchantSelect } from "@/features/clients/components/MerchantSelect";
import { canEditClientProfile, canViewApprovedClientWorkspace, canViewClientOnboardingWorkspace } from "@/features/clients/client-access";
import { CLIENT_SOURCE_LABEL_KEYS, type ClientSourceValue } from "@/features/clients/constants";
import { useMerchantOptions } from "@/features/clients/hooks/useMerchantOptions";
import { ProspectQualificationBadge } from "@/features/prospects/components/ProspectStatusBadge";
import { translateStatus } from "@/i18n";
import { ApiError, api, isUnauthorizedError } from "@/lib/api";
import { clientsListPath, parseSedeIdParam } from "@/lib/clientsNavigation";
import { useDocumentContentUrl } from "@/features/documents/hooks/useDocumentContentUrl";
import { inferMimeFromFilename, isPdfMime } from "@/features/documents/utils/documentMime";
import { getDocumentViewerUrl, prefetchDocuments } from "@/lib/contentBlobCache";
import { CLIENTS_REFRESH_EVENT, shouldRefreshClient, type ClientsRefreshDetail } from "@/lib/clientEvents";
import { clearPortalCredentials, savePortalCredentials } from "@/features/clients/portal-credentials-storage";
import { isOnboardingAreaLeader, isSedeAdmin } from "@/lib/roles";
import type { Address, Client, DocumentBrief, Vehicle } from "@/types/api";

function buildClientForm(client: Client) {
  return {
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone,
    source: client.source ?? "",
    merchant_id: client.merchant ? String(client.merchant.id) : "",
    date_of_birth: client.date_of_birth ?? "",
    ssn: "",
  };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="section-label">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value || "—"}</p>
    </div>
  );
}

function formatAddress(addr: Address) {
  const parts = [addr.street, addr.city, addr.state, addr.zip_code].filter(Boolean);
  const since =
    addr.residence_since_month && addr.residence_since_year
      ? ` (${addr.residence_since_month}/${addr.residence_since_year})`
      : "";
  return parts.join(", ") + since;
}

export default function ClienteDetailPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <>
          <Header
            title={t("clientDetail.headerContextLoading")}
            subtitle={t("clientDetail.loading")}
          />
          <div className="flex flex-1 items-center justify-center py-24">
            <LoadingSpinner label={t("clientDetail.loading")} />
          </div>
        </>
      }
    >
      <ClienteDetailPageContent />
    </Suspense>
  );
}

function ClienteDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id;
  const id = typeof rawId === "string" ? Number(rawId) : NaN;
  const idValid = Number.isFinite(id) && id > 0;
  const listSedeId = parseSedeIdParam(searchParams.get("sede"));
  const clientsHref = useMemo(() => clientsListPath(listSedeId), [listSedeId]);
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
  const { t, locale } = useTranslation();
  const modal = useModal();
  const { approveClient, rejectClient, resubmitClient, deleteClient, advisors, loadAdvisors } =
    useClientWorkflow(token);

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    source: "",
    merchant_id: "",
    date_of_birth: "",
    ssn: "",
  });
  const [saving, setSaving] = useState(false);
  const [portalPassword, setPortalPassword] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentBrief | null>(null);
  const [activeTab, setActiveTab] = useState<ClientWorkspaceTab>("overview");
  const loadInFlight = useRef(false);
  const deletedRef = useRef(false);
  const { merchants, loading: merchantsLoading } = useMerchantOptions(
    token,
    editing && (hasPermission("clients:create") || hasPermission("clients:update")),
  );
  const { availability, checking, hasConflict } = useClientAvailabilityCheck(
    token,
    form.email,
    form.phone,
    { excludeClientId: idValid ? id : undefined, enabled: editing },
  );
  const viewingDocIsPdf =
    !!viewingDoc &&
    isPdfMime(viewingDoc.mime_type ?? inferMimeFromFilename(viewingDoc.original_filename));
  const { url: viewingDocUrl, loading: viewingDocLoading } = useDocumentContentUrl(
    viewingDoc?.id ?? null,
    token,
    !!viewingDoc && !viewingDocIsPdf,
    viewingDoc?.mime_type,
    viewingDoc?.original_filename,
  );

  useEffect(() => {
    if (!token || !client?.documents?.length) return;
    if (!canViewApprovedClientWorkspace(user, client)) return;
    if (activeTab !== "documents") return;
    prefetchDocuments(client.documents, token, 3);
  }, [client, token, activeTab, user]);

  const emailError = availability?.email
    ? formatClientConflict(t, "email", availability.email)
    : undefined;
  const phoneError = availability?.phone
    ? formatClientConflict(t, "phone", availability.phone)
    : undefined;

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (deletedRef.current || authLoading || loadInFlight.current) return;
    if (!token || !idValid) {
      setLoading(false);
      if (!idValid) setLoadError("No se pudo cargar el cliente.");
      return;
    }
    const silent = options?.silent ?? false;
    loadInFlight.current = true;
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const c = await api.get<Client>(`/clients/${id}`, token);
      setClient(c);
      if (c.has_portal_access && c.portal_temp_password) {
        savePortalCredentials(c.id, {
          email: c.portal_email ?? c.email,
          tempPassword: c.portal_temp_password,
          portalLoginUrl: c.portal_login_url ?? undefined,
        });
        setPortalPassword(c.portal_temp_password);
      } else if (c.has_portal_access) {
        clearPortalCredentials(c.id);
        setPortalPassword(null);
      }
      setForm(buildClientForm(c));
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        setClient(null);
        setLoadError(getUserFacingErrorMessage(err, "Error al cargar el cliente."));
      }
    } finally {
      loadInFlight.current = false;
      if (!silent) setLoading(false);
    }
  }, [authLoading, token, id, idValid]);

  const refreshDocuments = useCallback(async () => {
    if (!token || !idValid) return;
    try {
      const c = await api.get<Client>(`/clients/${id}`, token);
      setClient((prev) => (prev ? { ...prev, documents: c.documents } : c));
    } catch {
      // Keep current UI if a background refresh fails.
    }
  }, [token, id, idValid]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!idValid) return;

    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent<ClientsRefreshDetail>).detail;
      if (detail?.deleted && detail.clientId === id) {
        deletedRef.current = true;
        router.push(clientsHref);
        return;
      }
      if (deletedRef.current) return;
      if (!shouldRefreshClient(detail, id)) return;
      if (detail?.scope === "board") return;
      if (detail?.scope === "documents") {
        void refreshDocuments();
        return;
      }
      void load({ silent: true });
    };

    window.addEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(CLIENTS_REFRESH_EVENT, handleRefresh);
  }, [id, idValid, load, refreshDocuments, router, clientsHref]);

  useEffect(() => {
    if (!client?.id) return;
    if (client.portal_temp_password) {
      savePortalCredentials(client.id, {
        email: client.portal_email ?? client.email,
        tempPassword: client.portal_temp_password,
        portalLoginUrl: client.portal_login_url ?? undefined,
      });
      setPortalPassword(client.portal_temp_password);
      return;
    }
    // Sin temporal en API: el cliente ya cambió la clave o nunca se guardó — no reusar cache viejo
    clearPortalCredentials(client.id);
    setPortalPassword(null);
  }, [client?.id, client?.has_portal_access, client?.portal_temp_password, client?.portal_email, client?.email, client?.portal_login_url]);

  const clientName = client ? `${client.first_name} ${client.last_name}` : "";
  const canEdit =
    client && canEditClientProfile(user, client, hasPermission("clients:update"));
  const canApprove =
    client?.status === "PENDIENTE_DE_REVISION" && hasPermission("clients:approve");
  const canResubmit =
    client?.status === "RECHAZADO" && hasPermission("clients:update");
  const canDelete = hasPermission("clients:delete");
  const assignedAdvisors = client?.advisors?.length
    ? client.advisors
    : client?.advisor
      ? [client.advisor]
      : [];
  const isAssignedAdvisor =
    user?.role.code === "ADVISOR" &&
    !!user?.id &&
    assignedAdvisors.some((item) => item.id === user.id);
  const canManageAdvisor =
    !!client?.approved_at &&
    ((user?.role.code === "ONBOARDING_MANAGER" && hasPermission("clients:approve")) ||
      user?.role.code === "ADMIN" ||
      user?.role.code === "BRANCH_MANAGER" ||
      isOnboardingAreaLeader(user) ||
      isAssignedAdvisor);
  const showAdvisorContact =
    assignedAdvisors.length > 0 &&
    !canManageAdvisor &&
    (user?.role.code === "SALES_REP" || isSedeAdmin(user?.role.code));

  const sourceLabel =
    client?.source && client.source in CLIENT_SOURCE_LABEL_KEYS
      ? t(CLIENT_SOURCE_LABEL_KEYS[client.source as ClientSourceValue])
      : client?.source ?? "—";

  async function handleDownloadDocument(doc: DocumentBrief) {
    if (!token) return;
    try {
      const url = await getDocumentViewerUrl(doc.id, token, doc.mime_type, doc.original_filename);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.original_filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !client || hasConflict) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        source: form.source || null,
        merchant_id: form.merchant_id ? Number(form.merchant_id) : null,
      };
      if (client && canViewApprovedClientWorkspace(user, client)) {
        if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
        if (form.ssn.trim()) payload.ssn = form.ssn.trim();
      }
      const updated = await api.patch<Client>(`/clients/${client.id}`, payload, token);
      setClient((prev) => (prev ? { ...prev, ...updated } : updated));
      setEditing(false);
      await modal.alert({
        title: t("clientDetail.editBasic"),
        message: t("clientDetail.saveSuccess"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!client) return;
    const ok = await approveClient(client.id, clientName);
    if (ok) {
      await load();
    }
  }

  async function handleReject() {
    if (!client) return;
    const ok = await rejectClient(client.id, clientName);
    if (ok) load();
  }

  async function handleResubmit() {
    if (!client) return;
    const ok = await resubmitClient(client.id, clientName);
    if (ok) load();
  }

  async function handleDelete() {
    if (!client) return;
    deletedRef.current = true;
    const ok = await deleteClient(client.id, clientName);
    if (ok) {
      router.push(clientsHref);
    } else {
      deletedRef.current = false;
    }
  }

  if (loading) {
    return (
      <>
        <Header
          title={t("clientDetail.headerContextLoading")}
          subtitle={t("clientDetail.loading")}
        />
        <div className="flex flex-1 items-center justify-center py-24">
          <LoadingSpinner label={t("clientDetail.loading")} />
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Header title={t("clientDetail.headerContextLoading")} subtitle={t("clientDetail.title")} />
        <PageContent>
          <div className="alert alert-info">{loadError || t("clientDetail.notFound")}</div>
          <Link href={clientsHref} className="btn btn-secondary btn-sm mt-4">
            {t("common.back")}
          </Link>
        </PageContent>
      </>
    );
  }

  const isApproved = !!client.approved_at;
  const canViewOnboarding = canViewClientOnboardingWorkspace(user, client);
  const showApprovedWorkspace = canViewApprovedClientWorkspace(user, client);
  const showOverviewSection = !canViewOnboarding || !isApproved || activeTab === "overview";
  const showOnboardingOverviewExtras = showApprovedWorkspace && activeTab === "overview";
  const showDocumentsSection = showApprovedWorkspace && activeTab === "documents";
  const workspaceHint =
    user?.role.code === "ADVISOR"
      ? t("clientDetail.workspaceHintAdvisor")
      : user?.role.code === "ONBOARDING_MANAGER"
        ? t("clientDetail.workspaceHintOnboarding")
        : null;

  return (
    <>
      <Header
        title={t("clientDetail.headerContext", { clientName })}
        subtitle={client.email}
      />
      <PageContent className="space-y-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="section-label">{t("clientDetail.title")}</p>
            <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">{clientName}</h2>
            <p className="mt-0.5 break-all text-sm text-slate-500">{client.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canApprove && (
              <>
                <Button size="sm" onClick={handleApprove}>{t("clients.approve")}</Button>
                <Button size="sm" variant="danger" onClick={handleReject}>{t("clients.reject")}</Button>
              </>
            )}
            {canResubmit && (
              <Button size="sm" variant="secondary" onClick={handleResubmit}>{t("clients.resubmit")}</Button>
            )}
            {canEdit && !editing && (
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>{t("common.edit")}</Button>
            )}
            {canDelete && (
              <Button size="sm" variant="danger" onClick={handleDelete}>{t("clients.delete")}</Button>
            )}
            <Link href={clientsHref} className="btn btn-secondary btn-sm">← {t("common.back")}</Link>
          </div>
        </div>
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="section-label">{t("common.status")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={client.status} />
                <ProspectQualificationBadge isQualified={client.is_qualified ?? true} />
              </div>
            </div>
            <div className="text-sm text-slate-500 sm:text-right">
              ID #{client.id}
            </div>
          </div>
          {client.rejection_reason && (
            <div className="alert alert-error mt-4">
              <strong>{t("clientDetail.rejectionReason")}</strong> {client.rejection_reason}
            </div>
          )}
        </Card>

        {client.source_prospect ? (
          <ClientSalesPipelineSection pipeline={client.source_prospect} locale={locale} />
        ) : null}

        {(showApprovedWorkspace && client.has_portal_access) || canManageAdvisor ? (
          <div
            className={
              showApprovedWorkspace && client.has_portal_access && canManageAdvisor
                ? "grid gap-4 lg:grid-cols-2 lg:items-start"
                : undefined
            }
          >
            {showApprovedWorkspace && client.has_portal_access ? (
              <PortalCredentialsCard
                client={client}
                tempPassword={portalPassword}
                token={token}
                canReset={hasPermission("clients:approve")}
                onPasswordUpdated={setPortalPassword}
                className="h-[16rem] max-h-[16rem] sm:h-[17rem] sm:max-h-[17rem]"
              />
            ) : null}

            {canManageAdvisor ? (
              <ClientAdvisorPanel
                clientId={client.id}
                clientStatus={client.status}
                advisorsAssigned={assignedAdvisors}
                token={token}
                advisors={advisors}
                onLoadAdvisors={loadAdvisors}
                onAdvisorsUpdated={(next) => {
                  setClient((prev) =>
                    prev
                      ? {
                          ...prev,
                          advisors: next,
                          advisor: next[0] ?? null,
                        }
                      : prev,
                  );
                }}
                className="h-[16rem] max-h-[16rem] sm:h-[17rem] sm:max-h-[17rem]"
              />
            ) : null}
          </div>
        ) : null}

        {showAdvisorContact ? (
          <Card className="p-4 sm:p-6">
            <p className="section-label">{t("clientDetail.assignedAdvisors")}</p>
            <ul className="mt-2 space-y-2">
              {assignedAdvisors.map((advisor) => (
                <li key={advisor.id}>
                  <p className="text-sm font-semibold text-slate-900">
                    {advisor.first_name} {advisor.last_name}
                  </p>
                  <a
                    href={`mailto:${advisor.email}`}
                    className="inline-block break-all text-sm text-brand hover:underline"
                  >
                    {advisor.email}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-slate-500">{t("clientDetail.advisorContactHint")}</p>
          </Card>
        ) : null}

        {showApprovedWorkspace && (
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
              {t("docusign.clientContractsTitle")}
            </h2>
            <LazyClientContractsPanel
              clientId={client.id}
              clientName={clientName}
              clientEmail={client.email}
              token={token}
              onError={(message) =>
                void modal.alert({ title: t("common.error"), message, variant: "error" })
              }
            />
          </Card>
        )}

        {showApprovedWorkspace && workspaceHint && (
          <p className="text-sm text-slate-500">{workspaceHint}</p>
        )}

        {showApprovedWorkspace && (
          <ClientOnboardingTabs active={activeTab} onChange={setActiveTab} />
        )}

        {showOverviewSection && (
          <>
            {editing ? (
              <Card className="p-4 sm:p-6">
                <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">
                  {t("clientDetail.editBasic")}
                </h2>
                <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
                  <Input label={t("common.firstName")} required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  <Input label={t("common.lastName")} required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  <Input label={t("common.email")} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={emailError} />
                  <Input label={t("common.phone")} required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={phoneError} />
                  <ClientSourceSelect value={form.source} onChange={(source) => setForm({ ...form, source })} required />
                  <MerchantSelect
                    merchants={merchants}
                    value={form.merchant_id}
                    onChange={(merchant_id) => setForm({ ...form, merchant_id })}
                    required
                    loading={merchantsLoading}
                  />
                  {showApprovedWorkspace ? (
                    <>
                      <Input
                        label={t("clientDetail.dateOfBirth")}
                        type="date"
                        value={form.date_of_birth}
                        onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      />
                      <div>
                        <Input
                          label={t("portal.ssn")}
                          value={form.ssn}
                          onChange={(e) => setForm({ ...form, ssn: e.target.value })}
                          placeholder={
                            client.has_ssn ? t("portal.ssnPlaceholderUpdate") : t("portal.ssnPlaceholder")
                          }
                        />
                        {client.has_ssn ? (
                          <p className="mt-1 text-xs text-slate-500">{t("portal.ssnHint")}</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 pe-[4.75rem] sm:col-span-2 sm:pe-[5.75rem]">
                    {checking && (
                      <p className="text-xs text-slate-400">{t("clients.checkingAvailability")}</p>
                    )}
                    <Button type="submit" disabled={saving || checking || hasConflict}>{saving ? t("common.loading") : t("common.saveChanges")}</Button>
                    <Button type="button" variant="secondary" onClick={() => { setEditing(false); setForm(buildClientForm(client)); }}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="p-4 sm:p-6">
                <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">
                  {t("clientDetail.overview")}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow label={t("common.firstName")} value={client.first_name} />
                  <InfoRow label={t("common.lastName")} value={client.last_name} />
                  <InfoRow label={t("common.email")} value={client.email} />
                  <InfoRow label={t("clientDetail.phone")} value={client.phone} />
                  <InfoRow label={t("clients.source")} value={sourceLabel} />
                  <InfoRow label={t("clients.merchant")} value={client.merchant?.name ?? "—"} />
                  {showApprovedWorkspace ? (
                    <>
                      <InfoRow label={t("clientDetail.dateOfBirth")} value={client.date_of_birth ?? "—"} />
                      <InfoRow label={t("clientDetail.hasSsn")} value={client.has_ssn ? t("common.yes") : t("common.no")} />
                    </>
                  ) : null}
                </div>
              </Card>
            )}

            {showOnboardingOverviewExtras ? (
              <>
            <Card className="p-4 sm:p-6">
              <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.addresses")}</h2>
              {client.addresses && client.addresses.length > 0 ? (
                <div className="space-y-3">
                  {client.addresses.map((addr) => (
                    <div key={addr.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {addr.type === "CURRENT" ? t("clientDetail.currentAddress") : t("clientDetail.previousAddress")}
                      </p>
                      <p className="mt-1 text-sm text-slate-800">{formatAddress(addr)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("clientDetail.noAddresses")}</p>
              )}
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.vehicles")}</h2>
              {client.vehicles && client.vehicles.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {client.vehicles.map((v: Vehicle) => (
                    <div key={v.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <p className="text-xs font-bold uppercase text-slate-400">{t("clientDetail.vehicleN", { n: v.order })}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{v.model} · {v.year} · {v.color}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("clientDetail.noVehicles")}</p>
              )}
            </Card>
              </>
            ) : null}
          </>
        )}

        {showDocumentsSection && (
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
              {t("clientDetail.documents")}
            </h2>
            <LazyStaffClientDocumentsPanel
              clientId={client.id}
              documents={client.documents}
              token={token}
              locale={locale}
              onUploaded={() => void refreshDocuments()}
              onViewDocument={setViewingDoc}
              onDownloadDocument={
                isSedeAdmin(user?.role.code) ? handleDownloadDocument : undefined
              }
            />
          </Card>
        )}

        {showApprovedWorkspace && activeTab === "board" && (
          <Card className="overflow-hidden p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.board")}</h2>
            <LazyClientBoardPanel token={token} clientId={client.id} />
          </Card>
        )}
      </PageContent>

      {viewingDoc && (
        <LazyDocumentViewerModal
          url={viewingDocUrl ?? ""}
          loading={!viewingDocIsPdf && (viewingDocLoading || !viewingDocUrl)}
          filename={viewingDoc.original_filename}
          mimeType={viewingDoc.mime_type}
          title={translateStatus(locale, "documentTypes", viewingDoc.type)}
          pdfSource={
            viewingDocIsPdf && token
              ? {
                  kind: "document",
                  id: viewingDoc.id,
                  token,
                  mimeType: viewingDoc.mime_type,
                  filename: viewingDoc.original_filename,
                }
              : undefined
          }
          onClose={() => setViewingDoc(null)}
        />
      )}
    </>
  );
}
