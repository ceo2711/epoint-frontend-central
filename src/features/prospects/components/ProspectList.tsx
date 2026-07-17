"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineEnvelope } from "react-icons/hi2";

import { IconActionButton, TableActions } from "@/components/ui/IconActionButton";
import { SendEmailModal } from "@/features/emails/components/SendEmailModal";
import { ProspectStatusBadge, ProspectQualificationBadge } from "@/features/prospects/components/ProspectStatusBadge";
import type { Prospect } from "@/features/prospects/types";
import { useTranslation } from "@/contexts/LanguageContext";

interface ProspectListProps {
  prospects: Prospect[];
}

export function ProspectList({ prospects }: ProspectListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [emailTarget, setEmailTarget] = useState<Prospect | null>(null);

  if (prospects.length === 0) {
    return (
      <div className="card-flat p-8 text-center text-sm text-slate-500">{t("prospects.empty")}</div>
    );
  }

  return (
    <>
      <div className="table-wrap">
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
                <td onClick={(event) => event.stopPropagation()}>
                  <TableActions>
                    <IconActionButton
                      label={t("emailCompose.action")}
                      icon={<HiOutlineEnvelope className="h-4 w-4" />}
                      onClick={() => setEmailTarget(prospect)}
                    />
                  </TableActions>
                </td>
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
