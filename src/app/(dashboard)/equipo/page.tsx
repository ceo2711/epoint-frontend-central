"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, PageContent } from "@/components/ui/Card";
import { Input, PasswordInput } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import type { User } from "@/types/api";

interface TeamMetrics {
  previous_month: { year: number; month: number };
  current_month: { year: number; month: number };
  eligibility: {
    eligible: boolean;
    previous_month_sales: number;
    required_sales: number;
    can_manage_sub_sellers: boolean;
  };
  members: Array<{
    user: User;
    is_self: boolean;
    is_sub_seller: boolean;
    sales_previous_month: number;
    sales_current_month: number;
    prospects_open: number;
  }>;
  totals: {
    sales_previous_month: number;
    sales_current_month: number;
    prospects_open: number;
    sub_sellers: number;
  };
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
};

export default function SubSellersPage() {
  const router = useRouter();
  const { token, user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const modal = useModal();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const canAccess = Boolean(user?.role.code === "SALES_REP" && !user.is_sub_seller);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sub-sellers", "metrics", user?.id],
    queryFn: () => api.get<TeamMetrics>("/sub-sellers/metrics", token),
    enabled: !!token && canAccess,
  });

  useEffect(() => {
    if (user && user.role.code !== "SALES_REP") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormError("");
    setFormSuccess("");
    if (form.password.trim().length < 8) {
      setFormError(t("subSellers.passwordTooShort"));
      return;
    }
    setSaving(true);
    try {
      await api.post("/sub-sellers", form, token, { silentHttpErrors: true });
      setForm(emptyForm);
      setShowForm(false);
      setFormSuccess(t("subSellers.createSuccess"));
      await refetch();
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["sub-sellers"] });
    } catch (err) {
      setFormError(getUserFacingErrorMessage(err, t("subSellers.createError")));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(member: User) {
    if (!token) return;
    const next = !member.is_active;
    const confirmed = await modal.confirm({
      title: t(next ? "subSellers.activateTitle" : "subSellers.deactivateTitle"),
      message: t(next ? "subSellers.activateConfirm" : "subSellers.deactivateConfirm", {
        name: `${member.first_name} ${member.last_name}`,
      }),
      confirmLabel: t(next ? "subSellers.activate" : "subSellers.deactivate"),
    });
    if (!confirmed) return;
    try {
      await api.patch(`/sub-sellers/${member.id}`, { is_active: next }, token);
      await refetch();
    } catch (err) {
      await modal.alert({
        title: t("common.error"),
        message: getUserFacingErrorMessage(err, t("subSellers.loadError")),
      });
    }
  }

  if (!user) return null;

  const eligible = Boolean(data?.eligibility.eligible ?? user.can_manage_sub_sellers);
  const subMembers = (data?.members ?? []).filter((m) => m.is_sub_seller);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Header title={t("subSellers.headerContext")} subtitle={t("subSellers.subtitle")} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PageContent className="space-y-6">
          {!canAccess ? (
            <Card className="p-6 text-sm text-slate-600">{t("subSellers.noPermission")}</Card>
          ) : isLoading ? (
            <LoadingSpinner label={t("common.loading")} />
          ) : error ? (
            <Card className="p-6 text-sm text-red-600">
              {getUserFacingErrorMessage(error, t("subSellers.loadError"))}
            </Card>
          ) : (
            <>
              <Card className="space-y-3 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    {t("subSellers.eligibilityTitle")}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      eligible
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                    }`}
                  >
                    {eligible ? t("subSellers.eligibleBadge") : t("subSellers.notEligibleBadge")}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">{t("subSellers.previousMonthSales")}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-800">
                      {data?.eligibility.previous_month_sales ?? user.previous_month_sales ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">{t("subSellers.requiredSales")}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {t("subSellers.requiredSalesHint", {
                        count: String(data?.eligibility.required_sales ?? 5),
                      })}
                    </p>
                  </div>
                </div>
                {!eligible && (
                  <p className="text-sm text-slate-600">{t("subSellers.noPermission")}</p>
                )}
              </Card>

              <Card className="space-y-4 p-5 sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {t("subSellers.metricsTitle")}
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric
                    label={t("subSellers.salesCurrentMonth")}
                    value={data?.totals.sales_current_month ?? 0}
                  />
                  <Metric
                    label={t("subSellers.salesPreviousMonth")}
                    value={data?.totals.sales_previous_month ?? 0}
                  />
                  <Metric
                    label={t("subSellers.openProspects")}
                    value={data?.totals.prospects_open ?? 0}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-2 py-2 font-semibold">{t("subSellers.team")}</th>
                        <th className="px-2 py-2 font-semibold">{t("subSellers.salesCurrentMonth")}</th>
                        <th className="px-2 py-2 font-semibold">{t("subSellers.salesPreviousMonth")}</th>
                        <th className="px-2 py-2 font-semibold">{t("subSellers.openProspects")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.members ?? []).map((row) => (
                        <tr key={row.user.id} className="border-t border-slate-100">
                          <td className="px-2 py-3">
                            <p className="font-medium text-slate-800">
                              {row.user.first_name} {row.user.last_name}
                              {row.is_self ? ` (${t("subSellers.you")})` : ""}
                            </p>
                            <p className="text-xs text-slate-500">
                              {row.is_sub_seller ? t("subSellers.subSeller") : t("subSellers.you")}
                              {" · "}
                              {row.user.email}
                            </p>
                          </td>
                          <td className="px-2 py-3">{row.sales_current_month}</td>
                          <td className="px-2 py-3">{row.sales_previous_month}</td>
                          <td className="px-2 py-3">{row.prospects_open}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    {t("subSellers.listTitle")}
                  </h2>
                  {eligible && (
                    <Button type="button" onClick={() => setShowForm((v) => !v)}>
                      {t("subSellers.add")}
                    </Button>
                  )}
                </div>

                {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
                {formError && <div className="alert alert-error">{formError}</div>}

                {showForm && eligible && (
                  <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label={t("subSellers.firstName")}
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      required
                    />
                    <Input
                      label={t("subSellers.lastName")}
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      required
                    />
                    <Input
                      label={t("subSellers.email")}
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                    <Input
                      label={t("subSellers.phone")}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <div className="sm:col-span-2">
                      <PasswordInput
                        label={t("subSellers.password")}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={8}
                      />
                      <p className="mt-1 text-xs text-slate-500">{t("subSellers.passwordHint")}</p>
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? t("subSellers.creating") : t("subSellers.create")}
                      </Button>
                    </div>
                  </form>
                )}

                {subMembers.length === 0 ? (
                  <p className="text-sm text-slate-500">{t("subSellers.empty")}</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {subMembers.map(({ user: member }) => (
                      <li
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {member.is_active
                              ? t("subSellers.statusActive")
                              : t("subSellers.statusInactive")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void toggleActive(member)}
                        >
                          {member.is_active
                            ? t("subSellers.deactivate")
                            : t("subSellers.activate")}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}
        </PageContent>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}
