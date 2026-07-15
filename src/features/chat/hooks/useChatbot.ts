"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { translate } from "@/i18n";
import { ApiError, api } from "@/lib/api";
import { emitClientsRefresh } from "@/lib/clientEvents";
import { invalidateClientsQueries } from "@/lib/invalidateClients";
import { savePortalCredentials } from "@/features/clients/portal-credentials-storage";
import type { Board, Paginated, Client } from "@/types/api";
import type { ChatMessage, ChatbotApiResponse, ChatCalendlyOptions, ChatCalendlySelection, PendingChatAction } from "@/features/chat/types";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/features/chat/types";
import { clearChatState, loadChatState, saveChatState } from "@/features/chat/chat-storage";
import { emitCalendlyRefresh } from "@/lib/calendlyEvents";

function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeChatLocale(locale: string): "es" | "en" {
  return locale.toLowerCase().startsWith("en") ? "en" : "es";
}

export type StagedUploadStep = "destination" | "client" | "document_type" | "board_card";

export interface StagedUpload {
  file: File;
  fileName: string;
  step: StagedUploadStep;
  destination: "document" | "board" | null;
  selectedClientId?: number;
  selectedClientName?: string;
}

export interface BoardCardOption {
  id: number;
  title: string;
  column: string;
}

export interface ClientOption {
  id: number;
  name: string;
  email: string;
}

interface UseChatbotOptions {
  userId?: number | null;
  clientIdHint?: number | null;
  canUploadDocuments?: boolean;
  canUploadToBoard?: boolean;
}

function createInitialChatLocale(defaultLocale: string): "es" | "en" {
  return normalizeChatLocale(defaultLocale);
}

