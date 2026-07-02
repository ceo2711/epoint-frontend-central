"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";
import type { Client, Paginated } from "@/features/clients/types";
import type {
  DocusignConnection,
  DocusignEnvelope,
  DocusignSendPayload,
  DocusignTemplate,
  DocusignTemplateDetail,
} from "@/features/docusign/types";

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
        void syncPendingEnvelopes().catch(() => undefined);
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
    downloadSignedDocument,
    searchClients,
  };
}
