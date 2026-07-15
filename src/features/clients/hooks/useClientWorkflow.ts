"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";
import { emitClientsRefresh } from "@/lib/clientEvents";
import { invalidateClientsQueries } from "@/lib/invalidateClients";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { savePortalCredentials } from "@/features/clients/portal-credentials-storage";
import type { Client } from "@/types/api";

export interface AdvisorOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export function useClientWorkflow(token: string | null) {
  const { t } = useTranslation();
  const modal = useModal();
  const queryClient = useQueryClient();
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);

  const loadAdvisors = useCallback(async (): Promise<AdvisorOption[]> => {
    if (!token) return [];
    try {
      const list = await api.get<AdvisorOption[]>("/advisors", token);
      setAdvisors(list);
      return list;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        throw new ApiError(404, t("clients.advisorsLoadError"));
      }
      throw err;
    }
  }, [token, t]);

  const approveClient = useCallback(
    async (clientId: number, clientName?: string) => {
      if (!token) return false;
      let list: AdvisorOption[];
      try {
        list = advisors.length ? advisors : await loadAdvisors();
      } catch (err) {
        await modal.alert({
          title: t("clients.approve"),
          message: getUserFacingErrorMessage(err, t("clients.advisorsLoadError")),
          variant: "error",
        });
        return false;
      }
      if (!list.length) {
        await modal.alert({
          title: t("clients.approve"),
          message: t("clients.noAdvisors"),
          variant: "error",
        });
        return false;
      }

      return modal.approveWithAdvisor({
        title: t("clients.approveTitle"),
        message: t("clients.approveConfirm", { name: clientName ?? "" }),
        advisors: list.map((a) => ({
          id: a.id,
          label: `${a.first_name} ${a.last_name} (${a.email})`,
        })),
        confirmLabel: t("clients.approve"),
        loadingMessage: t("clients.approving"),
        onConfirm: async (advisorId) => {
          try {
            const res = await api.post<{ client: Client; temp_password: string }>(
              `/clients/${clientId}/approve`,
              { advisor_user_id: advisorId },
              token,
            );
            savePortalCredentials(clientId, {
              email: res.client.email,
              tempPassword: res.temp_password,
            });
            await invalidateClientsQueries(queryClient, { clientId });
            emitClientsRefresh({ clientId });
            return {
              title: t("clients.approvedTitle"),
              message: t("clients.approvedMessage", { name: clientName ?? "" }),
              variant: "success" as const,
              copyText: res.temp_password,
            };
          } catch (err) {
            return {
              title: t("clients.approve"),
              message: getUserFacingErrorMessage(err, t("common.error")),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, advisors, loadAdvisors, modal, t, queryClient],
  );

  const rejectClient = useCallback(
    async (clientId: number, clientName?: string) => {
      if (!token) return false;

      return modal.rejectClient({
        title: t("clients.rejectTitle"),
        message: t("clients.rejectConfirm", { name: clientName ?? "" }),
        reasonLabel: t("clients.rejectPrompt"),
        reasonPlaceholder: t("clients.rejectPlaceholder"),
        minLength: 5,
        confirmLabel: t("clients.reject"),
        loadingMessage: t("clients.rejecting"),
        onConfirm: async (reason) => {
          try {
            await api.post(`/clients/${clientId}/reject`, { reason }, token);
            await invalidateClientsQueries(queryClient, { clientId });
            emitClientsRefresh({ clientId });
            return {
              title: t("clients.rejectedTitle"),
              message: t("clients.rejectedMessage", { name: clientName ?? "" }),
              variant: "info" as const,
            };
          } catch (err) {
            return {
              title: t("clients.reject"),
              message: getUserFacingErrorMessage(err, t("common.error")),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, modal, t, queryClient],
  );

  const resubmitClient = useCallback(
    async (clientId: number, clientName?: string) => {
      if (!token) return false;

      return modal.confirm({
        title: t("clients.resubmit"),
        message: t("clients.resubmitConfirm", { name: clientName ?? "" }),
        confirmLabel: t("clients.resubmit"),
        loadingMessage: t("clients.resubmitting"),
        onConfirmAsync: async () => {
          try {
            await api.post(`/clients/${clientId}/resubmit`, {}, token);
            await invalidateClientsQueries(queryClient, { clientId });
            emitClientsRefresh({ clientId });
            return {
              title: t("clients.resubmit"),
              message: t("clients.resubmitSuccess"),
              variant: "success" as const,
            };
          } catch (err) {
            return {
              title: t("clients.resubmit"),
              message: getUserFacingErrorMessage(err, t("common.error")),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, modal, t, queryClient],
  );

  const deleteClient = useCallback(
    async (clientId: number, clientName?: string) => {
      if (!token) return false;

      return modal.confirm({
        title: t("clients.delete"),
        message: t("clients.deleteConfirm", { name: clientName ?? "" }),
        confirmLabel: t("clients.delete"),
        variant: "danger",
        loadingMessage: t("clients.deleting"),
        onConfirmAsync: async () => {
          try {
            await api.post(`/clients/${clientId}/delete`, {}, token);
            await invalidateClientsQueries(queryClient, { clientId });
            emitClientsRefresh({ clientId, showAllMerchants: true, deleted: true });
            return {
              title: t("clients.delete"),
              message: t("clients.deleteSuccess", { name: clientName ?? "" }),
              variant: "success" as const,
            };
          } catch (err) {
            return {
              title: t("clients.delete"),
              message: getUserFacingErrorMessage(err, t("common.error")),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, modal, t, queryClient],
  );

  const bulkDeleteClients = useCallback(
    async (clientIds: number[]) => {
      if (!token || clientIds.length === 0) return false;

      return modal.confirm({
        title: t("clients.bulkDeleteTitle"),
        message: t("clients.bulkDeleteConfirm", { count: clientIds.length }),
        confirmLabel: t("clients.bulkDelete"),
        variant: "danger",
        loadingMessage: t("clients.bulkDeleting"),
        onConfirmAsync: async () => {
          try {
            const result = await api.post<{ deleted_ids: number[]; failures: Array<{ client_id: number; reason: string }> }>(
              "/clients/bulk-delete",
              { client_ids: clientIds },
              token,
            );
            await invalidateClientsQueries(queryClient, { clientIds: result.deleted_ids });
            emitClientsRefresh({ showAllMerchants: true });

            if (result.failures.length === 0) {
              return {
                title: t("clients.bulkDeleteTitle"),
                message: t("clients.bulkDeleteSuccess", { count: result.deleted_ids.length }),
                variant: "success" as const,
              };
            }

            return {
              title: t("clients.bulkDeleteTitle"),
              message: t("clients.bulkDeletePartial", {
                deleted: result.deleted_ids.length,
                failed: result.failures.length,
              }),
              variant: result.deleted_ids.length > 0 ? ("warning" as const) : ("error" as const),
            };
          } catch (err) {
            return {
              title: t("clients.bulkDeleteTitle"),
              message: getUserFacingErrorMessage(err, t("common.error")),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, modal, t, queryClient],
  );

  return { advisors, loadAdvisors, approveClient, rejectClient, resubmitClient, deleteClient, bulkDeleteClients };
}
