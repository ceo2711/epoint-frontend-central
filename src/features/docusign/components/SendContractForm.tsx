"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Client } from "@/features/clients/types";
import type { DocusignSendPayload, DocusignTemplate } from "@/features/docusign/types";

interface SendContractFormProps {
  templates: DocusignTemplate[];
  defaultTemplateId?: string | null;
  defaultRoleName?: string | null;
  onSearchClients: (query: string) => Promise<Client[]>;
  onSubmit: (payload: DocusignSendPayload) => Promise<void>;
}

export function SendContractForm({
  templates,
  defaultTemplateId,
  defaultRoleName,
  onSearchClients,
  onSubmit,
}: SendContractFormProps) {
  const { t } = useTranslation();
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [templateId, setTemplateId] = useState(defaultTemplateId ?? "");
  const [roleName, setRoleName] = useState(defaultRoleName ?? "Signer");
  const [subject, setSubject] = useState(t("docusign.defaultSubject"));
  const [clientSearch, setClientSearch] = useState("");
  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultTemplateId) setTemplateId(defaultTemplateId);
  }, [defaultTemplateId]);

  useEffect(() => {
    if (defaultRoleName) setRoleName(defaultRoleName);
  }, [defaultRoleName]);

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

  function selectClient(client: Client) {
    setSelectedClientId(client.id);
    setSignerName(`${client.first_name} ${client.last_name}`.trim());
    setSignerEmail(client.email);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setClientOptions([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
      setSignerName("");
      setSignerEmail("");
      setClientSearch("");
      setSelectedClientId(undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="card-flat space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("docusign.sendTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("docusign.sendSubtitle")}</p>
      </div>

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

      <Button type="submit" disabled={submitting || templates.length === 0}>
        {submitting ? t("docusign.sending") : t("docusign.sendAction")}
      </Button>
    </form>
  );
}
