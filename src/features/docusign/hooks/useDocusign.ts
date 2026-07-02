"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";
import type { Client, Paginated } from "@/features/clients/types";
import { DOCUSIGN_REFRESH_EVENT } from "@/features/docusign/docusign-events";
import type {
  DocusignConnection,
  DocusignEnvelope,
  DocusignSendPayload,
  DocusignTemplate,
  DocusignTemplateDetail,
} from "@/features/docusign/types";
import { hasPendingEnvelopes } from "@/features/docusign/utils";

const POLL_MS = 30_000;

export function useDocusign(token: string | null) {
  const [connection, setConnection] = useState<DocusignConnection | null>(null);
  const [templates, setTemplates] = useState<DocusignTemplate[]>([]);
  const [envelopes, setEnvelopes] = useState<DocusignEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConnection = useCallback(async () => {
    if (!token) return;
    const data = await api.get<DocusignConnection>("/docusign/connection", token);
    setConnection(data);
    return data;
  }, [token]);

  const loadTemplates = useCallback(async () => {
    if (!token) return [];
    setLoadingTemplates(true);
    try {
      const data = await api.get<DocusignTemplate[]>("/docusign/templates", token);
      setTemplates(data);
      return data;
    } finally {
      setLoadingTemplates(false);
    }
  }, [token]);

  const loadEnvelopes = useCallback(async () => {
    if (!token) return [];
    const data = await api.get<DocusignEnvelope[]>("/docusign/envelopes", token);
    setEnvelopes(data);
    return data;
  }, [token]);

  const syncPendingEnvelopes = useCallback(async () => {
    if (!token) return [];
    const data = await api.post<DocusignEnvelope[]>("/docusign/envelopes/sync-pending", {}, token);
    setEnvelopes(data);
    return data;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const conn = await loadConnection();
      if (conn?.connected) {
        await Promise.all([loadTemplates(), loadEnvelopes()]);
        try {
          await syncPendingEnvelopes();
        } catch (syncErr) {
          console.warn("DocuSign sync-pending failed", syncErr);
        }
      } else {
        setTemplates([]);
        setEnvelopes([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar DocuSign");
    } finally {
      setLoading(false);
    }
  }, [token, loadConnection, loadTemplates, loadEnvelopes, syncPendingEnvelopes]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!token || !connection?.connected || !hasPendingEnvelopes(envelopes)) return;

    const interval = window.setInterval(() => {
      void syncPendingEnvelopes().catch(() => undefined);
    }, POLL_MS);

    return () => window.clearInterval(interval);
  }, [token, connection?.connected, envelopes, syncPendingEnvelopes]);

  useEffect(() => {
    if (!token || !connection?.connected) return;

    const onRefresh = () => {
      void syncPendingEnvelopes().catch(() => undefined);
    };

    window.addEventListener(DOCUSIGN_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(DOCUSIGN_REFRESH_EVENT, onRefresh);
  }, [token, connection?.connected, syncPendingEnvelopes]);

  async function loadTemplateDetail(templateId: string) {
    if (!token) return null;
    return api.get<DocusignTemplateDetail>(`/docusign/templates/${templateId}`, token);
  }

  async function sendEnvelope(payload: DocusignSendPayload) {
    if (!token) return null;
    const result = await api.post<{ envelope: DocusignEnvelope; message: string }>(
      "/docusign/envelopes",
      payload,
      token,
    );
    setEnvelopes((prev) => [result.envelope, ...prev]);
    return result;
  }

  async function syncEnvelope(envelopeId: number) {
    if (!token) return null;
    const updated = await api.post<DocusignEnvelope>(
      `/docusign/envelopes/${envelopeId}/sync`,
      {},
      token,
    );
    setEnvelopes((prev) => prev.map((item) => (item.id === envelopeId ? updated : item)));
    return updated;
  }

  async function downloadSignedDocument(envelopeId: number) {
    if (!token) return null;
    return api.getBlob(`/docusign/envelopes/${envelopeId}/document`, token);
  }

  async function downloadSentDocument(envelopeId: number) {
    if (!token) return null;
    return api.getBlob(`/docusign/envelopes/${envelopeId}/document/sent`, token);
  }

  async function searchClients(query: string) {
    if (!token || !query.trim()) return [];
    const data = await api.get<Paginated<Client>>(
      `/clients?search=${encodeURIComponent(query.trim())}&page_size=10`,
      token,
    );
    return data.items ?? [];
  }

  return {
    connection,
    templates,
    envelopes,
    loading,
    loadingTemplates,
    error,
    refresh,
    loadTemplateDetail,
    sendEnvelope,
    syncEnvelope,
    syncPendingEnvelopes,
    downloadSignedDocument,
    downloadSentDocument,
    searchClients,
  };
}
