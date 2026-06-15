"use client";

import { FormEvent, useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { Input, PasswordInput } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError, api } from "@/lib/api";
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
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<Client>("/portal/me", token).then((c) => {
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
    });
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

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    clearFeedback();
    setSavingProfile(true);
    try {
      await api.patch("/portal/profile", { ssn, date_of_birth: dob }, token);
      setMessage(t("portalData.profileUpdated"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("portalData.saveError"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    clearFeedback();
    if (!validateAddressFields()) return;

    const month = parseOptionalInt(addr.residence_since_month);
    const year = parseOptionalInt(addr.residence_since_year);

    setSavingAddress(true);
    try {
      await api.post(
        "/portal/addresses",
        {
          type: "CURRENT",
          ...addr,
          residence_since_month: month,
          residence_since_year: year,
        },
        token,
      );
      setMessage(t("portalData.addressSaved"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("portalData.saveError"));
    } finally {
      setSavingAddress(false);
    }
  }

  async function saveVehicle(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    clearFeedback();
    if (!validateVehicleFields()) return;

    const year = parseRequiredInt(vehicle.year);
    if (year === null || Number.isNaN(year)) return;

    setSavingVehicle(true);
    try {
      await api.post(
        "/portal/vehicles",
        { order: 1, model: vehicle.model, year, color: vehicle.color },
        token,
      );
      setMessage(t("portalData.vehicleSaved"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("portalData.saveError"));
    } finally {
      setSavingVehicle(false);
    }
  }

  return (
    <>
      <Header title={t("portalData.title")} subtitle={t("portalData.subtitle")} />
      <PageContent className="space-y-6">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <Card className="p-4 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{t("portalData.basicData")}</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput
                label={t("portalData.ssn")}
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                placeholder={client?.has_ssn ? t("portalData.ssnMasked") : t("portalData.ssnPlaceholder")}
                showLabel={t("login.showPassword")}
                hideLabel={t("login.hidePassword")}
              />
              <Input
                label={t("portalData.dateOfBirth")}
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? t("common.loading") : t("portalData.saveProfile")}
            </Button>
          </form>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{t("portalData.currentAddress")}</h2>
          <form onSubmit={saveAddress} className="space-y-4">
            <Input
              label={t("portalData.street")}
              value={addr.street}
              onChange={(e) => setAddr({ ...addr, street: e.target.value })}
              placeholder={t("portalData.streetPlaceholder")}
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label={t("portalData.city")} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} required />
              <Input label={t("portalData.state")} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} required />
              <Input label={t("portalData.zip")} value={addr.zip_code} onChange={(e) => setAddr({ ...addr, zip_code: e.target.value })} required />
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
            <Button type="submit" disabled={savingAddress}>
              {savingAddress ? t("common.loading") : t("portalData.saveAddress")}
            </Button>
          </form>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{t("portalData.mainVehicle")}</h2>
          <form onSubmit={saveVehicle} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label={t("portalData.model")} value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} required />
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
              <Input label={t("portalData.color")} value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} required />
            </div>
            <Button type="submit" disabled={savingVehicle}>
              {savingVehicle ? t("common.loading") : t("portalData.saveVehicle")}
            </Button>
          </form>
        </Card>
      </PageContent>
    </>
  );
}
