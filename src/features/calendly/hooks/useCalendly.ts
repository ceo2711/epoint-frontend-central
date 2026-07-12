"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import {
  fetchCalendlyConnection,
  fetchCalendlyEventTypes,
  fetchCalendlyEvents,
  fetchCalendlySalesReps,
  calendlyUserQuery,
} from "@/lib/queryFetchers";
import { queryKeys } from "@/lib/queryKeys";
import type {
  CalendlyAvailableTime,
  CalendlyConnection,
  CalendlyEvent,
  CalendlyEventFormValues,
  CalendlyEventType,
  CalendlySalesRep,
} from "@/features/calendly/types";
import { getAvailableTimesRange } from "@/features/calendly/utils/dateRange";
import { EVENTS_AUTO_SYNC_MS } from "@/features/calendly/utils/eventTypesCache";

export function useCalendly(
  token: string | null,
  selectedUserId: number | null,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const queryClient = useQueryClient();
  const connectionRef = useRef<CalendlyConnection | null>(null);
  const userQuery = calendlyUserQuery(selectedUserId);

  const connectionQuery = useQuery({
    queryKey: queryKeys.calendly.connection(selectedUserId),
    queryFn: () => fetchCalendlyConnection(token!, selectedUserId),
    enabled: !!token && enabled,
  });

  const connected = connectionQuery.data?.connected ?? false;
  connectionRef.current = connectionQuery.data ?? null;

  const eventsQuery = useQuery({
    queryKey: queryKeys.calendly.events(selectedUserId),
    queryFn: () => fetchCalendlyEvents(token!, selectedUserId),
    enabled: !!token && enabled && connected,
  });

  const eventTypesQuery = useQuery({
    queryKey: queryKeys.calendly.eventTypes(selectedUserId),
    queryFn: () => fetchCalendlyEventTypes(token!, selectedUserId),
    enabled: !!token && enabled && connected,
  });

  const salesRepsQuery = useQuery({
    queryKey: queryKeys.calendly.salesReps,
    queryFn: () => fetchCalendlySalesReps(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const syncAndRefreshEvents = useCallback(async () => {
    if (!token || !connectionRef.current?.connected) return;
    try {
      await api.post(`/calendly/sync${userQuery}`, {}, token);
    } catch {
      // Si falla la sync, igual refrescamos eventos locales.
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.calendly.connection(selectedUserId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.calendly.events(selectedUserId) }),
    ]);
  }, [token, userQuery, queryClient, selectedUserId]);

  useEffect(() => {
    if (!token || !connected || !enabled) return;

    void syncAndRefreshEvents();

    const intervalId = window.setInterval(() => void syncAndRefreshEvents(), EVENTS_AUTO_SYNC_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncAndRefreshEvents();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token, connected, enabled, syncAndRefreshEvents]);

  const refresh = useCallback(async () => {
    if (!token || !enabled) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.calendly.connection(selectedUserId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.calendly.events(selectedUserId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.calendly.eventTypes(selectedUserId) }),
    ]);
  }, [token, enabled, queryClient, selectedUserId]);

  const loadSalesReps = useCallback(async () => {
    if (!token) return [];
    const reps = await queryClient.fetchQuery({
      queryKey: queryKeys.calendly.salesReps,
      queryFn: () => fetchCalendlySalesReps(token),
    });
    return reps;
  }, [token, queryClient]);

  const loadEventTypes = useCallback(
    async (force = false) => {
      if (!token) return [];
      if (force) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.calendly.eventTypes(selectedUserId),
        });
      }
      return queryClient.fetchQuery({
        queryKey: queryKeys.calendly.eventTypes(selectedUserId),
        queryFn: () => fetchCalendlyEventTypes(token, selectedUserId),
      });
    },
    [token, queryClient, selectedUserId],
  );

  const loadAvailableTimes = useCallback(
    async (eventTypeUri: string, dateValue: string) => {
      if (!token) return [];
      const range = getAvailableTimesRange(dateValue);
      if (!range) return [];

      const query = new URLSearchParams({
        event_type_uri: eventTypeUri,
        start: range.start,
        end: range.end,
      });
      return api.get<CalendlyAvailableTime[]>(`/calendly/available-times?${query.toString()}`, token);
    },
    [token],
  );

  const loadEventTypeDetail = useCallback(
    async (eventTypeUri: string) => {
      if (!token) {
        throw new Error("No autenticado");
      }
      const query = new URLSearchParams({ event_type_uri: eventTypeUri });
      if (selectedUserId) {
        query.set("user_id", String(selectedUserId));
      }
      const detail = await api.get<CalendlyEventType>(
        `/calendly/event-types/detail?${query.toString()}`,
        token,
      );
      return {
        ...detail,
        description: detail.description ?? null,
        custom_questions: detail.custom_questions ?? [],
      };
    },
    [token, selectedUserId],
  );

  async function connect(accessToken: string, schedulingUrl?: string) {
    if (!token) return;
    await api.post<CalendlyConnection>(
      "/calendly/connection",
      {
        access_token: accessToken,
        scheduling_url: schedulingUrl || undefined,
      },
      token,
    );
    await refresh();
    await loadEventTypes(true);
  }

  async function disconnect() {
    if (!token) return;
    await api.delete("/calendly/connection", token);
    await refresh();
  }

  async function sync() {
    await syncAndRefreshEvents();
  }

  const createEventMutation = useMutation({
    mutationFn: (values: CalendlyEventFormValues) =>
      api.post<CalendlyEvent>(
        "/calendly/events",
        {
          ...values,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        token!,
      ),
    onSuccess: () => {
      void syncAndRefreshEvents();
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, values }: { eventId: number; values: CalendlyEventFormValues }) =>
      api.patch<CalendlyEvent>(
        `/calendly/events/${eventId}`,
        {
          ...values,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        token!,
      ),
    onSuccess: () => {
      void syncAndRefreshEvents();
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: (eventId: number) => api.delete(`/calendly/events/${eventId}`, token!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendly.events(selectedUserId) });
    },
  });

  async function createEvent(values: CalendlyEventFormValues) {
    if (!token) return;
    await createEventMutation.mutateAsync(values);
  }

  async function updateEvent(eventId: number, values: CalendlyEventFormValues) {
    if (!token) return;
    await updateEventMutation.mutateAsync({ eventId, values });
  }

  async function cancelEvent(eventId: number) {
    if (!token) return;
    await cancelEventMutation.mutateAsync(eventId);
  }

  const loading =
    enabled &&
    (connectionQuery.isLoading || (connected && (eventsQuery.isLoading || eventTypesQuery.isLoading)));

  const queryError = connectionQuery.error ?? eventsQuery.error;
  const error = queryError
    ? getUserFacingErrorMessage(queryError, "Error al cargar Calendly")
    : "";

  return {
    connection: connectionQuery.data ?? null,
    events: eventsQuery.data ?? [],
    salesReps: salesRepsQuery.data ?? [],
    eventTypes: eventTypesQuery.data ?? [],
    loadingEventTypes: eventTypesQuery.isFetching,
    loading,
    error,
    refresh,
    loadSalesReps,
    loadEventTypes,
    loadAvailableTimes,
    loadEventTypeDetail,
    connect,
    disconnect,
    sync,
    createEvent,
    updateEvent,
    cancelEvent,
  };
}
