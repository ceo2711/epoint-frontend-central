export type { User, Paginated } from "@/types/api";

export type UserFormData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role_id: string;
  area_id: string;
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
  is_active: true,
};

