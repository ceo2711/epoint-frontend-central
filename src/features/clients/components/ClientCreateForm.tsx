"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import { ClientSourceSelect } from "@/features/clients/components/ClientSourceSelect";
import { MerchantSelect } from "@/features/clients/components/MerchantSelect";
import type { ClientFormData } from "@/features/clients/types";
import type { MerchantBrief } from "@/types/api";

interface ClientCreateFormProps {
  form: ClientFormData;
  merchants: MerchantBrief[];
  merchantsLoading?: boolean;
  onChange: (form: ClientFormData) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  checking: boolean;
  hasConflict: boolean;
  emailError?: string;
  phoneError?: string;
  embedded?: boolean;
}

export function ClientCreateForm({
  form,
  merchants,
  merchantsLoading,
  onChange,
  onSubmit,
  submitting,
  checking,
  hasConflict,
  emailError,
  phoneError,
  embedded = false,
}: ClientCreateFormProps) {
  const { t } = useTranslation();
  const formComplete =
    form.first_name &&
    form.last_name &&
    form.email &&
    form.phone &&
    form.source &&
    form.merchant_id;

  const formBody = (
    <form
      id={embedded ? "client-create-form" : undefined}
      onSubmit={onSubmit}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Input
        label={t("common.firstName")}
        required
        value={form.first_name}
        onChange={(e) => onChange({ ...form, first_name: e.target.value })}
        placeholder="Juan"
      />
      <Input
        label={t("common.lastName")}
        required
        value={form.last_name}
        onChange={(e) => onChange({ ...form, last_name: e.target.value })}
        placeholder="Pérez"
      />
      <Input
        label={t("common.email")}
        type="email"
        required
        value={form.email}
        onChange={(e) => onChange({ ...form, email: e.target.value })}
        placeholder="cliente@email.com"
        error={emailError}
      />
      <Input
        label={t("common.phone")}
        required
        value={form.phone}
        onChange={(e) => onChange({ ...form, phone: e.target.value })}
        placeholder="1131432490"
        error={phoneError}
      />
      <ClientSourceSelect
        value={form.source}
        onChange={(source) => onChange({ ...form, source })}
        required
      />
      <MerchantSelect
        merchants={merchants}
        value={form.merchant_id}
        onChange={(merchant_id) => onChange({ ...form, merchant_id })}
        required
        loading={merchantsLoading}
      />
      {!embedded ? (
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          {checking && (
            <p className="text-xs text-slate-400">{t("clients.checkingAvailability")}</p>
          )}
          <Button type="submit" disabled={submitting || checking || hasConflict || !formComplete}>
            {submitting ? t("common.loading") : t("clients.saveClient")}
          </Button>
        </div>
      ) : checking ? (
        <p className="text-xs text-slate-400 sm:col-span-2">{t("clients.checkingAvailability")}</p>
      ) : null}
    </form>
  );

  if (embedded) return formBody;

  return (
    <Card className="mb-6 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
        {t("clients.newClient")}
      </h3>
      {formBody}
    </Card>
  );
}