export function useChatbot(
  token: string | null,
  defaultLocale: string,
  options: UseChatbotOptions = {},
) {
  const { userId = null, clientIdHint = null, canUploadDocuments = false, canUploadToBoard = false } = options;
  const modal = useModal();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeClientId, setActiveClientId] = useState<number | null>(clientIdHint);
  const [pendingAction, setPendingAction] = useState<PendingChatAction | null>(null);
  const [calendlyOptions, setCalendlyOptions] = useState<ChatCalendlyOptions | null>(null);
  const [stagedUpload, setStagedUpload] = useState<StagedUpload | null>(null);
  const [boardCards, setBoardCards] = useState<BoardCardOption[]>([]);
  const [boardCardsLoading, setBoardCardsLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [clientSearchLoadingMore, setClientSearchLoadingMore] = useState(false);
  const [clientSearchHasMore, setClientSearchHasMore] = useState(false);
  const [clientSearchTotal, setClientSearchTotal] = useState(0);
  const [clientSearchPage, setClientSearchPage] = useState(0);
  const clientSearchQueryRef = useRef("");
  const pendingActionRef = useRef<PendingChatAction | null>(null);
  const selectClientRef = useRef<((clientId: number, name: string) => Promise<void>) | null>(null);
  const stagedUploadRef = useRef<StagedUpload | null>(null);
  const [chatLocale, setChatLocale] = useState<"es" | "en">(createInitialChatLocale(defaultLocale));
  const [chatHydrated, setChatHydrated] = useState(false);
  const loadedUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) {
      loadedUserIdRef.current = null;
      setChatHydrated(false);
      setMessages([]);
      setPendingAction(null);
      pendingActionRef.current = null;
      return;
    }

    if (loadedUserIdRef.current === userId) return;

    const saved = loadChatState(userId);
    if (saved) {
      setMessages(saved.messages);
      setPendingAction(saved.pendingAction);
      pendingActionRef.current = saved.pendingAction;
      setChatLocale(saved.chatLocale);
      setActiveClientId(clientIdHint ?? saved.activeClientId);
    } else {
      setMessages([]);
      setPendingAction(null);
      pendingActionRef.current = null;
      setChatLocale(createInitialChatLocale(defaultLocale));
      setActiveClientId(clientIdHint ?? null);
    }

    setError(null);
    setStagedUpload(null);
    setBoardCards([]);
    setClientOptions([]);
    loadedUserIdRef.current = userId;
    setChatHydrated(true);
  }, [userId, clientIdHint, defaultLocale]);

  useEffect(() => {
    if (!userId || !chatHydrated) return;
    saveChatState(userId, {
      messages,
      pendingAction,
      chatLocale,
      activeClientId,
    });
  }, [userId, chatHydrated, messages, pendingAction, chatLocale, activeClientId]);

  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  useEffect(() => {
    stagedUploadRef.current = stagedUpload;
  }, [stagedUpload]);

  useEffect(() => {
    if (clientIdHint) {
      setActiveClientId(clientIdHint);
    }
  }, [clientIdHint]);

  const chatT = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(chatLocale, key, params),
    [chatLocale],
  );

  const resolveClientId = useCallback(() => {
    return clientIdHint ?? activeClientId;
  }, [clientIdHint, activeClientId]);

  const needsStaffClientSelection = useCallback(() => {
    return canUploadToBoard && !resolveClientId();
  }, [canUploadToBoard, resolveClientId]);

  const toClientOption = useCallback((client: Client): ClientOption => ({
    id: client.id,
    name: `${client.first_name} ${client.last_name}`.trim(),
    email: client.email,
  }), []);

  const searchClients = useCallback(
    async (query: string, page = 1, append = false) => {
      if (!token) return [];

      const trimmed = query.trim();
      const isId = /^#?\d{1,8}$/.test(trimmed);
      if (!trimmed || (!isId && trimmed.length < 2)) {
        if (!append) {
          setClientOptions([]);
          setClientSearchHasMore(false);
          setClientSearchTotal(0);
          clientSearchQueryRef.current = "";
        }
        return [];
      }

      clientSearchQueryRef.current = query;
      if (append) {
        setClientSearchLoadingMore(true);
      } else {
        setClientSearchLoading(true);
      }

      try {
        if (isId) {
          const id = Number(trimmed.replace(/^#/, ""));
          const client = await api.get<Client>(`/clients/${id}`, token);
          const option = toClientOption(client);
          setClientOptions([option]);
          setClientSearchPage(1);
          setClientSearchTotal(1);
          setClientSearchHasMore(false);
          return [option];
        }

        const params = new URLSearchParams({
          page_size: "25",
          page: String(page),
          search: trimmed,
        });
        const data = await api.get<Paginated<Client>>(`/clients?${params}`, token);
        const options = data.items.map(toClientOption);
        setClientOptions((prev) => (append ? [...prev, ...options] : options));
        setClientSearchPage(data.page);
        setClientSearchTotal(data.total);
        setClientSearchHasMore(data.page < data.pages);
        return options;
      } catch {
        if (!append) {
          setClientOptions([]);
          setClientSearchTotal(0);
        }
        setClientSearchHasMore(false);
        return [];
      } finally {
        setClientSearchLoading(false);
        setClientSearchLoadingMore(false);
      }
    },
    [token, toClientOption],
  );

  const loadMoreClients = useCallback(async () => {
    if (!clientSearchHasMore || clientSearchLoading || clientSearchLoadingMore) return;
    await searchClients(clientSearchQueryRef.current, clientSearchPage + 1, true);
  }, [
    clientSearchHasMore,
    clientSearchLoading,
    clientSearchLoadingMore,
    clientSearchPage,
    searchClients,
  ]);

  const loadBoardCards = useCallback(
    async (clientId: number) => {
      if (!token) return [];
      setBoardCardsLoading(true);
      try {
        const board = await api.get<Board>(`/boards/client/${clientId}`, token);
        const cards: BoardCardOption[] = [];
        for (const list of board.lists) {
          for (const card of list.cards) {
            cards.push({ id: card.id, title: card.title, column: list.title });
          }
        }
        setBoardCards(cards);
        return cards;
      } catch {
        setBoardCards([]);
        return [];
      } finally {
        setBoardCardsLoading(false);
      }
    },
    [token],
  );

  const appendAssistant = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: newMessageId(), role: "assistant", content },
    ]);
  }, []);

  const applyChatResponse = useCallback(
    (response: ChatbotApiResponse, currentPendingAction: PendingChatAction | null) => {
      if (response.client_id) {
        setActiveClientId(response.client_id);
      }
      pendingActionRef.current = response.pending_action;
      setPendingAction(response.pending_action);
      setCalendlyOptions(response.calendly_options);
      setChatLocale(normalizeChatLocale(response.chat_locale));

      const registeredViaChat =
        currentPendingAction?.action === "register_client" &&
        Boolean(response.client_id) &&
        !response.pending_action;

      const clientListMutatedViaChat =
        currentPendingAction &&
        !response.pending_action &&
        ["approve_client", "approve_all", "reject_client", "reject_all"].includes(
          currentPendingAction.action,
        );

      const approvals =
        response.client_approvals?.length
          ? response.client_approvals
          : response.client_approval
            ? [response.client_approval]
            : [];

      const shouldRefreshClients =
        registeredViaChat ||
        clientListMutatedViaChat ||
        Boolean(response.client_approval) ||
        Boolean(response.client_approvals?.length) ||
        Boolean(response.clients_updated);

      if (shouldRefreshClients) {
        const affectedIds = approvals.map((approval) => approval.client_id);
        if (response.client_id && !affectedIds.includes(response.client_id)) {
          affectedIds.push(response.client_id);
        }
        void invalidateClientsQueries(
          queryClient,
          affectedIds.length === 1
            ? { clientId: affectedIds[0] }
            : affectedIds.length > 1
              ? { clientIds: affectedIds }
              : undefined,
        );
        emitClientsRefresh({
          clientId: response.client_id ?? affectedIds[0],
          showAllMerchants: Boolean(response.clients_updated),
        });
      }

      if (response.calendly_updated) {
        emitCalendlyRefresh();
      }

      for (const approval of approvals) {
        savePortalCredentials(approval.client_id, {
          email: approval.client_email,
          tempPassword: approval.temp_password,
        });
      }

      if (approvals.length === 1) {
        const approval = approvals[0];
        void modal.alert({
          title: t("clients.approvedTitle"),
          message: t("clients.approvedMessage", { name: approval.client_name }),
          variant: "success",
          copyText: approval.temp_password,
        });
      } else if (approvals.length > 1) {
        void modal.alert({
          title: t("clients.approvedTitle"),
          message: t("clients.bulkApprovedMessage", { count: approvals.length }),
          variant: "success",
        });
      }

      appendAssistant(response.reply);
    },
    [appendAssistant, modal, queryClient, t],
  );

  const sendCalendlySelection = useCallback(
    async (selection: ChatCalendlySelection, uiLocale: string) => {
      if (!token || loading) return;

      setLoading(true);
      setError(null);
      const currentPendingAction = pendingActionRef.current;

      try {
        const history = messages.slice(-20).map((item) => ({
          role: item.role,
          content: item.content,
        }));

        const response = await api.post<ChatbotApiResponse>(
          "/chatbot/message",
          {
            message: ".",
            history,
            client_id: resolveClientId(),
            locale: uiLocale,
            chat_locale: chatLocale,
            pending_action: currentPendingAction,
            calendly_selection: selection,
          },
          token,
        );

        applyChatResponse(response, currentPendingAction);
      } catch (err) {
        const message = getUserFacingErrorMessage(err, t("common.requestError"));
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [token, loading, messages, chatLocale, applyChatResponse, resolveClientId],
  );

  const sendMessage = useCallback(
    async (text: string, uiLocale: string) => {
      const trimmed = text.trim();
      if (!trimmed || !token || loading) return;

      if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH) {
        setError(chatT("chat.messageTooLong", { max: CHAT_MESSAGE_MAX_LENGTH }));
        return;
      }

      const userMessage: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      if (stagedUploadRef.current?.step === "client") {
        try {
          const idMatch = trimmed.match(/#?(\d{1,8})\b/);
          if (idMatch) {
            const candidateId = Number(idMatch[1]);
            const byId = clientOptions.find((c) => c.id === candidateId);
            if (byId) {
              await selectClientRef.current?.(byId.id, byId.name);
              return;
            }
            try {
              const client = await api.get<Client>(`/clients/${candidateId}`, token);
              await selectClientRef.current?.(client.id, `${client.first_name} ${client.last_name}`.trim());
              return;
            } catch {
              // fall through to name search
            }
          }

          const results = await searchClients(trimmed);
          if (results.length === 1) {
            await selectClientRef.current?.(results[0].id, results[0].name);
          } else if (results.length > 1) {
            appendAssistant(chatT("chat.multipleClientsFound", { count: results.length }));
          } else {
            appendAssistant(chatT("chat.noClientsFound"));
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      if (stagedUploadRef.current) {
        appendAssistant(chatT("chat.useUploadPanel"));
        setLoading(false);
        return;
      }

      const currentPendingAction = pendingActionRef.current;

      try {
        const history = [...messages, userMessage].slice(-20).map((item) => ({
          role: item.role,
          content: item.content,
        }));

        const response = await api.post<ChatbotApiResponse>(
          "/chatbot/message",
          {
            message: trimmed,
            history: history.slice(0, -1),
            client_id: resolveClientId(),
            locale: uiLocale,
            chat_locale: chatLocale,
            pending_action: currentPendingAction,
          },
          token,
        );

        applyChatResponse(response, currentPendingAction);
      } catch (err) {
        const message = getUserFacingErrorMessage(err, t("common.requestError"));
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [
      token,
      loading,
      messages,
      chatLocale,
      applyChatResponse,
      resolveClientId,
      stagedUpload,
      searchClients,
      appendAssistant,
      chatT,
    ],
  );

  const continueAfterClient = useCallback(
    async (clientId: number, clientName: string, destination: "document" | "board") => {
      setActiveClientId(clientId);
      setError(null);

      if (destination === "board") {
        setStagedUpload((current) =>
          current
            ? {
                ...current,
                step: "board_card",
                destination: "board",
                selectedClientId: clientId,
                selectedClientName: clientName,
              }
            : current,
        );
        await loadBoardCards(clientId);
        return;
      }

      setStagedUpload((current) =>
        current
          ? {
              ...current,
              step: "document_type",
              destination: "document",
              selectedClientId: clientId,
              selectedClientName: clientName,
            }
          : current,
      );
    },
    [loadBoardCards],
  );

  const selectClient = useCallback(
    async (clientId: number, clientName: string) => {
      const destination = stagedUploadRef.current?.destination ?? "document";
      await continueAfterClient(clientId, clientName, destination);
    },
    [continueAfterClient],
  );

  selectClientRef.current = selectClient;

  const goToClientStep = useCallback(
    async (destination: "document" | "board") => {
      setClientOptions([]);
      setClientSearchHasMore(false);
      setClientSearchTotal(0);
      clientSearchQueryRef.current = "";
      setStagedUpload((current) =>
        current ? { ...current, step: "client", destination } : current,
      );
    },
    [],
  );

  const changeClient = useCallback(() => {
    setActiveClientId(clientIdHint ?? null);
    setClientOptions([]);
    setClientSearchHasMore(false);
    setClientSearchTotal(0);
    clientSearchQueryRef.current = "";
    setStagedUpload((current) =>
      current
        ? {
            ...current,
            step: "client",
            selectedClientId: undefined,
            selectedClientName: undefined,
          }
        : current,
    );
  }, [clientIdHint]);

  const cancelStagedUpload = useCallback(() => {
    setStagedUpload(null);
    setBoardCards([]);
    setClientOptions([]);
    setClientSearchHasMore(false);
    setClientSearchTotal(0);
    clientSearchQueryRef.current = "";
    setError(null);
  }, []);

  const stageFile = useCallback(
    (file: File) => {
      if (!canUploadDocuments && !canUploadToBoard) return;

      setError(null);
      setMessages((prev) => [
        ...prev,
        { id: newMessageId(), role: "user", content: `📎 ${file.name}` },
      ]);

      if (canUploadDocuments && !canUploadToBoard) {
        setStagedUpload({
          file,
          fileName: file.name,
          step: "document_type",
          destination: "document",
        });
        return;
      }

      setStagedUpload({
        file,
        fileName: file.name,
        step: "destination",
        destination: null,
      });
    },
    [canUploadDocuments, canUploadToBoard],
  );

  const selectDestination = useCallback(
    async (destination: "document" | "board") => {
      if (!stagedUpload) return;

      if (needsStaffClientSelection()) {
        await goToClientStep(destination);
        return;
      }

      if (destination === "document") {
        setStagedUpload({ ...stagedUpload, step: "document_type", destination: "document" });
        return;
      }

      const clientId = resolveClientId();
      if (!clientId) return;

      setStagedUpload({ ...stagedUpload, step: "board_card", destination: "board" });
      await loadBoardCards(clientId);
    },
    [goToClientStep, loadBoardCards, needsStaffClientSelection, resolveClientId, stagedUpload],
  );

  const finishDocumentUpload = useCallback(
    async (documentType: string) => {
      if (!token || !stagedUpload || loading || fileUploading) return;

      const clientId = resolveClientId();
      if (!clientId && needsStaffClientSelection()) {
        await goToClientStep("document");
        return;
      }

      const { file, fileName, selectedClientName } = stagedUpload;
      setStagedUpload(null);
      setFileUploading(fileName);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("document_type", documentType);
        formData.append("file", file);

        const path = clientId ? `/documents/upload?client_id=${clientId}` : "/documents/upload";
        await api.upload(path, formData, token);

        const label = translate(chatLocale, `documentTypes.${documentType}`);
        if (canUploadToBoard) {
          appendAssistant(
            chatT("chat.uploadDocumentSuccessStaff", {
              type: label,
              client: selectedClientName ?? `#${clientId}`,
            }),
          );
        } else {
          appendAssistant(chatT("chat.uploadDocumentSuccess", { type: label }));
        }
        emitClientsRefresh({ clientId: clientId ?? undefined, scope: "documents" });
      } catch (err) {
        const message = getUserFacingErrorMessage(err, t("common.error"));
        setError(message);
        appendAssistant(chatT("chat.uploadError", { message }));
      } finally {
        setFileUploading(null);
      }
    },
    [
      token,
      stagedUpload,
      loading,
      fileUploading,
      resolveClientId,
      canUploadToBoard,
      needsStaffClientSelection,
      goToClientStep,
      chatT,
      chatLocale,
      appendAssistant,
      t,
    ],
  );

  const finishBoardUpload = useCallback(
    async (cardId: number) => {
      if (!token || !stagedUpload || loading || fileUploading) return;

      const clientId = stagedUpload.selectedClientId ?? resolveClientId() ?? undefined;
      const { file, fileName, selectedClientName } = stagedUpload;

      setStagedUpload(null);
      setFileUploading(fileName);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        await api.upload(`/boards/cards/${cardId}/attachments`, formData, token);

        if (canUploadToBoard) {
          appendAssistant(
            chatT("chat.uploadBoardSuccessStaff", {
              file: fileName,
              client: selectedClientName ?? "",
            }),
          );
        } else {
          appendAssistant(chatT("chat.uploadBoardSuccess", { file: fileName }));
        }
        emitClientsRefresh({ clientId, scope: "board" });
      } catch (err) {
        const message = getUserFacingErrorMessage(err, t("common.error"));
        setError(message);
        appendAssistant(chatT("chat.uploadError", { message }));
      } finally {
        setFileUploading(null);
      }
    },
    [token, stagedUpload, loading, fileUploading, chatT, appendAssistant, t, canUploadToBoard, resolveClientId],
  );

  const resetChat = useCallback(() => {
    if (userId) {
      clearChatState(userId);
    }
    setMessages([]);
    setError(null);
    setActiveClientId(clientIdHint ?? null);
    pendingActionRef.current = null;
    setPendingAction(null);
    setCalendlyOptions(null);
    setStagedUpload(null);
    setBoardCards([]);
    setFileUploading(null);
    setClientOptions([]);
    setChatLocale(createInitialChatLocale(defaultLocale));
  }, [userId, clientIdHint, defaultLocale]);

  const canAttachFile = canUploadDocuments || canUploadToBoard;

  return {
    messages,
    loading,
    fileUploading,
    error,
    sendMessage,
    sendCalendlySelection,
    stageFile,
    selectDestination,
    finishDocumentUpload,
    finishBoardUpload,
    cancelStagedUpload,
    resetChat,
    activeClientId,
    pendingAction,
    calendlyOptions,
    stagedUpload,
    boardCards,
    boardCardsLoading,
    clientOptions,
    clientSearchLoading,
    clientSearchLoadingMore,
    clientSearchHasMore,
    clientSearchTotal,
    searchClients,
    loadMoreClients,
    selectClient,
    changeClient,
    canAttachFile,
    chatLocale,
  };
}
