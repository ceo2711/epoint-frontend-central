export type { Client, ClientAvailability, ClientConflict, Paginated } from "@/types/api";

export type ClientFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export const EMPTY_CLIENT_FORM: ClientFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};
