"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Area } from "@/features/areas/types";
import type { Role } from "@/features/roles/types";
import type { Sede } from "@/features/sedes/types";
import { SEDE_REQUIRED_ROLE_CODES, type UserFormData } from "@/features/users/types";

interface UserFormProps {
  form: UserFormData;
  roles: Role[];
  areas: Area[];
  sedes: Sede[];
  showSedeSelect: boolean;
  onChange: (form: UserFormData) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  isEdit?: boolean;
  embedded?: boolean;
  formId?: string;
}

export function UserForm({
  form,
  roles,
  areas,
  sedes,
  showSedeSelect,
  onChange,
  onSubmit,
  submitting,
  isEdit,
  embedded,
  formId = "user-form",
}: UserFormProps) {
  const { t } = useTranslation();
  const internalRoles = roles.filter((r) => r.code !== "CLIENT");
  const selectedRole = internalRoles.find((r) => String(r.id) === form.role_id);
  const sedeRequired =
    !!selectedRole && SEDE_REQUIRED_ROLE_CODES.includes(selectedRole.code as (typeof SEDE_REQUIRED_ROLE_CODES)[number]);

  const formContent = (
      <form id={formId} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("common.firstName")}
          required
          value={form.first_name}
          onChange={(e) => onChange({ ...form, first_name: e.target.value })}
        />
        <Input
          label={t("common.lastName")}
          required
          value={form.last_name}
          onChange={(e) => onChange({ ...form, last_name: e.target.value })}
        />
        <Input
          label={t("common.email")}
          type="email"
          required
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
        />
        <Input
          label={t("common.phone")}
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
        />
        {!isEdit ? (
          <PasswordInput
            label={t("users.password")}
            required
            minLength={8}
            value={form.password}
            onChange={(e) => onChange({ ...form, password: e.target.value })}
            showLabel={t("login.showPassword")}
            hideLabel={t("login.hidePassword")}
          />
        ) : (
          <PasswordInput
            label={t("users.password")}
            minLength={8}
            value={form.password}
            onChange={(e) => onChange({ ...form, password: e.target.value })}
            showLabel={t("login.showPassword")}
            hideLabel={t("login.hidePassword")}
            placeholder={t("users.passwordKeepCurrent")}
          />
        )}
        <Select
          label={t("common.role")}
          required
          value={form.role_id}
          onChange={(e) => onChange({ ...form, role_id: e.target.value })}
        >
          <option value="">{t("users.selectRole")}</option>
          {internalRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </Select>
        <Select
          label={t("common.area")}
          value={form.area_id}
          onChange={(e) => onChange({ ...form, area_id: e.target.value })}
        >
          <option value="">{t("common.noArea")}</option>
          {areas.filter((a) => a.is_active).map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
        {showSedeSelect && sedeRequired ? (
          <Select
            label={t("users.sede")}
            required
            value={form.sede_id}
            onChange={(e) => onChange({ ...form, sede_id: e.target.value })}
          >
            <option value="">{t("users.selectSede")}</option>
            {sedes.filter((s) => s.is_active).map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.name}
              </option>
            ))}
          </Select>
        ) : null}
        {isEdit && (
          <Select
            label={t("common.status")}
            value={form.is_active ? "true" : "false"}
            onChange={(e) => onChange({ ...form, is_active: e.target.value === "true" })}
          >
            <option value="true">{t("common.active")}</option>
            <option value="false">{t("common.inactive")}</option>
          </Select>
        )}
        {!embedded ? (
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        ) : null}
      </form>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card className="mb-6 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
        {isEdit ? t("users.edit") : t("users.new")}
      </h3>
      {formContent}
    </Card>
  );
}
