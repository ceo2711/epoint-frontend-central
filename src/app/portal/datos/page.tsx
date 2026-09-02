"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { DateInput } from "@/components/ui/DateInput";
import { Input, PasswordInput } from "@/components/ui/Input";
import { DataSavedCongratsModal } from "@/features/portal/components/DataSavedCongratsModal";
import { PortalPageLoader } from "@/features/portal/components/PortalPageLoader";
import { AddressAutocomplete } from "@/features/portal/components/AddressAutocomplete";
import { usePortalMe } from "@/features/portal/hooks/usePortalWorkspace";
import { useSensitiveDocumentAccess } from "@/features/documents/hooks/useSensitiveDocumentAccess";
import { sensitiveStepUpHeaders } from "@/features/documents/sensitiveAccess";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { queryKeys } from "@/lib/queryKeys";
import type { Client } from "@/types/api";

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : NaN;
}

function parseRequiredInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : NaN;
}

function currentYear() {
  return new Date().getFullYear();
}

function digitsOnly(value: string, maxLen: number): string {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

function sanitizeMonth(value: string): string {
  const digits = digitsOnly(value, 2);
  if (!digits) return "";
  const n = Number(digits);
  if (n > 12) return digits.slice(0, 1);
  return digits;
}

function emptyStreetAddr() {
  return { street: "", city: "", state: "", zip_code: "" };
}

function isValidUsZip(value: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}

function isValidResidencePeriod(monthStr: string, yearStr: string): boolean {
  const month = parseOptionalInt(monthStr);
  const year = parseOptionalInt(yearStr);
  if (month === null || year === null || Number.isNaN(month) || Number.isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > currentYear()) return false;
  return true;
}

function residenceLessThanTwoYears(monthStr: string, yearStr: string): boolean {
  if (!isValidResidencePeriod(monthStr, yearStr)) return false;
  const month = parseOptionalInt(monthStr) as number;
  const year = parseOptionalInt(yearStr) as number;
  const now = new Date();
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return months < 24;
}

function hadPersonalDataSaved(client: Client | null): boolean {
  if (!client) return false;
  return Boolean(
    client.has_ssn ||
      client.date_of_birth ||
      client.addresses?.some((item) => item.type === "CURRENT") ||
      client.vehicles?.some((item) => item.order === 1),
  );
}

export default function PortalDatosPage() {
  const { token, refreshUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const profileQuery = usePortalMe(token);
  const { ensureAccess, modal: ssnUnlockModal } = useSensitiveDocumentAccess("ssn");
  const [client, setClient] = useState<Client | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ssn, setSsn] = useState("");
  const [dob, setDob] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addr, setAddr] = useState({
    street: "",
    city: "",
    state: "",
    zip_code: "",
    residence_since_month: "",
    residence_since_year: "",
  });
  const [addrErrors, setAddrErrors] = useState<{
    zip?: string;
    month?: string;
    year?: string;
  }>({});
  const [prevAddr, setPrevAddr] = useState(emptyStreetAddr());
  const [prevAddrError, setPrevAddrError] = useState("");
  const [vehicle, setVehicle] = useState({ model: "", year: "", color: "", license_plate: "" });
  const [vehicleErrors, setVehicleErrors] = useState<{ model?: string; year?: string; color?: string }>({});
  const [profileErrors, setProfileErrors] = useState<{ ssn?: string; dob?: string }>({});
  const [storedSsn, setStoredSsn] = useState<string | null>(null);
  const [ssnVisible, setSsnVisible] = useState(false);
  const [ssnUnlocking, setSsnUnlocking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  async function handleToggleSsnVisibility() {
    if (ssnVisible) {
      setSsnVisible(false);
      return;
    }
    if (!token || !client?.has_ssn) return;
    const allowed = await ensureAccess("SSN_CARD");
    if (!allowed) return;
    if (storedSsn) {
      setSsnVisible(true);
      return;
    }
    setSsnUnlocking(true);
    try {
      const data = await api.get<{ ssn: string }>("/portal/ssn", token, {
        headers: sensitiveStepUpHeaders(),
        silentHttpErrors: true,
      });
      setStoredSsn(data.ssn);
      setSsnVisible(true);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("portalData.ssnViewError")));
    } finally {
      setSsnUnlocking(false);
    }
  }

  useEffect(() => {
    const c = profileQuery.data;
    if (!c || hydrated) return;
    setClient(c);
    setFirstName(c.first_name ?? "");
    setLastName(c.last_name ?? "");
    if (c.date_of_birth) setDob(c.date_of_birth);
    const a = c.addresses?.find((x) => x.type === "CURRENT");
    if (a) {
      setAddr({
        street: a.street,
        city: a.city,
        state: a.state,
        zip_code: a.zip_code,
        residence_since_month: String(a.residence_since_month ?? ""),
        residence_since_year: String(a.residence_since_year ?? ""),
      });
    }
    const previous = c.addresses?.find((x) => x.type === "PREVIOUS");
    if (previous) {
      setPrevAddr({
        street: previous.street,
        city: previous.city,
        state: previous.state,
        zip_code: previous.zip_code,
      });
    }
    const v = c.vehicles?.find((x) => x.order === 1);
    if (v) {
      setVehicle({
        model: v.model,
        year: String(v.year),
        color: v.color,
        license_plate: v.license_plate ?? "",
      });
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data, hydrated]);

  const loading = profileQuery.isLoading || (!!profileQuery.data && !hydrated);

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  function validateAddressFields() {
    const next: { zip?: string; month?: string; year?: string } = {};
    const monthRaw = addr.residence_since_month.trim();
    const yearRaw = addr.residence_since_year.trim();
    const month = parseOptionalInt(monthRaw);
    const year = parseOptionalInt(yearRaw);
    const maxYear = currentYear();

    if (addr.zip_code.trim() && !isValidUsZip(addr.zip_code)) {
      next.zip = t("portalData.zipInvalid");
    }
    if (monthRaw && (Number.isNaN(month) || month === null || month < 1 || month > 12)) {
      next.month = t("portalData.monthInvalid");
    }
    if (yearRaw) {
      if (yearRaw.length !== 4 || Number.isNaN(year) || year === null) {
        next.year = t("portalData.yearFourDigits");
      } else if (year < 1900 || year > maxYear) {
        next.year = t("portalData.yearInvalid", { year: String(maxYear) });
      }
    }
    if ((monthRaw && !yearRaw) || (!monthRaw && yearRaw)) {
      if (!next.month && !monthRaw) next.month = t("portalData.monthYearPair");
      if (!next.year && !yearRaw) next.year = t("portalData.monthYearPair");
    }

    setAddrErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateVehicleFields() {
    const next: { model?: string; year?: string; color?: string } = {};
    const maxYear = currentYear();
    const year = parseRequiredInt(vehicle.year);

    if (!vehicle.model.trim()) {
      next.model = t("portalData.vehicleModelRequired");
    }
    if (!vehicle.color.trim()) {
      next.color = t("portalData.vehicleColorRequired");
    }
    if (!vehicle.year.trim()) {
      next.year = t("portalData.vehicleYearRequired");
    } else if (
      vehicle.year.trim().length !== 4 ||
      Number.isNaN(year) ||
      year === null ||
      year < 1900 ||
      year > maxYear
    ) {
      next.year = t("portalData.vehicleYearInvalid", { year: String(maxYear) });
    }

    setVehicleErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateProfileFields() {
    const next: { ssn?: string; dob?: string } = {};
    const ssnTrimmed = ssn.trim();
    const ssnDigits = ssnTrimmed.replace(/\D/g, "");

    if (ssnTrimmed && ssnDigits.length !== 9) {
      next.ssn = t("portalData.ssnInvalid");
    }
    if (dob.trim()) {
      if (Number.isNaN(Date.parse(dob))) {
        next.dob = t("portalData.dateOfBirthInvalid");
      } else {
        const parsed = new Date(`${dob}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsed > today) {
          next.dob = t("portalData.dateOfBirthFuture");
        } else if (parsed.getFullYear() < 1900) {
          next.dob = t("portalData.dateOfBirthTooOld");
        } else {
          const oldest = new Date(today);
          oldest.setFullYear(today.getFullYear() - 120);
          if (parsed < oldest) {
            next.dob = t("portalData.dateOfBirthTooOld");
          }
        }
      }
    }

    setProfileErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateAllFields() {
    const profileOk = validateProfileFields();
    const addressOk = validateAddressFields();
    const vehicleOk = validateVehicleFields();
    const needsPrevious = residenceLessThanTwoYears(
      addr.residence_since_month,
      addr.residence_since_year,
    );
    let previousOk = true;
    if (needsPrevious) {
      const missing =
        !prevAddr.street.trim() ||
        !prevAddr.city.trim() ||
        !prevAddr.state.trim() ||
        !prevAddr.zip_code.trim();
      if (missing) {
        setPrevAddrError(t("portalData.previousAddressRequired"));
        previousOk = false;
      } else if (!isValidUsZip(prevAddr.zip_code)) {
        setPrevAddrError(t("portalData.zipInvalid"));
        previousOk = false;
      } else {
        setPrevAddrError("");
      }
    } else {
      setPrevAddrError("");
    }
    return profileOk && addressOk && vehicleOk && previousOk;
  }

  async function saveAll(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    clearFeedback();
    if (!validateAllFields()) return;

    const year = parseRequiredInt(vehicle.year);
    if (year === null || Number.isNaN(year)) return;

    const month = parseOptionalInt(addr.residence_since_month);
    const wasFirstSave = !hadPersonalDataSaved(client);
    const needsPrevious = residenceLessThanTwoYears(
      addr.residence_since_month,
      addr.residence_since_year,
    );
    const profilePayload: {
      ssn?: string;
      date_of_birth?: string;
      first_name?: string;
      last_name?: string;
    } = {};
    const ssnTrimmed = ssn.trim();
    if (ssnTrimmed) {
      profilePayload.ssn = ssnTrimmed;
    }
    if (dob.trim()) {
      profilePayload.date_of_birth = dob;
    }
    if (firstName.trim()) profilePayload.first_name = firstName.trim();
    if (lastName.trim()) profilePayload.last_name = lastName.trim();

    setSaving(true);
    try {
      if (Object.keys(profilePayload).length > 0) {
        await api.patch("/portal/profile", profilePayload, token);
      }

      await api.post(
        "/portal/addresses",
        {
          type: "CURRENT",
          ...addr,
          residence_since_month: month,
          residence_since_year: parseOptionalInt(addr.residence_since_year),
        },
        token,
      );

      if (needsPrevious) {
        await api.post(
          "/portal/addresses",
          { type: "PREVIOUS", ...prevAddr },
          token,
        );
      }

      await api.post(
        "/portal/vehicles",
        {
          order: 1,
          model: vehicle.model,
          year,
          color: vehicle.color,
          license_plate: vehicle.license_plate.trim() || null,
        },
        token,
      );

      const updated = await api.get<Client>("/portal/me", token);
      setClient(updated);
      queryClient.setQueryData(queryKeys.portal.me, updated);
      setSsn("");
      setSsnVisible(false);
      setStoredSsn(null);
      await refreshUser();
      setMessage(wasFirstSave ? "" : t("portalData.dataSaved"));
      if (wasFirstSave) {
        setShowSavedModal(true);
      }
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("portalData.saveError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Header title={t("portalData.headerContext")} subtitle={t("portalData.subtitle")} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PageContent className="space-y-6">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <PortalPageLoader label={t("portalData.loading")} />
          ) : (
          <Card className="p-4 sm:p-6">
            <form id="portal-data-form" onSubmit={saveAll} className="space-y-8" autoComplete="off">
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {t("portalData.basicData")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t("common.firstName")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label={t("common.lastName")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  <div>
                    <div className="mb-2 sm:min-h-[4.5rem]">
                      <label htmlFor="portal-ssn" className="input-label">
                        {t("portalData.ssn")}
                      </label>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{t("portalData.ssnDescription")}</p>
                    </div>
                    {client?.has_ssn && (
                      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium text-slate-600">{t("portalData.ssnOnFile")}</p>
                        <div className="relative mt-2">
                          <div className="input-field flex min-h-[2.75rem] items-center bg-white pr-11 font-mono text-sm text-slate-800">
                            {ssnUnlocking
                              ? t("common.loading")
                              : ssnVisible && storedSsn
                                ? storedSsn
                                : t("portalData.ssnMasked")}
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleToggleSsnVisibility()}
                            disabled={ssnUnlocking}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                            aria-label={ssnVisible ? t("login.hidePassword") : t("login.showPassword")}
                          >
                            {ssnVisible ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 8 10 8a18.36 18.36 0 0 1-2.16 3.19" />
                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s4 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
                                <line x1="2" x2="22" y1="2" y2="2" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{t("portalData.ssnViewHint")}</p>
                      </div>
                    )}
                    <PasswordInput
                      id="portal-ssn"
                      value={ssn}
                      onChange={(e) => setSsn(e.target.value)}
                      placeholder={
                        client?.has_ssn ? t("portalData.ssnPlaceholderUpdate") : t("portalData.ssnPlaceholder")
                      }
                      showLabel={t("login.showPassword")}
                      hideLabel={t("login.hidePassword")}
                      error={profileErrors.ssn}
                    />
                    {client?.has_ssn && (
                      <p className="mt-1 text-xs text-slate-500">{t("portalData.ssnHint")}</p>
                    )}
                  </div>
                  <div>
                    <div className="mb-2 sm:min-h-[4.5rem]">
                      <label htmlFor="portal-dob" className="input-label">
                        {t("portalData.dateOfBirth")}
                      </label>
                    </div>
                    <DateInput
                      id="portal-dob"
                      value={dob}
                      onChange={(value) => {
                        setDob(value);
                        if (profileErrors.dob) setProfileErrors((prev) => ({ ...prev, dob: undefined }));
                      }}
                      error={profileErrors.dob}
                      hint={t("portalData.dateOfBirthHint")}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {t("portalData.currentAddress")}
                </h2>
                <AddressAutocomplete
                  label={t("portalData.street")}
                  value={addr.street}
                  onChange={(street) => setAddr((prev) => ({ ...prev, street }))}
                  onSelect={(resolved) =>
                    setAddr((prev) => ({
                      ...prev,
                      street: resolved.street,
                      city: resolved.city || prev.city,
                      state: resolved.state || prev.state,
                      zip_code: resolved.zip_code || prev.zip_code,
                    }))
                  }
                  placeholder={t("portalData.streetPlaceholder")}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label={t("portalData.city")}
                    name="portal-addr-city"
                    autoComplete="one-time-code"
                    value={addr.city}
                    onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                    required
                  />
                  <Input
                    label={t("portalData.state")}
                    name="portal-addr-state"
                    autoComplete="one-time-code"
                    value={addr.state}
                    onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                    required
                  />
                  <Input
                    label={t("portalData.zip")}
                    name="portal-addr-zip"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={10}
                    value={addr.zip_code}
                    onChange={(e) => {
                      setAddr({ ...addr, zip_code: e.target.value });
                      if (addrErrors.zip) setAddrErrors((prev) => ({ ...prev, zip: undefined }));
                    }}
                    error={addrErrors.zip}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t("portalData.monthSince")}
                    inputMode="numeric"
                    maxLength={2}
                    value={addr.residence_since_month}
                    onChange={(e) => {
                      setAddr({ ...addr, residence_since_month: sanitizeMonth(e.target.value) });
                      if (addrErrors.month) setAddrErrors((prev) => ({ ...prev, month: undefined }));
                    }}
                    placeholder={t("portalData.monthPlaceholder")}
                    error={addrErrors.month}
                  />
                  <Input
                    label={t("portalData.yearSince")}
                    inputMode="numeric"
                    maxLength={4}
                    value={addr.residence_since_year}
                    onChange={(e) => {
                      setAddr({ ...addr, residence_since_year: digitsOnly(e.target.value, 4) });
                      if (addrErrors.year) setAddrErrors((prev) => ({ ...prev, year: undefined }));
                    }}
                    placeholder={t("portalData.yearPlaceholder")}
                    error={addrErrors.year}
                  />
                </div>
                {residenceLessThanTwoYears(addr.residence_since_month, addr.residence_since_year) && (
                  <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{t("portalData.previousAddress")}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {t("portalData.previousAddressHint")}
                      </p>
                    </div>
                    <AddressAutocomplete
                      label={t("portalData.street")}
                      value={prevAddr.street}
                      onChange={(street) => setPrevAddr((prev) => ({ ...prev, street }))}
                      onSelect={(resolved) =>
                        setPrevAddr((prev) => ({
                          ...prev,
                          street: resolved.street,
                          city: resolved.city || prev.city,
                          state: resolved.state || prev.state,
                          zip_code: resolved.zip_code || prev.zip_code,
                        }))
                      }
                      placeholder={t("portalData.streetPlaceholder")}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Input
                        label={t("portalData.city")}
                        value={prevAddr.city}
                        onChange={(e) => setPrevAddr({ ...prevAddr, city: e.target.value })}
                        required
                      />
                      <Input
                        label={t("portalData.state")}
                        value={prevAddr.state}
                        onChange={(e) => setPrevAddr({ ...prevAddr, state: e.target.value })}
                        required
                      />
                      <Input
                        label={t("portalData.zip")}
                        value={prevAddr.zip_code}
                        onChange={(e) => setPrevAddr({ ...prevAddr, zip_code: e.target.value })}
                        required
                      />
                    </div>
                    {prevAddrError ? <p className="text-sm text-red-600">{prevAddrError}</p> : null}
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {t("portalData.mainVehicle")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label={t("portalData.model")}
                    value={vehicle.model}
                    onChange={(e) => {
                      setVehicle({ ...vehicle, model: e.target.value });
                      if (vehicleErrors.model) setVehicleErrors((prev) => ({ ...prev, model: undefined }));
                    }}
                    error={vehicleErrors.model}
                    required
                  />
                  <Input
                    label={t("portalData.year")}
                    inputMode="numeric"
                    maxLength={4}
                    value={vehicle.year}
                    onChange={(e) => {
                      setVehicle({ ...vehicle, year: digitsOnly(e.target.value, 4) });
                      if (vehicleErrors.year) setVehicleErrors((prev) => ({ ...prev, year: undefined }));
                    }}
                    placeholder={t("portalData.vehicleYearPlaceholder")}
                    error={vehicleErrors.year}
                    required
                  />
                  <Input
                    label={t("portalData.color")}
                    value={vehicle.color}
                    onChange={(e) => {
                      setVehicle({ ...vehicle, color: e.target.value });
                      if (vehicleErrors.color) setVehicleErrors((prev) => ({ ...prev, color: undefined }));
                    }}
                    error={vehicleErrors.color}
                    required
                  />
                </div>
                <div>
                  <Input
                    label={t("portalData.licensePlate")}
                    value={vehicle.license_plate}
                    onChange={(e) => setVehicle({ ...vehicle, license_plate: e.target.value })}
                    placeholder={t("portalData.licensePlatePlaceholder")}
                  />
                  <p className="mt-1 text-xs text-slate-500">{t("portalData.licensePlateHint")}</p>
                </div>
              </section>
            </form>
          </Card>
          )}
        </PageContent>
      </div>

      {!loading && (
        <div className="shrink-0 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex justify-end pe-[4.75rem] sm:pe-[5.75rem]">
            <Button type="submit" form="portal-data-form" disabled={saving} size="lg" className="shadow-lg">
              {saving ? t("common.loading") : t("portalData.saveData")}
            </Button>
          </div>
        </div>
      )}

      {showSavedModal ? (
        <DataSavedCongratsModal
          onClose={() => setShowSavedModal(false)}
          onGoToDocuments={() => {
            setShowSavedModal(false);
            router.push("/portal/documentos");
          }}
        />
      ) : null}
      {ssnUnlockModal}
    </div>
  );
}
