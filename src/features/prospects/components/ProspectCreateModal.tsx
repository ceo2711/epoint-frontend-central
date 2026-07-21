"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import type { CalendlySalesRep } from "@/features/calendly/types";
import { ClientSourceSelect } from "@/features/clients/components/ClientSourceSelect";
import { MerchantSelect } from "@/features/clients/components/MerchantSelect";
import {
  formatProspectConflict,
  useProspectAvailabilityCheck,
} from "@/features/prospects/hooks/useProspectAvailabilityCheck";
import { EMPTY_PROSPECT_FORM, type ProspectFormData } from "@/features/prospects/types";
import { useSedes } from "@/features/sedes/hooks/useSedes";
import type { MerchantBrief } from "@/types/api";
import { api } from "@/lib/api";
import { isGlobalAdmin, isSedeAdmin } from "@/lib/roles";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface ProspectCreateModalProps {
  token: string | null;
  merchants: MerchantBrief[];
  merchantsLoading?: boolean;
  salesReps?: CalendlySalesRep[];
  initialSedeId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProspectCreateModal({
  token,
  merchants,
  merchantsLoading,
  salesReps = [],
  initialSedeId = null,
  onClose,
  onSuccess,
}: ProspectCreateModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const { user, hasPermission } = useAuth();
  const roleCode = user?.role.code;
  const isGlobal = isGlobalAdmin(roleCode);
  const sedeAdmin = isSedeAdmin(roleCode);
  const needsSalesRep = isGlobal || sedeAdmin;

  const [form, setForm] = useState<ProspectFormData>(() => ({
    ...EMPTY_PROSPECT_FORM,
    sede_id: initialSedeId != null ? String(initialSedeId) : "",
  }));
  const [submitting, setSubmitting] = useState(false);

  const { sedes, loading: sedesLoading } = useSedes(
    token,
    isGlobal && hasPermission("sedes:read"),
    t("sedes.loadError"),
    "",
    false,
  );

  const selectedSedeId = form.sede_id ? Number(form.sede_id) : null;

  const repsForSede = useMemo(() => {
    if (!isGlobal || selectedSedeId == null) return salesReps;
    return salesReps.filter((rep) => rep.sede_id === selectedSedeId);
  }, [salesReps, isGlobal, selectedSedeId]);

  const merchantsForSede = useMemo(() => {
    if (!isGlobal || selectedSedeId == null) return merchants;
    return merchants.filter((merchant) => merchant.sede_id === selectedSedeId);
  }, [merchants, isGlobal, selectedSedeId]);

  useEffect(() => {
    if (!isGlobal) return;
    setForm((current) => {
      const next = { ...current };
      let changed = false;
      if (current.assigned_to_user_id) {
        const stillValid = repsForSede.some(
          (rep) => String(rep.id) === current.assigned_to_user_id,
        );
        if (!stillValid) {
          next.assigned_to_user_id = "";
          changed = true;
        }
      }
      if (current.merchant_id) {
        const stillValid = merchantsForSede.some(
          (merchant) => String(merchant.id) === current.merchant_id,
        );
        if (!stillValid) {
          next.merchant_id = "";
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [isGlobal, repsForSede, merchantsForSede]);

  const { availability, checking, hasConflict } = useProspectAvailabilityCheck(
    token,
    form.merchant_id,
    form.email,
    form.phone,
  );

  const emailError = availability?.email
    ? formatProspectConflict(t, "email", availability.email)
    : undefined;
  const phoneError = availability?.phone
    ? formatProspectConflict(t, "phone", availability.phone)
    : undefined;

  const formComplete =
    Boolean(form.first_name && form.last_name && form.email && form.phone && form.merchant_id) &&
    (!isGlobal || Boolean(form.sede_id)) &&
    (!needsSalesRep || Boolean(form.assigned_to_user_id));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !formComplete || hasConflict) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        source: form.source,
        merchant_id: Number(form.merchant_id),
        is_qualified: form.is_qualified,
        notes: form.notes || undefined,
      };
      if (needsSalesRep && form.assigned_to_user_id) {
        payload.assigned_to_user_id = Number(form.assigned_to_user_id);
      }
      if (isGlobal && form.sede_id) {
        payload.sede_id = Number(form.sede_id);
      }
      await api.post("/prospects", payload, token);
      onSuccess();
      onClose();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title={t("prospects.createTitle")}>
      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("common.firstName")}
          required
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <Input
          label={t("common.lastName")}
          required
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <Input
          label={t("common.email")}
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={emailError}
        />
        <Input
          label={t("common.phone")}
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          error={phoneError}
        />
        <div className="sm:col-span-2">
          <ClientSourceSelect
            value={form.source}
            onChange={(source) => setForm({ ...form, source })}
          />
        </div>

        {isGlobal ? (
          <div className="sm:col-span-2">
            <Select
              label={t("users.sede")}
              required
              disabled={sedesLoading}
              value={form.sede_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  sede_id: e.target.value,
                  assigned_to_user_id: "",
                  merchant_id: "",
                })
              }
            >
              <option value="">
                {sedesLoading ? t("common.loading") : t("users.selectSede")}
              </option>
              {sedes
                .filter((sede) => sede.is_active)
                .map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.name}
                  </option>
                ))}
            </Select>
          </div>
        ) : null}

        {needsSalesRep ? (
          <div className="sm:col-span-2">
            <Select
              label={t("prospects.columns.salesRep")}
              required
              disabled={isGlobal && !form.sede_id}
              value={form.assigned_to_user_id}
              onChange={(e) => setForm({ ...form, assigned_to_user_id: e.target.value })}
            >
              <option value="">
                {isGlobal && !form.sede_id
                  ? t("prospects.selectSedeFirst")
                  : t("prospects.selectSalesRep")}
              </option>
              {repsForSede.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.first_name} {rep.last_name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <MerchantSelect
            merchants={merchantsForSede}
            loading={merchantsLoading}
            value={form.merchant_id}
            onChange={(merchant_id) => setForm({ ...form, merchant_id })}
            disabled={isGlobal && !form.sede_id}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-slate-700">{t("prospects.qualification")}</p>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input
                type="radio"
                name="is_qualified"
                checked={form.is_qualified}
                onChange={() => setForm({ ...form, is_qualified: true })}
              />
              {t("prospects.qualified")}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input
                type="radio"
                name="is_qualified"
                checked={!form.is_qualified}
                onChange={() => setForm({ ...form, is_qualified: false })}
              />
              {t("prospects.unqualified")}
            </label>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{t("prospects.qualificationHint")}</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            {t("common.notes")}
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={submitting || checking || hasConflict || !formComplete}>
            {submitting ? t("common.saving") : t("prospects.createAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
