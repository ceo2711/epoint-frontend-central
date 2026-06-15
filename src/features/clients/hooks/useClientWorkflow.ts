"use client";

import { useCallback, useState } from "react";

import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";
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
          message: err instanceof ApiError ? err.message : t("clients.advisorsLoadError"),
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
            return {
              title: t("clients.approvedTitle"),
              message: t("clients.approvedMessage", { name: clientName ?? "" }),
              variant: "success" as const,
              copyText: res.temp_password,
            };
          } catch (err) {
            return {
              title: t("clients.approve"),
              message: err instanceof Error ? err.message : t("common.error"),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, advisors, loadAdvisors, modal, t],
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
            return {
              title: t("clients.rejectedTitle"),
              message: t("clients.rejectedMessage", { name: clientName ?? "" }),
              variant: "info" as const,
            };
          } catch (err) {
            return {
              title: t("clients.reject"),
              message: err instanceof Error ? err.message : t("common.error"),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, modal, t],
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
            return {
              title: t("clients.resubmit"),
              message: t("clients.resubmitSuccess"),
              variant: "success" as const,
            };
          } catch (err) {
            return {
              title: t("clients.resubmit"),
              message: err instanceof Error ? err.message : t("common.error"),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, modal, t],
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
            return {
              title: t("clients.delete"),
              message: t("clients.deleteSuccess", { name: clientName ?? "" }),
              variant: "success" as const,
            };
          } catch (err) {
            return {
              title: t("clients.delete"),
              message: err instanceof Error ? err.message : t("common.error"),
              variant: "error" as const,
            };
          }
        },
      });
    },
    [token, modal, t],
  );

  return { advisors, loadAdvisors, approveClient, rejectClient, resubmitClient, deleteClient };
}
