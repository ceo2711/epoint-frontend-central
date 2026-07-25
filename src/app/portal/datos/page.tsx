"use client";

import { FormEvent, useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { Input, PasswordInput } from "@/components/ui/Input";
import { PortalPageLoader } from "@/features/portal/components/PortalPageLoader";
import { AddressAutocomplete } from "@/features/portal/components/AddressAutocomplete";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
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

export default function PortalDatosPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [client, setClient] = useState<Client | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ssn, setSsn] = useState("");
  const [dob, setDob] = useState("");
  const [addr, setAddr] = useState({
    street: "",
    city: "",
    state: "",
    zip_code: "",
    residence_since_month: "",
    residence_since_year: "",
  });
  const [addrErrors, setAddrErrors] = useState<{ month?: string; year?: string }>({});
  const [vehicle, setVehicle] = useState({ model: "", year: "", color: "" });
  const [vehicleErrors, setVehicleErrors] = useState<{ year?: string }>({});
  const [profileErrors, setProfileErrors] = useState<{ ssn?: string; dob?: string }>({});
  const [storedSsn, setStoredSsn] = useState<string | null>(null);
  const [ssnVisible, setSsnVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadStoredSsn(hasSsn: boolean) {
    if (!token || !hasSsn) {
      setStoredSsn(null);
      return;
    }
    try {
      const data = await api.get<{ ssn: string }>("/portal/ssn", token);
      setStoredSsn(data.ssn);
    } catch {
      setStoredSsn(null);
    }
  }

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get<Client>("/portal/me", token)
      .then(async (c) => {
        setClient(c);
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
        const v = c.vehicles?.find((x) => x.order === 1);
        if (v) setVehicle({ model: v.model, year: String(v.year), color: v.color });
        await loadStoredSsn(c.has_ssn);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  function validateAddressFields() {
    const next: { month?: string; year?: string } = {};
    const month = parseOptionalInt(addr.residence_since_month);
    const year = parseOptionalInt(addr.residence_since_year);

    if (addr.residence_since_month.trim() && (Number.isNaN(month) || month === null || month < 1 || month > 12)) {
      next.month = t("portalData.monthInvalid");
    }
    if (addr.residence_since_year.trim() && (Number.isNaN(year) || year === null || year < 1900 || year > 2100)) {
      next.year = t("portalData.yearInvalid");
    }

    setAddrErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateVehicleFields() {
    const next: { year?: string } = {};
    const maxYear = currentYear();
    const year = parseRequiredInt(vehicle.year);

    if (!vehicle.year.trim()) {
      next.year = t("portalData.vehicleYearRequired");
    } else if (Number.isNaN(year) || year === null || year < 1900 || year > maxYear) {
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
    if (dob.trim() && Number.isNaN(Date.parse(dob))) {
      next.dob = t("portalData.dateOfBirthInvalid");
    }

    setProfileErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateAllFields() {
    const profileOk = validateProfileFields();
    const addressOk = validateAddressFields();
    const vehicleOk = validateVehicleFields();
    return profileOk && addressOk && vehicleOk;
  }

  async function saveAll(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    clearFeedback();
    if (!validateAllFields()) return;

    const year = parseRequiredInt(vehicle.year);
    if (year === null || Number.isNaN(year)) return;

    const month = parseOptionalInt(addr.residence_since_month);
    const profilePayload: { ssn?: string; date_of_birth?: string } = {};
    const ssnTrimmed = ssn.trim();
    if (ssnTrimmed) {
      profilePayload.ssn = ssnTrimmed;
    }
    if (dob.trim()) {
      profilePayload.date_of_birth = dob;
    }

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

      await api.post(
        "/portal/vehicles",
        { order: 1, model: vehicle.model, year, color: vehicle.color },
        token,
      );

      const updated = await api.get<Client>("/portal/me", token);
      setClient(updated);
      setSsn("");
      setSsnVisible(false);
      await loadStoredSsn(updated.has_ssn);
      setMessage(t("portalData.dataSaved"));
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
                            {storedSsn
                              ? ssnVisible
                                ? storedSsn
                                : t("portalData.ssnMasked")
                              : t("common.loading")}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSsnVisible((visible) => !visible)}
                            disabled={!storedSsn}
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
                    <Input
                      id="portal-dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      error={profileErrors.dob}
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
                    value={addr.zip_code}
                    onChange={(e) => setAddr({ ...addr, zip_code: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t("portalData.monthSince")}
                    type="number"
                    min={1}
                    max={12}
                    inputMode="numeric"
                    value={addr.residence_since_month}
                    onChange={(e) => {
                      setAddr({ ...addr, residence_since_month: e.target.value });
                      if (addrErrors.month) setAddrErrors((prev) => ({ ...prev, month: undefined }));
                    }}
                    placeholder={t("portalData.monthPlaceholder")}
                    error={addrErrors.month}
                  />
                  <Input
                    label={t("portalData.yearSince")}
                    type="number"
                    min={1900}
                    max={2100}
                    inputMode="numeric"
                    value={addr.residence_since_year}
                    onChange={(e) => {
                      setAddr({ ...addr, residence_since_year: e.target.value });
                      if (addrErrors.year) setAddrErrors((prev) => ({ ...prev, year: undefined }));
                    }}
                    placeholder={t("portalData.yearPlaceholder")}
                    error={addrErrors.year}
                  />
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {t("portalData.mainVehicle")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label={t("portalData.model")}
                    value={vehicle.model}
                    onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                    required
                  />
                  <Input
                    label={t("portalData.year")}
                    type="number"
                    min={1900}
                    max={currentYear()}
                    inputMode="numeric"
                    value={vehicle.year}
                    onChange={(e) => {
                      setVehicle({ ...vehicle, year: e.target.value });
                      if (vehicleErrors.year) setVehicleErrors({});
                    }}
                    placeholder={t("portalData.vehicleYearPlaceholder")}
                    error={vehicleErrors.year}
                    required
                  />
                  <Input
                    label={t("portalData.color")}
                    value={vehicle.color}
                    onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                    required
                  />
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
    </div>
  );
}
