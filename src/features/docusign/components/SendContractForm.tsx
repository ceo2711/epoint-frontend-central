"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Client } from "@/features/clients/types";
import type {
  DocusignSendPayload,
  DocusignTemplate,
  DocusignTemplateDetail,
} from "@/features/docusign/types";

interface SendContractFormProps {
  templates: DocusignTemplate[];
  defaultTemplateId?: string | null;
  defaultRoleName?: string | null;
  onSearchClients: (query: string) => Promise<Client[]>;
  onLoadTemplateDetail?: (templateId: string) => Promise<DocusignTemplateDetail | null>;
  onSubmit: (payload: DocusignSendPayload) => Promise<void>;
  /** Sin card ni título; para usar dentro de un modal. */
  embedded?: boolean;
  /** Datos precargados (p. ej. invitado de Calendly). */
  initialSigner?: { name: string; email: string; clientId?: number };
  hideClientSearch?: boolean;
}

export function SendContractForm({
  templates,
  defaultTemplateId,
  defaultRoleName,
  onSearchClients,
  onLoadTemplateDetail,
  onSubmit,
  embedded = false,
  initialSigner,
  hideClientSearch = false,
}: SendContractFormProps) {
  const { t } = useTranslation();
  const submittingRef = useRef(false);
  const [signerName, setSignerName] = useState(initialSigner?.name ?? "");
  const [signerEmail, setSignerEmail] = useState(initialSigner?.email ?? "");
  const [templateId, setTemplateId] = useState(defaultTemplateId ?? "");
  const [roleName, setRoleName] = useState(defaultRoleName ?? "Signer");
  const [subject, setSubject] = useState(t("docusign.defaultSubject"));
  const [clientSearch, setClientSearch] = useState("");
  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(initialSigner?.clientId);
  const [submitting, setSubmitting] = useState(false);
  const [templateDetail, setTemplateDetail] = useState<DocusignTemplateDetail | null>(null);

  useEffect(() => {
    if (defaultTemplateId) setTemplateId(defaultTemplateId);
  }, [defaultTemplateId]);

  useEffect(() => {
    if (!initialSigner?.email || initialSigner.clientId) return;
    const email = initialSigner.email.trim();
    if (!email) return;
    let cancelled = false;
    void onSearchClients(email).then((clients) => {
      if (cancelled) return;
      const match = clients.find((client) => client.email.toLowerCase() === email.toLowerCase());
      if (match) setSelectedClientId(match.id);
    });
    return () => {
      cancelled = true;
    };
  }, [initialSigner?.email, initialSigner?.clientId, onSearchClients]);

  useEffect(() => {
    if (!templateDetail?.roles.length) return;
    const validRoles = templateDetail.roles.map((role) => role.role_name);
    if (!validRoles.includes(roleName)) {
      setRoleName(validRoles[0]);
    }
  }, [templateDetail, roleName]);

  useEffect(() => {
    const query = clientSearch.trim();
    if (query.length < 2) {
      setClientOptions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void onSearchClients(query).then(setClientOptions);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [clientSearch, onSearchClients]);

  useEffect(() => {
    if (!templateId || !onLoadTemplateDetail) {
      setTemplateDetail(null);
      return;
    }
    let cancelled = false;
    void onLoadTemplateDetail(templateId).then((detail) => {
      if (!cancelled) setTemplateDetail(detail);
    });
    return () => {
      cancelled = true;
    };
    // Solo recargar al cambiar plantilla; onLoadTemplateDetail es estable (useCallback en el hook).
  }, [templateId, onLoadTemplateDetail]);

  function selectClient(client: Client) {
    setSelectedClientId(client.id);
    setSignerName(`${client.first_name} ${client.last_name}`.trim());
    setSignerEmail(client.email);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setClientOptions([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit({
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim(),
        template_id: templateId || undefined,
        template_role_name: roleName.trim() || undefined,
        subject: subject.trim(),
        client_id: selectedClientId,
      });
      if (!embedded) {
        setSignerName("");
        setSignerEmail("");
        setClientSearch("");
        setSelectedClientId(undefined);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      id={embedded ? "send-contract-form" : undefined}
      onSubmit={(e) => void handleSubmit(e)}
      className={embedded ? "space-y-4" : "card-flat space-y-4 p-6"}
    >
      {!embedded ? (
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("docusign.sendTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("docusign.sendSubtitle")}</p>
        </div>
      ) : null}

      {!hideClientSearch ? (
        <>
          <Input
            label={t("docusign.searchClient")}
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder={t("docusign.searchClientPlaceholder")}
          />
          {clientOptions.length > 0 ? (
            <ul className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {clientOptions.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => selectClient(client)}
                  >
                    <span className="font-medium text-slate-900">
                      {client.first_name} {client.last_name}
                    </span>
                    <span className="text-slate-500">{client.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("docusign.signerName")}
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          required
        />
        <Input
          label={t("docusign.signerEmail")}
          type="email"
          value={signerEmail}
          onChange={(e) => setSignerEmail(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t("docusign.template")}
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            required
          >
            <option value="">{t("docusign.selectTemplate")}</option>
            {templates.map((template) => (
              <option key={template.template_id} value={template.template_id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          label={t("docusign.roleName")}
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          required
        />
      </div>

      <Input
        label={t("docusign.subject")}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
      />

      {!embedded ? (
        <Button type="submit" disabled={submitting || templates.length === 0}>
          {submitting ? t("docusign.sending") : t("docusign.sendAction")}
        </Button>
      ) : null}
    </form>
  );
}
