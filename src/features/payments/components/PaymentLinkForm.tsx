"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { PaymentConfig, PaymentLinkCreatePayload } from "@/features/payments/types";
import { EMPTY_PAYMENT_FORM } from "@/features/payments/types";
import { getConfiguredProviders, getDefaultProvider, getProviderLabel } from "@/features/payments/utils/providers";
import {
  ProspectSearchSelect,
  type ProspectSearchResponse,
} from "@/features/prospects/components/ProspectSearchSelect";
import type { Prospect } from "@/features/prospects/types";

const MIN_NAME_SEARCH_LENGTH = 3;
const MIN_EMAIL_SEARCH_LENGTH = 3;

interface PaymentLinkFormProps {
  config: PaymentConfig | undefined;
  submitting: boolean;
  onSubmit: (payload: PaymentLinkCreatePayload) => Promise<void>;
  initialData?: Partial<PaymentLinkCreatePayload>;
  onSearchProspects?: (query: string) => Promise<ProspectSearchResponse>;
  hideProspectSearch?: boolean;
}

function buildExternalProspectSearch(
  firstName: string,
  lastName: string,
  email: string,
): string {
  const normalizedEmail = email.trim();
  if (normalizedEmail.includes("@") && normalizedEmail.length >= MIN_EMAIL_SEARCH_LENGTH) {
    return normalizedEmail;
  }
  const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
  return fullName.length >= MIN_NAME_SEARCH_LENGTH ? fullName : "";
}

export function PaymentLinkForm({
  config,
  submitting,
  onSubmit,
  initialData,
  onSearchProspects,
  hideProspectSearch = false,
}: PaymentLinkFormProps) {
  const { t } = useTranslation();
  const availableProviders = useMemo(() => getConfiguredProviders(config), [config]);
  const [form, setForm] = useState<PaymentLinkCreatePayload>({
    ...EMPTY_PAYMENT_FORM,
    provider: getDefaultProvider(config),
    ...initialData,
  });
  const [linkedProspect, setLinkedProspect] = useState<Prospect | null>(null);

  const showProspectSearch = !hideProspectSearch && Boolean(onSearchProspects);
  const externalProspectSearch = useMemo(
    () =>
      buildExternalProspectSearch(
        form.customer_first_name,
        form.customer_last_name,
        form.customer_email,
      ),
    [form.customer_first_name, form.customer_last_name, form.customer_email],
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      provider: availableProviders.includes(current.provider)
        ? current.provider
        : getDefaultProvider(config),
    }));
  }, [config, availableProviders]);

  useEffect(() => {
    if (!linkedProspect) return;
    const email = form.customer_email.trim().toLowerCase();
    if (email && linkedProspect.email.toLowerCase() !== email) {
      setLinkedProspect(null);
    }
  }, [form.customer_email, linkedProspect]);

  const disabled = !config?.payments_enabled || submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.customer_first_name || !form.customer_last_name || !form.customer_email || !form.customer_phone) {
      return;
    }
    if (!form.amount || form.amount <= 0) return;
    await onSubmit({
      ...form,
      amount: Number(form.amount),
      description: form.description?.trim() || undefined,
      prospect_id: linkedProspect?.id ?? initialData?.prospect_id,
    });
    setForm({
      ...EMPTY_PAYMENT_FORM,
      provider: getDefaultProvider(config),
      ...initialData,
    });
    setLinkedProspect(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("payments.form.firstName")}
          value={form.customer_first_name}
          onChange={(e) => setForm((f) => ({ ...f, customer_first_name: e.target.value }))}
          required
        />
        <Input
          label={t("payments.form.lastName")}
          value={form.customer_last_name}
          onChange={(e) => setForm((f) => ({ ...f, customer_last_name: e.target.value }))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("payments.form.email")}
          type="email"
          value={form.customer_email}
          onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
          required
        />
        <Input
          label={t("payments.form.phone")}
          value={form.customer_phone}
          onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
          required
        />
      </div>

      {showProspectSearch ? (
        <ProspectSearchSelect
          label={t("payments.form.searchProspect")}
          searchPlaceholder={t("payments.form.searchProspectPlaceholder")}
          prospect={linkedProspect}
          externalSearch={externalProspectSearch}
          onSearch={onSearchProspects!}
          onChange={setLinkedProspect}
          disabled={disabled}
          linkedHint={t("payments.form.prospectLinkedHint")}
          changeLabel={t("payments.form.changeProspect")}
          clearLabel={t("payments.form.clearProspect")}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("payments.form.amount")}
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount || ""}
          onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          required
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            {t("payments.form.provider")}
          </label>
          <select
            className="input-field w-full"
            value={form.provider}
            onChange={(e) =>
              setForm((f) => ({ ...f, provider: e.target.value as PaymentLinkCreatePayload["provider"] }))
            }
          >
            {availableProviders.map((provider) => (
              <option key={provider} value={provider}>
                {getProviderLabel(provider)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label={t("payments.form.description")}
        value={form.description ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
          checked={form.send_email !== false}
          onChange={(e) => setForm((f) => ({ ...f, send_email: e.target.checked }))}
          disabled={disabled}
        />
        <span>
          <span className="block text-sm font-medium text-[var(--color-text-primary)]">
            {t("payments.form.sendEmail")}
          </span>
          <span className="mt-0.5 block text-sm text-[var(--color-text-muted)]">
            {t("payments.form.sendEmailHint")}
          </span>
        </span>
      </label>
      {config?.stub_mode ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("payments.stubModeHint")}
        </p>
      ) : null}
      <Button type="submit" disabled={disabled} fullWidth>
        {submitting
          ? form.send_email !== false
            ? t("payments.form.generatingAndSending")
            : t("payments.form.generating")
          : form.send_email !== false
            ? t("payments.form.generateAndSend")
            : t("payments.form.generate")}
      </Button>
    </form>
  );
}
