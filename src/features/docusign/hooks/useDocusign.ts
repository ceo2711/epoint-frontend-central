"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchDocusignConnection,
  fetchDocusignEnvelopes,
  fetchDocusignTemplates,
} from "@/lib/queryFetchers";
import { ApiError, api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { DOCUSIGN_REFRESH_EVENT, dispatchDocusignRefresh } from "@/features/docusign/docusign-events";
import type {
  DocusignConnection,
  DocusignEnvelope,
  DocusignRegisterClientPayload,
  DocusignRegisterClientResponse,
  DocusignSendPayload,
  DocusignTemplate,
  DocusignTemplateDetail,
} from "@/features/docusign/types";
import { hasPendingEnvelopes } from "@/features/docusign/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Client, Paginated } from "@/features/clients/types";

const POLL_MS = 15_000;
const MIN_SYNC_GAP_MS = 5_000;

export interface UseDocusignOptions {
  /** Vista admin: solo lectura por vendedor, sin formulario de envío. */
  adminView?: boolean;
  /** Filtra contratos por vendedor (requerido en vista admin). */
  salesRepId?: number | null;
}

export function useDocusign(token: string | null, options?: UseDocusignOptions) {
  const adminView = options?.adminView ?? false;
  const salesRepId = options?.salesRepId ?? null;
  const queryClient = useQueryClient();
  const syncInFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);

  const envelopesQueryKey =
    adminView && salesRepId != null
      ? queryKeys.docusign.envelopesBySalesRep(salesRepId)
      : queryKeys.docusign.envelopes;

  const connectionQuery = useQuery({
    queryKey: queryKeys.docusign.connection,
    queryFn: () => fetchDocusignConnection(token!),
    enabled: !!token,
  });

  const connected = connectionQuery.data?.connected ?? false;

  const templatesQuery = useQuery({
    queryKey: queryKeys.docusign.templates,
    queryFn: () => fetchDocusignTemplates(token!),
    enabled: !!token && connected && !adminView,
  });

  const envelopesEnabled =
    !!token && connected && (!adminView || salesRepId != null);

  const envelopesQuery = useQuery({
    queryKey: envelopesQueryKey,
    queryFn: () =>
      fetchDocusignEnvelopes(token!, adminView ? salesRepId : undefined),
    enabled: envelopesEnabled,
  });

  const envelopes = envelopesQuery.data ?? [];
  const shouldPoll = useMemo(() => hasPendingEnvelopes(envelopes), [envelopes]);

  const syncPendingEnvelopes = useCallback(async (options?: { force?: boolean }) => {
    if (!token || !connected || !envelopesEnabled) return [];
    const now = Date.now();
    if (
      !options?.force &&
      (syncInFlightRef.current || now - lastSyncAtRef.current < MIN_SYNC_GAP_MS)
    ) {
      return queryClient.getQueryData<DocusignEnvelope[]>(envelopesQueryKey) ?? [];
    }

    syncInFlightRef.current = true;
    try {
      const qs =
        adminView && salesRepId != null
          ? `?sent_by_user_id=${encodeURIComponent(String(salesRepId))}`
          : "";
      const data = await api.post<DocusignEnvelope[]>(
        `/docusign/envelopes/sync-pending${qs}`,
        {},
        token,
      );
      lastSyncAtRef.current = Date.now();
      queryClient.setQueryData(envelopesQueryKey, data);
      return data;
    } finally {
      syncInFlightRef.current = false;
    }
  }, [token, connected, envelopesEnabled, adminView, salesRepId, queryClient, envelopesQueryKey]);

  const syncPendingRef = useRef(syncPendingEnvelopes);
  syncPendingRef.current = syncPendingEnvelopes;

  useEffect(() => {
    if (!envelopesEnabled) return;
    lastSyncAtRef.current = 0;
    void syncPendingRef.current().catch(() => undefined);
  }, [envelopesEnabled, token, connected, salesRepId]);

  useEffect(() => {
    if (!envelopesEnabled || !shouldPoll) return;

    const interval = window.setInterval(() => {
      void syncPendingEnvelopes().catch(() => undefined);
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncPendingEnvelopes({ force: true }).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [envelopesEnabled, shouldPoll, syncPendingEnvelopes]);

  useEffect(() => {
    if (!envelopesEnabled) return;

    const onRefresh = () => {
      void syncPendingEnvelopes({ force: true }).catch(() => undefined);
    };

    window.addEventListener(DOCUSIGN_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(DOCUSIGN_REFRESH_EVENT, onRefresh);
  }, [envelopesEnabled, syncPendingEnvelopes]);

  const refresh = useCallback(async () => {
    if (!token) return;
    await Promise.all([
      connectionQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: queryKeys.docusign.all }),
    ]);
  }, [token, connectionQuery, queryClient]);

  const loadTemplateDetail = useCallback(
    async (templateId: string) => {
      if (!token) return null;
      return queryClient.fetchQuery({
        queryKey: queryKeys.docusign.templateDetail(templateId),
        queryFn: () => api.get<DocusignTemplateDetail>(`/docusign/templates/${templateId}`, token),
        staleTime: 60_000,
      });
    },
    [token, queryClient],
  );

  const sendEnvelopeMutation = useMutation({
    mutationFn: (payload: DocusignSendPayload) =>
      api.post<{ envelope: DocusignEnvelope; message: string }>("/docusign/envelopes", payload, token!),
    onSuccess: (result) => {
      queryClient.setQueryData<DocusignEnvelope[]>(envelopesQueryKey, (prev) =>
        prev ? [result.envelope, ...prev] : [result.envelope],
      );
      dispatchDocusignRefresh({ envelopeId: result.envelope.id });
    },
  });

  const syncEnvelopeMutation = useMutation({
    mutationFn: (envelopeId: number) =>
      api.post<DocusignEnvelope>(`/docusign/envelopes/${envelopeId}/sync`, {}, token!),
    onSuccess: (updated) => {
      queryClient.setQueryData<DocusignEnvelope[]>(envelopesQueryKey, (prev) =>
        prev ? prev.map((item) => (item.id === updated.id ? updated : item)) : [updated],
      );
    },
  });

  const registerClientMutation = useMutation({
    mutationFn: ({
      envelopeId,
      payload,
    }: {
      envelopeId: number;
      payload: DocusignRegisterClientPayload;
    }) =>
      api.post<DocusignRegisterClientResponse>(
        `/docusign/envelopes/${envelopeId}/register-client`,
        payload,
        token!,
      ),
    onSuccess: (result) => {
      queryClient.setQueryData<DocusignEnvelope[]>(envelopesQueryKey, (prev) =>
        prev
          ? prev.map((item) => (item.id === result.envelope.id ? result.envelope : item))
          : [result.envelope],
      );
    },
  });

  const sendEnvelope = useCallback(
    async (payload: DocusignSendPayload) => {
      if (!token) return null;
      return sendEnvelopeMutation.mutateAsync(payload);
    },
    [token, sendEnvelopeMutation],
  );

  const syncEnvelope = useCallback(
    async (envelopeId: number) => {
      if (!token) return null;
      return syncEnvelopeMutation.mutateAsync(envelopeId);
    },
    [token, syncEnvelopeMutation],
  );

  const registerClientFromEnvelope = useCallback(
    async (envelopeId: number, payload: DocusignRegisterClientPayload) => {
      if (!token) return null;
      return registerClientMutation.mutateAsync({ envelopeId, payload });
    },
    [token, registerClientMutation],
  );

  const downloadSignedDocument = useCallback(
    async (envelopeId: number) => {
      if (!token) return null;
      return api.getBlob(`/docusign/envelopes/${envelopeId}/document`, token);
    },
    [token],
  );

  const downloadSentDocument = useCallback(
    async (envelopeId: number) => {
      if (!token) return null;
      return api.getBlob(`/docusign/envelopes/${envelopeId}/document/sent`, token);
    },
    [token],
  );

  const searchClients = useCallback(
    async (query: string) => {
      if (!token || !query.trim()) return [];
      const data = await api.get<Paginated<Client>>(
        `/clients?search=${encodeURIComponent(query.trim())}&page_size=10`,
        token,
      );
      return data.items ?? [];
    },
    [token],
  );

  const loading =
    connectionQuery.isLoading ||
    (connected &&
      !adminView &&
      templatesQuery.isLoading) ||
    (envelopesEnabled && envelopesQuery.isLoading);

  const loadingEnvelopes = envelopesEnabled && envelopesQuery.isLoading;

  const error = connectionQuery.error
    ? getUserFacingErrorMessage(connectionQuery.error, "Error al cargar DocuSign")
    : null;

  return {
    connection: connectionQuery.data ?? null,
    templates: templatesQuery.data ?? [],
    envelopes,
    loading,
    loadingEnvelopes,
    loadingTemplates: templatesQuery.isFetching,
    error,
    refresh,
    loadTemplateDetail,
    sendEnvelope,
    syncEnvelope,
    syncPendingEnvelopes,
    downloadSignedDocument,
    downloadSentDocument,
    registerClientFromEnvelope,
    searchClients,
  };
}
