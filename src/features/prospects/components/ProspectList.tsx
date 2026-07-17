"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineEnvelope, HiOutlineTrash } from "react-icons/hi2";

import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/features/auth/AuthContext";
import { SendEmailModal } from "@/features/emails/components/SendEmailModal";
import { ProspectStatusBadge, ProspectQualificationBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { Prospect } from "@/features/prospects/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface ProspectListProps {
  prospects: Prospect[];
  onDeleted?: () => void;
}

export function ProspectList({ prospects, onDeleted }: ProspectListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const modal = useModal();
  const { token, user } = useAuth();
  const [emailTarget, setEmailTarget] = useState<Prospect | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isAdmin = user?.role.code === "ADMIN";

  async function handleDelete(prospect: Prospect) {
    if (!token || deletingId !== null) return;
    const confirmed = await modal.confirm({
      title: t("prospects.deleteTitle"),
      message: t("prospects.deleteMessage", { name: prospect.full_name }),
      confirmLabel: t("prospects.deleteAction"),
      variant: "danger",
    });
    if (!confirmed) return;
    setDeletingId(prospect.id);
    try {
      await api.delete(`/prospects/${prospect.id}`, token);
      onDeleted?.();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (prospects.length === 0) {
    return (
      <div className="card-flat p-8 text-center text-sm text-slate-500">{t("prospects.empty")}</div>
    );
  }

  const prospectActions = (prospect: Prospect) => (
    <TableActions>
      <IconActionButton
        label={t("emailCompose.action")}
        icon={<HiOutlineEnvelope className="h-4 w-4" />}
        onClick={() => setEmailTarget(prospect)}
      />
      {isAdmin ? (
        <IconActionButton
          label={t("prospects.deleteAction")}
          icon={<HiOutlineTrash className="h-4 w-4" />}
          variant="danger"
          disabled={deletingId === prospect.id}
          onClick={() => void handleDelete(prospect)}
        />
      ) : null}
    </TableActions>
  );

  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {prospects.map((prospect) => (
          <div
            key={prospect.id}
            role="link"
            tabIndex={0}
            className="card-flat cursor-pointer p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            onClick={() => router.push(`/prospectos/${prospect.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/prospectos/${prospect.id}`);
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{prospect.full_name}</p>
                <p className="truncate text-sm text-slate-500">{prospect.email}</p>
              </div>
              <div onClick={(event) => event.stopPropagation()}>{prospectActions(prospect)}</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <ProspectStatusBadge status={prospect.status} />
              <ProspectQualificationBadge isQualified={prospect.is_qualified} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-sm">
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t("prospects.columns.merchant")}
                </dt>
                <dd className="mt-0.5 truncate text-slate-700">{prospect.merchant_name ?? "—"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t("prospects.columns.salesRep")}
                </dt>
                <dd className="mt-0.5 truncate text-slate-700">
                  {prospect.assigned_to
                    ? `${prospect.assigned_to.first_name} ${prospect.assigned_to.last_name}`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: table */}
      <div className="table-wrap max-md:hidden">
        <table className="table-modern">
          <thead>
            <tr>
              <th>{t("prospects.columns.name")}</th>
              <th>{t("common.email")}</th>
              <th>{t("prospects.columns.merchant")}</th>
              <th>{t("prospects.columns.salesRep")}</th>
              <th>{t("prospects.columns.status")}</th>
              <th>{t("prospects.columns.qualification")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => (
              <tr
                key={prospect.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                onClick={() => router.push(`/prospectos/${prospect.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/prospectos/${prospect.id}`);
                  }
                }}
              >
                <td className="font-semibold text-slate-900">{prospect.full_name}</td>
                <td className="text-slate-500">{prospect.email}</td>
                <td className="text-slate-500">{prospect.merchant_name ?? "—"}</td>
                <td className="text-slate-500">
                  {prospect.assigned_to
                    ? `${prospect.assigned_to.first_name} ${prospect.assigned_to.last_name}`
                    : "—"}
                </td>
                <td>
                  <ProspectStatusBadge status={prospect.status} />
                </td>
                <td>
                  <ProspectQualificationBadge isQualified={prospect.is_qualified} />
                </td>
                <td onClick={(event) => event.stopPropagation()}>{prospectActions(prospect)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {emailTarget ? (
        <SendEmailModal
          recipientName={emailTarget.full_name}
          recipientEmail={emailTarget.email}
          basePath={`/prospects/${emailTarget.id}`}
          onClose={() => setEmailTarget(null)}
        />
      ) : null}
    </>
  );
}
