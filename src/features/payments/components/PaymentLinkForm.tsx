"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { PaymentConfig, PaymentLinkCreatePayload } from "@/features/payments/types";
import { EMPTY_PAYMENT_FORM } from "@/features/payments/types";

interface PaymentLinkFormProps {
  config: PaymentConfig | undefined;
  submitting: boolean;
  onSubmit: (payload: PaymentLinkCreatePayload) => Promise<void>;
}

export function PaymentLinkForm({ config, submitting, onSubmit }: PaymentLinkFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<PaymentLinkCreatePayload>({
    ...EMPTY_PAYMENT_FORM,
    provider: config?.default_provider ?? "stripe",
  });

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
    });
    setForm({ ...EMPTY_PAYMENT_FORM, provider: config?.default_provider ?? "stripe" });
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
            <option value="stripe">Stripe</option>
            <option value="authorize">Authorize.net</option>
          </select>
        </div>
      </div>
      <Input
        label={t("payments.form.description")}
        value={form.description ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />
      {config?.stub_mode ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("payments.stubModeHint")}
        </p>
      ) : null}
      <Button type="submit" disabled={disabled} fullWidth>
        {submitting ? t("payments.form.generating") : t("payments.form.generate")}
      </Button>
    </form>
  );
}
