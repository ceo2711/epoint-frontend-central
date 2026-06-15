"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { PortalCredentialsCard } from "@/features/clients/components/PortalCredentialsCard";
import { DocumentViewerModal } from "@/features/documents/components/DocumentViewerModal";
import { DocumentThumbnail } from "@/features/documents/components/DocumentThumbnail";
import { StatusBadge, VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useClientWorkflow } from "@/features/clients/hooks/useClientWorkflow";
import { formatClientConflict, useClientAvailabilityCheck } from "@/features/clients/hooks/useClientAvailabilityCheck";
import { translateStatus } from "@/i18n";
import { ApiError, api, isUnauthorizedError } from "@/lib/api";
import { loadPortalCredentials } from "@/features/clients/portal-credentials-storage";
import type { Address, Board, Client, DocumentBrief, Vehicle } from "@/types/api";

const EDITABLE_STATUSES = ["PENDIENTE_DE_REVISION", "RECHAZADO"];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-AR");
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
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { token, hasPermission, user, isLoading: authLoading } = useAuth();
  const { t, locale } = useTranslation();
  const modal = useModal();
  const { approveClient, rejectClient, resubmitClient, deleteClient } = useClientWorkflow(token);

  const [client, setClient] = useState<Client | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [portalPassword, setPortalPassword] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentBrief | null>(null);
  const { availability, checking, hasConflict } = useClientAvailabilityCheck(
    token,
    form.email,
    form.phone,
    { excludeClientId: id, enabled: editing },
  );

  const emailError = availability?.email
    ? formatClientConflict(t, "email", availability.email)
    : undefined;
  const phoneError = availability?.phone
    ? formatClientConflict(t, "phone", availability.phone)
    : undefined;

  const load = useCallback(async () => {
    if (authLoading || !token || !id) return;
    setLoading(true);
    try {
      const c = await api.get<Client>(`/clients/${id}`, token);
      setClient(c);
      setForm({
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
      });
      if (c.approved_at) {
        const b = await api.get<Board>(`/boards/client/${id}`, token).catch(() => null);
        setBoard(b);
      } else {
        setBoard(null);
      }
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, token, id]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!client?.id) return;
    const stored = loadPortalCredentials(client.id);
    setPortalPassword(stored?.tempPassword ?? null);
  }, [client?.id, client?.has_portal_access]);

  const clientName = client ? `${client.first_name} ${client.last_name}` : "";
  const canEdit =
    client &&
    hasPermission("clients:update") &&
    EDITABLE_STATUSES.includes(client.status);
  const canApprove =
    client?.status === "PENDIENTE_DE_REVISION" && hasPermission("clients:approve");
  const canResubmit =
    client?.status === "RECHAZADO" && hasPermission("clients:update");
  const canDelete = hasPermission("clients:delete");

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !client || hasConflict) return;
    setSaving(true);
    try {
      const updated = await api.patch<Client>(`/clients/${client.id}`, form, token);
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
        message: err instanceof ApiError ? err.message : t("common.error"),
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
      const stored = loadPortalCredentials(client.id);
      setPortalPassword(stored?.tempPassword ?? null);
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
    const ok = await deleteClient(client.id, clientName);
    if (ok) router.push("/clientes");
  }

  if (loading || !client) {
    return (
      <>
        <Header
          title={user ? `${user.first_name} ${user.last_name}` : t("clientDetail.title")}
          subtitle={user?.email}
        />
        <div className="flex flex-1 items-center justify-center py-24">
          <LoadingSpinner label={t("clientDetail.loading")} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={user ? `${user.first_name} ${user.last_name}` : t("clientDetail.title")}
        subtitle={user?.email}
      />
      <PageContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.title")}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{clientName}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{client.email}</p>
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
            <Link href="/clientes" className="btn btn-secondary btn-sm">← {t("common.back")}</Link>
          </div>
        </div>
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("common.status")}</p>
              <div className="mt-2"><StatusBadge status={client.status} /></div>
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

        {client.has_portal_access && (
          <PortalCredentialsCard
            client={client}
            tempPassword={portalPassword}
            token={token}
            canReset={hasPermission("clients:approve")}
            onPasswordUpdated={setPortalPassword}
          />
        )}

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
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                {checking && (
                  <p className="text-xs text-slate-400">{t("clients.checkingAvailability")}</p>
                )}
                <Button type="submit" disabled={saving || checking || hasConflict}>{saving ? t("common.loading") : t("common.saveChanges")}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditing(false); setForm({ first_name: client.first_name, last_name: client.last_name, email: client.email, phone: client.phone }); }}>
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
              <InfoRow label={t("clientDetail.dateOfBirth")} value={client.date_of_birth ?? "—"} />
              <InfoRow label={t("clientDetail.hasSsn")} value={client.has_ssn ? t("common.yes") : t("common.no")} />
            </div>
          </Card>
        )}

        <Card className="p-4 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.timeline")}</h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <InfoRow label={t("clientDetail.registeredAt")} value={formatDate(client.created_at, locale)} />
            <InfoRow label={t("clientDetail.approvedAt")} value={formatDate(client.approved_at, locale)} />
            <InfoRow label={t("clientDetail.rejectedAt")} value={formatDate(client.rejected_at, locale)} />
          </div>
        </Card>

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

        <Card className="p-4 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.documents")}</h2>
          {client.documents && client.documents.length > 0 ? (
            <div className="space-y-3">
              {client.documents.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {d.download_url ? (
                      <DocumentThumbnail doc={d} viewLabel={t("portalDocs.viewDocument")} />
                    ) : null}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{translateStatus(locale, "documentTypes", d.type)}</p>
                      <p className="text-sm text-slate-500">{d.original_filename}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(d.uploaded_at, locale)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {d.download_url && (
                      <Button type="button" size="sm" variant="secondary" onClick={() => setViewingDoc(d)}>
                        {t("portalDocs.viewDocument")}
                      </Button>
                    )}
                    <VerificationBadge status={d.verification_status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{t("clientDetail.noDocuments")}</p>
          )}
        </Card>

        {board && (
          <Card className="p-4 sm:p-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">{t("clientDetail.board")}</h2>
            <p className="text-slate-600">
              {t("clientDetail.boardSummary", {
                tasks: board.lists.reduce((acc, l) => acc + l.cards.length, 0),
                columns: board.lists.length,
              })}
            </p>
          </Card>
        )}
      </PageContent>

      {viewingDoc?.download_url && (
        <DocumentViewerModal
          url={viewingDoc.download_url}
          filename={viewingDoc.original_filename}
          mimeType={viewingDoc.mime_type}
          title={translateStatus(locale, "documentTypes", viewingDoc.type)}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </>
  );
}
