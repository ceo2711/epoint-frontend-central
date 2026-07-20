"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VscArrowLeft } from "react-icons/vsc";

import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useModal } from "@/contexts/ModalContext";
import { CalendlyActionsMenu } from "@/features/calendly/components/CalendlyActionsMenu";
import { CalendlyCalendarView } from "@/features/calendly/components/CalendlyCalendarView";
import { CalendlyConnectPanel } from "@/features/calendly/components/CalendlyConnectPanel";
import { CalendlyEventFormModal } from "@/features/calendly/components/CalendlyEventFormModal";
import { CalendlyEventModal } from "@/features/calendly/components/CalendlyEventModal";
import { CalendlySettingsModal } from "@/features/calendly/components/CalendlySettingsModal";
import { CalendlyShareLink } from "@/features/calendly/components/CalendlyShareLink";
import { SalesRepList } from "@/features/calendly/components/SalesRepList";
import { CALENDLY_WRITE_ENABLED } from "@/features/calendly/config";
import { useCalendly } from "@/features/calendly/hooks/useCalendly";
import { onCalendlyRefresh } from "@/lib/calendlyEvents";
import { ApiError } from "@/lib/api";
import { ProspectLinkPickerModal } from "@/features/prospects/components/ProspectLinkPickerModal";
import type { CalendlyEvent } from "@/features/calendly/types";
import { api } from "@/lib/api";

const CALENDAR_ROLES = new Set(["ADMIN", "SALES_REP"]);

type EventFormState =
  | { mode: "create"; initialDate?: Date }
  | { mode: "edit"; event: CalendlyEvent };

