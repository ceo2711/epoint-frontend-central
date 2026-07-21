export type { Sede } from "@/types/api";

export type SedeFormData = {
  code: string;
  name: string;
  description: string;
};

export const EMPTY_SEDE_FORM: SedeFormData = {
  code: "",
  name: "",
  description: "",
};
