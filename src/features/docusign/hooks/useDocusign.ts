"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";
import type { Client, Paginated } from "@/features/clients/types";
import type {
  DocusignConnectPayload,
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

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const conn = await loadConnection();
      if (conn?.connected) {
        await Promise.all([loadTemplates(), loadEnvelopes()]);
      } else {
        setTemplates([]);
        setEnvelopes([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar DocuSign");
    } finally {
      setLoading(false);
    }
  }, [token, loadConnection, loadTemplates, loadEnvelopes]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function connect(payload: DocusignConnectPayload) {
    if (!token) return;
    const data = await api.post<DocusignConnection>("/docusign/connection", payload, token);
    setConnection(data);
    await Promise.all([loadTemplates(), loadEnvelopes()]);
    return data;
  }

  async function disconnect() {
    if (!token) return;
    await api.delete("/docusign/connection", token);
    setConnection({ connected: false });
    setTemplates([]);
    setEnvelopes([]);
  }

  async function getConsentUrl() {
    if (!token) return null;
    return api.get<{ consent_url: string; redirect_uri: string }>("/docusign/consent-url", token);
  }

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
    connect,
    disconnect,
    getConsentUrl,
    loadTemplateDetail,
    sendEnvelope,
    syncEnvelope,
    searchClients,
  };
}
