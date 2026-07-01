import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type {
  CalendlyAvailableTime,
  CalendlyConnection,
  CalendlyEvent,
  CalendlyEventFormValues,
  CalendlyEventType,
  CalendlySalesRep,
} from "@/features/calendly/types";
import { getAvailableTimesRange } from "@/features/calendly/utils/dateRange";
import {
  EVENTS_AUTO_SYNC_MS,
  isEventTypesCacheStale,
  readEventTypesCache,
  writeEventTypesCache,
} from "@/features/calendly/utils/eventTypesCache";

export function useCalendly(
  token: string | null,
  selectedUserId: number | null,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const [connection, setConnection] = useState<CalendlyConnection | null>(null);
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [salesReps, setSalesReps] = useState<CalendlySalesRep[]>([]);
  const [eventTypes, setEventTypes] = useState<CalendlyEventType[]>([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const connectionRef = useRef<CalendlyConnection | null>(null);
  const fetchGenerationRef = useRef(0);
  const refreshGenerationRef = useRef(0);

  const userQuery = selectedUserId ? `?user_id=${selectedUserId}` : "";

  const fetchEvents = useCallback(async () => {
    if (!token || !enabled) return null;
    const generation = ++fetchGenerationRef.current;
    const [connectionData, eventsData] = await Promise.all([
      api.get<CalendlyConnection>(`/calendly/connection${userQuery}`, token),
      api.get<CalendlyEvent[]>(`/calendly/events${userQuery}`, token),
    ]);
    if (generation !== fetchGenerationRef.current) {
      return null;
    }
    setConnection(connectionData);
    connectionRef.current = connectionData;
    setEvents(eventsData);
    return connectionData;
  }, [token, userQuery, enabled]);

  const fetchEventTypes = useCallback(
    async (options?: { force?: boolean; useCache?: boolean }) => {
      if (!token) return [];

      const cached = readEventTypesCache(selectedUserId);
      if (options?.useCache !== false && cached && !options?.force && !isEventTypesCacheStale(selectedUserId)) {
        setEventTypes(cached.types);
        return cached.types;
      }

      setLoadingEventTypes(true);
      try {
        const types = await api.get<CalendlyEventType[]>(`/calendly/event-types${userQuery}`, token);
        const normalized = types.map((type) => ({
          ...type,
          description: type.description ?? null,
          custom_questions: type.custom_questions ?? [],
        }));
        setEventTypes(normalized);
        writeEventTypesCache(selectedUserId, normalized);
        return normalized;
      } catch {
        if (cached) {
          setEventTypes(cached.types);
          return cached.types;
        }
        setEventTypes([]);
        return [];
      } finally {
        setLoadingEventTypes(false);
      }
    },
    [token, userQuery, selectedUserId],
  );

  const refresh = useCallback(async () => {
    if (!token || !enabled) return;
    const generation = ++refreshGenerationRef.current;
    setLoading(true);
    setError("");
    try {
      const connectionData = await fetchEvents();
      if (generation !== refreshGenerationRef.current) {
        return;
      }
      if (connectionData?.connected) {
        await fetchEventTypes({ useCache: true });
      } else {
        setEventTypes([]);
      }
    } catch (err) {
      if (generation !== refreshGenerationRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : "Error cargando calendario");
    } finally {
      if (generation === refreshGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [token, enabled, fetchEvents, fetchEventTypes]);

  const refreshEventsOnly = useCallback(async () => {
    if (!token) return;
    try {
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando calendario");
    }
  }, [token, fetchEvents]);

  const syncAndRefreshEvents = useCallback(async () => {
    if (!token || !connectionRef.current?.connected) return;
    try {
      await api.post(`/calendly/sync${userQuery}`, {}, token);
    } catch {
      // Si falla la sync, igual refrescamos eventos locales.
    }
    await refreshEventsOnly();
  }, [token, userQuery, refreshEventsOnly]);

  const loadSalesReps = useCallback(async () => {
    if (!token) return;
    try {
      const reps = await api.get<CalendlySalesRep[]>("/calendly/sales-reps", token);
      setSalesReps(reps);
    } catch {
      setSalesReps([]);
    }
  }, [token]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setConnection(null);
      connectionRef.current = null;
      setEvents([]);
      setEventTypes([]);
      setError("");
      return;
    }
    void refresh();
  }, [refresh, enabled]);

  useEffect(() => {
    if (!token || !connection?.connected) return;

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
  }, [token, connection?.connected, userQuery, syncAndRefreshEvents]);

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
    await fetchEventTypes({ force: true });
  }

  async function disconnect() {
    if (!token) return;
    await api.delete("/calendly/connection", token);
    await refresh();
  }

  async function sync() {
    if (!token) return;
    await api.post(`/calendly/sync${userQuery}`, {}, token);
    await refreshEventsOnly();
  }

  const loadEventTypes = useCallback(
    async (force = false) => fetchEventTypes({ force, useCache: !force }),
    [fetchEventTypes],
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
      const detail = await api.get<CalendlyEventType>(`/calendly/event-types/detail?${query.toString()}`, token);
      return {
        ...detail,
        description: detail.description ?? null,
        custom_questions: detail.custom_questions ?? [],
      };
    },
    [token, selectedUserId],
  );

  async function createEvent(values: CalendlyEventFormValues) {
    if (!token) return;
    await api.post<CalendlyEvent>(
      "/calendly/events",
      {
        ...values,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      token,
    );
    await sync();
  }

  async function updateEvent(eventId: number, values: CalendlyEventFormValues) {
    if (!token) return;
    await api.patch<CalendlyEvent>(
      `/calendly/events/${eventId}`,
      {
        ...values,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      token,
    );
    await sync();
  }

  async function cancelEvent(eventId: number) {
    if (!token) return;
    await api.delete(`/calendly/events/${eventId}`, token);
    await refreshEventsOnly();
  }

  return {
    connection,
    events,
    salesReps,
    eventTypes,
    loadingEventTypes,
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
