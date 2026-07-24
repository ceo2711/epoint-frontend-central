"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { ClientSourceSelect } from "@/features/clients/components/ClientSourceSelect";
import { useInfluencerOptions } from "@/features/influencers/hooks/useInfluencerOptions";
import type { Prospect } from "@/features/prospects/types";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

type ProspectEditForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  influencer_id: string;
  notes: string;
  is_qualified: boolean;
};

function buildForm(prospect: Prospect): ProspectEditForm {
  return {
    first_name: prospect.first_name,
    last_name: prospect.last_name,
    email: prospect.email,
    phone: prospect.phone,
    source: prospect.source ?? "",
    influencer_id: prospect.influencer_id != null ? String(prospect.influencer_id) : "",
    notes: prospect.notes ?? "",
    is_qualified: prospect.is_qualified,
  };
}

interface ProspectEditModalProps {
  prospect: Prospect;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProspectEditModal({ prospect, token, onClose, onSuccess }: ProspectEditModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const { user } = useAuth();
  const [form, setForm] = useState<ProspectEditForm>(() => buildForm(prospect));
  const [submitting, setSubmitting] = useState(false);

  const needsInfluencer = form.source === "INFLUENCERS";
  const { options: influencerOptions, loading: influencersLoading } = useInfluencerOptions(
    token,
    needsInfluencer,
    null,
  );

  useEffect(() => {
    setForm(buildForm(prospect));
  }, [prospect]);

  useEffect(() => {
    if (!needsInfluencer) {
      setForm((current) => (current.influencer_id ? { ...current, influencer_id: "" } : current));
      return;
    }
    setForm((current) => {
      if (!current.influencer_id) return current;
      const stillValid = influencerOptions.some((item) => String(item.id) === current.influencer_id);
      if (stillValid) return current;
      // Keep current id until options load if it matches the prospect's influencer
      if (
        influencersLoading &&
        prospect.influencer_id != null &&
        String(prospect.influencer_id) === current.influencer_id
      ) {
        return current;
      }
      return { ...current, influencer_id: "" };
    });
  }, [needsInfluencer, influencerOptions, influencersLoading, prospect.influencer_id]);

  const formComplete =
    Boolean(form.first_name && form.last_name && form.email && form.phone) &&
    (!needsInfluencer || Boolean(form.influencer_id));

  const salesRepName = prospect.assigned_to
    ? `${prospect.assigned_to.first_name} ${prospect.assigned_to.last_name}`
    : "—";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !formComplete) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        source: form.source || undefined,
        notes: form.notes.trim(),
        is_qualified: form.is_qualified,
        influencer_id: needsInfluencer && form.influencer_id ? Number(form.influencer_id) : null,
      };
      await api.patch(`/prospects/${prospect.id}`, payload, token);
      onSuccess();
      onClose();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("prospects.editError")),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={t("prospects.editTitle")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="prospect-edit-form" disabled={submitting || !formComplete}>
            {submitting ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </div>
      }
    >
      <form id="prospect-edit-form" onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
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
        />
        <Input
          label={t("common.phone")}
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <div className="sm:col-span-2">
          <ClientSourceSelect
            value={form.source}
            onChange={(source) => setForm({ ...form, source, influencer_id: "" })}
          />
        </div>

        {needsInfluencer ? (
          <div className="sm:col-span-2">
            <Select
              label={t("influencers.title")}
              required
              disabled={influencersLoading}
              value={form.influencer_id}
              onChange={(e) => setForm({ ...form, influencer_id: e.target.value })}
            >
              <option value="">
                {influencersLoading ? t("common.loading") : t("influencers.selectInfluencer")}
              </option>
              {influencerOptions.map((influencer) => (
                <option key={influencer.id} value={influencer.id}>
                  {influencer.name}
                  {influencer.handle ? ` (${influencer.handle})` : ""}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-slate-700">{t("prospects.qualification")}</p>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.is_qualified ? "1" : "0"}
            onChange={(e) => setForm({ ...form, is_qualified: e.target.value === "1" })}
          >
            <option value="1">{t("prospects.qualified")}</option>
            <option value="0">{t("prospects.unqualified")}</option>
          </select>
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

        <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
          <p>
            <span className="font-medium text-slate-700">{t("prospects.columns.merchant")}:</span>{" "}
            {prospect.merchant_name ?? "—"}
          </p>
          <p className="mt-1">
            <span className="font-medium text-slate-700">{t("prospects.columns.salesRep")}:</span>{" "}
            {salesRepName}
          </p>
          {user?.sede?.name ? (
            <p className="mt-1">
              <span className="font-medium text-slate-700">{t("users.sede")}:</span> {user.sede.name}
            </p>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