export function CalendarioPage() {
  const router = useRouter();
  const modal = useModal();
  const { user, token, hasPermission } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role.code === "ADMIN";
  const isSalesRep = user?.role.code === "SALES_REP";
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendlyEvent | null>(null);
  const [linkProspectEvent, setLinkProspectEvent] = useState<CalendlyEvent | null>(null);
  const canLinkProspect = hasPermission("prospects:update");
  const [formState, setFormState] = useState<EventFormState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingReps, setLoadingReps] = useState(false);

  const adminViewingRep = isAdmin && selectedRepId !== null;

  const targetUserId = useMemo(() => {
    if (isSalesRep) return user?.id ?? null;
    if (isAdmin) return selectedRepId;
    return null;
  }, [isAdmin, isSalesRep, selectedRepId, user?.id]);

  const {
    connection,
    events,
    salesReps,
    eventTypes,
    loadingEventTypes,
    loading,
    error,
    loadSalesReps,
    loadEventTypes,
    loadAvailableTimes,
    loadEventTypeDetail,
    connect,
    disconnect,
    sync,
    refresh,
    createEvent,
    updateEvent,
    cancelEvent,
  } = useCalendly(token, targetUserId, {
    enabled: !isAdmin || selectedRepId !== null,
  });

  const selectedRep = useMemo(
    () => salesReps.find((rep) => rep.id === selectedRepId) ?? null,
    [salesReps, selectedRepId],
  );

  useEffect(() => {
    if (user && !CALENDAR_ROLES.has(user.role.code)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingReps(true);
    void loadSalesReps().finally(() => setLoadingReps(false));
  }, [isAdmin, loadSalesReps]);

  useEffect(() => {
    return onCalendlyRefresh(() => {
      if (!isAdmin || selectedRepId !== null) {
        void sync();
      }
    });
  }, [sync, isAdmin, selectedRepId]);

  useEffect(() => {
    if (formState && isSalesRep) {
      void loadEventTypes();
    }
  }, [formState, isSalesRep, loadEventTypes]);

  function handleSelectRep(id: number) {
    setSelectedRepId(id);
    setSelectedEvent(null);
    setFormState(null);
  }

  function handleBackToRepList() {
    setSelectedRepId(null);
    setSelectedEvent(null);
    setFormState(null);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await sync();
    } finally {
      setSyncing(false);
    }
  }

  async function openCreateForm(initialDate?: Date) {
    setSelectedEvent(null);
    setFormState({ mode: "create", initialDate });
  }

  async function handleDeleteEvent(event: CalendlyEvent) {
    const confirmed = await modal.confirm({
      title: t("calendly.deleteEventTitle"),
      message: t("calendly.deleteEventMessage"),
      confirmLabel: t("calendly.deleteEvent"),
      cancelLabel: t("common.cancel"),
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await cancelEvent(event.id);
      setSelectedEvent(null);
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("calendly.deleteEventError")),
        variant: "error",
      });
    }
  }

  async function handleLinkProspect(prospectId: number) {
    if (!token || !linkProspectEvent) return;
    try {
      await api.post(
        `/prospects/${prospectId}/link-calendly`,
        { calendly_event_id: linkProspectEvent.id },
        token,
      );
      await refresh();
      setLinkProspectEvent(null);
      setSelectedEvent(null);
      await modal.alert({
        title: t("prospects.linkCalendlySuccessTitle"),
        message: t("prospects.linkCalendlySuccessMessage"),
        variant: "success",
      });
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("common.error")),
        variant: "error",
      });
    }
  }

  if (!user || !CALENDAR_ROLES.has(user.role.code)) {
    return null;
  }

  const viewingOwnCalendar = isSalesRep;
  const canManageEvents = viewingOwnCalendar && connection?.connected && CALENDLY_WRITE_ENABLED;
  const showConnectPanel = viewingOwnCalendar && !connection?.connected;
  const showCalendarArea = connection?.connected && (viewingOwnCalendar || adminViewingRep);

  const calendarContent = (
    <>
      {(loading || (isAdmin && adminViewingRep && !selectedRep)) && (
        <div className="flex justify-center py-12">
          <LoadingSpinner label={t("calendly.loading")} />
        </div>
      )}

      {!loading && showConnectPanel && <CalendlyConnectPanel onConnect={connect} />}

      {!loading && adminViewingRep && !connection?.connected && (
        <div className="card-flat p-6 text-sm text-slate-600">{t("calendly.adminNotConnected")}</div>
      )}

      {!loading && showCalendarArea && (
        <>
          <CalendlyCalendarView
            events={events}
            canManage={canManageEvents}
            onSelectEvent={setSelectedEvent}
            onSelectSlot={(start) => void openCreateForm(start)}
            actionsMenu={
              connection?.connected ? (
                <CalendlyActionsMenu
                  canCreateEvent={!!canManageEvents}
                  canOpenSettings={viewingOwnCalendar}
                  syncing={syncing}
                  loading={loading}
                  align="right"
                  onCreateEvent={() => void openCreateForm()}
                  onSync={() => void handleSync()}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              ) : undefined
            }
          />
          {connection?.connected && (
            <CalendlyShareLink
              eventTypes={eventTypes}
              profileUrl={connection.scheduling_url}
              loading={loadingEventTypes}
            />
          )}
        </>
      )}
    </>
  );

  return (
    <>
      <Header
        title={t("calendly.headerContext")}
        subtitle={t(isAdmin ? "calendly.adminSubtitle" : "calendly.salesSubtitle")}
      />
      <PageContent className="space-y-6">
        {error && <div className="alert alert-error">{error}</div>}

        {isAdmin && !adminViewingRep && (
          <>
            {loadingReps ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner label={t("calendly.loading")} />
              </div>
            ) : (
              <SalesRepList reps={salesReps} onSelect={handleSelectRep} />
            )}
          </>
        )}

        {isAdmin && adminViewingRep && selectedRep && (
          <div className="space-y-6">
            <div className="card-flat p-4 sm:p-5">
              <button
                type="button"
                onClick={handleBackToRepList}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-800"
              >
                <VscArrowLeft className="h-4 w-4" aria-hidden />
                {t("calendly.backToSalesReps")}
              </button>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedRep.first_name} {selectedRep.last_name}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">{selectedRep.email}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    selectedRep.connected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {selectedRep.connected ? t("calendly.connected") : t("calendly.notConnected")}
                </span>
              </div>
            </div>
            {calendarContent}
          </div>
        )}

        {isSalesRep && <div className="space-y-6">{calendarContent}</div>}
      </PageContent>

      {selectedEvent && (
        <CalendlyEventModal
          event={selectedEvent}
          canManage={!!canManageEvents}
          canLinkProspect={canLinkProspect}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setFormState({ mode: "edit", event: selectedEvent });
            setSelectedEvent(null);
          }}
          onDelete={() => void handleDeleteEvent(selectedEvent)}
          onLinkProspect={() => {
            setLinkProspectEvent(selectedEvent);
            setSelectedEvent(null);
          }}
        />
      )}

      {linkProspectEvent ? (
        <ProspectLinkPickerModal
          token={token}
          title={t("prospects.linkToProspect")}
          emailHint={linkProspectEvent.invitee_email ?? undefined}
          onClose={() => setLinkProspectEvent(null)}
          onSelect={handleLinkProspect}
        />
      ) : null}

      {formState && canManageEvents && (
        <CalendlyEventFormModal
          mode={formState.mode}
          event={formState.mode === "edit" ? formState.event : undefined}
          initialDate={formState.mode === "create" ? formState.initialDate : undefined}
          eventTypes={eventTypes}
          loadingEventTypes={loadingEventTypes}
          onLoadAvailableTimes={loadAvailableTimes}
          onLoadEventTypeDetail={loadEventTypeDetail}
          onSubmit={async (values) => {
            if (formState.mode === "edit") {
              await updateEvent(formState.event.id, values);
            } else {
              await createEvent(values);
            }
          }}
          onClose={() => setFormState(null)}
        />
      )}

      {settingsOpen && viewingOwnCalendar && (
        <CalendlySettingsModal
          schedulingUrl={connection?.scheduling_url}
          onClose={() => setSettingsOpen(false)}
          onUpdateToken={connect}
          onDisconnect={disconnect}
        />
      )}
    </>
  );
}
