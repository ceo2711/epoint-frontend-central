"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/contexts/LanguageContext";
import type { ClientFormData } from "@/features/clients/types";

interface ClientCreateFormProps {
  form: ClientFormData;
  onChange: (form: ClientFormData) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  checking: boolean;
  hasConflict: boolean;
  emailError?: string;
  phoneError?: string;
}

export function ClientCreateForm({
  form,
  onChange,
  onSubmit,
  submitting,
  checking,
  hasConflict,
  emailError,
  phoneError,
}: ClientCreateFormProps) {
  const { t } = useTranslation();

  return (
    <Card className="mb-6 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
        {t("clients.newClient")}
      </h3>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
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
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          {checking && (
            <p className="text-xs text-slate-400">{t("clients.checkingAvailability")}</p>
          )}
          <Button type="submit" disabled={submitting || checking || hasConflict}>
            {submitting ? t("common.loading") : t("clients.saveClient")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
