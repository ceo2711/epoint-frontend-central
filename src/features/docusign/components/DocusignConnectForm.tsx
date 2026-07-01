"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { DocusignConnectPayload } from "@/features/docusign/types";

interface DocusignConnectFormProps {
  onSubmit: (payload: DocusignConnectPayload) => Promise<void>;
  onConsent?: () => Promise<void>;
  defaultAuthServer?: string;
}

export function DocusignConnectForm({
  onSubmit,
  onConsent,
  defaultAuthServer = "account-d.docusign.com",
}: DocusignConnectFormProps) {
  const { t } = useTranslation();
  const [integrationKey, setIntegrationKey] = useState("");
  const [userId, setUserId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [authServer, setAuthServer] = useState(defaultAuthServer);
  const [defaultTemplateId, setDefaultTemplateId] = useState("");
  const [defaultRoleName, setDefaultRoleName] = useState("Signer");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        integration_key: integrationKey.trim(),
        impersonated_user_id: userId.trim(),
        account_id: accountId.trim(),
        private_key: privateKey.trim(),
        auth_server: authServer.trim(),
        default_template_id: defaultTemplateId.trim() || undefined,
        default_template_role_name: defaultRoleName.trim() || "Signer",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("docusign.integrationKey")}
          value={integrationKey}
          onChange={(e) => setIntegrationKey(e.target.value)}
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Input
          label={t("docusign.userId")}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          placeholder="User GUID"
        />
        <Input
          label={t("docusign.accountId")}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          placeholder="Account GUID"
        />
        <Input
          label={t("docusign.authServer")}
          value={authServer}
          onChange={(e) => setAuthServer(e.target.value)}
          required
          placeholder="account-d.docusign.com"
        />
      </div>

      <label className="block text-sm font-medium text-slate-700">
        {t("docusign.privateKey")}
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          rows={6}
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          required
          placeholder="-----BEGIN RSA PRIVATE KEY-----"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("docusign.defaultTemplateId")}
          value={defaultTemplateId}
          onChange={(e) => setDefaultTemplateId(e.target.value)}
          placeholder={t("docusign.optional")}
        />
        <Input
          label={t("docusign.defaultRoleName")}
          value={defaultRoleName}
          onChange={(e) => setDefaultRoleName(e.target.value)}
          placeholder="Signer"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("docusign.connecting") : t("docusign.connectAction")}
        </Button>
        {onConsent ? (
          <Button type="button" variant="secondary" onClick={() => void onConsent()}>
            {t("docusign.consentAction")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
