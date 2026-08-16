"use client";

import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

import { FormEvent, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { HiOutlineCamera, HiOutlineMagnifyingGlass, HiOutlineTrash } from "react-icons/hi2";

import { Header } from "@/components/layout/Header";
import { Card, PageContent } from "@/components/ui/Card";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { api } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { isSedeAdmin } from "@/lib/roles";
import type { TotpSetupResponse, User } from "@/types/api";

function profileFromUser(user: User) {
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
  };
}

export function AccountSettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const { t } = useTranslation();
  const canEditProfile = isSedeAdmin(user?.role.code);

  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", email: "" });
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileForm(profileFromUser(user));
    }
  }, [user]);

  if (!user || !token) return null;

  async function handleUploadAvatar(file: File) {
    setError("");
    setMessage("");
    setAvatarBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.upload<User>("/auth/me/avatar", formData, token);
      await refreshUser();
      setMessage(t("account.avatarSaved"));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("account.avatarError")));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setError("");
    setMessage("");
    setAvatarBusy(true);
    try {
      await api.delete<User>("/auth/me/avatar", token);
      await refreshUser();
      setMessage(t("account.avatarRemoved"));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("account.avatarError")));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setProfileBusy(true);
    try {
      await api.patch(
        "/auth/me",
        {
          first_name: profileForm.first_name.trim(),
          last_name: profileForm.last_name.trim(),
          email: profileForm.email.trim(),
        },
        token,
      );
      await refreshUser();
      setMessage(t("account.profileSaved"));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("account.profileError")));
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleSetup2fa() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api.post<TotpSetupResponse>("/auth/2fa/setup", {}, token);
      setSetupData(data);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("account.twoFactor.error")));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm2fa(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await api.post<{ message: string }>(
        "/auth/2fa/confirm",
        { code: confirmCode },
        token,
      );
      setMessage(result.message);
      setSetupData(null);
      setConfirmCode("");
      await refreshUser();
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("account.twoFactor.error")));
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError(t("changePassword.mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("changePassword.minLength"));
      return;
    }

    setBusy(true);
    try {
      const result = await api.post<{ message: string }>(
        "/auth/change-password",
        { current_password: currentPassword, new_password: newPassword },
        token,
      );
      setMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getUserFacingErrorMessage(err, t("changePassword.error")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header title={t("account.headerContext")} subtitle={t("account.subtitle")} />
      <PageContent className="mx-auto max-w-4xl space-y-6">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">{t("account.profileTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("account.profileSubtitle")}</p>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              {canEditProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="profile-first-name"
                      label={t("common.firstName")}
                      required
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    />
                    <Input
                      id="profile-last-name"
                      label={t("common.lastName")}
                      required
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                  <Input
                    id="profile-email"
                    type="email"
                    label={t("common.email")}
                    required
                    autoComplete="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <div>
                    <p className="input-label">{t("common.role")}</p>
                    <p className="text-sm font-medium text-slate-900">{user.role.name}</p>
                  </div>
                  {user.sede?.name ? (
                    <div>
                      <p className="input-label">{t("users.sede")}</p>
                      <p className="text-sm font-medium text-slate-900">{user.sede.name}</p>
                    </div>
                  ) : null}
                  <Button type="submit" disabled={profileBusy}>
                    {profileBusy ? t("account.profileSaving") : t("account.profileSave")}
                  </Button>
                </form>
              ) : (
                <>
                  <p className="text-sm text-slate-500">{t("account.profileReadOnlyHint")}</p>
                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("common.firstName")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{user.first_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("common.lastName")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{user.last_name}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("common.email")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("common.role")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{user.role.name}</dd>
                    </div>
                    {user.sede?.name ? (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("users.sede")}
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">{user.sede.name}</dd>
                      </div>
                    ) : null}
                  </dl>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-slate-100 pt-6 lg:w-52 lg:shrink-0 lg:items-center lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={avatarBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void handleUploadAvatar(file);
                }}
              />

              {user.avatar_url ? (
                <Tooltip label={t("account.avatarView")}>
                  <button
                    type="button"
                    onClick={() => setAvatarPreviewOpen(true)}
                    className="group relative h-36 w-36 overflow-hidden rounded-full border-2 border-cream-600 bg-cream-200 shadow-md ring-2 ring-brand/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label={t("account.avatarView")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brown-950/0 transition duration-200 group-hover:bg-brown-950/45">
                      <HiOutlineMagnifyingGlass className="h-7 w-7 text-white opacity-0 drop-shadow transition duration-200 group-hover:opacity-100" />
                    </span>
                  </button>
                </Tooltip>
              ) : (
                <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-cream-600 bg-gradient-to-br from-brand to-brand-dark text-3xl font-bold text-white shadow-md ring-2 ring-brand/10">
                  {user.first_name[0]}
                  {user.last_name[0]}
                </div>
              )}

              <div className="flex items-center gap-2">
                <IconActionButton
                  label={avatarBusy ? t("account.avatarUploading") : t("account.avatarChange")}
                  icon={<HiOutlineCamera className="h-4 w-4" />}
                  variant="primary"
                  disabled={avatarBusy}
                  onClick={() => avatarFileRef.current?.click()}
                />
                {user.avatar_url ? (
                  <IconActionButton
                    label={avatarBusy ? t("account.avatarRemoving") : t("account.avatarRemove")}
                    icon={<HiOutlineTrash className="h-4 w-4" />}
                    variant="danger"
                    disabled={avatarBusy}
                    onClick={() => void handleRemoveAvatar()}
                  />
                ) : null}
              </div>
              <p className="text-center text-[11px] leading-snug text-slate-400">
                {t("account.avatarFormats")}
              </p>
            </div>
          </div>
        </Card>

        {avatarPreviewOpen && user.avatar_url ? (
          <Modal
            title={t("account.avatarTitle")}
            onClose={() => setAvatarPreviewOpen(false)}
            size="lg"
          >
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar_url}
                alt=""
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
          </Modal>
        ) : null}

        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t("account.twoFactor.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("account.twoFactor.subtitle")}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                user.totp_enabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {user.totp_enabled ? t("account.twoFactor.enabled") : t("account.twoFactor.disabled")}
            </span>
          </div>

          {!user.totp_enabled && !setupData && (
            <div className="mt-6">
              <Button onClick={handleSetup2fa} disabled={busy}>
                {busy ? t("account.twoFactor.settingUp") : t("account.twoFactor.enable")}
              </Button>
            </div>
          )}

          {!user.totp_enabled && setupData && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-slate-600">{t("account.twoFactor.scanHint")}</p>
              <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-start">
                <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <QRCode value={setupData.provisioning_uri} size={160} />
                </div>
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <p className="font-medium text-slate-900">{t("account.twoFactor.manualEntry")}</p>
                  <code className="block break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                    {setupData.secret}
                  </code>
                </div>
              </div>
              <form onSubmit={handleConfirm2fa} className="space-y-4">
                <Input
                  id="confirmCode"
                  label={t("account.twoFactor.codeLabel")}
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={busy || confirmCode.length !== 6}>
                    {busy ? t("account.twoFactor.confirming") : t("account.twoFactor.confirm")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSetupData(null);
                      setConfirmCode("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {user.totp_enabled && (
            <p className="mt-6 text-sm text-slate-600">{t("account.twoFactor.mandatoryHint")}</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">{t("account.passwordTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("account.passwordSubtitle")}</p>
          <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
            <PasswordInput
              label={t("changePassword.currentPassword")}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
            <PasswordInput
              label={t("changePassword.newPassword")}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
            <PasswordInput
              label={t("changePassword.confirmPassword")}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
            <Button type="submit" disabled={busy}>
              {busy ? t("changePassword.saving") : t("changePassword.save")}
            </Button>
          </form>
        </Card>
      </PageContent>
    </>
  );
}
