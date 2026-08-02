"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import type { User } from "@/types/api";

interface ReassignSubSellerModalProps {
  token: string;
  subSeller: User;
  onClose: () => void;
  onSuccess: (updated: User) => void;
}

export function ReassignSubSellerModal({
  token,
  subSeller,
  onClose,
  onSuccess,
}: ReassignSubSellerModalProps) {
  const { t } = useTranslation();
  const [parents, setParents] = useState<User[]>([]);
  const [parentId, setParentId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await api.get<User[]>("/sub-sellers/reassign-parents", token);
        if (cancelled) return;
        const options = rows.filter((p) => p.id !== subSeller.parent_user_id);
        setParents(options);
        setParentId(options[0]?.id ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(getUserFacingErrorMessage(err, t("subSellers.reassignLoadError")));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, subSeller.parent_user_id, t]);

  async function handleSubmit() {
    if (parentId === "") return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<User>(
        `/sub-sellers/${subSeller.id}/parent`,
        { new_parent_user_id: parentId },
        token,
        { silentHttpErrors: true },
      );
      onSuccess(updated);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("subSellers.reassignError")));
    } finally {
      setSaving(false);
    }
  }

  const fullName = `${subSeller.first_name} ${subSeller.last_name}`.trim();

  return (
    <Modal
      title={t("subSellers.reassignTitle")}
      subtitle={fullName || subSeller.email}
      onClose={onClose}
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || loading || parentId === ""}
          >
            {saving ? t("common.saving") : t("subSellers.reassignConfirm")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{t("subSellers.reassignHint")}</p>
        {error ? <div className="alert alert-error text-sm">{error}</div> : null}
        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : parents.length === 0 ? (
          <p className="text-sm text-slate-500">{t("subSellers.reassignNoParents")}</p>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">{t("subSellers.reassignParent")}</span>
            <select
              className="input w-full"
              value={parentId === "" ? "" : String(parentId)}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
            >
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.first_name} {parent.last_name} ({parent.email})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </Modal>
  );
}
