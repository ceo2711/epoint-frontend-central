export type { User, Paginated } from "@/types/api";

/** Roles que deben tener sede asignada al crear/editar. */
export const SEDE_REQUIRED_ROLE_CODES = [
  "SALES_REP",
  "ONBOARDING_MANAGER",
  "ADVISOR",
  "BRANCH_MANAGER",
  "AREA_LEADER",
] as const;

/** Roles que deben tener área asignada al crear/editar. */
export const AREA_REQUIRED_ROLE_CODES = ["AREA_LEADER"] as const;

export type UserFormData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role_id: string;
  area_id: string;
  sede_id: string;
  is_active: boolean;
};

export const EMPTY_USER_FORM: UserFormData = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  role_id: "",
  area_id: "",
  sede_id: "",
  is_active: true,
};
